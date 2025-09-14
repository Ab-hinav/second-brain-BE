import '@fastify/jwt';
import fastifyJwt from '@fastify/jwt';
import fastifyBcrypt from 'fastify-bcrypt';
import fp from 'fastify-plugin';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';

declare module 'fastify' {
  interface FastifyJWT {
    payload: { id: string }; // User payload definition
    user: {
      id: string;
    }; // User object available in request.user
  }
}

/**
 * Auth plugin: JWT + bcrypt and an `authenticate` decorator for route guards.
 */
export default fp(async (app) => {
  app.register(fastifyJwt, {
    secret: app.config.JWT_SECRET,
  });

  app.register(fastifyBcrypt,{
    saltWorkFactor: 12
  })

  app.decorate(
    "authenticate",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  );

});
