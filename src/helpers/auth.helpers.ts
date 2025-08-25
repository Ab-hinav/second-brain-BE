import { FastifyReply, FastifyRequest } from "fastify";
import { AuthBody } from "../routes/user";
import z from "zod";
import { Knex } from "knex";

export async function SignUpHelper(knex:Knex, req:FastifyRequest,reply:FastifyReply){

    const {name,email, password} = req.body as z.infer<typeof AuthBody>;

    const existing  = await knex('users').where({email}).first();
    if(existing){
        reply.status(400).send({message: "User already exists"});
        return;
    }

    






}