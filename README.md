# App Host Manager

Web arayüzlü uygulama host yöneticisi. GitHub'dan otomatik kurulum, ortam değişkeni yönetimi, sistem terminali entegrasyonu.

## ✨ Özellikler

- 🚀 **GitHub'dan tek tıkla kurulum**: URL yapıştır → Otomatik klon + kurulum
- 🔧 **Akıllı ortam değişkeni tespiti**: Koddan otomatik ENV değişkenlerini bulur
- 🛡️ **Güvenli başlatma**: Eksik ENV varsa uygulama başlamaz
- 💻 **Sistem terminali entegrasyonu**: Python venv otomatik aktif
- 📊 **Detaylı loglar**: Zaman damgalı, renkli log görüntüleme
- 🎨 **Kod düzenleyici**: Dosya ağacı ve düzenleme
- 🔄 **Otomatik port temizleme**: "Port in use" hatası yok
- 🌐 **Cross-platform**: Windows, macOS, Linux

## 🚀 Hızlı Kurulum

### Windows (PowerShell - Yönetici olarak çalıştırın)

```powershell
irm https://raw.githubusercontent.com/kayametehan/app-host-manager/main/install.ps1 | iex
```

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/kayametehan/app-host-manager/main/install.sh | bash
```

## 📦 Manuel Kurulum

### Gereksinimler

- Node.js 18+ ([nodejs.org](https://nodejs.org))
- Git ([git-scm.com](https://git-scm.com))

### Adımlar

```bash
git clone https://github.com/kayametehan/app-host-manager.git
cd app-host-manager
npm install
npm start
```

Tarayıcıda açın: **http://localhost:3840**

## 🎯 Kullanım

1. **Uygulama Ekle**: GitHub URL'sini yapıştırın
2. **Ortam Değişkenlerini Ayarla**: Otomatik tespit edilen değişkenleri doldurun
3. **Başlat**: Uygulama çalışmaya başlar
4. **Terminal**: Sistem terminalinde proje dizinini açar (Python venv otomatik)

## 🛠️ Desteklenen Proje Tipleri

- **Node.js**: package.json ile otomatik tespit
- **Python**: requirements.txt, otomatik venv kurulumu
- **Go**: go.mod ile otomatik tespit

## 📁 Klasör Yapısı

```
app-host-manager/
├── data/
│   ├── apps.json          # Uygulama kayıtları
│   ├── repos/             # Klonlanan repolar
│   └── logs_*.txt         # Uygulama logları
├── public/                # Frontend
├── server.js              # Backend
└── kill-ports.js          # Port temizleme
```

## 🔒 Güvenlik

- Yerel ağ kullanımı için tasarlandı
- İnternete açmadan önce kimlik doğrulama ekleyin
- Sadece güvendiğiniz repoları ekleyin

## 📝 Lisans

MIT

## 🤝 Katkıda Bulunma

Pull request'ler memnuniyetle karşılanır!
