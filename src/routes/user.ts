// api/v1/signup
// api/v1/signin
// api/v1/me
// api/v1/auth/exchange

import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { SignUpHelper } from "../helpers/auth.helpers";


export const AuthBody = z.object({
    name: z.string().min(3),
    email: z.email(),
    password: z.string().min(3)
})

export const SignUpRes = z.object({
    message : z.string()
})



const plugin: FastifyPluginAsync = async (app) =>{
    
    const r = app.withTypeProvider<ZodTypeProvider>()

    r.post('/signup', {
        schema: {
            tags: ['auth'],
            body: AuthBody,
            response: {
                201: SignUpRes,
            },
        },
    }, async (req,reply) => SignUpHelper(app.knex,req,reply));

}


