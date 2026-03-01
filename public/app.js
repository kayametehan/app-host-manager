/**
 * App Host Manager - Frontend
 */

const API = '/api';

async function fetchApps() {
  const res = await fetch(API + '/apps');
  if (!res.ok) throw new Error('Uygulamalar yüklenemedi');
  return res.json();
}

async function addApp(githubUrl) {
  const res = await fetch(API + '/apps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ githubUrl: githubUrl.trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ekleme başarısız');
  return data;
}

async function startApp(id) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/start', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Başlatılamadı');
  return data;
}

async function stopApp(id) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/stop', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Durdurulamadı');
  return data;
}

async function deleteApp(id) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id), { method: 'DELETE' });
  if (!res.ok) throw new Error('Silinemedi');
}

async function fetchLogs(id) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/logs');
  if (!res.ok) throw new Error('Loglar alınamadı');
  return res.json();
}

async function fetchSystemStats() {
  const res = await fetch(API + '/system/stats');
  if (!res.ok) throw new Error('İstatistikler alınamadı');
  return res.json();
}

async function fetchAppEnv(id) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/env');
  if (!res.ok) throw new Error('Ortam yüklenemedi');
  return res.json();
}

async function saveAppEnv(id, env) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/env', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(env),
  });
  if (!res.ok) throw new Error('Kaydedilemedi');
}

async function fetchConfigFiles(id) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/config-files');
  if (!res.ok) throw new Error('Dosya listesi alınamadı');
  return res.json();
}

async function fetchAppFile(id, filePath) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/file?path=' + encodeURIComponent(filePath));
  if (!res.ok) throw new Error('Dosya okunamadı');
  return res.json();
}

async function saveAppFile(id, filePath, content) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/file', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, content }),
  });
  if (!res.ok) throw new Error('Dosya kaydedilemedi');
}

async function fetchAppFiles(id, dirPath) {
  const q = dirPath ? '?path=' + encodeURIComponent(dirPath) : '';
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/files' + q);
  if (!res.ok) throw new Error('Dizin listelenemedi');
  return res.json();
}

async function fetchSuggestedEnv(id) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/suggested-env');
  if (!res.ok) return { keys: [] };
  return res.json();
}

async function fetchAppHealth(id) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/health');
  if (!res.ok) return { ok: false };
  return res.json();
}

function isTerminalAvailable() {
  return window.terminalAvailable === true;
}

function renderApps(apps) {
  const list = document.getElementById('appsList');
  const empty = document.getElementById('emptyState');

  if (!apps.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  list.innerHTML = apps.map((app) => {
    const statusClass = app.running ? 'running' : 'stopped';
    const statusText = app.running ? 'Çalışıyor' : 'Durduruldu';
    const portInfo = app.port ? `Port: ${app.port}` : '';
    const typeInfo = app.type ? ` • ${app.type}` : '';
    const dockerBadge = app.useDocker ? ' <span class="status-badge docker-badge">Docker</span>' : '';
    return `
      <div class="app-card ${app.running ? 'running' : ''}" data-id="${escapeHtml(app.id)}">
        <div class="app-info">
          <div class="app-name">${escapeHtml(app.name)}</div>
          <div class="app-meta">
            <span class="status-badge ${statusClass}">${statusText}</span>${dockerBadge}
            ${portInfo ? ` ${escapeHtml(portInfo)}` : ''}${escapeHtml(typeInfo)}
            <span class="app-health" data-id="${escapeHtml(app.id)}" title="HTTP yanıt veriyorsa yeşil; yoksa uyarı (Telegram botları için normal)"></span>
          </div>
        </div>
        <div class="app-actions">
          <button type="button" class="btn btn-ghost code-btn" data-id="${escapeHtml(app.id)}" data-name="${escapeHtml(app.name)}" title="Kodu görüntüle ve düzenle">Kod</button>
          <button type="button" class="btn btn-ghost terminal-btn" data-id="${escapeHtml(app.id)}" data-name="${escapeHtml(app.name)}" title="Terminal">Terminal</button>
          <button type="button" class="btn btn-ghost config-btn" data-id="${escapeHtml(app.id)}" data-name="${escapeHtml(app.name)}" title="Config & API anahtarları">Config</button>
          <button type="button" class="btn btn-ghost logs-btn" data-id="${escapeHtml(app.id)}" data-name="${escapeHtml(app.name)}">Loglar</button>
          ${app.running
            ? `<button type="button" class="btn btn-danger stop-btn" data-id="${escapeHtml(app.id)}">Durdur</button>`
            : `<button type="button" class="btn btn-primary start-btn" data-id="${escapeHtml(app.id)}">Başlat</button>`
          }
          <button type="button" class="btn btn-ghost delete-btn" data-id="${escapeHtml(app.id)}" data-name="${escapeHtml(app.name)}">Sil</button>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.start-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleStart(btn.dataset.id));
  });
  list.querySelectorAll('.stop-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleStop(btn.dataset.id));
  });
  list.querySelectorAll('.logs-btn').forEach((btn) => {
    btn.addEventListener('click', () => showLogs(btn.dataset.id, btn.dataset.name));
  });
  list.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.id, btn.dataset.name));
  });
  list.querySelectorAll('.config-btn').forEach((btn) => {
    btn.addEventListener('click', () => openConfigModal(btn.dataset.id, btn.dataset.name));
  });
  list.querySelectorAll('.terminal-btn').forEach((btn) => {
    btn.addEventListener('click', () => openTerminalModal(btn.dataset.id, btn.dataset.name));
  });
  list.querySelectorAll('.code-btn').forEach((btn) => {
    btn.addEventListener('click', () => openCodeModal(btn.dataset.id, btn.dataset.name));
  });
  apps.filter((a) => a.running && a.port).forEach((a) => updateAppHealth(a.id));
}

function updateAppHealth(appId) {
  const el = Array.from(document.querySelectorAll('.app-health')).find((n) => n.dataset.id === appId);
  if (!el) return;
  fetchAppHealth(appId).then((h) => {
    if (!h.running) { el.textContent = ''; el.className = 'app-health'; return; }
    if (h.ok === false) {
      el.textContent = ' ⚠ Yanıt vermiyor';
      el.className = 'app-health app-health-warn';
    } else {
      el.textContent = '';
      el.className = 'app-health';
    }
  }).catch(() => { el.textContent = ''; el.className = 'app-health'; });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function showAddError(msg) {
  const el = document.getElementById('addError');
  const success = document.getElementById('addSuccess');
  success.textContent = '';
  el.textContent = msg || '';
}

function showAddSuccess(msg) {
  const el = document.getElementById('addSuccess');
  const err = document.getElementById('addError');
  err.textContent = '';
  el.textContent = msg || '';
}

async function handleAdd(ev) {
  ev.preventDefault();
  const input = document.getElementById('githubUrl');
  const btn = document.getElementById('addBtn');
  const url = input.value.trim();
  if (!url) return;

  btn.disabled = true;
  showAddError('');
  showAddSuccess('');

  try {
    await addApp(url);
    showAddSuccess('Uygulama eklendi ve başlatıldı.');
    input.value = '';
    loadApps();
  } catch (e) {
    showAddError(e.message || 'Bir hata oluştu.');
  } finally {
    btn.disabled = false;
  }
}

async function handleStart(id) {
  try {
    await startApp(id);
    loadApps();
  } catch (e) {
    alert(e.message);
  }
}

async function handleStop(id) {
  try {
    await stopApp(id);
    loadApps();
  } catch (e) {
    alert(e.message);
  }
}

async function handleDelete(id, name) {
  if (!confirm(`"${name}" uygulamasını silmek istediğinize emin misiniz? Repo klasörü de silinecektir.`)) return;
  try {
    await deleteApp(id);
    loadApps();
  } catch (e) {
    alert(e.message);
  }
}

async function loadApps() {
  try {
    const apps = await fetchApps();
    renderApps(apps);
  } catch (e) {
    document.getElementById('appsList').innerHTML = '';
    document.getElementById('emptyState').textContent = 'Uygulamalar yüklenemedi: ' + e.message;
    document.getElementById('emptyState').classList.remove('hidden');
  }
}

let logsAppId = null;
let logsAppName = null;

function showLogs(id, name) {
  logsAppId = id;
  logsAppName = name;
  const modal = document.getElementById('logsModal');
  document.getElementById('logsTitle').textContent = name + ' – Loglar';
  modal.hidden = false;
  refreshLogsContent();
}

function refreshLogsContent() {
  if (!logsAppId) return;
  fetchLogs(logsAppId).then((data) => {
    const body = document.getElementById('logsBody');
    body.textContent = data.lines && data.lines.length ? data.lines.join('\n') : '(Henüz log yok)';
  }).catch(() => {
    document.getElementById('logsBody').textContent = 'Loglar yüklenemedi.';
  });
}

function closeLogsModal() {
  document.getElementById('logsModal').hidden = true;
  logsAppId = null;
  logsAppName = null;
}

function formatBytes(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' GB';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' MB';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + ' KB';
  return n + ' B';
}

function formatUptime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 24) return Math.floor(h / 24) + ' gün';
  return h + 's ' + m + 'dk';
}

async function loadSystemStats() {
  try {
    const s = await fetchSystemStats();
    document.getElementById('statMemory').textContent = '%' + (s.memory.usedPercent ?? '—') + ' (' + formatBytes(s.memory.used) + ' / ' + formatBytes(s.memory.total) + ')';
    document.getElementById('statLoad').textContent = s.loadAvg != null ? s.loadAvg : '—';
    document.getElementById('statUptime').textContent = formatUptime(s.uptime);
    document.getElementById('statHost').textContent = s.hostname || s.platform || '—';

    const listEl = document.getElementById('appsStatsList');
    const totalEl = document.getElementById('appsStatsTotal');
    if (s.runningApps && s.runningApps.length > 0) {
      listEl.innerHTML = s.runningApps
        .map(
          (a) =>
            `<div class="apps-stats-row">
              <span class="apps-stats-name">${escapeHtml(a.name)}</span>
              <span class="apps-stats-cpu">CPU %${a.cpuPercent}</span>
              <span class="apps-stats-mem">Bellek %${a.memoryPercent}</span>
            </div>`
        )
        .join('');
      const tot = s.totalApps || {};
      totalEl.innerHTML = `<div class="apps-stats-row apps-stats-total-row">
        <span class="apps-stats-name">Toplam (uygulamalar)</span>
        <span class="apps-stats-cpu">CPU %${tot.cpuPercent ?? 0}</span>
        <span class="apps-stats-mem">Bellek %${tot.memoryPercent ?? 0}</span>
      </div>`;
      totalEl.hidden = false;
    } else {
      listEl.innerHTML = '<p class="apps-stats-empty">Çalışan uygulama yok</p>';
      totalEl.innerHTML = '';
      totalEl.hidden = true;
    }
  } catch {
    document.getElementById('statMemory').textContent = '—';
    document.getElementById('statLoad').textContent = '—';
    document.getElementById('statUptime').textContent = '—';
    document.getElementById('statHost').textContent = '—';
    document.getElementById('appsStatsList').innerHTML = '';
    document.getElementById('appsStatsTotal').innerHTML = '';
    document.getElementById('appsStatsTotal').hidden = true;
  }
}

let configAppId = null;
let configAppName = null;

function envObjectToRows(env) {
  return Object.entries(env || {}).map(([k, v]) => ({ key: k, value: String(v) }));
}

function rowsToEnvObject(rows) {
  const o = {};
  rows.forEach((r) => {
    const k = (r.key || '').trim();
    if (k) o[k] = (r.value || '').trim();
  });
  return o;
}

function renderEnvEditor(rows) {
  const container = document.getElementById('envEditor');
  container.innerHTML = rows
    .map(
      (r, i) =>
        `<div class="env-row" data-i="${i}">
          <input type="text" class="env-key" placeholder="KEY" value="${escapeHtml(r.key)}" />
          <input type="text" class="env-value" placeholder="Değer" value="${escapeHtml(r.value)}" />
          <button type="button" class="btn btn-ghost env-remove" data-i="${i}" aria-label="Kaldır">×</button>
        </div>`
    )
    .join('');
  container.querySelectorAll('.env-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i, 10);
      envRows.splice(i, 1);
      renderEnvEditor(envRows);
    });
  });
}

let envRows = [];

async function openConfigModal(id, name) {
  configAppId = id;
  configAppName = name;
  document.getElementById('configTitle').textContent = name + ' – Config & Ortam';
  document.getElementById('configModal').hidden = false;
  document.querySelector('.config-tab[data-tab="env"]').classList.add('active');
  document.querySelector('.config-tab[data-tab="files"]').classList.remove('active');
  document.getElementById('configTabEnv').hidden = false;
  document.getElementById('configTabFiles').hidden = true;
  document.getElementById('configFileEditor').hidden = true;
  try {
    const [appData, env, suggested] = await Promise.all([
      fetch(API + '/apps/' + encodeURIComponent(id)).then((r) => r.ok ? r.json() : {}),
      fetchAppEnv(id),
      fetchSuggestedEnv(id).catch(() => ({ keys: [] })),
    ]);
    document.getElementById('configUseDocker').checked = !!appData.useDocker;
    document.getElementById('configStartCommand').value = appData.startCommand || '';
    const existingKeys = new Set(Object.keys(env || {}));
    const suggestedKeys = (suggested.keys || []).filter((k) => !existingKeys.has(k));
    envRows = envObjectToRows(env);
    suggestedKeys.forEach((k) => envRows.push({ key: k, value: '' }));
    if (envRows.length === 0) envRows.push({ key: '', value: '' });
    renderEnvEditor(envRows);
    const hintEl = document.getElementById('configSuggestedHint');
    if (hintEl) hintEl.textContent = suggestedKeys.length ? 'Önerilen API/ortam değişkenleri eklendi (değerleri doldurup Kaydet\'e basın).' : '';
  } catch (e) {
    envRows = [{ key: '', value: '' }];
    renderEnvEditor(envRows);
  }
}

function closeConfigModal() {
  document.getElementById('configModal').hidden = true;
  configAppId = null;
  configAppName = null;
}

function collectEnvRows() {
  const rows = [];
  document.querySelectorAll('#envEditor .env-row').forEach((row) => {
    const key = (row.querySelector('.env-key') || {}).value || '';
    const value = (row.querySelector('.env-value') || {}).value || '';
    rows.push({ key, value });
  });
  return rows;
}

async function handleEnvSave() {
  if (!configAppId) return;
  const rows = collectEnvRows();
  const env = rowsToEnvObject(rows);
  await saveAppEnv(configAppId, env);
  alert('Ortam değişkenleri kaydedildi. Uygulamayı yeniden başlattığınızda uygulanır.');
}

function addEnvRow() {
  envRows.push({ key: '', value: '' });
  renderEnvEditor(envRows);
}

async function showConfigFilesTab() {
  if (!configAppId) return;
  const listEl = document.getElementById('configFileList');
  listEl.innerHTML = 'Yükleniyor...';
  try {
    const { files } = await fetchConfigFiles(configAppId);
    if (files.length === 0) {
      listEl.innerHTML = '<p class="config-no-files">Bu repoda bilinen config dosyası yok.</p>';
      return;
    }
    listEl.innerHTML = files
      .map(
        (f) =>
          `<button type="button" class="config-file-item" data-path="${escapeHtml(f)}">${escapeHtml(f)}</button>`
      )
      .join('');
    listEl.querySelectorAll('.config-file-item').forEach((btn) => {
      btn.addEventListener('click', () => openConfigFile(btn.dataset.path));
    });
  } catch (e) {
    listEl.innerHTML = '<p class="error">' + escapeHtml(e.message) + '</p>';
  }
}

let currentConfigFilePath = null;

async function openConfigFile(filePath) {
  currentConfigFilePath = filePath;
  document.getElementById('configFileEditor').hidden = false;
  document.getElementById('configFileName').textContent = filePath;
  const editor = document.getElementById('configFileContent');
  editor.value = '';
  try {
    const data = await fetchAppFile(configAppId, filePath);
    editor.value = data.content || '';
  } catch (e) {
    editor.value = '# Yüklenemedi: ' + e.message;
  }
}

async function handleConfigFileSave() {
  if (!configAppId || !currentConfigFilePath) return;
  const content = document.getElementById('configFileContent').value;
  await saveAppFile(configAppId, currentConfigFilePath, content);
  alert('Dosya kaydedildi.');
}

// --- Terminal modal ---
let terminalWs = null;
let terminalXterm = null;
let terminalFitAddon = null;

function openTerminalModal(id, name) {
  document.getElementById('terminalTitle').textContent = name + ' – Terminal';
  document.getElementById('terminalModal').hidden = false;
  document.getElementById('terminalUnavailable').hidden = true;
  const container = document.getElementById('terminalContainer');
  container.innerHTML = '';
  if (!window.Terminal || !isTerminalAvailable()) {
    document.getElementById('terminalUnavailable').hidden = false;
    return;
  }
  const Term = window.Terminal && (window.Terminal.Terminal || window.Terminal);
  terminalXterm = new Term({ theme: { background: '#0f0f12', foreground: '#e4e4e7' }, fontFamily: 'JetBrains Mono, monospace' });
  const FitCtor = (window.FitAddon && window.FitAddon.FitAddon) || window.FitAddon;
  if (FitCtor) {
    terminalFitAddon = new FitCtor();
    terminalXterm.loadAddon(terminalFitAddon);
  }
  terminalXterm.open(container);
  if (terminalFitAddon && terminalFitAddon.fit) setTimeout(() => terminalFitAddon.fit(), 100);
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = protocol + '//' + location.host + '/ws/terminal';
  terminalWs = new WebSocket(wsUrl);
  let terminalReady = false;
  terminalWs.onopen = () => {
    terminalWs.send(JSON.stringify({ type: 'init', appId: id }));
  };
  terminalWs.onmessage = (ev) => {
    const payload = typeof ev.data === 'string' ? ev.data : (ev.data && typeof ev.data.toString === 'function' ? ev.data.toString() : '');
    try {
      const msg = payload.startsWith('{') ? JSON.parse(payload) : { type: 'output', data: payload };
      if (msg.type === 'output') terminalXterm.write(msg.data || '');
      if (msg.type === 'error') terminalXterm.writeln('\r\n[Hata] ' + (msg.data || '') + '\r\n');
      if (msg.type === 'ready') terminalReady = true;
      if (msg.type === 'exit') {
        terminalReady = false;
        terminalXterm.writeln('\r\n[Oturum kapandı]\r\n');
      }
    } catch (e) {
      terminalXterm.writeln(payload || '[Geçersiz yanıt]');
    }
  };
  terminalWs.onerror = () => terminalXterm.writeln('\r\n[WebSocket bağlantı hatası]\r\n');
  terminalXterm.onData((key) => {
    if (terminalReady && terminalWs && terminalWs.readyState === WebSocket.OPEN)
      terminalWs.send(JSON.stringify({ type: 'input', data: key }));
  });
  window.addEventListener('resize', () => terminalFitAddon && terminalFitAddon.fit && terminalFitAddon.fit());
}

function closeTerminalModal() {
  if (terminalWs) {
    terminalWs.close();
    terminalWs = null;
  }
  if (terminalXterm) terminalXterm.dispose();
  terminalXterm = null;
  document.getElementById('terminalModal').hidden = true;
}

// --- Code modal ---
let codeAppId = null;
let codeAppName = null;
let currentCodeFilePath = null;

function openCodeModal(id, name) {
  codeAppId = id;
  codeAppName = name;
  document.getElementById('codeTitle').textContent = name + ' – Kod';
  document.getElementById('codeModal').hidden = false;
  document.getElementById('codeEditorEmpty').hidden = false;
  document.getElementById('codeEditorBox').hidden = true;
  renderCodeTree('');
}

function closeCodeModal() {
  document.getElementById('codeModal').hidden = true;
  codeAppId = null;
  codeAppName = null;
  currentCodeFilePath = null;
}

async function renderCodeTree(prefix) {
  const treeEl = document.getElementById('codeTree');
  treeEl.innerHTML = 'Yükleniyor...';
  try {
    const { entries } = await fetchAppFiles(codeAppId, prefix || undefined);
    treeEl.innerHTML = '';
    if (prefix) {
      const up = document.createElement('span');
      up.className = 'code-tree-item code-tree-up';
      up.textContent = '[..] Üst dizin';
      up.addEventListener('click', () => renderCodeTree(prefix.split('/').slice(0, -1).join('/')));
      treeEl.appendChild(up);
    }
    const base = prefix ? prefix + '/' : '';
    entries.forEach((e) => {
      const span = document.createElement('span');
      span.className = 'code-tree-item' + (e.isDir ? ' code-tree-dir' : '');
      span.textContent = (e.isDir ? '[+] ' : '') + e.name;
      span.dataset.path = base + e.name;
      span.dataset.isDir = e.isDir;
      span.addEventListener('click', () => {
        if (e.isDir) renderCodeTree(base + e.name);
        else openCodeFile(base + e.name);
      });
      treeEl.appendChild(span);
    });
  } catch (err) {
    treeEl.innerHTML = '<span class="error">' + escapeHtml(err.message) + '</span>';
  }
}

async function openCodeFile(filePath) {
  currentCodeFilePath = filePath;
  document.getElementById('codeEditorEmpty').hidden = true;
  document.getElementById('codeEditorBox').hidden = false;
  document.getElementById('codeFileName').textContent = filePath;
  const ta = document.getElementById('codeFileContent');
  ta.value = '';
  try {
    const data = await fetchAppFile(codeAppId, filePath);
    ta.value = data.content || '';
  } catch (e) {
    ta.value = '# Yüklenemedi: ' + e.message;
  }
}

async function handleCodeFileSave() {
  if (!codeAppId || !currentCodeFilePath) return;
  const content = document.getElementById('codeFileContent').value;
  await saveAppFile(codeAppId, currentCodeFilePath, content);
  alert('Dosya kaydedildi.');
}

document.getElementById('addForm').addEventListener('submit', handleAdd);
document.querySelector('#logsModal .modal-backdrop').addEventListener('click', closeLogsModal);
document.querySelector('#logsModal .modal-close').addEventListener('click', closeLogsModal);
document.getElementById('refreshLogs').addEventListener('click', refreshLogsContent);

document.querySelector('.config-modal-close').addEventListener('click', closeConfigModal);
document.querySelector('#configModal .modal-backdrop').addEventListener('click', closeConfigModal);
document.querySelector('.terminal-modal-close').addEventListener('click', closeTerminalModal);
document.querySelector('#terminalModal .modal-backdrop').addEventListener('click', closeTerminalModal);
document.querySelector('.code-modal-close').addEventListener('click', closeCodeModal);
document.querySelector('#codeModal .modal-backdrop').addEventListener('click', closeCodeModal);
document.getElementById('codeFileSave').addEventListener('click', handleCodeFileSave);
document.getElementById('envAddRow').addEventListener('click', addEnvRow);
document.getElementById('envSave').addEventListener('click', handleEnvSave);
document.getElementById('configFileSave').addEventListener('click', handleConfigFileSave);
document.getElementById('configUseDocker').addEventListener('change', async function () {
  if (!configAppId) return;
  try {
    await fetch(API + '/apps/' + encodeURIComponent(configAppId) + '/use-docker', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useDocker: this.checked }),
    });
    loadApps();
  } catch (e) {
    alert(e.message);
  }
});

document.getElementById('configStartCommandSave').addEventListener('click', async function () {
  if (!configAppId) return;
  const cmd = document.getElementById('configStartCommand').value.trim();
  try {
    await fetch(API + '/apps/' + encodeURIComponent(configAppId) + '/start-command', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startCommand: cmd }),
    });
    alert('Başlatma komutu kaydedildi. Uygulamayı yeniden başlattığınızda uygulanır.');
    loadApps();
  } catch (e) {
    alert(e.message);
  }
});

document.querySelectorAll('.config-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.config-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const t = tab.dataset.tab;
    document.getElementById('configTabEnv').hidden = t !== 'env';
    document.getElementById('configTabFiles').hidden = t !== 'files';
    if (t === 'files') showConfigFilesTab();
  });
});

fetch(API + '/terminal-available').then((r) => r.json()).then((d) => { window.terminalAvailable = d.available; }).catch(() => { window.terminalAvailable = false; });
loadApps();
loadSystemStats();
setInterval(loadSystemStats, 8000);
