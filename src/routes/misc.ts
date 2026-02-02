import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { getAllTags, prefillHelper } from "../helpers/misc.helpers";

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

  // Public: Prefill metadata for a URL (Twitter/YouTube/noembed/OG)
  const PrefillQuery = z.object({ url: z.string().url() });
  const PrefillResp = z.object({ title: z.string().optional(), description: z.string().optional() });

  r.get(
    "/prefill",
    {
      schema: {
        tags: ["misc"],
        querystring: PrefillQuery,
        response: { 200: PrefillResp },
      },
    },
    async (req) => prefillHelper(app, req)
  );

  r.get(
    "/tags",
    {
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
