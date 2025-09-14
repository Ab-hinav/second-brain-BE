import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

/**
 * Swagger/OpenAPI plugin: exposes docs when SWAGGER_ENABLED is true.
 */
export default fp(async (app) => {
  if (!app.config.SWAGGER_ENABLED) return;

  await app.register(swagger, {
    openapi: {
      info: { title: 'Second Brain API', version: '0.1.0' },
      servers: [{ url: `http://${app.config.HOST}:${app.config.PORT}` }],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUI, {
    routePrefix: app.config.SWAGGER_ROUTE,
  });
});
