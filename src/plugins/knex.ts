import fp from 'fastify-plugin';
import knexFactory, { Knex } from 'knex';

export default fp(async (app) => {
  const knex = knexFactory({
    client: 'pg',
    connection: app.config.DATABASE_URL,
    pool: { min: 0, max: 10 }
  });

  app.decorate('knex', knex);
  app.addHook('onClose', async () => { await knex.destroy(); });
});

declare module 'fastify' {
  interface FastifyInstance { knex: Knex }
}