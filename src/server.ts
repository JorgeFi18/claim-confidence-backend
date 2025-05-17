import dotenv from 'dotenv';
import log from './utils/logger';
import app from './app';
import Database from './config/database';

dotenv.config();

const startServer = async () => {
  try {
    // Initialize database connection
    const database = Database.getInstance();
    await database.connect();

    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      log.info(`Server listening at port:${port}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      log.info('SIGTERM signal received: closing HTTP server');
      await database.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      log.info('SIGINT signal received: closing HTTP server');
      await database.disconnect();
      process.exit(0);
    });
  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();