# App Host Manager - Windows Kurulum Scripti
# PowerShell'i Yönetici olarak çalıştırın

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "App Host Manager Kurulumu" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Node.js kontrolü
Write-Host "Node.js kontrol ediliyor..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js bulundu: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js bulunamadı!" -ForegroundColor Red
    Write-Host "Lütfen Node.js 18+ yükleyin: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Git kontrolü
Write-Host "Git kontrol ediliyor..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git bulundu: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git bulunamadı!" -ForegroundColor Red
    Write-Host "Lütfen Git yükleyin: https://git-scm.com" -ForegroundColor Yellow
    exit 1
}

# Kurulum dizini
$installDir = "$env:USERPROFILE\app-host-manager"

# Eğer dizin varsa sor
if (Test-Path $installDir) {
    Write-Host ""
    Write-Host "Dizin zaten mevcut: $installDir" -ForegroundColor Yellow
    $response = Read-Host "Mevcut kurulumu silip yeniden kurmak ister misiniz? (E/H)"
    if ($response -eq "E" -or $response -eq "e") {
        Write-Host "Eski kurulum siliniyor..." -ForegroundColor Yellow
        Remove-Item -Path $installDir -Recurse -Force
    } else {
        Write-Host "Kurulum iptal edildi." -ForegroundColor Red
        exit 0
    }
}

# Repo klonla
Write-Host ""
Write-Host "GitHub'dan indiriliyor..." -ForegroundColor Yellow
git clone https://github.com/kayametehan/app-host-manager.git $installDir

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ GitHub'dan indirme başarısız!" -ForegroundColor Red
    exit 1
}

# Dizine geç
Set-Location $installDir

# Bağımlılıkları yükle
Write-Host ""
Write-Host "Bağımlılıklar yükleniyor..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Bağımlılık yükleme başarısız!" -ForegroundColor Red
    exit 1
}

# Başarılı
Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "✓ Kurulum tamamlandı!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Başlatmak için:" -ForegroundColor Cyan
Write-Host "  cd $installDir" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "Tarayıcıda açın: http://localhost:3840" -ForegroundColor Cyan
Write-Host ""

# Otomatik başlat sor
$response = Read-Host "Şimdi başlatmak ister misiniz? (E/H)"
if ($response -eq "E" -or $response -eq "e") {
    Write-Host ""
    Write-Host "Başlatılıyor..." -ForegroundColor Yellow
    npm start
}
