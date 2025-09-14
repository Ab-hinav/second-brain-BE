import Fastify from 'fastify';
import envPlugin from './plugins/env';
import securityPlugin from './plugins/security';
import knexPlugin from './plugins/knex';
import authPlugin from './plugins/auth';
import swaggerPlugin from './plugins/swagger';
import routes from './routes';
import errors from './util/errors';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';

/**
 * Build and start the Fastify app: registers core plugins, routes, and error handlers.
 */
export async function build() {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Order matters: env -> security -> db -> auth -> swagger -> routes -> errors
  await app.register(envPlugin);
  await app.register(securityPlugin);
  await app.register(knexPlugin);
  await app.register(authPlugin)
  await app.register(swaggerPlugin);
  await app.register(routes);
  await app.register(errors);

  return app;
}


// Standalone start when run directly
build()
  .then(async (app) => {
    try {
      await app.listen({ host: app.config.HOST, port: app.config.PORT });
    } catch (err) {
      app.log.error(err, 'Failed to start server');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Failed to build server', err);
    process.exit(1);
  });
