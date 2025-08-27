
import type { FastifyPluginAsync } from 'fastify';

import health from './health';
import user from './user';
// import me from './me';
// import brains from './brains';
// import items from './items';

const routes: FastifyPluginAsync = async (app) => {
  // Public routes
  await app.register(health); // GET /health

  // Authenticated API routes (mounted under /api/v1)
  await app.register(async (v1) => {
    await v1.register(user);
    // await v1.register(me);      // e.g., GET /api/v1/me
    // await v1.register(brains);  // e.g., /api/v1/brains
    // await v1.register(items);   // e.g., /api/v1/items
  }, { prefix: '/api/v1' });

  // Optional root (handy during dev)
  app.get('/', async () => ({ name: 'second-brain-api', version: '0.1.0' }));
};

export default routes;
