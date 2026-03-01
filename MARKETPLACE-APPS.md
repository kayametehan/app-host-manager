# Marketplace - Self-Hosted Uygulamalar

## Eklenen Özellikler

### 30+ Self-Hosted Uygulama
Marketplace'e 30'dan fazla popüler self-hosted uygulama eklendi. Artık bu uygulamaları marketplace'den tek tıkla kurabilirsiniz!

### Yeni Kategori: Self-Hosted Apps
Marketplace'e "Self-Hosted Apps" kategorisi eklendi. Bu kategoride tüm büyük home server uygulamalarını bulabilirsiniz.

### Tek Tıkla Kurulum
Self-hosted uygulamalar için özel "Kur ve Çalıştır" butonu. GitHub'dan otomatik klonlama ve kurulum.

## Eklenen Uygulamalar

### Bulut & Depolama
- **Nextcloud** - Google Drive alternatifi, bulut depolama ve ofis paketi
- **PhotoPrism** - AI destekli fotoğraf yönetimi, Google Photos alternatifi
- **Immich** - Yüksek performanslı fotoğraf ve video yedekleme

### Medya Sunucuları
- **Plex Media Server** - Kişisel medya sunucusu
- **Jellyfin** - Açık kaynak media server, Plex alternatifi

### CMS & Blog
- **WordPress** - Dünyanın en popüler CMS sistemi
- **Ghost** - Modern blog platformu, Medium alternatifi
- **Strapi** - Headless CMS, API-first content management

### DevOps & Geliştirme
- **GitLab CE** - Self-hosted Git, CI/CD, issue tracking
- **code-server** - Tarayıcıda VS Code
- **Portainer** - Docker container yönetim arayüzü

### İşbirliği & İletişim
- **Mattermost** - Team chat, Slack alternatifi
- **BookStack** - Wiki ve dokümantasyon, Notion alternatifi

### Otomasyon & Monitoring
- **n8n** - Workflow automation, Zapier alternatifi
- **Grafana** - Monitoring ve analytics platformu
- **Uptime Kuma** - Self-hosted monitoring tool
- **Home Assistant** - Akıllı ev otomasyon platformu

### Güvenlik & Gizlilik
- **Vaultwarden** - Şifre yöneticisi, Bitwarden alternatifi
- **Pi-hole** - Network-wide ad blocker
- **Authentik** - Identity provider ve SSO çözümü

### Database & Backend
- **Supabase** - Firebase alternatifi (Database, Auth, Storage)
- **Appwrite** - Backend-as-a-Service platformu
- **NocoDB** - No-code database, Airtable alternatifi
- **Metabase** - Business intelligence ve analytics

### Doküman & Organizasyon
- **Paperless-ngx** - Doküman yönetim sistemi, OCR destekli
- **Stirling PDF** - PDF araçları (birleştir, böl, dönüştür)
- **Mealie** - Tarif yöneticisi ve yemek planlayıcı
- **FreshRSS** - RSS feed okuyucu, Feedly alternatifi
- **Linkwarden** - Bookmark manager, Pocket alternatifi

## Kullanım

### Marketplace'den Kurulum
1. Marketplace'i açın (🛍️ Marketplace butonu)
2. "Self-Hosted Apps" kategorisini seçin
3. İstediğiniz uygulamayı bulun
4. "Kur ve Çalıştır" butonuna tıklayın
5. Uygulama otomatik olarak indirilir ve kurulur
6. Ana sayfadan uygulamayı başlatın

### Özellikler
- **Docker Badge**: Docker gerektiren uygulamalar işaretli
- **Port Bilgisi**: Her uygulamanın varsayılan portu gösteriliyor
- **Detaylı Bilgi**: Rating, download sayısı, versiyon bilgisi
- **Tag Sistemi**: Uygulamaları etiketlere göre filtrele
- **Arama**: İsim, açıklama ve etiketlerde arama

### Görsel İyileştirmeler
- Self-hosted uygulamalar için özel yeşil kenarlık
- Docker badge (🐳 Docker)
- Port bilgisi badge
- Gradient arka plan efekti
- Hover animasyonları

## Teknik Detaylar

### Proje Tipi Desteği
Artık şu proje tipleri destekleniyor:
- Node.js (npm, yarn)
- Python (pip, venv)
- PHP (Composer)
- Ruby (Bundler)
- Rust (Cargo)
- Go (go mod)
- Docker (Dockerfile)
- Docker Compose (docker-compose.yml)

### Otomatik Tespit
- Dockerfile varsa Docker modu önerilir
- docker-compose.yml varsa otomatik Docker Compose kullanılır
- package.json, requirements.txt, vb. otomatik tespit edilir

### Hata Mesajları
- Docker gerekli uygulamalar için yönlendirme
- Desteklenmeyen projeler için özel komut önerisi
- Eksik ortam değişkenleri için uyarı

## Notlar

- Tüm self-hosted uygulamalar ücretsiz ve açık kaynak
- Docker gerektiren uygulamalar için Docker kurulu olmalı
- Bazı uygulamalar yüksek kaynak kullanabilir
- İlk kurulum biraz zaman alabilir (bağımlılıklar indiriliyor)

## Sonraki Adımlar

Potansiyel eklemeler:
- Daha fazla self-hosted uygulama
- Uygulama kategorileri (Media, DevOps, Security, vb.)
- Popülerlik sıralaması
- Kullanıcı yorumları
- Kurulum rehberleri
- Önerilen sistem gereksinimleri
- Bağımlılık kontrolü
