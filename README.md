# App Host Manager

Windows 11 (veya herhangi bir işletim sistemi) üzerinde bilgisayarınızı sunucu gibi kullanarak uygulamalarınızı host etmenizi sağlayan **web arayüzlü** uygulama. GitHub deposu linkini girdiğinizde repoyu otomatik klonlar, gerekirse bağımlılıkları kurar ve uygulamayı çalıştırır.

## Özellikler

- **Web arayüzü**: Tarayıcıdan tüm işlemleri yönetirsiniz
- **GitHub’dan tek tıkla kurulum**: URL yapıştır → Ekle → Otomatik klon + kurulum + çalıştırma
- **Cross-platform**: Windows 11, macOS ve Linux’ta çalışır
- **Desteklenen proje tipleri**: Node.js, Python, Go
- **Detaylı loglar**: Her satırda zaman damgası ve [stdout]/[stderr] etiketi
- **Docker sandbox**: Repoda `Dockerfile` varsa uygulama container içinde izole çalışır (Config’ten açıp kapatabilirsiniz)
- **Web terminali**: Her uygulama için repoda çalışan bir terminal (node-pty gerekir)
- **Kod düzenleyici**: Repo dosya ağacı, dosya açma ve kaydetme
- **Config / ortam**: API anahtarları ve config dosyalarını düzenleme

## Gereksinimler

- **Node.js** 18 veya üzeri ([nodejs.org](https://nodejs.org))
- **Git** ([git-scm.com](https://git-scm.com)) – repoları klonlamak için
- **Docker** (isteğe bağlı) – sandbox modu için
- Host edeceğiniz uygulamalar için:
  - Node projeleri: `npm` (Node ile gelir)
  - Python projeleri: `python3` veya `python` ve isteğe bağlı `venv`
  - Go projeleri: `go`

## Kurulum ve çalıştırma

### 1. Projeyi indirin veya klonlayın

```bash
cd server4
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. Sunucuyu başlatın

```bash
npm start
```

Varsayılan port: **3840**. Tarayıcıda açın:

- Yerel: **http://localhost:3840**
- Aynı ağdaki diğer cihazlar: **http://<bilgisayar-ip>:3840**

Portu değiştirmek için:

```bash
PORT=8080 npm start
```

Windows (CMD):

```cmd
set PORT=8080 && npm start
```

Windows (PowerShell):

```powershell
$env:PORT=8080; npm start
```

## Web arayüzü kullanımı

1. **Yeni uygulama ekle**: “Yeni uygulama ekle” alanına GitHub repo URL’sini yapıştırın (örn. `https://github.com/kullanici/repo`) ve **Ekle ve çalıştır**’a tıklayın.
2. Uygulama otomatik olarak klonlanır, türüne göre bağımlılıklar kurulur ve başlatılır.
3. Listeden **Başlat**, **Durdur**, **Loglar** veya **Sil** ile yönetin.
4. “Port: XXXX” bilgisiyle uygulamanıza `http://<sunucu-ip>:XXXX` adresinden erişebilirsiniz.

## Klasör yapısı

- `data/` – Kayıtlar ve klonlanan repolar (otomatik oluşur)
- `data/apps.json` – Eklenen uygulamaların listesi
- `data/repos/<app-id>/` – Her uygulamanın klonlandığı klasör
- `data/logs_<app-id>.txt` – Uygulama logları

## Güvenlik notu

Bu uygulama yerel ağda veya ev kullanımı için uygundur. İnternete açacaksanız:

- Güçlü bir şifre / kimlik doğrulama ekleyin
- HTTPS kullanın
- Güvendiğiniz GitHub repolarını ekleyin; rastgele kod çalıştırma riskine dikkat edin

## Lisans

MIT
