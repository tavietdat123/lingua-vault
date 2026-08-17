import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`
=====================================================
🚀 KHỞI ĐỘNG HỆ THỐNG LINGUAVAULT (SERVER + WEB)
=====================================================
`);

// 1. Start Server API (Port 5001)
const server = spawn('node', ['src/index.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// 2. Start Vite Web Client (Port 3000)
const web = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'web'),
  stdio: 'inherit',
  shell: true
});

// Graceful shutdown
const cleanup = () => {
  console.log('\n🛑 Đang dừng toàn bộ dịch vụ LinguaVault...');
  server.kill('SIGINT');
  web.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
