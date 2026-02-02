import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { createTweetItemHelper } from "../helpers/items.helpers";

// Standard success shape for item creation endpoints
const ItemSuccessResp = z.object({
  id: z.string(),
});


// Payload for creating a tweet item
export const CreateItemBody = z.object({
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  brainId: z.string(),
  url: z.string().optional(),
  pinned: z.boolean()
});

/**
 * Item endpoints (currently only tweet creation).
 */
const plugin: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    "/item/tweet",

    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["items", "tweets"],
        body: CreateItemBody,
        response: {
          200: ItemSuccessResp,
        },
      },
    },
    async (req) => createTweetItemHelper(app, req)
  );
};

export default plugin;
