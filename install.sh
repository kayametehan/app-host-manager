#!/bin/bash
# App Host Manager - macOS/Linux Kurulum Scripti

set -e

echo "=================================="
echo "App Host Manager Kurulumu"
echo "=================================="
echo ""

# Node.js kontrolü
echo "Node.js kontrol ediliyor..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js bulundu: $NODE_VERSION"
else
    echo "✗ Node.js bulunamadı!"
    echo "Lütfen Node.js 18+ yükleyin: https://nodejs.org"
    exit 1
fi

# Git kontrolü
echo "Git kontrol ediliyor..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "✓ Git bulundu: $GIT_VERSION"
else
    echo "✗ Git bulunamadı!"
    echo "Lütfen Git yükleyin: https://git-scm.com"
    exit 1
fi

# Kurulum dizini
INSTALL_DIR="$HOME/app-host-manager"

# Eğer dizin varsa sor
if [ -d "$INSTALL_DIR" ]; then
    echo ""
    echo "Dizin zaten mevcut: $INSTALL_DIR"
    read -p "Mevcut kurulumu silip yeniden kurmak ister misiniz? (e/h): " response
    if [ "$response" = "e" ] || [ "$response" = "E" ]; then
        echo "Eski kurulum siliniyor..."
        rm -rf "$INSTALL_DIR"
    else
        echo "Kurulum iptal edildi."
        exit 0
    fi
fi

# Repo klonla
echo ""
echo "GitHub'dan indiriliyor..."
git clone https://github.com/kayametehan/app-host-manager.git "$INSTALL_DIR"

# Dizine geç
cd "$INSTALL_DIR"

# Bağımlılıkları yükle
echo ""
echo "Bağımlılıklar yükleniyor..."
npm install

# Başarılı
echo ""
echo "=================================="
echo "✓ Kurulum tamamlandı!"
echo "=================================="
echo ""
echo "Başlatmak için:"
echo "  cd $INSTALL_DIR"
echo "  npm start"
echo ""
echo "Tarayıcıda açın: http://localhost:3840"
echo ""

# Otomatik başlat sor
read -p "Şimdi başlatmak ister misiniz? (e/h): " response
if [ "$response" = "e" ] || [ "$response" = "E" ]; then
    echo ""
    echo "Başlatılıyor..."
    npm start
fi
