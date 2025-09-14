import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AppError } from '../util/appError';

// Optional flag to include DB health
const HealthQuery = z.object({
  extended: z.coerce.boolean().optional().default(false),
});

// Standard health payload (with optional DB indicator)
const HealthResponse = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  version: z.string(),
  now: z.string(),
  db: z.string().optional(),
});

/**
 * Health endpoint with optional DB connectivity check.
 */
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
          await app.knex.raw('select 1');
          return { ...base, db: "OK" };
        } catch (error) {
          throw AppError.internal("BE-00", "DB_HEALTH_FAILED")
        }
      }
      return base;
    }
  );
};

export default plugin;
