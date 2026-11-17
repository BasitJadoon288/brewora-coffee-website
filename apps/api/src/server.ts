import mongoose from 'mongoose';
import { createApplication } from './bootstrap';
import { connectDatabase } from './shared/infrastructure/mongo';
import { loadEnv } from './shared/infrastructure/env';
import { logger } from './shared/infrastructure/logger';
(async () => {
  const env = loadEnv(); await connectDatabase(env.MONGODB_URI);
  const { app } = createApplication(env);
  const server = app.listen(env.PORT, () => logger.info(`BREWORA API listening on :${env.PORT}`));
  const stop = () => server.close(async () => { await mongoose.disconnect(); process.exit(0); });
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
})().catch(e => { console.error(e); process.exit(1); });
