import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { CONTENT_TYPES, createBrainHelper, getBrainHelper, getBrainDetailHelper } from "../helpers/brain.helpers";


// Brain navigation item returned by /brain-nav
export const BrainNavItemsSchema = z.object({
    id: z.string(),
    name: z.string(),
    is_default: z.boolean(),
    [CONTENT_TYPES.TWEET]: z.boolean(),
    [CONTENT_TYPES.YOUTUBE]: z.boolean(),
    [CONTENT_TYPES.LINK]: z.boolean(),
    [CONTENT_TYPES.OTHER]: z.boolean(),
    [CONTENT_TYPES.NOTE]: z.boolean(),
  });
  
 
export const BrainNavResp = z.array(BrainNavItemsSchema);

export const CreateBrainResp = z.object({
    id: z.string()
})

// Create brain payload
export const CreateBrainBody = z.object({
    name: z.string().min(3,'min 3 char required'),
    description: z.string().optional()
})

const CountsSchema = z.object({
  total: z.number(),
  tweets: z.number(),
  videos: z.number(),
  notes: z.number(),
  links: z.number(),
  other: z.number(),
  youtube: z.number(),
});

// Params for /brain-detail/:brainId
export const BrainDetailParams = z.object({
  brainId: z.string(),
});

// Brain detail plus counts of items by content_type
export const BrainDetailResp = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  counts: CountsSchema,
});

/**
 * Brain endpoints: navigation list, creation, and details with counts.
 */
const plugin: FastifyPluginAsync = async (app) => {
    const r = app.withTypeProvider<ZodTypeProvider>();
  
    r.get(
      "/brain-nav",
      
      { //@ts-ignore
        preHandler: [app.authenticate],
        schema: {
          tags: ["brain"],
          response: {
            200: BrainNavResp,
          },
        },
      },
      async (req) => getBrainHelper(app, req)
    );

    r.post("/brain",
        { //@ts-ignore
            preHandler: [app.authenticate],
            schema: {
              tags: ["brain"],
              body: CreateBrainBody,
              response: {
                200: CreateBrainResp,
              },
            },
          },
          async (req) => createBrainHelper(app, req) 
        )

    r.get(
      "/brain-detail/:brainId",
      { //@ts-ignore
        preHandler: [app.authenticate],
        schema: {
          tags: ["brain"],
          params: BrainDetailParams,
          response: {
            200: BrainDetailResp,
          },
        },
      },
      async (req) => getBrainDetailHelper(app, req)
    );
  
    
};

export default plugin;
