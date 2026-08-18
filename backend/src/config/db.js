const dns = require('dns');
const mongoose = require('mongoose');
const { env } = require('./env');
const { logger } = require('./logger');

let memoryServer = null;

function configureDns() {
  if (env.MONGODB_DNS_SERVERS) {
    const servers = env.MONGODB_DNS_SERVERS.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (servers.length > 0) {
      try {
        dns.setServers(servers);
      } catch (err) {
        logger.warn('Failed to set custom DNS servers for MongoDB resolution', { error: err.message });
      }
    }
  }
}

async function getConnectionString() {
  const uri = (env.MONGODB_URI || '').trim();
  if (uri) {
    return uri;
  }

  // In production, MONGODB_URI must be set — do not silently use an ephemeral DB
  if (env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is required in production');
  }

  logger.warn('MONGODB_URI not set — using in-memory MongoDB (data will not persist)');
  const { MongoMemoryServer } = await import('mongodb-memory-server');

  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }

  return memoryServer.getUri('placement-companion');
}

async function connectDatabase(retries = 3) {
  configureDns();
  mongoose.set('strictQuery', true);
  const connectionString = await getConnectionString();
  const isPersistent = Boolean((env.MONGODB_URI || '').trim());

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(connectionString);
      logger.info(isPersistent ? 'Persistent MongoDB connected' : 'MongoDB memory server connected');
      return;
    } catch (error) {
      logger.error(`Database connection attempt ${attempt}/${retries} failed:`, { error: error.message });
      if (attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

// Graceful shutdown
async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  logger.info('Database disconnected');
}

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

module.exports = { connectDatabase, disconnectDatabase };