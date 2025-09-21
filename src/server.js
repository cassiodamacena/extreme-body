import { createApp } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;


let serverInstance;

const startServer = async () => {
  const app = await createApp();
  serverInstance = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`API Docs: http://localhost:${PORT}/api-docs`);
  });
};

startServer();

// Graceful shutdown
const shutdown = () => {
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('Server closed. Port released.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);