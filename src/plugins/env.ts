import fp from 'fastify-plugin';
import { z } from 'zod';
import 'dotenv/config';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace','silent']).default('info'),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  DATABASE_URL: z.string().url(),
  KNEX_MIGRATIONS_DIR: z.string().default('./db/migrations'),
  KNEX_SEEDS_DIR: z.string().default('./db/seeds'),

  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be set'),
  NEXTAUTH_SALT: z.string(),

  RATE_LIMIT_MAX: z.coerce.number().default(120),
  RATE_LIMIT_TIME_WINDOW: z.string().default('1 minute'),

  SWAGGER_ENABLED: z.coerce.boolean().default(true),
  SWAGGER_ROUTE: z.string().default('/docs'),
});

declare module 'fastify' {
  interface FastifyInstance {
    config: z.infer<typeof EnvSchema>;
  }
}

export default fp(async (app) => {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    app.log.error({ issues: parsed.error.issues }, 'Invalid environment configuration');
    throw new Error('ENV_VALIDATION_FAILED');
  }
  app.decorate('config', parsed.data);
});
