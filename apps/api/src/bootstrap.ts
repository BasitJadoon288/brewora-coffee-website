import { createApp } from './app';
import { buildContainer } from './container';
import { Env, loadEnv } from './shared/infrastructure/env';
export function createApplication(env: Env = loadEnv()) { const container = buildContainer(env); return { app: createApp(container, env), container, env }; }
