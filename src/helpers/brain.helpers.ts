import { FastifyInstance, FastifyRequest } from "fastify";
import { AppError } from "../util/appError";
import { CreateBrainBody } from "../routes/brain";
import { z } from "zod";
import { isEmpty } from "./commons";
export const CONTENT_TYPES = {
    LINK: 'link',
    NOTE: 'note',
    OTHER: 'other',
    TWEET: 'tweet',
    YOUTUBE: 'youtube',
}


export  async function getBrainHelper(app:FastifyInstance,req:FastifyRequest){

    const knex = app.knex;
    // @ts-ignore
    const { id } = req.user;

    try {

    const brainData = await knex
      .table("brains as b")
      .where("b.owner_id", id)
      .leftJoin("items as i", "i.brain_id", "b.id")
      .groupBy('b.id')
      .select({
        id: "b.id",
        name: "b.name",
        is_default: 'b.is_default',
        content_types: knex.raw(
          `coalesce(string_agg(distinct i.content_type,','), '')`
        ),
      });


      const brainNav = brainData.map(r => {
        const set = new Set(r.content_types.split(', '));

        

        return {
            id: r.id,
            name: r.name,
            is_default: r.is_default == true,
            [CONTENT_TYPES.TWEET]: set.has(CONTENT_TYPES.TWEET),
            [CONTENT_TYPES.YOUTUBE]: set.has(CONTENT_TYPES.YOUTUBE),
            [CONTENT_TYPES.LINK]: set.has(CONTENT_TYPES.LINK),
            [CONTENT_TYPES.NOTE]: set.has(CONTENT_TYPES.NOTE),
            [CONTENT_TYPES.OTHER]: set.has(CONTENT_TYPES.OTHER),
        }

      })
    
      return brainNav


    }catch(error){
        app.log.info('error in getting brain data'+error)
        throw AppError.internal('BE-01','issue while getting brain data')
    }



}


export async function createBrainHelper(app:FastifyInstance, req:FastifyRequest){

    const knex = app.knex;
    // @ts-ignore
    const { id } = req.user;
    const { name,description } = req.body as z.infer<typeof CreateBrainBody>;


    const exists = await knex.table('brains').where('name',name).first()

        if(isEmpty(exists)){
            throw AppError.conflict('BE-09','Brain name already taken')
        }

    try {

        const brain = await knex.table('brains').insert({
            name,
            owner_id: id,
            description
        }).returning('id');

        return {
            id:brain[0].id
        }

    }catch(error){
        app.log.info('error in creating brain'+error)
        throw AppError.internal('BE-01', 'issue while creating brain')
    }

}