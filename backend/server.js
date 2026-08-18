const { app } = require('./src/app');
const { connectDatabase } = require('./src/config/db');
const { env } = require('./src/config/env');
const { logger } = require('./src/config/logger');

async function startServer() {
  await connectDatabase();

  app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`);
  });
}

startServer().catch((error) => {
  logger.error('Server failed to start', error);
  process.exit(1);
});