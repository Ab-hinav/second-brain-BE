import fp from 'fastify-plugin';
import knexFactory, { Knex } from 'knex';

/**
 * Knex plugin: initializes a Postgres client (searchPath=app) and decorates `app.knex`.
 */
export default fp(async (app) => {
  const knex = knexFactory({
    client: 'pg',
    searchPath: ['app'],
    connection: {
      host: app.config.DB_HOST,
      port: app.config.DB_PORT,
      user: app.config.DB_USER,
      password: app.config.DB_PASSWORD,
      database: app.config.DB_NAME
    },
    pool: { min: 0, max: 10 }
  });

  app.decorate('knex', knex);
  app.addHook('onClose', async () => { await knex.destroy(); });
});

declare module 'fastify' {
  interface FastifyInstance { knex: Knex }
}
