import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';

export default fp(async (app) => {
  await app.register(sensible);
  await app.register(cors, { origin: app.config.CORS_ORIGIN, credentials: app.config.CORS_CREDENTIALS });
  await app.register(helmet);
  await app.register(rateLimit, { max: app.config.RATE_LIMIT_MAX, timeWindow: app.config.RATE_LIMIT_TIME_WINDOW });
});