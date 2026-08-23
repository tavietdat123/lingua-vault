import { config, auditConfig } from './config.js';
import { createApp } from './app.js';
import { initializeDatabase } from './db/database.js';
import { seedInitialData, seedWorkProjectData } from './db/seedData.js';
import { schedulerService } from './services/schedulerService.js';
import { telegramBotService } from './services/telegramBotService.js';

// 1. Refuse to boot a production instance on development secrets; warn locally.
for (const problem of auditConfig()) {
  console.warn('⚠️  Config warning:', problem);
}

// 2. Database & seed data
initializeDatabase();
seedInitialData();
seedWorkProjectData();

// 3. Application
const app = createApp();

// 4. Background workers
if (config.schedulersEnabled) {
  schedulerService.start();
  telegramBotService.start();
}

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`
🚀 ===================================================
   LINGUAVAULT SERVER API RUNNING SUCCESSFULLY!
   • Environment:          ${config.env}
   • Local URL:            http://localhost:${config.port}
   • Health Check:         http://localhost:${config.port}/api/health
   • Auth:                 Required on every /api data route
   • Spaced Repetition:    Enabled (SuperMemo SM-2)
   • Telegram AI Copilot:  ${config.schedulersEnabled ? 'Active (Two-Way Bi-Directional)' : 'Disabled'}
   • Client debug logs:    ${config.debugLogsEnabled ? 'Enabled' : 'Disabled'}
===================================================
  `);
});

const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
