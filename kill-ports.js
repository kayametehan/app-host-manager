#!/usr/bin/env node
const { execSync } = require('child_process');

const ports = [3840, 4001, 4002, 4003, 4004, 4005];

function killPort(port) {
  try {
    const cmd = process.platform === 'win32'
      ? `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /F /PID %a`
      : `lsof -ti:${port} | xargs kill -9`;
    
    execSync(cmd, { stdio: 'ignore' });
    console.log(`✓ Port ${port} temizlendi`);
  } catch (err) {
    // Port zaten boşsa hata vermez
  }
}

console.log('Portlar temizleniyor...');
ports.forEach(killPort);
console.log('Tamamlandı!');
