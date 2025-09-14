import { FastifyInstance, FastifyRequest } from "fastify";


/**
 * Return all tags (name/color) for all brains owned by the authenticated user.
 */
export async function getAllTags(app:FastifyInstance,req:FastifyRequest){

    const knex = app.knex;
    // @ts-ignore
    const { id } = req.user;

    // Subquery: all brain ids owned by the user
    const allBrainIdQuery = knex.table("brains as b").where("b.owner_id", id).select('b.id');

    // Fetch tags limited to those brains
    const allTagsData = await knex
      .table("tags as t")
      .whereIn("t.brain_id", allBrainIdQuery)
      .select<{name:string,color:string}[]>({name: "t.name", color: "t.color"});

    return allTagsData

}
