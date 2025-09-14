import { ZodSchema } from "zod";

/**
 * Small helper to attach zod parsing onto a Fastify hook/handler.
 */
export const zParse =
  <K extends "body" | "query" | "params">(key: K, schema: ZodSchema<any>) =>
  async (req: any) => {
    req[key] = await schema.parseAsync(req[key]);
  };
