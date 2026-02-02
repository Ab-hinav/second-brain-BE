import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthExchangeBody, RefreshTokenBody, SignInBody, SignUpBody } from "../routes/user";
import z from "zod";
import * as jose from "jose";

import { AppError } from "../util/appError";
import { isEmpty } from "./commons";

/**
 * Build access/refresh tokens for a user and include a client-friendly expiry.
 */
const getTokenData = (id: string, app: FastifyInstance) => {
  const accessToken = app.jwt.sign({ id: id }, { expiresIn: "1hr" });
  const refreshToken = app.jwt.sign({ id: id }, { expiresIn: "7d" });
  const currentDate = new Date();
  const expiresAt = new Date(
    currentDate.setHours(currentDate.getHours() + 1)
  ).toString();

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
  };
};

/**
 * Create a new user with hashed password and return a 201 message.
 */
export async function signUpHelper(
  app: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { name, email, password } = req.body as z.infer<typeof SignUpBody>;
  const knex = app.knex;
  const bcrypt = app.bcrypt;

  // Check for existing user by email
  const existing = await knex("users").where({ email }).first();
  if (existing) {
    throw AppError.conflict("BE-03", "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password);
  app.log.info(hashedPassword);

  // Persist user inside a transaction
  await knex.transaction(async (trx) => {
    const createUser = await trx("users")
      .insert({ name, email, password: hashedPassword })
      .returning("*");
    app.log.info(createUser, "User created successfully");
    return reply.code(201).send({ message: "User created successfully" });
  });
  return;
}

/**
 * Validate credentials and return JWTs on success.
 */
export async function signInHelper(app: FastifyInstance, req: FastifyRequest) {
  const { email, password } = req.body as z.infer<typeof SignInBody>;
  const knex = app.knex;
  const bcrypt = app.bcrypt;

  // Lookup user by email
  const user = await knex("users").where({ email }).first();
  if (!user) {
    throw AppError.notFound("BE-02", "User not found");
  }

  // Compare password against stored hash
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw AppError.unauthorized("BE-04", "Invalid password");
  }

  return getTokenData(user.id, app);
}

/**
 * Return basic profile info for the authenticated user.
 */
export async function meHelper(app: FastifyInstance, req: FastifyRequest) {
  const { id } = req.user;
  const knex = app.knex;

  // Fetch user by id from JWT
  const user = await knex("users").where({ id }).first();
  app.log.info("me log", user);
  if (!user) {
    throw AppError.notFound("BE-02", "User not found");
  }

  return { name: user.name, email: user.email, avatar_url: user.avatar_url };
}

/**
 * FE assertion (JWS) -> verifies using FE public key -> returns BE JWTs.
 */
export async function exchangeTokenHelper(
  app: FastifyInstance,
  req: FastifyRequest
) {
  const { assertion, provider } = req.body as z.infer<typeof AuthExchangeBody>;
  const knex = app.knex;

  // Import the FE SPKI public key for ES256 JWS verification
  async function importFePublicKey() {
    const pem = app.config.FE_JWS_PUBLIC_PEM!;
    return jose.importSPKI(pem, "ES256");
  }

  const pub = await importFePublicKey();
  const { payload } = await jose.jwtVerify(assertion, pub, {
    issuer: app.config.FE_JWS_ISS,
    audience: app.config.FE_JWS_AUD,
  });

  console.log(payload);

  try {

    // Two cases: user already exists (by email) or needs to be created

    const user = await knex("users")
      .where({ email: payload.email })
      .select({
        id: "id",
        name: "name",
        email: "email",
        avatar_url: "avatar_url",
      })
      .first();

    // Enrich existing user if name/avatar are empty

    if (!isEmpty(user) && (isEmpty(user.avatar_url) || isEmpty(user.name))) {
      await knex.transaction(async (trx) => {
        await trx("users").where({ id: user.id }).update({
          avatar_url: payload.avatar_url,
          name: payload.name,
        });
      });
    }

    if (!isEmpty(user)) {
      return getTokenData(user.id, app);
    }

    // New user path
    return await knex.transaction(async (trx) => {
      const insertedData = await trx("users").insert(
        {
          email: payload.email,
          name: payload.name,
          avatar_url: payload.avatar_url,
        },
        ["id"]
      );

      const { id } = insertedData[0];
      return getTokenData(id, app);
    });
  } catch (error) {
    throw AppError.internal("BE-01", "Issue while saving the user");
  }
}

/**
 * Exchange a valid refresh token for a fresh access/refresh token pair.
 */
export async function getRefreshToken(
  app: FastifyInstance,
  req: FastifyRequest
) {
  const { refreshToken } = req.body as z.infer<typeof RefreshTokenBody>;

  // Basic expiration check by decoding the JWT locally
  const isTokenExpired = (token:string) =>{
    if(!token) return true;
    try {

        const decodedToken = app.jwt.decode(token);
        const currentTIme = Date.now()/1000;

        if(decodedToken && typeof decodedToken !== 'string' && 'exp' in decodedToken){
            return (decodedToken as { exp: number }).exp < currentTIme;
        }

        return true

    }catch(error){
        app.log.info('error in decoding token'+error)
        return true
    }
  }

  if(!isTokenExpired(refreshToken)){

    const {id} = app.jwt.decode(refreshToken) as {id:string};
    return getTokenData(id,app);

  }
  

    throw AppError.unauthorized('BE-03','your refresh token expired') ;
}
