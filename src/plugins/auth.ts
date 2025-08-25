import '@fastify/jwt';
import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';

declare module 'fastify' {
  interface FastifyJWT {
    payload: { id: number }; // User payload definition
    user: {
      id: number;
    }; // User object available in request.user
  }
}

export default fp(async (app) => {
  app.register(fastifyJwt, {
    secret: app.config.JWT_SECRET,
  });
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