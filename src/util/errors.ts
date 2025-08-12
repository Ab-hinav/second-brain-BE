import fp from 'fastify-plugin';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { AppError } from '../util/appError';

export default fp(async (app) => {
  // 404 handler for unknown routes
  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({
      ok: false,
      statusCode: 404,
      error: 'Not Found',
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
      requestId: req.id
    });
  });

  // Central error handler
  app.setErrorHandler((err: any, req, reply) => {
    // Zod validation errors (request/response)
    if (hasZodFastifySchemaValidationErrors(err)) {
      const issues = err.validation; // zod issues array
      return reply.code(400).send({
        ok: false,
        statusCode: 400,
        error: 'Bad Request',
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: issues,
        requestId: req.id
      });
    }

    // Domain errors
    if (err instanceof AppError) {
      const status = err.statusCode ?? 500;
      if (status >= 500) app.log.error({ err, code: err.code, requestId: req.id });
      else app.log.warn({ err, code: err.code, requestId: req.id });
      return reply.code(status).send({
        ok: false,
        statusCode: status,
        error: err.title || (status >= 500 ? 'Internal Server Error' : 'Error'),
        code: err.code,
        message: err.message,
        details: err.details ?? null,
        requestId: req.id
      });
    }

    // Fallback (includes httpErrors from @fastify/sensible)
    const status = Number(err?.statusCode || 500);
    const msg = String(err?.message || 'Something went wrong');
    if (status >= 500) app.log.error({ err, requestId: req.id });
    else app.log.warn({ err, requestId: req.id });

    return reply.code(status).send({
      ok: false,
      statusCode: status,
      error: status >= 500 ? 'Internal Server Error' : 'Error',
      code: err?.code || 'UNEXPECTED',
      message: msg,
      requestId: req.id
    });
  });
});