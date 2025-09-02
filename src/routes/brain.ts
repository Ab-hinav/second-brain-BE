import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { CONTENT_TYPES, createBrainHelper, getBrainHelper } from "../helpers/brain.helpers";


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

export const CreateBrainBody = z.object({
    name: z.string().min(3,'min 3 char required'),
    description: z.string().optional()
})


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
  
    
};

export default plugin;