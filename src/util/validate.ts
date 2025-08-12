import { ZodSchema } from "zod";
export const zParse =
  <K extends "body" | "query" | "params">(key: K, schema: ZodSchema<any>) =>
  async (req: any) => {
    req[key] = await schema.parseAsync(req[key]);
  };
