import fp from 'fastify-plugin';
import { decode } from '@auth/core/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { userId: string; email?: string | null };
  }
  interface FastifyInstance {
    requireAuth: (req: any, reply: any, done: any) => void;
  }
}

export default fp(async (app) => {
  app.decorate('requireAuth', async (req: any, reply: any) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return reply.code(401).send({ ok: false, statusCode: 401, error: 'Unauthorized', code: 'NO_TOKEN', message: 'Missing bearer token', requestId: req.id });
    }

    const token = auth.slice('Bearer '.length).trim();
    let payload: any;
    try {
      payload = await decode({
        token,
        secret: app.config.NEXTAUTH_SECRET,
        salt: app.config.NEXTAUTH_SALT
        // salt defaults to cookie name internally; not needed here since we pass raw token
      });
    } catch (err) {
      app.log.warn({ err, requestId: req.id }, 'Failed to decode session token');
      return reply.code(401).send({ ok: false, statusCode: 401, error: 'Unauthorized', code: 'TOKEN_INVALID', message: 'Invalid or expired session token', requestId: req.id });
    }

    if (!payload || (payload as any).exp * 1000 < Date.now()) {
      return reply.code(401).send({ ok: false, statusCode: 401, error: 'Unauthorized', code: 'TOKEN_INVALID', message: 'Invalid or expired session token', requestId: req.id });
    }

    req.user = { userId: String((payload as any).sub), email: (payload as any).email ?? null };
  });
});
