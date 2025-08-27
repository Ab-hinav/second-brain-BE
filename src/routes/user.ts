// api/v1/signup
// api/v1/signin
// api/v1/me
// api/v1/auth/exchange

import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { exchangeTokenHelper, meHelper, signInHelper, signUpHelper } from "../helpers/auth.helpers";


export const SignUpBody = z.object({
    name: z.string().min(3),
    email: z.email(),
    password: z.string().min(3)
})

export const SignInBody = z.object({
    email: z.email(),
    password: z.string().min(3)
}) 

export const AuthExchangeBody = z.object({
    assertion: z.string(),
    provider: z.enum(['google','github'])
})

const SignUpRes = z.object({
    message : z.string()
})

const SignInRes = z.object({
    access_token :z.string(),
    refresh_token: z.string(),
    expires_at: z.string()
})

const meRes = z.object({
    name: z.string(),
    email: z.email(),
    avatar_url: z.string().url().nullable().optional()
})



const plugin: FastifyPluginAsync = async (app) =>{
    
    const r = app.withTypeProvider<ZodTypeProvider>()

    r.post('/signup', {
        schema: {
            tags: ['auth'],
            body: SignUpBody,
            response: {
                201: SignUpRes,
            },
        },
    }, async (req,reply) => signUpHelper(app,req,reply));

    r.post('/signin',{
        schema: {
            tags: ['auth'],
            body: SignInBody,
            response: {
                200: SignInRes,
            },
        },
    } ,async (req) => signInHelper(app,req)  )

    r.get('/me',{
        //@ts-ignore
        preHandler: [app.authenticate],
        schema: {
            tags: ['auth'],
            response: {
                200: meRes,
            },
        },
    } ,async (req) => meHelper(app,req)  )

    r.post('/auth/exchange',{
        schema: {
            tags: ['auth'],
            body: AuthExchangeBody,
            response: {
                200: SignInRes,
            },
        },
    } ,async (req) => exchangeTokenHelper(app, req) )

}



export default plugin;