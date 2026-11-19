import type { IncomingMessage, ServerResponse } from 'http';
import { createApplication } from './bootstrap';
import { loadEnv } from './shared/infrastructure/env';
import { connectDatabase } from './shared/infrastructure/mongo';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;
let ready: Promise<Handler> | undefined;
/** Builds the Express app once per warm serverless instance and re-uses the MongoDB connection between requests. */
function boot(): Promise<Handler> {
  ready ??= (async () => {
    const env = loadEnv(); await connectDatabase(env.MONGODB_URI, { serverless: true });
    return createApplication(env).app as unknown as Handler;
  })().catch(e => { ready = undefined; throw e; });
  return ready;
}
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try { (await boot())(req, res); }
  catch (e) { console.error('Startup failed', e); res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ message: 'Server is not configured correctly. Check the environment variables on Vercel.' })); }
}
