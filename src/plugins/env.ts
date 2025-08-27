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

  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),

  JWT_SECRET: z.string().min(3),
  FE_JWS_PUBLIC_PEM: z.string().min(3),
  FE_JWS_ISS: z.string().min(3),
  FE_JWS_AUD: z.string().min(3),

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
