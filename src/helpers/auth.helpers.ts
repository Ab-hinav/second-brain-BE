import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import user, { AuthExchangeBody, SignInBody, SignUpBody } from "../routes/user";
import z from "zod";
import * as jose from "jose";

import { AppError } from "../util/appError";
import { isEmpty } from "./commons";

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

export async function signUpHelper(
  app: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { name, email, password } = req.body as z.infer<typeof SignUpBody>;
  const knex = app.knex;
  const bcrypt = app.bcrypt;

  const existing = await knex("users").where({ email }).first();
  if (existing) {
    throw AppError.conflict("BE-03", "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password);
  app.log.info(hashedPassword);

  await knex.transaction(async (trx) => {
    const createUser = await trx("users")
      .insert({ name, email, password: hashedPassword })
      .returning("*");
    app.log.info(createUser, "User created successfully");
    return reply.code(201).send({ message: "User created successfully" });
  });

  throw AppError.internal("BE-01", "Something went wrong");
}

export async function signInHelper(app: FastifyInstance, req: FastifyRequest) {
  const { email, password } = req.body as z.infer<typeof SignInBody>;
  const knex = app.knex;
  const bcrypt = app.bcrypt;

  const user = await knex("users").where({ email }).first();
  if (!user) {
    throw AppError.notFound("BE-02", "User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw AppError.unauthorized("BE-04", "Invalid password");
  }

  return getTokenData(user.id, app);
}

export async function meHelper(app: FastifyInstance, req: FastifyRequest) {
  // @ts-ignore
  const { id } = req.user;
  const knex = app.knex;

  const user = await knex("users").where({ id }).first();
  app.log.info("me log", user);
  if (!user) {
    throw AppError.notFound("BE-02", "User not found");
  }

  return { name: user.name, email: user.email, avatar_url: user.avatar_url };
}

export async function exchangeTokenHelper(
  app: FastifyInstance,
  req: FastifyRequest
) {
  const { assertion, provider } = req.body as z.infer<typeof AuthExchangeBody>;
  const knex = app.knex;

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
    let currentUser;

    // user has same email, aldready
    // user has new email

    const user = await knex("users")
      .where({ email: payload.email })
      .select({
        id: "id",
        name: "name",
        email: "email",
        avatar_url: "avatar_url",
      })
      .first();

    // data enrich if needed

    if (!isEmpty(user) && (isEmpty(user.avatar_url) || isEmpty(user.name))) {
      knex.transaction(async (trx) => {
        await trx("users").where({ id: user.id }).update({
          avatar_url: payload.avatar_url,
          name: payload.name,
        });
      });
    }

    if (!isEmpty(user)) {
      return getTokenData(user.id, app);
    }

    knex.transaction(async (trx) => {
      const insertedData = await trx("users").insert(
        {
          email: payload.email,
          name: payload.name,
          avatar_url: payload.avatar_url,
        },
        ["id"]
      );

      console.log(insertedData);

      currentUser = insertedData[0];

      return getTokenData(currentUser.id, app);
    });
  } catch (error) {
    throw AppError.internal("BE-01", "Issue while saving the user");
  }
}
