/**
 * App Host Manager - Web arayüzlü uygulama host sunucusu
 * GitHub URL ile uygulama ekleyip otomatik kurulum. Docker sandbox, terminal, kod düzenleme.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');
const simpleGit = require('simple-git');
const WebSocket = require('ws');

let pty;
try {
  pty = require('node-pty');
} catch {
  pty = null;
}

let pidusage;
try {
  pidusage = require('pidusage');
} catch {
  pidusage = null;
}

const PORT = process.env.PORT || 3840;
const DATA_DIR = path.join(__dirname, 'data');
const APPS_FILE = path.join(DATA_DIR, 'apps.json');
const REPOS_DIR = path.join(DATA_DIR, 'repos');

// Çalışan process veya container (id -> { process?, containerId?, logStream? })
const runningProcesses = new Map();
// Son kullanılan port (her yeni uygulama için artır)
let lastUsedPort = 4000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(REPOS_DIR)) fs.mkdirSync(REPOS_DIR, { recursive: true });
  if (!fs.existsSync(APPS_FILE)) fs.writeFileSync(APPS_FILE, '[]', 'utf8');
}

function loadApps() {
  ensureDirs();
  try {
    return JSON.parse(fs.readFileSync(APPS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveApps(apps) {
  ensureDirs();
  fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2), 'utf8');
}

function updateAppMainFile(appId, mainFile) {
  const apps = loadApps();
  const a = apps.find((x) => x.id === appId);
  if (a) {
    a.mainFile = mainFile;
    saveApps(apps);
  }
}

function nextPort() {
  lastUsedPort += 1;
  return lastUsedPort;
}

function parseGitHubUrl(url) {
  let normalized = url.trim().replace(/\.git$/, '');
  const match = normalized.match(/github\.com[/:](\w[-?\w]*)\/([\w.-]+)/i);
  if (match) {
    const [, owner, repo] = match;
    return { owner, repo, name: repo, cloneUrl: `https://github.com/${owner}/${repo}.git` };
  }
  return null;
}

/** Python projesi için kök dizindeki giriş dosyasını bulur (main.py, app.py, web.py, bot.py vb.) */
function findPythonEntryPoint(repoPath) {
  const preferred = ['main.py', 'app.py', 'run.py', 'web.py', 'server.py', 'bot.py', 'manage.py'];
  for (const name of preferred) {
    if (fs.existsSync(path.join(repoPath, name))) return name;
  }
  try {
    const names = fs.readdirSync(repoPath);
    const pyFiles = names.filter((n) => n.endsWith('.py') && n !== '__init__.py');
    if (pyFiles.length === 1) return pyFiles[0];
    if (pyFiles.length > 1) return pyFiles.sort()[0];
  } catch {}
  return 'main.py';
}

function detectProjectType(repoPath) {
  const pkgPath = path.join(repoPath, 'package.json');
  const requirementsPath = path.join(repoPath, 'requirements.txt');
  const pyProjectPath = path.join(repoPath, 'pyproject.toml');
  const goModPath = path.join(repoPath, 'go.mod');

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const scripts = pkg.scripts || {};
      let runCommand;
      if (scripts.start) runCommand = [process.platform === 'win32' ? 'npm.cmd' : 'npm', 'start'];
      else if (scripts.dev) runCommand = [process.platform === 'win32' ? 'npm.cmd' : 'npm', 'run', 'dev'];
      else runCommand = [process.platform === 'win32' ? 'node.exe' : 'node', 'index.js'];
      return { type: 'node', runCommand, hasInstall: true };
    } catch {
      return { type: 'node', runCommand: [process.platform === 'win32' ? 'node.exe' : 'node', 'index.js'], hasInstall: true };
    }
  }
  if (fs.existsSync(requirementsPath) || fs.existsSync(pyProjectPath)) {
    const mainPy = findPythonEntryPoint(repoPath);
    return { type: 'python', mainFile: mainPy, hasInstall: true };
  }
  if (fs.existsSync(goModPath)) {
    return { type: 'go', hasInstall: true };
  }
  return { type: 'unknown' };
}

async function runApp(appId, appRecord) {
  if (runningProcesses.has(appId)) return { ok: false, error: 'Zaten çalışıyor' };

  const repoPath = path.join(REPOS_DIR, appId);
  if (!fs.existsSync(repoPath)) return { ok: false, error: 'Repo bulunamadı' };

  const detected = detectProjectType(repoPath);
  const port = appRecord.port || nextPort();
  const env = { ...process.env, ...(appRecord.env || {}), PORT: String(port) };
  const logPath = path.join(DATA_DIR, `logs_${appId}.txt`);
  const logStream = fs.createWriteStream(logPath, { flags: 'w' });

  function logLine(stream, data) {
    const ts = new Date().toISOString();
    const tag = stream === 'stderr' ? '[stderr]' : '[stdout]';
    const lines = data.toString().split('\n').filter((l) => l.length > 0);
    lines.forEach((line) => logStream.write(ts + ' ' + tag + ' ' + line + '\n'));
  }

  // Docker sandbox: repoda Dockerfile varsa ve useDocker açıksa container'da çalıştır
  const useDocker = appRecord.useDocker && fs.existsSync(path.join(repoPath, 'Dockerfile'));
  if (useDocker) {
    const docker = process.platform === 'win32' ? 'docker.exe' : 'docker';
    const imageTag = 'apphost-' + appId;
    const containerName = 'apphost-' + appId;
    try {
      const build = spawn(docker, ['build', '-t', imageTag, '.'], { cwd: repoPath });
      let buildErr = '';
      build.stderr.on('data', (d) => { buildErr += d; logLine('stderr', d); });
      build.stdout.on('data', (d) => logLine('stdout', d));
      await new Promise((resolve, reject) => {
        build.on('close', (c) => (c === 0 ? resolve() : reject(new Error('Docker build failed: ' + buildErr.slice(-500)))));
      });
      const envArgs = [];
      Object.entries(appRecord.env || {}).forEach(([k, v]) => envArgs.push('-e', `${k}=${v}`));
      envArgs.push('-e', 'PORT=' + port);
      const run = spawn(docker, ['run', '-d', '--name', containerName, '-p', port + ':' + port, ...envArgs, imageTag]);
      let runOut = '';
      run.stdout.on('data', (d) => { runOut += d.toString(); });
      run.stderr.on('data', (d) => logLine('stderr', d));
      await new Promise((resolve, reject) => {
        run.on('close', (c) => (c === 0 ? resolve() : reject(new Error('Docker run failed'))));
      });
      const logTail = spawn(docker, ['logs', '-f', containerName]);
      logTail.stdout.on('data', (d) => logLine('stdout', d));
      logTail.stderr.on('data', (d) => logLine('stderr', d));
      runningProcesses.set(appId, { containerId: containerName, logStream, logTail });
      return { ok: true, port };
    } catch (err) {
      logStream.write(new Date().toISOString() + ' [system] Docker error: ' + err.message + '\n');
      logStream.end();
      return { ok: false, error: err.message };
    }
  }

  let child;
  const cwd = repoPath;

  const customCmd = typeof appRecord.startCommand === 'string' && appRecord.startCommand.trim();
  if (customCmd) {
    const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
    const flag = process.platform === 'win32' ? '/c' : '-c';
    child = spawn(shell, [flag, appRecord.startCommand.trim()], { cwd, env });
  } else if (detected.type === 'node') {
    const [cmd, ...args] = detected.runCommand || [process.platform === 'win32' ? 'npm.cmd' : 'npm', 'start'];
    child = spawn(cmd, args, { cwd, env });
  } else if (detected.type === 'python') {
    const venvPath = path.join(repoPath, 'venv');
    const py = process.platform === 'win32'
      ? path.join(venvPath, 'Scripts', 'python.exe')
      : path.join(venvPath, 'bin', 'python');
    let mainFile = (appRecord.mainFile && fs.existsSync(path.join(repoPath, appRecord.mainFile)))
      ? appRecord.mainFile
      : (detected.mainFile && fs.existsSync(path.join(repoPath, detected.mainFile)))
        ? detected.mainFile
        : findPythonEntryPoint(repoPath);
    const mainPath = path.join(repoPath, mainFile);
    if (!fs.existsSync(mainPath) || mainFile === 'run.py') {
      mainFile = findPythonEntryPoint(repoPath);
    }
    updateAppMainFile(appRecord.id, mainFile);
    if (fs.existsSync(py)) {
      child = spawn(py, [mainFile], { cwd, env });
    } else {
      child = spawn(process.platform === 'win32' ? 'python' : 'python3', [mainFile], { cwd, env });
    }
  } else if (detected.type === 'go') {
    child = spawn(process.platform === 'win32' ? 'go.exe' : 'go', ['run', '.'], { cwd, env });
  } else {
    return { ok: false, error: 'Desteklenmeyen proje tipi' };
  }

  child.stdout.on('data', (data) => logLine('stdout', data));
  child.stderr.on('data', (data) => logLine('stderr', data));
  child.on('close', (code) => {
    runningProcesses.delete(appId);
    const ts = new Date().toISOString();
    logStream.write(ts + ' [system] Process exited with code ' + code + '\n');
    logStream.end();
  });

  runningProcesses.set(appId, { process: child, logStream });
  return { ok: true, port };
}

function stopApp(appId) {
  const entry = runningProcesses.get(appId);
  if (!entry) return { ok: false, error: 'Çalışan process yok' };
  if (entry.containerId) {
    if (entry.logTail) entry.logTail.kill('SIGTERM');
    spawn(process.platform === 'win32' ? 'docker.exe' : 'docker', ['stop', entry.containerId]).on('close', () => {});
  } else if (entry.process) {
    entry.process.kill('SIGTERM');
  }
  if (entry.logStream && !entry.logStream.closed) entry.logStream.end();
  runningProcesses.delete(appId);
  return { ok: true };
}

// --- API ---

app.get('/api/apps', (req, res) => {
  const apps = loadApps().map((a) => ({
    ...a,
    running: runningProcesses.has(a.id),
  }));
  res.json(apps);
});

app.get('/api/apps/:id', (req, res) => {
  const apps = loadApps();
  const appRecord = apps.find((a) => a.id === req.params.id);
  if (!appRecord) return res.status(404).json({ error: 'Uygulama bulunamadı' });
  res.json({ ...appRecord, running: runningProcesses.has(appRecord.id) });
});

app.post('/api/apps', async (req, res) => {
  const { githubUrl } = req.body || {};
  if (!githubUrl || typeof githubUrl !== 'string') {
    return res.status(400).json({ error: 'githubUrl gerekli' });
  }

  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) {
    return res.status(400).json({ error: 'Geçersiz GitHub URL' });
  }

  const apps = loadApps();
  const appId = `${parsed.owner}_${parsed.repo}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const repoPath = path.join(REPOS_DIR, appId);

  if (apps.some((a) => a.id === appId)) {
    return res.status(409).json({ error: 'Bu uygulama zaten ekli' });
  }

  const git = simpleGit();
  try {
    await git.clone(parsed.cloneUrl, repoPath);
  } catch (err) {
    return res.status(500).json({ error: 'Klonlama hatası: ' + (err.message || String(err)) });
  }

  const detected = detectProjectType(repoPath);
  const port = nextPort();

  if (detected.type === 'node' && detected.hasInstall) {
    try {
      await new Promise((resolve, reject) => {
        const npm = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install'], {
          cwd: repoPath,
        });
        npm.on('close', (c) => (c === 0 ? resolve() : reject(new Error('npm install failed'))));
        npm.on('error', reject);
      });
    } catch (e) {
      // Kurulum hatası olsa da kaydediyoruz, kullanıcı manuel çalıştırabilir
    }
  }

  if (detected.type === 'python' && detected.hasInstall) {
    const venvPath = path.join(repoPath, 'venv');
    const reqPath = path.join(repoPath, 'requirements.txt');
    if (!fs.existsSync(venvPath) && fs.existsSync(reqPath)) {
      try {
        await new Promise((resolve, reject) => {
          const py = process.platform === 'win32' ? 'python' : 'python3';
          const child = spawn(py, ['-m', 'venv', 'venv'], { cwd: repoPath });
          child.on('close', (c) => (c === 0 ? resolve() : reject(new Error('venv failed'))));
          child.on('error', reject);
        });
        const pip = process.platform === 'win32'
          ? path.join(venvPath, 'Scripts', 'pip.exe')
          : path.join(venvPath, 'bin', 'pip');
        if (fs.existsSync(pip)) {
          await new Promise((resolve, reject) => {
            const child = spawn(pip, ['install', '-r', 'requirements.txt'], { cwd: repoPath });
            child.on('close', (c) => (c === 0 ? resolve() : reject(new Error('pip failed'))));
            child.on('error', reject);
          });
        }
      } catch {
        // venv/pip hata verse de kaydet
      }
    }
  }

  // Otomatik ortam değişkenlerini tespit et ve boş olarak ekle
  const suggestedKeys = suggestEnvKeys(repoPath);
  const autoEnv = {};
  suggestedKeys.forEach(key => {
    autoEnv[key] = '';
  });

  const newApp = {
    id: appId,
    name: parsed.name,
    githubUrl: parsed.cloneUrl,
    repoPath,
    port,
    type: detected.type,
    env: autoEnv,
    startCommand: '',
    useDocker: fs.existsSync(path.join(repoPath, 'Dockerfile')),
    createdAt: new Date().toISOString(),
  };
  if (detected.type === 'python' && detected.mainFile) newApp.mainFile = detected.mainFile;
  apps.push(newApp);
  saveApps(apps);

  // Ortam değişkenleri eksikse başlatma
  res.status(201).json({ 
    ...newApp, 
    running: false,
    needsEnvSetup: suggestedKeys.length > 0,
    message: suggestedKeys.length > 0 
      ? `Uygulama eklendi. Başlatmadan önce ortam değişkenlerini ayarlayın: ${suggestedKeys.join(', ')}`
      : 'Uygulama eklendi ve başlatılabilir.'
  });
});

app.post('/api/apps/:id/start', async (req, res) => {
  const apps = loadApps();
  const appRecord = apps.find((a) => a.id === req.params.id);
  if (!appRecord) return res.status(404).json({ error: 'Uygulama bulunamadı' });
  
  // Gerekli ortam değişkenlerini kontrol et
  const repoPath = path.join(REPOS_DIR, appRecord.id);
  const requiredEnvKeys = suggestEnvKeys(repoPath);
  const missingKeys = requiredEnvKeys.filter(key => {
    const value = (appRecord.env || {})[key];
    return !value || value.trim() === '';
  });
  
  if (missingKeys.length > 0) {
    return res.status(400).json({ 
      error: 'Eksik ortam değişkenleri', 
      missingKeys,
      message: `Lütfen önce şu ortam değişkenlerini ayarlayın: ${missingKeys.join(', ')}`
    });
  }
  
  const result = await runApp(appRecord.id, appRecord);
  if (result.ok) {
    res.json({ ok: true, port: result.port });
  } else {
    res.status(400).json({ error: result.error });
  }
});

app.post('/api/apps/:id/stop', (req, res) => {
  const result = stopApp(req.params.id);
  if (result.ok) res.json({ ok: true });
  else res.status(400).json({ error: result.error });
});

app.get('/api/apps/:id/logs', (req, res) => {
  const logPath = path.join(DATA_DIR, `logs_${req.params.id}.txt`);
  if (!fs.existsSync(logPath)) return res.json({ lines: [] });
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  res.json({ lines });
});

app.delete('/api/apps/:id', (req, res) => {
  stopApp(req.params.id);
  const apps = loadApps().filter((a) => a.id !== req.params.id);
  saveApps(apps);
  const repoPath = path.join(REPOS_DIR, req.params.id);
  if (fs.existsSync(repoPath)) {
    try {
      fs.rmSync(repoPath, { recursive: true });
    } catch {}
  }
  res.json({ ok: true });
});

app.post('/api/apps/:id/update', async (req, res) => {
  const apps = loadApps();
  const appRecord = apps.find((a) => a.id === req.params.id);
  if (!appRecord) return res.status(404).json({ error: 'Uygulama bulunamadı' });
  
  const repoPath = path.join(REPOS_DIR, appRecord.id);
  if (!fs.existsSync(repoPath)) {
    return res.status(404).json({ error: 'Repo dizini bulunamadı' });
  }
  
  // Çalışıyorsa durdur
  const wasRunning = runningProcesses.has(appRecord.id);
  if (wasRunning) {
    stopApp(appRecord.id);
  }
  
  // Git pull
  const git = simpleGit(repoPath);
  try {
    await git.pull();
  } catch (err) {
    return res.status(500).json({ error: 'Git pull hatası: ' + (err.message || String(err)) });
  }
  
  // Proje tipini yeniden tespit et
  const detected = detectProjectType(repoPath);
  appRecord.type = detected.type;
  if (detected.type === 'python' && detected.mainFile) {
    appRecord.mainFile = detected.mainFile;
  }
  
  // Bağımlılıkları güncelle
  if (detected.type === 'node' && detected.hasInstall) {
    try {
      await new Promise((resolve, reject) => {
        const npm = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install'], {
          cwd: repoPath,
        });
        npm.on('close', (c) => (c === 0 ? resolve() : reject(new Error('npm install failed'))));
        npm.on('error', reject);
      });
    } catch (e) {
      // Devam et
    }
  }
  
  if (detected.type === 'python' && detected.hasInstall) {
    const venvPath = path.join(repoPath, 'venv');
    const reqPath = path.join(repoPath, 'requirements.txt');
    if (fs.existsSync(venvPath) && fs.existsSync(reqPath)) {
      try {
        const pip = process.platform === 'win32'
          ? path.join(venvPath, 'Scripts', 'pip.exe')
          : path.join(venvPath, 'bin', 'pip');
        if (fs.existsSync(pip)) {
          await new Promise((resolve, reject) => {
            const child = spawn(pip, ['install', '-r', 'requirements.txt'], { cwd: repoPath });
            child.on('close', (c) => (c === 0 ? resolve() : reject(new Error('pip failed'))));
            child.on('error', reject);
          });
        }
      } catch {
        // Devam et
      }
    }
  }
  
  // Yeni env değişkenlerini tespit et ve mevcut değerleri koru
  const newSuggestedKeys = suggestEnvKeys(repoPath);
  const currentEnv = appRecord.env || {};
  newSuggestedKeys.forEach(key => {
    if (!(key in currentEnv)) {
      currentEnv[key] = '';
    }
  });
  appRecord.env = currentEnv;
  
  saveApps(apps);
  
  // Eğer çalışıyorsa tekrar başlat
  if (wasRunning) {
    const result = await runApp(appRecord.id, appRecord);
    res.json({ ok: true, restarted: result.ok, message: 'Güncelleme tamamlandı' });
  } else {
    res.json({ ok: true, restarted: false, message: 'Güncelleme tamamlandı' });
  }
});

// --- System stats ---
const appsById = () => {
  const list = loadApps();
  const m = new Map();
  list.forEach((a) => m.set(a.id, a));
  return m;
};

app.get('/api/system/stats', async (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const usedPercent = totalMem ? Math.round((usedMem / totalMem) * 100) : 0;
  const loadAvg = os.loadavg();
  const cpus = os.cpus();
  const nodeMem = process.memoryUsage();
  const appNames = appsById();

  const runningApps = [];
  let totalCpu = 0;
  let totalMemBytes = 0;

  if (pidusage) {
    for (const [appId, entry] of runningProcesses) {
      const pid = entry.process && entry.process.pid;
      if (!pid) continue;
      try {
        const stat = await pidusage(pid);
        const cpuPercent = Math.round((stat.cpu || 0) * 10) / 10;
        const memBytes = stat.memory || 0;
        const memPercent = totalMem ? Math.round((memBytes / totalMem) * 1000) / 10 : 0;
        totalCpu += cpuPercent;
        totalMemBytes += memBytes;
        runningApps.push({
          id: appId,
          name: (appNames.get(appId) || {}).name || appId,
          cpuPercent,
          memoryPercent: memPercent,
          memoryBytes: memBytes,
        });
      } catch {
        runningApps.push({ id: appId, name: (appNames.get(appId) || {}).name || appId, cpuPercent: 0, memoryPercent: 0, memoryBytes: 0 });
      }
    }
  }

  const totalMemoryPercent = totalMem ? Math.round((totalMemBytes / totalMem) * 1000) / 10 : 0;

  res.json({
    memory: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usedPercent,
    },
    loadAvg: loadAvg[0] != null ? loadAvg[0].toFixed(2) : null,
    cpuCount: cpus.length,
    uptime: os.uptime(),
    platform: os.platform(),
    hostname: os.hostname(),
    nodeMemory: {
      rss: nodeMem.rss,
      heapUsed: nodeMem.heapUsed,
      heapTotal: nodeMem.heapTotal,
    },
    runningApps,
    totalApps: {
      cpuPercent: Math.round(totalCpu * 10) / 10,
      memoryPercent: totalMemoryPercent,
      memoryBytes: totalMemBytes,
    },
  });
});

// --- App env & config files ---
app.get('/api/apps/:id/env', (req, res) => {
  const apps = loadApps();
  const appRecord = apps.find((a) => a.id === req.params.id);
  if (!appRecord) return res.status(404).json({ error: 'Uygulama bulunamadı' });
  res.json(appRecord.env || {});
});

app.put('/api/apps/:id/env', (req, res) => {
  const apps = loadApps();
  const appRecord = apps.find((a) => a.id === req.params.id);
  if (!appRecord) return res.status(404).json({ error: 'Uygulama bulunamadı' });
  const env = req.body && typeof req.body === 'object' ? req.body : {};
  appRecord.env = env;
  saveApps(apps);
  res.json({ ok: true });
});

app.post('/api/apps/:id/env/import', (req, res) => {
  const apps = loadApps();
  const appRecord = apps.find((a) => a.id === req.params.id);
  if (!appRecord) return res.status(404).json({ error: 'Uygulama bulunamadı' });
  
  const envContent = req.body && req.body.content;
  if (typeof envContent !== 'string') {
    return res.status(400).json({ error: 'Geçersiz içerik' });
  }
  
  const parsed = {};
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) {
      let value = match[2].trim();
      // Tırnak işaretlerini kaldır
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      parsed[match[1]] = value;
    }
  });
  
  appRecord.env = { ...appRecord.env, ...parsed };
  saveApps(apps);
  res.json({ ok: true, imported: Object.keys(parsed).length });
});

function resolveRepoPath(appId, relativePath) {
  const repoPath = path.join(REPOS_DIR, appId);
  const resolved = path.resolve(repoPath, relativePath || '.');
  if (!resolved.startsWith(path.resolve(repoPath))) return null;
  return resolved;
}

const COMMON_CONFIG_FILES = ['.env', '.env.local', 'config.json', 'config.yaml', 'config.yml', 'settings.json', '.env.example'];

app.get('/api/apps/:id/config-files', (req, res) => {
  const repoPath = path.join(REPOS_DIR, req.params.id);
  if (!fs.existsSync(repoPath)) return res.status(404).json({ error: 'Repo bulunamadı' });
  const existing = COMMON_CONFIG_FILES.filter((f) => fs.existsSync(path.join(repoPath, f)));
  res.json({ files: existing });
});

app.get('/api/apps/:id/files', (req, res) => {
  const dirPath = resolveRepoPath(req.params.id, req.query.path || '.');
  if (!dirPath || !fs.existsSync(dirPath)) return res.status(400).json({ error: 'Dizin bulunamadı' });
  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) return res.status(400).json({ error: 'Dizin değil' });
  try {
    const names = fs.readdirSync(dirPath, { withFileTypes: true });
    const entries = names
      .filter((d) => !d.name.startsWith('.') || d.name === '.env' || d.name === '.gitignore')
      .map((d) => ({ name: d.name, isDir: d.isDirectory() }))
      .sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name));
    res.json({ path: req.query.path || '', entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/apps/:id/file', (req, res) => {
  const filePath = resolveRepoPath(req.params.id, req.query.path);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(400).json({ error: 'Dosya bulunamadı veya geçersiz yol' });
  }
  const content = fs.readFileSync(filePath, 'utf8');
  res.json({ path: req.query.path, content });
});

app.put('/api/apps/:id/file', (req, res) => {
  const filePath = resolveRepoPath(req.params.id, req.body && req.body.path);
  if (!filePath) return res.status(400).json({ error: 'Geçersiz yol' });
  const content = req.body && typeof req.body.content === 'string' ? req.body.content : '';
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/apps/:id/use-docker', (req, res) => {
  const apps = loadApps();
  const appRecord = apps.find((a) => a.id === req.params.id);
  if (!appRecord) return res.status(404).json({ error: 'Uygulama bulunamadı' });
  appRecord.useDocker = !!req.body.useDocker;
  saveApps(apps);
  res.json({ ok: true, useDocker: appRecord.useDocker });
});

app.put('/api/apps/:id/start-command', (req, res) => {
  const apps = loadApps();
  const appRecord = apps.find((a) => a.id === req.params.id);
  if (!appRecord) return res.status(404).json({ error: 'Uygulama bulunamadı' });
  appRecord.startCommand = typeof req.body.startCommand === 'string' ? req.body.startCommand.trim() : '';
  saveApps(apps);
  res.json({ ok: true, startCommand: appRecord.startCommand });
});

function suggestEnvKeys(repoPath) {
  const keys = new Set();
  
  // .env.example dosyasından oku
  const envExample = path.join(repoPath, '.env.example');
  if (fs.existsSync(envExample)) {
    try {
      const content = fs.readFileSync(envExample, 'utf8');
      content.split('\n').forEach((line) => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
        if (m) keys.add(m[1]);
      });
    } catch {}
  }
  
  // Koddan otomatik tespit et
  try {
    const files = fs.readdirSync(repoPath);
    const re = /\b(?:os\.environ\.get|os\.getenv|process\.env)\s*[\[(]\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g;
    files.forEach((f) => {
      if (!/\.(py|js|ts|mjs|cjs)$/.test(f)) return;
      const fp = path.join(repoPath, f);
      if (!fs.statSync(fp).isFile()) return;
      try {
        const content = fs.readFileSync(fp, 'utf8');
        let m;
        while ((m = re.exec(content)) !== null) keys.add(m[1]);
      } catch {}
    });
  } catch {}
  
  return Array.from(keys);
}

app.get('/api/apps/:id/suggested-env', (req, res) => {
  const repoPath = path.join(REPOS_DIR, req.params.id);
  if (!fs.existsSync(repoPath)) return res.status(404).json({ error: 'Repo bulunamadı' });
  res.json({ keys: suggestEnvKeys(repoPath) });
});

app.get('/api/apps/:id/health', (req, res) => {
  const apps = loadApps();
  const appRecord = apps.find((a) => a.id === req.params.id);
  if (!appRecord) return res.status(404).json({ error: 'Uygulama bulunamadı' });
  const running = runningProcesses.has(appRecord.id);
  if (!running || !appRecord.port) {
    return res.json({ running, ok: false, reason: running ? 'Port yok' : 'Çalışmıyor' });
  }
  const port = appRecord.port;
  const opts = { hostname: '127.0.0.1', port, path: '/health', method: 'GET', timeout: 3000 };
  const req2 = http.request(opts, (r) => {
    res.json({ running: true, ok: r.statusCode < 500, statusCode: r.statusCode });
  });
  req2.on('error', () => res.json({ running: true, ok: false, reason: 'Bağlanılamadı' }));
  req2.on('timeout', () => { req2.destroy(); res.json({ running: true, ok: false, reason: 'Zaman aşımı' }); });
  req2.end();
});

app.get('/api/terminal-available', (req, res) => {
  res.json({ available: true, type: 'system' });
});

app.post('/api/apps/:id/open-terminal', (req, res) => {
  const apps = loadApps();
  const appRecord = apps.find((a) => a.id === req.params.id);
  if (!appRecord) return res.status(404).json({ error: 'Uygulama bulunamadı' });
  
  const repoPath = path.join(REPOS_DIR, appRecord.id);
  if (!fs.existsSync(repoPath)) return res.status(404).json({ error: 'Repo bulunamadı' });
  
  // Python projesi ve venv varsa activate komutu ekle
  const venvPath = path.join(repoPath, 'venv');
  const hasVenv = fs.existsSync(venvPath) && appRecord.type === 'python';
  
  try {
    if (process.platform === 'darwin') {
      // macOS - Terminal.app ile aç
      const activateCmd = hasVenv ? 'source venv/bin/activate && ' : '';
      const script = `tell application "Terminal"
        do script "cd '${repoPath}' && ${activateCmd}clear"
        activate
      end tell`;
      
      spawn('osascript', ['-e', script], { detached: true });
      res.json({ ok: true, message: 'Terminal açıldı' });
    } else if (process.platform === 'win32') {
      // Windows
      const activateCmd = hasVenv ? 'venv\\Scripts\\activate && ' : '';
      spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', `cd /d "${repoPath}" && ${activateCmd}echo Terminal hazır`], { detached: true });
      res.json({ ok: true, message: 'Terminal açıldı' });
    } else {
      // Linux - gnome-terminal veya xterm dene
      const activateCmd = hasVenv ? 'source venv/bin/activate && ' : '';
      try {
        spawn('gnome-terminal', ['--working-directory=' + repoPath, '--', 'bash', '-c', `${activateCmd}bash`], { detached: true });
      } catch {
        spawn('xterm', ['-e', `cd "${repoPath}" && ${activateCmd}bash`], { detached: true });
      }
      res.json({ ok: true, message: 'Terminal açıldı' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Terminal açılamadı: ' + err.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).end();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws/terminal' });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'error', data: 'Terminal özelliği şu anda devre dışı (node-pty sorunu)' }));
  ws.close();
});

server.listen(PORT, '0.0.0.0', () => {
  ensureDirs();
  console.log(`App Host Manager: http://localhost:${PORT}`);
  console.log('Tüm ağ arayüzlerinden erişim: http://<bilgisayar-ip>:' + PORT);
  if (!pty) console.log('Terminal: node-pty yüklü değil, web terminal devre dışı.');
});
