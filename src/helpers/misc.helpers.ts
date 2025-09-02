import { FastifyInstance, FastifyRequest } from "fastify";


export async function getAllTags(app:FastifyInstance,req:FastifyRequest){

    const knex = app.knex;
    // @ts-ignore
    const { id } = req.user;

    const allBrainIdQuery = knex.table("brains as b").where("b.owner_id", id).select('b.id');

    const allTagsData = await knex
      .table("tags as t")
      .where("t.brain_id", "in", allBrainIdQuery)
      .select<{name:string,color:string}[]>({name: "t.name", color: "t.color"});

    return allTagsData

}