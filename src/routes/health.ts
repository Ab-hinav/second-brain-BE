import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AppError } from '../util/appError';

const HealthQuery = z.object({
  extended: z.coerce.boolean().optional().default(false),
});

const HealthResponse = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  version: z.string(),
  now: z.string(),
  db: z.string().optional(),
});

const plugin: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/health",
    {
      schema: {
        tags: ["system"],
        querystring: HealthQuery,
        response: { 200: HealthResponse },
      },
    },
    async (req, reply) => {
      const base = {
        status: "ok" as const,
        uptime: process.uptime(),
        version: "0.1.0",
        now: new Date().toISOString(),
      };

      if (req.query.extended) {
        try {
          const dbHealth = await app.knex.table("users").select();
          return { ...base, db: dbHealth.length > 0 ? "OK" : "XXXX" };
        } catch (error) {
          throw AppError.internal("BE-01", "DB_HEALTH_FAILED")
        }
      } else {
        return base;
      }
    }
  );
};

export default plugin;
