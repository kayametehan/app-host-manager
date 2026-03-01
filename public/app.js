/**
 * App Host Manager - Frontend
 */

const API = '/api';

async function fetchApps() {
  const res = await fetch(API + '/apps', {
    cache: 'no-cache',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
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
  if (!res.ok) {
    if (data.missingKeys && data.missingKeys.length > 0) {
      throw new Error(data.message || 'Eksik ortam değişkenleri: ' + data.missingKeys.join(', '));
    }
    throw new Error(data.error || 'Başlatılamadı');
  }
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

async function updateApp(id) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/update', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Güncellenemedi');
  return data;
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

async function importEnvFile(id, content) {
  const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/env/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('İçe aktarılamadı');
  return res.json();
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
    
    // Better type display
    let typeInfo = '';
    if (app.type === 'docker-compose') {
      typeInfo = ' • 🐳 Docker Compose';
    } else if (app.type === 'docker') {
      typeInfo = ' • 🐳 Docker';
    } else if (app.type) {
      typeInfo = ` • ${app.type}`;
    }
    
    const dockerBadge = app.useDocker ? ' <span class="status-badge docker-badge">🐳 Docker</span>' : '';
    const createdDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString('tr-TR') : '';
    
    return `
      <div class="app-card-clickable ${app.running ? 'running' : ''}" data-id="${escapeHtml(app.id)}">
        <div class="app-card-header">
          <div class="app-name">${escapeHtml(app.name)}</div>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="app-card-body">
          <div class="app-meta">
            ${dockerBadge}
            ${portInfo ? ` <span class="app-meta-item">${escapeHtml(portInfo)}</span>` : ''}
            ${typeInfo ? `<span class="app-meta-item">${escapeHtml(typeInfo)}</span>` : ''}
            ${createdDate ? `<span class="app-meta-item">📅 ${createdDate}</span>` : ''}
          </div>
          <div class="app-card-actions">
            ${app.running
              ? `<button type="button" class="btn btn-sm btn-danger stop-btn" data-id="${escapeHtml(app.id)}" onclick="event.stopPropagation()">Durdur</button>`
              : `<button type="button" class="btn btn-sm btn-primary start-btn" data-id="${escapeHtml(app.id)}" onclick="event.stopPropagation()">Başlat</button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.app-card-clickable').forEach((card) => {
    card.addEventListener('click', () => openAppDashboard(card.dataset.id));
  });
  list.querySelectorAll('.start-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleStart(btn.dataset.id));
  });
  list.querySelectorAll('.stop-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleStop(btn.dataset.id));
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
    showToast('Başarılı', 'Uygulama eklendi ve başlatıldı', 'success');
    input.value = '';
    loadApps();
  } catch (e) {
    showAddError(e.message || 'Bir hata oluştu.');
    showToast('Hata', e.message || 'Bir hata oluştu', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handleStart(id) {
  try {
    await startApp(id);
    showToast('Başarılı', 'Uygulama başlatıldı', 'success');
    loadApps();
  } catch (e) {
    const errorMsg = e.message;
    
    // Provide helpful guidance based on error
    if (errorMsg.includes('Docker gerekli ama çalışmıyor') || errorMsg.includes('Docker Desktop')) {
      showToast('Docker Gerekli', '🐳 Docker Desktop\'ı başlatın ve birkaç saniye bekleyin, sonra tekrar deneyin.', 'error');
      
      // Show detailed instructions
      setTimeout(() => {
        if (confirm('Docker Desktop kurulu değil mi?\n\nMacOS için: brew install --cask docker\nWindows için: https://www.docker.com/products/docker-desktop\n\nKurulum sayfasını açmak ister misiniz?')) {
          window.open('https://www.docker.com/products/docker-desktop', '_blank');
        }
      }, 2000);
    } else if (errorMsg.includes('Docker gerektirir')) {
      showToast('Docker Gerekli', 'Bu uygulama Docker ile çalışır. Uygulama kartına tıklayıp Ayarlar sekmesinden Docker\'ı aktifleştirin.', 'warning');
    } else if (errorMsg.includes('Desteklenmeyen proje tipi')) {
      showToast('Özel Komut Gerekli', 'Bu proje için özel başlatma komutu gerekiyor. Uygulama kartına tıklayıp Ayarlar sekmesinden başlatma komutunu girin.', 'warning');
    } else if (errorMsg.includes('Eksik ortam değişkenleri')) {
      showToast('Ortam Değişkenleri Eksik', errorMsg, 'warning');
    } else {
      showToast('Hata', errorMsg, 'error');
    }
    
    // Show detailed error in console
    console.error('Start error:', e);
  }
}

async function handleStop(id) {
  try {
    await stopApp(id);
    showToast('Başarılı', 'Uygulama durduruldu', 'success');
    loadApps();
  } catch (e) {
    showToast('Hata', e.message, 'error');
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

async function handleUpdate(id, name) {
  if (!confirm(`"${name}" uygulamasını GitHub'dan güncellemek istediğinize emin misiniz? Mevcut env değişkenleri korunacak.`)) return;
  try {
    const result = await updateApp(id);
    alert(result.message || 'Güncelleme tamamlandı');
    loadApps();
  } catch (e) {
    alert('Güncelleme hatası: ' + e.message);
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

async function openTerminalModal(id) {
  try {
    const res = await fetch(API + '/apps/' + encodeURIComponent(id) + '/open-terminal', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert('Terminal açılamadı: ' + (data.error || 'Bilinmeyen hata'));
    }
  } catch (err) {
    alert('Terminal açılamadı: ' + err.message);
  }
}

async function loadSystemStats() {
  try {
    const s = await fetchSystemStats();
    const apps = await fetchApps();
    
    // Bellek
    const memPercent = s.memory.usedPercent ?? 0;
    document.getElementById('statMemory').textContent = memPercent + '%';
    document.getElementById('statMemoryDetail').textContent = 
      formatBytes(s.memory.used) + ' / ' + formatBytes(s.memory.total);
    document.getElementById('systemMemBar').style.width = memPercent + '%';
    
    // CPU
    const cpuLoad = s.loadAvg != null ? parseFloat(s.loadAvg) : 0;
    const cpuPercent = s.cpuCount > 0 ? Math.min(Math.round((cpuLoad / s.cpuCount) * 100), 100) : 0;
    document.getElementById('statLoad').textContent = cpuPercent + '%';
    document.getElementById('statCpuDetail').textContent = s.cpuCount + ' çekirdek';
    
    // Çalışan uygulamalar
    const runningCount = apps.filter(a => a.running).length;
    const totalCount = apps.length;
    document.getElementById('statRunningApps').textContent = runningCount;
    document.getElementById('statTotalApps').textContent = totalCount + ' toplam';
    
    // Uptime
    document.getElementById('statUptime').textContent = formatUptime(s.uptime);
    document.getElementById('statHost').textContent = s.hostname || s.platform || '—';
    
    // System health indicator
    updateSystemHealth(memPercent, cpuPercent, runningCount, totalCount);
    
    // Çalışan uygulamalar listesi
    const runningAppsSection = document.getElementById('runningAppsSection');
    const runningAppsList = document.getElementById('runningAppsList');
    
    if (s.runningApps && s.runningApps.length > 0) {
      runningAppsSection.hidden = false;
      runningAppsList.innerHTML = s.runningApps.map(app => {
        const cpuColor = app.cpuPercent > 80 ? '#ef4444' : app.cpuPercent > 50 ? '#f59e0b' : '#22c55e';
        const memColor = app.memoryPercent > 80 ? '#ef4444' : app.memoryPercent > 50 ? '#f59e0b' : '#22c55e';
        
        return `
          <div class="running-app-item">
            <div class="running-app-name">${escapeHtml(app.name)}</div>
            <div class="running-app-stats">
              <div class="running-app-stat">
                <span class="running-app-stat-label">CPU</span>
                <span class="running-app-stat-value" style="color: ${cpuColor}">${app.cpuPercent}%</span>
              </div>
              <div class="running-app-stat">
                <span class="running-app-stat-label">Bellek</span>
                <span class="running-app-stat-value" style="color: ${memColor}">${app.memoryPercent}%</span>
              </div>
              <div class="running-app-stat">
                <span class="running-app-stat-label">RAM</span>
                <span class="running-app-stat-value">${formatBytes(app.memoryBytes)}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      runningAppsSection.hidden = true;
    }
  } catch (e) {
    console.error('Stats yüklenemedi:', e);
    document.getElementById('statMemory').textContent = '—';
    document.getElementById('statLoad').textContent = '—';
    document.getElementById('statRunningApps').textContent = '0';
    document.getElementById('statUptime').textContent = '—';
    updateSystemHealth(0, 0, 0, 0, true);
  }
}

function updateSystemHealth(memPercent, cpuPercent, runningCount, totalCount, error = false) {
  const indicator = document.getElementById('systemHealthIndicator');
  const healthText = indicator.querySelector('.health-text');
  
  if (error) {
    indicator.className = 'system-health-indicator error';
    healthText.textContent = 'Hata';
    indicator.title = 'Sistem istatistikleri alınamadı';
    return;
  }
  
  // Determine health status
  if (memPercent > 90 || cpuPercent > 90) {
    indicator.className = 'system-health-indicator error';
    healthText.textContent = 'Kritik';
    indicator.title = `Yüksek kaynak kullanımı: CPU ${cpuPercent}%, Bellek ${memPercent}%`;
  } else if (memPercent > 75 || cpuPercent > 75) {
    indicator.className = 'system-health-indicator warning';
    healthText.textContent = 'Uyarı';
    indicator.title = `Orta kaynak kullanımı: CPU ${cpuPercent}%, Bellek ${memPercent}%`;
  } else {
    indicator.className = 'system-health-indicator';
    healthText.textContent = 'Sağlıklı';
    indicator.title = `Sistem normal: CPU ${cpuPercent}%, Bellek ${memPercent}%, ${runningCount}/${totalCount} uygulama çalışıyor`;
  }
}

document.getElementById('addForm').addEventListener('submit', handleAdd);

fetch(API + '/terminal-available').then((r) => r.json()).then((d) => { window.terminalAvailable = d.available; }).catch(() => { window.terminalAvailable = false; });

// Check Docker status
async function checkDockerStatus() {
  try {
    const res = await fetch(API + '/docker/status');
    const status = await res.json();
    
    const indicator = document.getElementById('dockerStatusIndicator');
    const dot = indicator.querySelector('.docker-dot');
    const text = indicator.querySelector('.docker-text');
    
    if (status.available) {
      indicator.className = 'docker-status-indicator docker-running';
      text.textContent = 'Docker ✓';
      indicator.title = 'Docker çalışıyor';
    } else {
      indicator.className = 'docker-status-indicator docker-stopped';
      text.textContent = 'Docker ✗';
      indicator.title = status.error || 'Docker çalışmıyor';
    }
  } catch (e) {
    const indicator = document.getElementById('dockerStatusIndicator');
    indicator.className = 'docker-status-indicator docker-unknown';
    indicator.title = 'Docker durumu kontrol edilemiyor';
  }
}

// Check Docker status on load and periodically
checkDockerStatus();
setInterval(checkDockerStatus, 15000);

// Quick deploy templates
async function loadQuickDeploy() {
  try {
    const templates = await fetchTemplates();
    const popular = templates.filter(t => ['nextcloud', 'wordpress', 'ghost', 'strapi', 'n8n', 'code-server'].includes(t.id));
    
    const grid = document.getElementById('quickDeployGrid');
    grid.innerHTML = popular.map(t => `
      <div class="quick-deploy-card" data-repo="${escapeHtml(t.repo)}">
        <span class="quick-deploy-icon">${t.icon}</span>
        <span class="quick-deploy-name">${escapeHtml(t.name)}</span>
      </div>
    `).join('');
    
    grid.querySelectorAll('.quick-deploy-card').forEach(card => {
      card.addEventListener('click', () => {
        document.getElementById('githubUrl').value = card.dataset.repo;
        showToast('Şablon Seçildi', 'GitHub URL alanına eklendi', 'info');
      });
    });
  } catch (e) {
    console.error('Quick deploy load error:', e);
  }
}

loadQuickDeploy();

// Sayfa yüklendiğinde durumu geri yükle
restoreAppDashboardState();

loadApps();
loadSystemStats();
setInterval(loadSystemStats, 8000);

// --- App Dashboard ---
let currentAppId = null;
let currentAppData = null;
let appEnvRows = [];
let currentAppCodeFilePath = null;

// LocalStorage'dan durumu geri yükle
function restoreAppDashboardState() {
  const savedAppId = localStorage.getItem('currentAppId');
  if (savedAppId) {
    // Sayfa yüklendiğinde app dashboard'u aç
    setTimeout(() => {
      openAppDashboard(savedAppId);
    }, 100);
  }
}

function openAppDashboard(appId) {
  currentAppId = appId;
  localStorage.setItem('currentAppId', appId);
  document.getElementById('mainDashboard').hidden = true;
  document.getElementById('appDashboard').hidden = false;
  
  loadAppDashboard();
  switchDashboardTab('overview');
}

function closeAppDashboard() {
  document.getElementById('mainDashboard').hidden = false;
  document.getElementById('appDashboard').hidden = true;
  
  // Terminal'i temizle
  if (terminalSocket) {
    terminalSocket.close();
    terminalSocket = null;
  }
  if (terminalInstance) {
    terminalInstance.dispose();
    terminalInstance = null;
  }
  
  currentAppId = null;
  currentAppData = null;
  localStorage.removeItem('currentAppId');
  
  // Uygulamaları yeniden yükle (güncel durumları al)
  loadApps();
}

async function loadAppDashboard() {
  if (!currentAppId) return;
  
  try {
    const res = await fetch(API + '/apps/' + encodeURIComponent(currentAppId));
    if (!res.ok) throw new Error('Uygulama bulunamadı');
    currentAppData = await res.json();
    
    document.getElementById('appDashboardTitle').textContent = currentAppData.name;
    
    // Durum butonları
    if (currentAppData.running) {
      document.getElementById('appDashStartBtn').style.display = 'none';
      document.getElementById('appDashStopBtn').style.display = 'inline-block';
    } else {
      document.getElementById('appDashStartBtn').style.display = 'inline-block';
      document.getElementById('appDashStopBtn').style.display = 'none';
    }
    
    // Overview tab
    updateOverviewTab();
    
    // Stats tab
    if (currentAppData.running) {
      updateStatsTab();
    }
  } catch (e) {
    alert('Uygulama yüklenemedi: ' + e.message);
    closeAppDashboard();
  }
}

function updateOverviewTab() {
  const statusBadge = document.getElementById('appStatusBadge');
  statusBadge.textContent = currentAppData.running ? 'Çalışıyor' : 'Durduruldu';
  statusBadge.className = 'status-badge-large ' + (currentAppData.running ? 'running' : 'stopped');
  
  document.getElementById('appPort').textContent = currentAppData.port || '-';
  document.getElementById('appType').textContent = currentAppData.type || '-';
  
  const githubLink = document.getElementById('appGithub');
  githubLink.textContent = currentAppData.githubUrl || '-';
  githubLink.href = currentAppData.githubUrl || '#';
  
  // Son loglar
  fetchLogs(currentAppId).then((data) => {
    const lines = data.lines || [];
    document.getElementById('recentLogs').textContent = lines.slice(-10).join('\n') || '(Henüz log yok)';
  }).catch(() => {
    document.getElementById('recentLogs').textContent = 'Loglar yüklenemedi.';
  });
  
  // Gerçek zamanlı stats güncelle
  if (currentAppData.running) {
    updateStatsTab();
  }
}

async function updateStatsTab() {
  if (!currentAppId || !currentAppData.running) {
    // Uygulama çalışmıyorsa sıfırla
    document.getElementById('appCpuPercent').textContent = '0%';
    document.getElementById('appMemPercent').textContent = '0%';
    document.getElementById('appMemBytes').textContent = '0 MB';
    document.getElementById('appCpuBar').style.width = '0%';
    document.getElementById('appMemBar').style.width = '0%';
    document.getElementById('appNetworkStatus').textContent = 'Kapalı';
    document.getElementById('appHealthText').textContent = 'Durduruldu';
    document.getElementById('appHealthDot').style.background = 'var(--text-muted)';
    document.getElementById('appHealthDot').style.animation = 'none';
    return;
  }
  
  try {
    const stats = await fetchSystemStats();
    const appStat = stats.runningApps.find(a => a.id === currentAppId);
    
    if (appStat) {
      const cpuPercent = Math.round(appStat.cpuPercent * 10) / 10;
      const memPercent = Math.round(appStat.memoryPercent * 10) / 10;
      
      document.getElementById('appCpuPercent').textContent = cpuPercent + '%';
      document.getElementById('appMemPercent').textContent = memPercent + '%';
      document.getElementById('appMemBytes').textContent = formatBytes(appStat.memoryBytes);
      
      // Progress bar'ları güncelle
      document.getElementById('appCpuBar').style.width = Math.min(cpuPercent, 100) + '%';
      document.getElementById('appMemBar').style.width = Math.min(memPercent, 100) + '%';
      
      // Gerçek zamanlı stats (Stats tab dışında da göster)
      if (document.getElementById('appRealtimeCpu')) {
        document.getElementById('appRealtimeCpu').textContent = cpuPercent + '%';
        document.getElementById('appRealtimeMem').textContent = memPercent + '%';
        document.getElementById('appRealtimeCpuBar').style.width = Math.min(cpuPercent, 100) + '%';
        document.getElementById('appRealtimeMemBar').style.width = Math.min(memPercent, 100) + '%';
      }
    } else {
      document.getElementById('appCpuPercent').textContent = '0%';
      document.getElementById('appMemPercent').textContent = '0%';
      document.getElementById('appMemBytes').textContent = '0 MB';
      document.getElementById('appCpuBar').style.width = '0%';
      document.getElementById('appMemBar').style.width = '0%';
    }
    
    document.getElementById('appStatsPort').textContent = currentAppData.port || '-';
    document.getElementById('appStatsPortDetail').textContent = currentAppData.port || '-';
    
    const url = currentAppData.port ? `http://localhost:${currentAppData.port}` : '-';
    document.getElementById('appStatsUrl').textContent = url;
    document.getElementById('appStatsUrl').href = url !== '-' ? url : '#';
    
    // Network status
    if (currentAppData.running && currentAppData.port) {
      document.getElementById('appNetworkStatus').textContent = 'Aktif';
      document.getElementById('appHealthText').textContent = 'Çalışıyor';
      document.getElementById('appHealthDot').style.background = 'var(--accent)';
      document.getElementById('appHealthDot').style.animation = 'pulse 2s infinite';
    } else {
      document.getElementById('appNetworkStatus').textContent = 'Kapalı';
      document.getElementById('appHealthText').textContent = 'Durduruldu';
      document.getElementById('appHealthDot').style.background = 'var(--text-muted)';
      document.getElementById('appHealthDot').style.animation = 'none';
    }
    
    // PID bilgisi (varsa)
    if (appStat && appStat.pid) {
      document.getElementById('appPid').textContent = appStat.pid;
    } else {
      document.getElementById('appPid').textContent = '-';
    }
  } catch (e) {
    console.error('Stats yüklenemedi:', e);
  }
}

function switchDashboardTab(tabName) {
  document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.dashboard-tab[data-tab="${tabName}"]`).classList.add('active');
  
  document.querySelectorAll('.dashboard-tab-content').forEach(c => c.hidden = true);
  document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).hidden = false;
  
  // Tab açıldığında ilgili verileri yükle
  if (tabName === 'files') {
    renderAppCodeTree('');
  } else if (tabName === 'env') {
    loadAppEnv();
  } else if (tabName === 'logs') {
    loadAppLogs();
  } else if (tabName === 'terminal') {
    initTerminal();
  } else if (tabName === 'stats') {
    updateStatsTab();
  } else if (tabName === 'settings') {
    loadAppSettings();
  }
}

// Files tab
let originalFileContent = '';
let currentFileModified = false;

async function renderAppCodeTree(prefix) {
  const treeEl = document.getElementById('appCodeTree');
  treeEl.innerHTML = 'Yükleniyor...';
  try {
    const { entries } = await fetchAppFiles(currentAppId, prefix || undefined);
    treeEl.innerHTML = '';
    if (prefix) {
      const up = document.createElement('span');
      up.className = 'code-tree-item code-tree-up';
      up.textContent = '[..] Üst dizin';
      up.addEventListener('click', () => renderAppCodeTree(prefix.split('/').slice(0, -1).join('/')));
      treeEl.appendChild(up);
    }
    const base = prefix ? prefix + '/' : '';
    entries.forEach((e) => {
      const span = document.createElement('span');
      span.className = 'code-tree-item' + (e.isDir ? ' code-tree-dir' : '');
      const icon = e.isDir ? '📁' : getFileIcon(e.name);
      span.textContent = icon + ' ' + e.name;
      span.dataset.path = base + e.name;
      span.dataset.isDir = e.isDir;
      span.addEventListener('click', () => {
        if (e.isDir) renderAppCodeTree(base + e.name);
        else openAppCodeFile(base + e.name);
      });
      treeEl.appendChild(span);
    });
  } catch (err) {
    treeEl.innerHTML = '<span class="error">' + escapeHtml(err.message) + '</span>';
  }
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    'js': '📜', 'ts': '📘', 'jsx': '⚛️', 'tsx': '⚛️',
    'py': '🐍', 'java': '☕', 'go': '🐹',
    'html': '🌐', 'css': '🎨', 'scss': '🎨',
    'json': '📋', 'xml': '📋', 'yaml': '📋', 'yml': '📋',
    'md': '📝', 'txt': '📄',
    'png': '🖼️', 'jpg': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
    'env': '🔐', 'config': '⚙️'
  };
  return icons[ext] || '📄';
}

async function openAppCodeFile(filePath) {
  if (currentFileModified) {
    if (!confirm('Kaydedilmemiş değişiklikler var. Devam etmek istiyor musunuz?')) {
      return;
    }
  }
  
  currentAppCodeFilePath = filePath;
  currentFileModified = false;
  document.getElementById('appCodeEditorEmpty').hidden = true;
  document.getElementById('appCodeEditorBox').hidden = false;
  document.getElementById('appCodeFileName').textContent = filePath;
  document.getElementById('editorModified').hidden = true;
  
  const ta = document.getElementById('appCodeFileContent');
  ta.value = 'Yükleniyor...';
  try {
    const data = await fetchAppFile(currentAppId, filePath);
    originalFileContent = data.content || '';
    ta.value = originalFileContent;
    updateEditorStatus();
    
    // Syntax highlighting hint
    const ext = filePath.split('.').pop().toLowerCase();
    ta.dataset.language = ext;
    
    // Initial syntax highlighting
    updateSyntaxHighlighting(originalFileContent);
  } catch (e) {
    ta.value = '# Yüklenemedi: ' + e.message;
  }
}

function updateEditorStatus() {
  const content = document.getElementById('appCodeFileContent').value;
  const lines = content.split('\n').length;
  const chars = content.length;
  
  document.getElementById('editorLineCount').textContent = lines + ' satır';
  document.getElementById('editorCharCount').textContent = chars + ' karakter';
  
  currentFileModified = content !== originalFileContent;
  document.getElementById('editorModified').hidden = !currentFileModified;
  
  // Update line numbers
  updateLineNumbers(lines);
  
  // Update syntax highlighting
  updateSyntaxHighlighting(content);
}

function updateLineNumbers(lineCount) {
  const lineNumbersEl = document.getElementById('editorLineNumbers');
  const currentLines = lineNumbersEl.children.length;
  
  if (currentLines === lineCount) return;
  
  lineNumbersEl.innerHTML = '';
  for (let i = 1; i <= lineCount; i++) {
    const div = document.createElement('div');
    div.textContent = i;
    lineNumbersEl.appendChild(div);
  }
}

function syncEditorScroll() {
  const textarea = document.getElementById('appCodeFileContent');
  const lineNumbers = document.getElementById('editorLineNumbers');
  const codeDisplay = document.getElementById('codeDisplay');
  
  if (textarea && lineNumbers) {
    lineNumbers.scrollTop = textarea.scrollTop;
  }
  if (textarea && codeDisplay) {
    codeDisplay.scrollTop = textarea.scrollTop;
    codeDisplay.scrollLeft = textarea.scrollLeft;
  }
}

function escapeHtmlForHighlight(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function updateSyntaxHighlighting(code) {
  const codeDisplay = document.getElementById('codeDisplay');
  if (!codeDisplay) return;
  
  const ext = currentAppCodeFilePath ? currentAppCodeFilePath.split('.').pop().toLowerCase() : '';
  let highlighted = escapeHtmlForHighlight(code);
  
  // JavaScript/TypeScript highlighting
  if (['js', 'jsx', 'ts', 'tsx', 'mjs'].includes(ext)) {
    highlighted = highlightJavaScript(highlighted);
  }
  // Python highlighting
  else if (ext === 'py') {
    highlighted = highlightPython(highlighted);
  }
  // HTML highlighting
  else if (['html', 'htm'].includes(ext)) {
    highlighted = highlightHTML(highlighted);
  }
  // CSS highlighting
  else if (['css', 'scss', 'sass'].includes(ext)) {
    highlighted = highlightCSS(highlighted);
  }
  // JSON highlighting
  else if (ext === 'json') {
    highlighted = highlightJSON(highlighted);
  }
  
  codeDisplay.innerHTML = highlighted;
}

function highlightJavaScript(code) {
  // Keywords
  const keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|async|await|class|extends|import|export|from|default|new|this|super|static|get|set|typeof|instanceof|in|of|delete|void|yield)\b/g;
  code = code.replace(keywords, '<span class="syntax-keyword">$1</span>');
  
  // Constants
  const constants = /\b(true|false|null|undefined|NaN|Infinity)\b/g;
  code = code.replace(constants, '<span class="syntax-constant">$1</span>');
  
  // Strings (double and single quotes)
  code = code.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="syntax-string">$1</span>');
  code = code.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="syntax-string">$1</span>');
  code = code.replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="syntax-string">$1</span>');
  
  // Numbers
  code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="syntax-number">$1</span>');
  
  // Comments
  code = code.replace(/(\/\/.*$)/gm, '<span class="syntax-comment">$1</span>');
  code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="syntax-comment">$1</span>');
  
  // Function calls
  code = code.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, '<span class="syntax-function">$1</span>');
  
  return code;
}

function highlightPython(code) {
  // Keywords
  const keywords = /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|pass|break|continue|raise|assert|del|global|nonlocal|async|await|in|is|not|and|or)\b/g;
  code = code.replace(keywords, '<span class="syntax-keyword">$1</span>');
  
  // Constants
  const constants = /\b(True|False|None)\b/g;
  code = code.replace(constants, '<span class="syntax-constant">$1</span>');
  
  // Strings
  code = code.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="syntax-string">$1</span>');
  code = code.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="syntax-string">$1</span>');
  code = code.replace(/("""[\s\S]*?""")/g, '<span class="syntax-string">$1</span>');
  code = code.replace(/('''[\s\S]*?''')/g, '<span class="syntax-string">$1</span>');
  
  // Numbers
  code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="syntax-number">$1</span>');
  
  // Comments
  code = code.replace(/(#.*$)/gm, '<span class="syntax-comment">$1</span>');
  
  // Function definitions
  code = code.replace(/\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, 'def <span class="syntax-function">$1</span>');
  
  return code;
}

function highlightHTML(code) {
  // Comments
  code = code.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="syntax-comment">$1</span>');
  
  // Tags
  code = code.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="syntax-tag">$2</span>');
  
  // Attributes
  code = code.replace(/\s([\w-]+)=/g, ' <span class="syntax-attribute">$1</span>=');
  
  // Attribute values
  code = code.replace(/=(&quot;[^&]*&quot;)/g, '=<span class="syntax-value">$1</span>');
  code = code.replace(/=(&#039;[^&]*&#039;)/g, '=<span class="syntax-value">$1</span>');
  
  return code;
}

function highlightCSS(code) {
  // Comments
  code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="syntax-comment">$1</span>');
  
  // Selectors
  code = code.replace(/^([.#]?[\w-]+)(?=\s*\{)/gm, '<span class="syntax-class">$1</span>');
  
  // Properties
  code = code.replace(/\b([\w-]+)(?=\s*:)/g, '<span class="syntax-property">$1</span>');
  
  // Values
  code = code.replace(/:\s*([^;{]+)/g, ': <span class="syntax-value">$1</span>');
  
  // Numbers with units
  code = code.replace(/\b(\d+\.?\d*)(px|em|rem|%|vh|vw|pt)?\b/g, '<span class="syntax-number">$1$2</span>');
  
  return code;
}

function highlightJSON(code) {
  // Strings (keys and values)
  code = code.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="syntax-string">$1</span>');
  
  // Numbers
  code = code.replace(/:\s*(\d+\.?\d*)/g, ': <span class="syntax-number">$1</span>');
  
  // Booleans and null
  code = code.replace(/\b(true|false|null)\b/g, '<span class="syntax-constant">$1</span>');
  
  return code;
}

async function handleAppCodeFileSave() {
  if (!currentAppId || !currentAppCodeFilePath) return;
  const content = document.getElementById('appCodeFileContent').value;
  
  try {
    await saveAppFile(currentAppId, currentAppCodeFilePath, content);
    originalFileContent = content;
    currentFileModified = false;
    document.getElementById('editorModified').hidden = true;
    
    // Success feedback
    const saveBtn = document.getElementById('appCodeFileSave');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✅ Kaydedildi';
    saveBtn.disabled = true;
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 2000);
  } catch (e) {
    alert('Dosya kaydedilemedi: ' + e.message);
  }
}

function handleAppCodeFileRevert() {
  if (!currentFileModified) return;
  if (confirm('Değişiklikleri geri almak istediğinize emin misiniz?')) {
    document.getElementById('appCodeFileContent').value = originalFileContent;
    updateEditorStatus();
  }
}

function handleAppCodeFileFormat() {
  const ta = document.getElementById('appCodeFileContent');
  const content = ta.value;
  const ext = currentAppCodeFilePath.split('.').pop().toLowerCase();
  
  try {
    if (ext === 'json') {
      const parsed = JSON.parse(content);
      ta.value = JSON.stringify(parsed, null, 2);
      updateEditorStatus();
    } else {
      alert('Bu dosya tipi için otomatik format desteklenmiyor.');
    }
  } catch (e) {
    alert('Format hatası: ' + e.message);
  }
}

// Env tab
async function loadAppEnv() {
  try {
    const env = await fetchAppEnv(currentAppId);
    appEnvRows = envObjectToRows(env);
    if (appEnvRows.length === 0) appEnvRows.push({ key: '', value: '' });
    renderAppEnvEditor(appEnvRows);
  } catch (e) {
    appEnvRows = [{ key: '', value: '' }];
    renderAppEnvEditor(appEnvRows);
  }
}

function renderAppEnvEditor(rows) {
  const container = document.getElementById('appEnvEditor');
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
      appEnvRows.splice(i, 1);
      renderAppEnvEditor(appEnvRows);
    });
  });
}

function collectAppEnvRows() {
  const rows = [];
  document.querySelectorAll('#appEnvEditor .env-row').forEach((row) => {
    const key = (row.querySelector('.env-key') || {}).value || '';
    const value = (row.querySelector('.env-value') || {}).value || '';
    rows.push({ key, value });
  });
  return rows;
}

async function handleAppEnvSave() {
  if (!currentAppId) return;
  const rows = collectAppEnvRows();
  const env = rowsToEnvObject(rows);
  await saveAppEnv(currentAppId, env);
  alert('Ortam değişkenleri kaydedildi. Uygulamayı yeniden başlattığınızda uygulanır.');
}

function addAppEnvRow() {
  appEnvRows.push({ key: '', value: '' });
  renderAppEnvEditor(appEnvRows);
}

async function handleAppEnvImport() {
  if (!currentAppId) return;
  const fileInput = document.getElementById('appEnvFileInput');
  const file = fileInput.files[0];
  if (!file) return;
  
  try {
    const content = await file.text();
    const result = await importEnvFile(currentAppId, content);
    alert(`${result.imported} ortam değişkeni içe aktarıldı!`);
    
    const env = await fetchAppEnv(currentAppId);
    appEnvRows = envObjectToRows(env);
    renderAppEnvEditor(appEnvRows);
    
    fileInput.value = '';
  } catch (e) {
    alert('Hata: ' + e.message);
  }
}

// Logs tab
async function loadAppLogs() {
  try {
    const data = await fetchLogs(currentAppId);
    const body = document.getElementById('appLogsBody');
    body.textContent = data.lines && data.lines.length ? data.lines.join('\n') : '(Henüz log yok)';
  } catch {
    document.getElementById('appLogsBody').textContent = 'Loglar yüklenemedi.';
  }
}

// Terminal tab
let terminalInstance = null;
let terminalSocket = null;
let terminalFitAddon = null;

function initTerminal() {
  console.log('[Terminal] initTerminal çağrıldı');
  console.log('[Terminal] window.Terminal:', typeof window.Terminal);
  console.log('[Terminal] window.FitAddon:', typeof window.FitAddon);
  
  if (!window.Terminal) {
    console.error('[Terminal] xterm.js yüklenmedi!');
    document.getElementById('terminalStatus').textContent = 'Terminal kütüphanesi yüklenemedi';
    document.getElementById('terminalStatus').className = 'terminal-status error';
    return;
  }
  
  // Mevcut terminal varsa temizle
  if (terminalInstance) {
    terminalInstance.dispose();
    terminalInstance = null;
  }
  
  if (terminalSocket) {
    terminalSocket.close();
    terminalSocket = null;
  }
  
  // Yeni terminal oluştur
  terminalInstance = new window.Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Consolas, Monaco, monospace',
    theme: {
      background: '#000000',
      foreground: '#ffffff',
      cursor: '#ffffff',
      cursorAccent: '#000000',
      selection: 'rgba(255, 255, 255, 0.3)',
      black: '#000000',
      red: '#e06c75',
      green: '#98c379',
      yellow: '#d19a66',
      blue: '#61afef',
      magenta: '#c678dd',
      cyan: '#56b6c2',
      white: '#abb2bf',
      brightBlack: '#5c6370',
      brightRed: '#e06c75',
      brightGreen: '#98c379',
      brightYellow: '#d19a66',
      brightBlue: '#61afef',
      brightMagenta: '#c678dd',
      brightCyan: '#56b6c2',
      brightWhite: '#ffffff'
    },
    cols: 80,
    rows: 30
  });
  
  // FitAddon ekle
  if (window.FitAddon) {
    terminalFitAddon = new window.FitAddon.FitAddon();
    terminalInstance.loadAddon(terminalFitAddon);
  }
  
  const container = document.getElementById('terminalContainer');
  container.innerHTML = '';
  terminalInstance.open(container);
  
  // Terminal'e focus ver
  setTimeout(() => {
    terminalInstance.focus();
  }, 100);
  
  if (terminalFitAddon) {
    terminalFitAddon.fit();
  }
  
  // WebSocket bağlantısı
  connectTerminalWebSocket();
  
  // Resize event
  window.addEventListener('resize', () => {
    if (terminalFitAddon && terminalInstance) {
      terminalFitAddon.fit();
      if (terminalSocket && terminalSocket.readyState === WebSocket.OPEN) {
        terminalSocket.send(JSON.stringify({
          type: 'resize',
          cols: terminalInstance.cols,
          rows: terminalInstance.rows
        }));
      }
    }
  });
}

function connectTerminalWebSocket() {
  if (!currentAppId) return;
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/terminal?appId=${encodeURIComponent(currentAppId)}`;
  
  document.getElementById('terminalStatus').textContent = 'Bağlanıyor...';
  document.getElementById('terminalStatus').className = 'terminal-status';
  
  terminalSocket = new WebSocket(wsUrl);
  
  terminalSocket.onopen = () => {
    document.getElementById('terminalStatus').textContent = 'Bağlı ✓';
    document.getElementById('terminalStatus').className = 'terminal-status connected';
    // Terminal'e focus ver
    if (terminalInstance) {
      terminalInstance.focus();
    }
  };
  
  terminalSocket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      console.log('[Terminal] Received:', msg.type);
      
      if (msg.type === 'ready') {
        terminalInstance.write(msg.message || '');
      } else if (msg.type === 'data') {
        terminalInstance.write(msg.data);
      } else if (msg.type === 'exit') {
        terminalInstance.write(`\r\n\r\n[Process exited with code ${msg.exitCode}]\r\n`);
        document.getElementById('terminalStatus').textContent = 'Bağlantı kapandı';
        document.getElementById('terminalStatus').className = 'terminal-status';
      } else if (msg.type === 'error') {
        terminalInstance.write(`\r\n[Error: ${msg.data}]\r\n`);
        document.getElementById('terminalStatus').textContent = 'Hata: ' + msg.data;
        document.getElementById('terminalStatus').className = 'terminal-status error';
      }
    } catch (e) {
      console.error('Terminal message parse error:', e);
    }
  };
  
  terminalSocket.onerror = (error) => {
    console.error('Terminal WebSocket error:', error);
    document.getElementById('terminalStatus').textContent = 'Bağlantı hatası';
    document.getElementById('terminalStatus').className = 'terminal-status error';
  };
  
  terminalSocket.onclose = () => {
    document.getElementById('terminalStatus').textContent = 'Bağlantı kapandı';
    document.getElementById('terminalStatus').className = 'terminal-status';
  };
  
  // Terminal'den gelen input'u WebSocket'e gönder
  terminalInstance.onData((data) => {
    console.log('[Terminal] Input:', data.length, 'bytes');
    if (terminalSocket && terminalSocket.readyState === WebSocket.OPEN) {
      // Local echo - yazdıklarımızı görmek için
      if (data !== '\r') {
        terminalInstance.write(data);
      }
      terminalSocket.send(JSON.stringify({ type: 'data', data }));
    } else {
      console.warn('[Terminal] WebSocket not ready, state:', terminalSocket?.readyState);
    }
  });
}

function clearTerminal() {
  if (terminalInstance) {
    terminalInstance.clear();
  }
}

function reconnectTerminal() {
  initTerminal();
}

// Settings tab
async function loadAppSettings() {
  document.getElementById('appUseDocker').checked = !!currentAppData.useDocker;
  document.getElementById('appStartCommand').value = currentAppData.startCommand || '';
  
  // Show project info
  document.getElementById('appProjectType').textContent = currentAppData.type || 'unknown';
  document.getElementById('appRepoPath').textContent = currentAppData.repoPath || '-';
}

async function handleAppStartCommandSave() {
  if (!currentAppId) return;
  const cmd = document.getElementById('appStartCommand').value.trim();
  try {
    await fetch(API + '/apps/' + encodeURIComponent(currentAppId) + '/start-command', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startCommand: cmd }),
    });
    alert('Başlatma komutu kaydedildi.');
    loadAppDashboard();
  } catch (e) {
    alert(e.message);
  }
}

async function handleAppUseDockerChange() {
  if (!currentAppId) return;
  try {
    await fetch(API + '/apps/' + encodeURIComponent(currentAppId) + '/use-docker', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useDocker: document.getElementById('appUseDocker').checked }),
    });
    loadAppDashboard();
  } catch (e) {
    alert(e.message);
  }
}

async function handleAppDelete() {
  if (!currentAppId || !currentAppData) return;
  if (!confirm(`"${currentAppData.name}" uygulamasını silmek istediğinize emin misiniz? Repo klasörü de silinecektir.`)) return;
  try {
    await deleteApp(currentAppId);
    closeAppDashboard();
  } catch (e) {
    alert(e.message);
  }
}

// Dashboard buton event listeners
document.getElementById('backToMain').addEventListener('click', closeAppDashboard);

document.getElementById('appDashStartBtn').addEventListener('click', async () => {
  if (!currentAppId) return;
  try {
    await startApp(currentAppId);
    loadAppDashboard();
  } catch (e) {
    alert(e.message);
  }
});

document.getElementById('appDashStopBtn').addEventListener('click', async () => {
  if (!currentAppId) return;
  try {
    await stopApp(currentAppId);
    loadAppDashboard();
  } catch (e) {
    alert(e.message);
  }
});

document.getElementById('appDashUpdateBtn').addEventListener('click', async () => {
  if (!currentAppId || !currentAppData) return;
  if (!confirm(`"${currentAppData.name}" uygulamasını GitHub'dan güncellemek istediğinize emin misiniz?`)) return;
  try {
    const result = await updateApp(currentAppId);
    alert(result.message || 'Güncelleme tamamlandı');
    loadAppDashboard();
  } catch (e) {
    alert('Güncelleme hatası: ' + e.message);
  }
});

document.querySelectorAll('.dashboard-tab').forEach((tab) => {
  tab.addEventListener('click', () => switchDashboardTab(tab.dataset.tab));
});

document.getElementById('quickTerminal').addEventListener('click', () => {
  switchDashboardTab('terminal');
});

document.getElementById('quickLogs').addEventListener('click', () => {
  switchDashboardTab('logs');
});

document.getElementById('quickRestart').addEventListener('click', async () => {
  if (!currentAppId) return;
  try {
    await stopApp(currentAppId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await startApp(currentAppId);
    loadAppDashboard();
  } catch (e) {
    alert(e.message);
  }
});

document.getElementById('quickFiles').addEventListener('click', () => {
  switchDashboardTab('files');
});

document.getElementById('viewAllLogs').addEventListener('click', () => {
  switchDashboardTab('logs');
});

document.getElementById('appCodeFileSave').addEventListener('click', handleAppCodeFileSave);
document.getElementById('appCodeFileRevert').addEventListener('click', handleAppCodeFileRevert);
document.getElementById('appCodeFileFormat').addEventListener('click', handleAppCodeFileFormat);
document.getElementById('refreshFileTree').addEventListener('click', () => {
  if (currentAppId) renderAppCodeTree('');
});

// Editor'da değişiklik takibi
document.getElementById('appCodeFileContent').addEventListener('input', updateEditorStatus);

// Editor scroll sync
document.getElementById('appCodeFileContent').addEventListener('scroll', syncEditorScroll);

// Sayfa kapatılırken uyarı
window.addEventListener('beforeunload', (e) => {
  if (currentFileModified) {
    e.preventDefault();
    e.returnValue = '';
  }
});
document.getElementById('appEnvAddRow').addEventListener('click', addAppEnvRow);
document.getElementById('appEnvSave').addEventListener('click', handleAppEnvSave);
document.getElementById('appEnvImportBtn').addEventListener('click', () => {
  document.getElementById('appEnvFileInput').click();
});
document.getElementById('appEnvFileInput').addEventListener('change', handleAppEnvImport);
document.getElementById('appLogsRefresh').addEventListener('click', loadAppLogs);
document.getElementById('terminalClear').addEventListener('click', clearTerminal);
document.getElementById('terminalReconnect').addEventListener('click', reconnectTerminal);
document.getElementById('appStartCommandSave').addEventListener('click', handleAppStartCommandSave);
document.getElementById('appUseDocker').addEventListener('change', handleAppUseDockerChange);
document.getElementById('appDeleteBtn').addEventListener('click', handleAppDelete);

// Stats tab otomatik güncelleme
setInterval(() => {
  if (currentAppId && currentAppData && currentAppData.running) {
    if (!document.getElementById('tabStats').hidden) {
      updateStatsTab();
    }
    // Overview tab'da da gerçek zamanlı stats varsa güncelle
    if (!document.getElementById('tabOverview').hidden) {
      updateStatsTab();
    }
  }
}, 3000);

// Ana dashboard sistem istatistikleri güncelleme
setInterval(() => {
  if (!document.getElementById('mainDashboard').hidden) {
    loadSystemStats();
    // Uygulamaları da güncelle (durum değişikliklerini yakala)
    loadApps();
  }
}, 5000);

// Arama, filtreleme ve sıralama
let allApps = [];
let searchTerm = '';
let filterStatus = 'all';
let sortBy = 'name';

function filterAndSortApps() {
  let filtered = allApps;
  
  // Arama
  if (searchTerm) {
    filtered = filtered.filter(app => 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.type && app.type.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  
  // Filtreleme
  if (filterStatus === 'running') {
    filtered = filtered.filter(app => app.running);
  } else if (filterStatus === 'stopped') {
    filtered = filtered.filter(app => !app.running);
  }
  
  // Sıralama
  filtered.sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'date') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortBy === 'status') {
      return (b.running ? 1 : 0) - (a.running ? 1 : 0);
    }
    return 0;
  });
  
  renderApps(filtered);
}

document.getElementById('appSearch').addEventListener('input', (e) => {
  searchTerm = e.target.value;
  filterAndSortApps();
});

document.getElementById('appFilter').addEventListener('change', (e) => {
  filterStatus = e.target.value;
  filterAndSortApps();
});

document.getElementById('appSort').addEventListener('change', (e) => {
  sortBy = e.target.value;
  filterAndSortApps();
});

async function loadApps() {
  try {
    allApps = await fetchApps();
    filterAndSortApps();
  } catch (e) {
    console.error('Apps load error:', e);
    document.getElementById('appsList').innerHTML = '';
    document.getElementById('emptyState').textContent = 'Uygulamalar yüklenemedi: ' + e.message;
    document.getElementById('emptyState').classList.remove('hidden');
  }
}

// Dosya arama
let allFiles = [];

async function loadAllFiles(prefix = '', files = []) {
  try {
    const { entries } = await fetchAppFiles(currentAppId, prefix || undefined);
    const base = prefix ? prefix + '/' : '';
    
    for (const e of entries) {
      const fullPath = base + e.name;
      if (e.isDir) {
        await loadAllFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  } catch {
    return files;
  }
}

document.getElementById('fileSearchInput').addEventListener('input', async (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const treeEl = document.getElementById('appCodeTree');
  
  if (!searchTerm) {
    renderAppCodeTree('');
    return;
  }
  
  if (allFiles.length === 0) {
    allFiles = await loadAllFiles();
  }
  
  const filtered = allFiles.filter(f => f.toLowerCase().includes(searchTerm));
  
  treeEl.innerHTML = '';
  if (filtered.length === 0) {
    treeEl.innerHTML = '<span class="code-tree-item" style="color: var(--text-muted)">Sonuç bulunamadı</span>';
    return;
  }
  
  filtered.slice(0, 50).forEach(filePath => {
    const span = document.createElement('span');
    span.className = 'code-tree-item';
    const icon = getFileIcon(filePath);
    span.textContent = icon + ' ' + filePath;
    span.addEventListener('click', () => openAppCodeFile(filePath));
    treeEl.appendChild(span);
  });
  
  if (filtered.length > 50) {
    const more = document.createElement('span');
    more.className = 'code-tree-item';
    more.style.color = 'var(--text-muted)';
    more.textContent = `... ve ${filtered.length - 50} dosya daha`;
    treeEl.appendChild(more);
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + S: Kaydet
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (!document.getElementById('appCodeEditorBox').hidden) {
      handleAppCodeFileSave();
    }
  }
  
  // Ctrl/Cmd + F: Dosya ara
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    if (!document.getElementById('tabFiles').hidden) {
      e.preventDefault();
      document.getElementById('fileSearchInput').focus();
    }
  }
  
  // Esc: Arama temizle
  if (e.key === 'Escape') {
    if (document.activeElement === document.getElementById('fileSearchInput')) {
      document.getElementById('fileSearchInput').value = '';
      renderAppCodeTree('');
    }
  }
});

// Tab tuşu desteği
document.getElementById('appCodeFileContent').addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    const value = e.target.value;
    
    // Tab ekle
    e.target.value = value.substring(0, start) + '  ' + value.substring(end);
    e.target.selectionStart = e.target.selectionEnd = start + 2;
    
    updateEditorStatus();
  }
});


// --- Marketplace ---
let allPlugins = [];
let currentCategory = 'all';
let marketplaceSearchTerm = '';

async function fetchMarketplacePlugins(category = 'all') {
  const url = category === 'all' ? '/api/marketplace/plugins' : `/api/marketplace/plugins?category=${category}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Marketplace yüklenemedi');
  return res.json();
}

async function installPlugin(pluginId) {
  const res = await fetch(`/api/marketplace/install/${pluginId}`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Kurulum başarısız');
  return data;
}

async function uninstallPlugin(pluginId) {
  const res = await fetch(`/api/marketplace/uninstall/${pluginId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Kaldırma başarısız');
}

async function fetchInstalledPlugins() {
  const res = await fetch('/api/marketplace/installed');
  if (!res.ok) throw new Error('Kurulu eklentiler yüklenemedi');
  return res.json();
}

async function togglePlugin(pluginId) {
  const res = await fetch(`/api/marketplace/toggle/${pluginId}`, { method: 'PUT' });
  if (!res.ok) throw new Error('Durum değiştirilemedi');
  return res.json();
}

function openMarketplace() {
  document.getElementById('mainDashboard').hidden = true;
  document.getElementById('marketplacePage').hidden = false;
  loadMarketplace();
}

function closeMarketplace() {
  document.getElementById('mainDashboard').hidden = false;
  document.getElementById('marketplacePage').hidden = true;
}

async function loadMarketplace() {
  try {
    allPlugins = await fetchMarketplacePlugins(currentCategory);
    renderMarketplacePlugins();
  } catch (e) {
    alert('Marketplace yüklenemedi: ' + e.message);
  }
}

function renderMarketplacePlugins() {
  let filtered = allPlugins;
  
  // Search filter
  if (marketplaceSearchTerm) {
    const term = marketplaceSearchTerm.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.tags.some(t => t.toLowerCase().includes(term))
    );
  }
  
  const grid = document.getElementById('marketplaceGrid');
  
  if (filtered.length === 0) {
    grid.innerHTML = '<p class="empty-state">Eklenti bulunamadı</p>';
    return;
  }
  
  grid.innerHTML = filtered.map(plugin => {
    const dockerBadge = plugin.requiresDocker ? '<span class="plugin-docker-badge">🐳 Docker</span>' : '';
    const portInfo = plugin.defaultPort ? `<span class="plugin-port-info">Port: ${plugin.defaultPort}</span>` : '';
    const isSelfHosted = plugin.category === 'selfhosted';
    
    return `
      <div class="plugin-card ${isSelfHosted ? 'plugin-selfhosted' : ''}">
        <div class="plugin-card-header">
          <div class="plugin-icon">${plugin.icon}</div>
          <div class="plugin-info">
            <h3 class="plugin-name">${escapeHtml(plugin.name)}</h3>
            <div class="plugin-version">v${plugin.version}</div>
          </div>
        </div>
        <p class="plugin-description">${escapeHtml(plugin.description)}</p>
        <div class="plugin-meta">
          <div class="plugin-meta-item">⭐ ${plugin.rating}</div>
          <div class="plugin-meta-item">📥 ${plugin.downloads}</div>
          <div class="plugin-meta-item">👤 ${escapeHtml(plugin.author)}</div>
        </div>
        ${dockerBadge || portInfo ? `<div class="plugin-badges">${dockerBadge}${portInfo}</div>` : ''}
        <div class="plugin-tags">
          ${plugin.tags.map(tag => `<span class="plugin-tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="plugin-actions">
          ${plugin.installed 
            ? `<button class="btn btn-danger btn-sm uninstall-plugin-btn" data-id="${plugin.id}">Kaldır</button>
               <span class="plugin-installed-badge">✓ Kurulu</span>`
            : isSelfHosted && plugin.githubUrl
              ? `<button class="btn btn-primary btn-sm install-app-btn" data-id="${plugin.id}" data-url="${escapeHtml(plugin.githubUrl)}">Kur ve Çalıştır</button>`
              : `<button class="btn btn-primary btn-sm install-plugin-btn" data-id="${plugin.id}">Kur</button>`
          }
          <span class="plugin-price ${plugin.price}">${plugin.price === 'free' ? 'Ücretsiz' : 'Premium'}</span>
        </div>
      </div>
    `;
  }).join('');
  
  // Event listeners
  grid.querySelectorAll('.install-plugin-btn').forEach(btn => {
    btn.addEventListener('click', () => handleInstallPlugin(btn.dataset.id));
  });
  
  grid.querySelectorAll('.install-app-btn').forEach(btn => {
    btn.addEventListener('click', () => handleInstallSelfHostedApp(btn.dataset.id, btn.dataset.url));
  });
  
  grid.querySelectorAll('.uninstall-plugin-btn').forEach(btn => {
    btn.addEventListener('click', () => handleUninstallPlugin(btn.dataset.id));
  });
}

async function handleInstallSelfHostedApp(pluginId, githubUrl) {
  try {
    showToast('Kuruluyor', 'Uygulama indiriliyor ve Docker ile kuruluyor...', 'info');
    
    // Add app using GitHub URL with auto-docker enabled
    const res = await fetch(API + '/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        githubUrl: githubUrl.trim(),
        autoDocker: true  // Auto-enable Docker for marketplace apps
      }),
    });
    
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Ekleme başarısız');
    
    // Mark as installed in marketplace
    await installPlugin(pluginId);
    
    showToast('Başarılı', data.message || 'Uygulama başarıyla kuruldu! Docker otomatik aktif edildi.', 'success');
    
    // Reload marketplace and apps
    loadMarketplace();
    
    // Close marketplace and go to main page
    setTimeout(() => {
      closeMarketplace();
      loadApps();
    }, 1500);
  } catch (e) {
    showToast('Hata', 'Kurulum başarısız: ' + e.message, 'error');
  }
}

async function handleInstallPlugin(pluginId) {
  try {
    await installPlugin(pluginId);
    alert('Eklenti başarıyla kuruldu!');
    loadMarketplace();
  } catch (e) {
    alert(e.message);
  }
}

async function handleUninstallPlugin(pluginId) {
  if (!confirm('Bu eklentiyi kaldırmak istediğinize emin misiniz?')) return;
  try {
    await uninstallPlugin(pluginId);
    alert('Eklenti kaldırıldı');
    loadMarketplace();
    loadInstalledPlugins();
  } catch (e) {
    alert(e.message);
  }
}

async function loadInstalledPlugins() {
  try {
    const installed = await fetchInstalledPlugins();
    const grid = document.getElementById('installedPluginsGrid');
    const empty = document.getElementById('noInstalledPlugins');
    
    if (installed.length === 0) {
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }
    
    empty.hidden = true;
    grid.innerHTML = installed.map(plugin => `
      <div class="plugin-card">
        <div class="plugin-card-header">
          <div class="plugin-icon">${plugin.icon}</div>
          <div class="plugin-info">
            <h3 class="plugin-name">${escapeHtml(plugin.name)}</h3>
            <div class="plugin-version">v${plugin.version}</div>
          </div>
        </div>
        <p class="plugin-description">${escapeHtml(plugin.description)}</p>
        <div class="plugin-meta">
          <div class="plugin-meta-item">📅 ${new Date(plugin.installedAt).toLocaleDateString('tr-TR')}</div>
          <div class="plugin-meta-item">${plugin.enabled ? '✅ Aktif' : '⏸️ Devre Dışı'}</div>
        </div>
        <div class="plugin-actions">
          <button class="btn btn-ghost btn-sm toggle-plugin-btn" data-id="${plugin.id}">
            ${plugin.enabled ? 'Devre Dışı Bırak' : 'Etkinleştir'}
          </button>
          <button class="btn btn-danger btn-sm uninstall-plugin-btn" data-id="${plugin.id}">Kaldır</button>
        </div>
      </div>
    `).join('');
    
    // Event listeners
    grid.querySelectorAll('.toggle-plugin-btn').forEach(btn => {
      btn.addEventListener('click', () => handleTogglePlugin(btn.dataset.id));
    });
    
    grid.querySelectorAll('.uninstall-plugin-btn').forEach(btn => {
      btn.addEventListener('click', () => handleUninstallPlugin(btn.dataset.id));
    });
  } catch (e) {
    alert('Kurulu eklentiler yüklenemedi: ' + e.message);
  }
}

async function handleTogglePlugin(pluginId) {
  try {
    await togglePlugin(pluginId);
    loadInstalledPlugins();
  } catch (e) {
    alert(e.message);
  }
}

function switchMarketplaceTab(tabName) {
  document.querySelectorAll('.marketplace-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.marketplace-tab[data-tab="${tabName}"]`).classList.add('active');
  
  document.querySelectorAll('.marketplace-tab-content').forEach(c => c.hidden = true);
  document.getElementById('marketplace' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).hidden = false;
  
  if (tabName === 'installed') {
    loadInstalledPlugins();
  }
}

// Event listeners
document.getElementById('openMarketplace').addEventListener('click', openMarketplace);
document.getElementById('backToMainFromMarketplace').addEventListener('click', closeMarketplace);

document.querySelectorAll('.marketplace-tab').forEach(tab => {
  tab.addEventListener('click', () => switchMarketplaceTab(tab.dataset.tab));
});

document.querySelectorAll('.marketplace-category-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('.marketplace-category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    try {
      allPlugins = await fetchMarketplacePlugins(currentCategory);
      renderMarketplacePlugins();
    } catch (e) {
      alert('Kategori yüklenemedi: ' + e.message);
    }
  });
});

document.getElementById('marketplaceSearch').addEventListener('input', (e) => {
  marketplaceSearchTerm = e.target.value;
  renderMarketplacePlugins();
});


// --- Toast Notifications ---
function showToast(title, message, type = 'info', duration = 5000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="Kapat">×</button>
  `;
  
  container.appendChild(toast);
  
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));
  
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
}

function removeToast(toast) {
  toast.classList.add('removing');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}


// --- Bulk Actions ---
async function startAllApps() {
  const apps = allApps.filter(a => !a.running);
  if (apps.length === 0) {
    showToast('Bilgi', 'Başlatılacak uygulama yok', 'info');
    return;
  }
  
  if (!confirm(`${apps.length} uygulamayı başlatmak istediğinize emin misiniz?`)) return;
  
  let success = 0;
  let failed = 0;
  
  for (const app of apps) {
    try {
      await startApp(app.id);
      success++;
    } catch (e) {
      failed++;
      console.error(`${app.name} başlatılamadı:`, e);
    }
  }
  
  showToast('Toplu Başlatma', `${success} uygulama başlatıldı${failed > 0 ? `, ${failed} başarısız` : ''}`, failed > 0 ? 'warning' : 'success');
  loadApps();
}

async function stopAllApps() {
  const apps = allApps.filter(a => a.running);
  if (apps.length === 0) {
    showToast('Bilgi', 'Durdurulacak uygulama yok', 'info');
    return;
  }
  
  if (!confirm(`${apps.length} uygulamayı durdurmak istediğinize emin misiniz?`)) return;
  
  let success = 0;
  let failed = 0;
  
  for (const app of apps) {
    try {
      await stopApp(app.id);
      success++;
    } catch (e) {
      failed++;
      console.error(`${app.name} durdurulamadı:`, e);
    }
  }
  
  showToast('Toplu Durdurma', `${success} uygulama durduruldu${failed > 0 ? `, ${failed} başarısız` : ''}`, failed > 0 ? 'warning' : 'success');
  loadApps();
}

async function restartAllApps() {
  const apps = allApps.filter(a => a.running);
  if (apps.length === 0) {
    showToast('Bilgi', 'Yeniden başlatılacak uygulama yok', 'info');
    return;
  }
  
  if (!confirm(`${apps.length} uygulamayı yeniden başlatmak istediğinize emin misiniz?`)) return;
  
  let success = 0;
  let failed = 0;
  
  for (const app of apps) {
    try {
      await stopApp(app.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await startApp(app.id);
      success++;
    } catch (e) {
      failed++;
      console.error(`${app.name} yeniden başlatılamadı:`, e);
    }
  }
  
  showToast('Toplu Yeniden Başlatma', `${success} uygulama yeniden başlatıldı${failed > 0 ? `, ${failed} başarısız` : ''}`, failed > 0 ? 'warning' : 'success');
  loadApps();
}

document.getElementById('startAllApps').addEventListener('click', startAllApps);
document.getElementById('stopAllApps').addEventListener('click', stopAllApps);
document.getElementById('restartAllApps').addEventListener('click', restartAllApps);

// Export/Import Apps
async function exportApps() {
  try {
    const apps = await fetchApps();
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      apps: apps.map(app => ({
        name: app.name,
        githubUrl: app.githubUrl,
        port: app.port,
        type: app.type,
        env: app.env,
        startCommand: app.startCommand,
        useDocker: app.useDocker,
        mainFile: app.mainFile
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-host-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Başarılı', `${exportData.apps.length} uygulama dışa aktarıldı`, 'success');
  } catch (e) {
    showToast('Hata', 'Dışa aktarma başarısız: ' + e.message, 'error');
  }
}

async function importApps() {
  document.getElementById('importAppsFile').click();
}

async function handleImportApps(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const content = await file.text();
    const data = JSON.parse(content);
    
    if (!data.apps || !Array.isArray(data.apps)) {
      throw new Error('Geçersiz dosya formatı');
    }
    
    const existingApps = await fetchApps();
    const existingUrls = new Set(existingApps.map(a => a.githubUrl));
    
    let imported = 0;
    let skipped = 0;
    
    for (const app of data.apps) {
      if (existingUrls.has(app.githubUrl)) {
        skipped++;
        continue;
      }
      
      try {
        await addApp(app.githubUrl);
        imported++;
        
        // Wait a bit between imports
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.error(`Failed to import ${app.name}:`, e);
      }
    }
    
    showToast('İçe Aktarma Tamamlandı', `${imported} uygulama eklendi, ${skipped} zaten mevcut`, 'success');
    loadApps();
    
    event.target.value = '';
  } catch (e) {
    showToast('Hata', 'İçe aktarma başarısız: ' + e.message, 'error');
  }
}

document.getElementById('exportApps').addEventListener('click', exportApps);
document.getElementById('importApps').addEventListener('click', importApps);
document.getElementById('importAppsFile').addEventListener('change', handleImportApps);


// --- Templates ---
let allTemplates = [];
let templateFilter = 'all';

async function fetchTemplates() {
  const res = await fetch('/api/templates');
  if (!res.ok) throw new Error('Şablonlar yüklenemedi');
  return res.json();
}

async function loadTemplates() {
  try {
    if (allTemplates.length === 0) {
      allTemplates = await fetchTemplates();
    }
    renderTemplates();
  } catch (e) {
    showToast('Hata', 'Şablonlar yüklenemedi: ' + e.message, 'error');
  }
}

function renderTemplates() {
  let filtered = allTemplates;
  
  // Filter by category
  if (templateFilter === 'basic') {
    filtered = allTemplates.filter(t => !t.requiresDocker && ['express-api', 'react-app', 'nextjs-app', 'python-flask', 'fastapi', 'discord-bot', 'telegram-bot', 'vue-app'].includes(t.id));
  } else if (templateFilter === 'selfhosted') {
    filtered = allTemplates.filter(t => ['nextcloud', 'wordpress', 'gitlab', 'ghost', 'mattermost', 'n8n', 'grafana', 'portainer', 'jellyfin', 'bookstack', 'code-server', 'strapi', 'supabase', 'metabase', 'nocodb', 'appwrite'].includes(t.id));
  } else if (templateFilter === 'docker') {
    filtered = allTemplates.filter(t => t.requiresDocker);
  }
  
  const grid = document.getElementById('templatesGrid');
  
  if (filtered.length === 0) {
    grid.innerHTML = '<p class="empty-state">Bu kategoride şablon bulunamadı</p>';
    return;
  }
  
  grid.innerHTML = filtered.map(template => {
    const dockerBadge = template.requiresDocker ? '<span class="template-docker-badge">🐳 Docker</span>' : '';
    const portInfo = template.defaultPort ? `<span class="template-port-info">Port: ${template.defaultPort}</span>` : '';
    
    return `
      <div class="template-card ${template.requiresDocker ? 'template-docker' : ''}" data-repo="${escapeHtml(template.repo)}">
        <div class="template-header">
          <div class="template-icon">${template.icon}</div>
          ${dockerBadge}
        </div>
        <h3 class="template-name">${escapeHtml(template.name)}</h3>
        <p class="template-description">${escapeHtml(template.description)}</p>
        <div class="template-meta">
          <span class="template-meta-item">💻 ${escapeHtml(template.language)}</span>
          <span class="template-meta-item">⚙️ ${escapeHtml(template.framework)}</span>
          ${portInfo}
        </div>
        <div class="template-features">
          ${template.features.map(f => `<span class="template-feature">${escapeHtml(f)}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
  
  grid.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const repo = card.dataset.repo;
      document.getElementById('githubUrl').value = repo;
      switchAddTab('github');
      showToast('Şablon Seçildi', 'GitHub URL alanına eklendi, "Ekle ve çalıştır" butonuna tıklayın', 'success');
    });
  });
}

function switchTemplateFilter(filter) {
  templateFilter = filter;
  document.querySelectorAll('.template-filter-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.template-filter-btn[data-filter="${filter}"]`).classList.add('active');
  renderTemplates();
}

function switchAddTab(tabName) {
  document.querySelectorAll('.add-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.add-tab[data-tab="${tabName}"]`).classList.add('active');
  
  document.querySelectorAll('.add-tab-content').forEach(c => c.hidden = true);
  document.getElementById('add' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).hidden = false;
  
  if (tabName === 'template') {
    loadTemplates();
  }
}

document.querySelectorAll('.add-tab').forEach(tab => {
  tab.addEventListener('click', () => switchAddTab(tab.dataset.tab));
});

// Template filter buttons
document.querySelectorAll('.template-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTemplateFilter(btn.dataset.filter));
});
