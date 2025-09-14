import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { getAllTags } from "../helpers/misc.helpers";

export const Tag = z.object({
  name: z.string(),
  color: z.string(),
});

export const TagRes = z.array(Tag);

/**
 * Misc endpoints (e.g., tag dictionary for the authenticated user).
 */
const plugin: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/tags",
    {
      //@ts-ignore
      preHandler: [app.authenticate],
      schema: {
        tags: ["all-tags"],
        response: {
          200: TagRes,
        },
      },
    },
    async (req) => getAllTags(app, req)
  );
};

export default plugin;
