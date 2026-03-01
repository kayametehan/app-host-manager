# App Host Manager 🚀

Modern web-based application host manager with GitHub integration, Docker support, and marketplace for 60+ self-hosted applications.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D16-brightgreen)

## ✨ Features

### 🎯 Core Features
- **GitHub Integration** - Clone and deploy apps directly from GitHub URLs
- **Auto Installation** - Automatic dependency installation (npm, pip, composer)
- **Docker Support** - Full Docker and Docker Compose support
- **Multi-Language** - Node.js, Python, PHP, Ruby, Rust, Go support
- **Web Terminal** - Built-in web terminal for each app
- **File Editor** - VS Code-like file editor with syntax highlighting
- **Real-time Stats** - CPU, memory, and network monitoring
- **Environment Variables** - Easy env management with auto-detection

### 🛍️ Marketplace (60+ Apps)
- **Self-Hosted Apps** - Nextcloud, WordPress, GitLab, Plex, Jellyfin, Home Assistant, and more
- **One-Click Install** - Install apps directly from marketplace
- **Auto Docker Setup** - Docker automatically enabled for marketplace apps
- **Categories** - Organized by type (Media, DevOps, Security, etc.)

### 🎨 UI Features
- **Card-Based Dashboard** - Modern, responsive design
- **Dark Theme** - Easy on the eyes
- **Toast Notifications** - Real-time feedback
- **Search & Filter** - Find apps quickly
- **Bulk Actions** - Start/stop/restart all apps at once
- **Export/Import** - Backup and restore app configurations

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Git
- Docker Desktop (optional, for Docker apps)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/app-host-manager.git
cd app-host-manager

# Install dependencies
npm install

# Start the server
npm start
```

The app will be available at `http://localhost:3840`

### Docker Installation (Recommended)

```bash
# macOS
brew install --cask docker

# Windows
# Download from https://www.docker.com/products/docker-desktop

# Linux
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

## 📖 Usage

### Adding an App

1. **From GitHub URL**
   - Click "Yeni uygulama ekle"
   - Paste GitHub repository URL
   - Click "Ekle ve çalıştır"
   - App will be cloned and installed automatically

2. **From Marketplace**
   - Click "🛍️ Marketplace"
   - Browse or search for apps
   - Click "Kur ve Çalıştır"
   - App will be installed with Docker automatically

3. **From Templates**
   - Click "Şablonlar" tab
   - Choose a template (Express, React, Next.js, etc.)
   - GitHub URL will be auto-filled
   - Click "Ekle ve çalıştır"

### Managing Apps

- **Start/Stop** - Click buttons on app cards
- **View Details** - Click on app card to open dashboard
- **Edit Files** - Use built-in file editor
- **View Logs** - Real-time log streaming
- **Terminal Access** - Web-based terminal for each app
- **Environment Variables** - Manage env vars in dashboard
- **Settings** - Configure Docker, start commands, etc.

### Bulk Actions

- **Start All** - Start all stopped apps
- **Stop All** - Stop all running apps
- **Restart All** - Restart all apps
- **Export** - Backup all app configurations
- **Import** - Restore from backup

## 🐳 Docker Support

### Automatic Docker Detection
- Apps with `Dockerfile` → Docker mode suggested
- Apps with `docker-compose.yml` → Docker Compose mode
- Marketplace apps → Docker automatically enabled

### Docker Status
- Real-time Docker status indicator in header
- 🔵 Blue: Docker running
- 🔴 Red: Docker not running
- 🟡 Yellow: Status unknown

## 📦 Marketplace Apps (60+)

### Cloud & Storage
- Nextcloud, PhotoPrism, Immich, Syncthing, File Browser

### Media Servers
- Plex, Jellyfin, Overseerr, Tautulli, Navidrome, Audiobookshelf

### CMS & Blogging
- WordPress, Ghost, Strapi

### DevOps & Development
- GitLab CE, code-server, Portainer, Yacht

### Security & Privacy
- Vaultwarden, Pi-hole, AdGuard Home, Authentik, WireGuard Easy

### Monitoring
- Uptime Kuma, Netdata, Glances, Grafana, Healthchecks

### Dashboards
- Heimdall, Homer, Dashy, Homarr, Flame, Organizr

### And many more...

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3840
NODE_ENV=production
```

### Custom Port

```bash
PORT=8080 npm start
```

### Data Directory

All app data is stored in `./data/`:
- `data/apps.json` - App configurations
- `data/repos/` - Cloned repositories
- `data/logs_*.txt` - App logs
- `data/marketplace.json` - Marketplace data
- `data/templates.json` - Template definitions

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# The server will restart automatically on file changes
```

### Project Structure

```
app-host-manager/
├── server.js              # Main server file
├── public/
│   ├── index.html        # Frontend HTML
│   ├── app.js            # Frontend JavaScript
│   └── styles.css        # Frontend CSS
├── data/
│   ├── apps.json         # App configurations
│   ├── marketplace.json  # Marketplace data
│   ├── templates.json    # Template definitions
│   └── repos/            # Cloned repositories
├── package.json
└── README.md
```

## 🎯 Supported Project Types

- **Node.js** - npm, yarn, package.json
- **Python** - pip, venv, requirements.txt
- **PHP** - Composer, composer.json
- **Ruby** - Bundler, Gemfile
- **Rust** - Cargo, Cargo.toml
- **Go** - go mod, go.mod
- **Docker** - Dockerfile
- **Docker Compose** - docker-compose.yml

## 📊 System Requirements

### Minimum
- CPU: 2 cores
- RAM: 2GB
- Disk: 10GB free space
- OS: macOS, Linux, Windows

### Recommended
- CPU: 4+ cores
- RAM: 4GB+
- Disk: 50GB+ free space
- SSD storage

## 🔒 Security

- Apps run in isolated directories
- Docker sandbox support
- Environment variable encryption (coming soon)
- User authentication (coming soon)
- SSL/TLS support (coming soon)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Express.js, WebSocket, and xterm.js
- Icons from emoji
- Inspired by Portainer, Coolify, and CapRover

## 📞 Support

- GitHub Issues: [Report a bug](https://github.com/YOUR_USERNAME/app-host-manager/issues)
- Documentation: [Wiki](https://github.com/YOUR_USERNAME/app-host-manager/wiki)

## 🗺️ Roadmap

- [ ] User authentication & multi-user support
- [ ] SSL certificate management (Let's Encrypt)
- [ ] Nginx reverse proxy integration
- [ ] Database management UI
- [ ] Backup & restore automation
- [ ] Webhook support
- [ ] Mobile app
- [ ] Cloud deployment (AWS, DigitalOcean, etc.)

## 📸 Screenshots

### Main Dashboard
![Dashboard](screenshots/dashboard.png)

### Marketplace
![Marketplace](screenshots/marketplace.png)

### App Details
![App Details](screenshots/app-details.png)

---

Made with ❤️ by the community
