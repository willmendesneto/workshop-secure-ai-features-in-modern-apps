import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { logger } from './logger.js';

const config = loadConfig();

createApp({ config }).listen(config.port, config.host, (error) => {
  if (error) {
    logger.error('api failed to start', { message: error.message });
    process.exitCode = 1;
    return;
  }
  logger.info('api listening', { url: `http://${config.host}:${String(config.port)}` });
});
