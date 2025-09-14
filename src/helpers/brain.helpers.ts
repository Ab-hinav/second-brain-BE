import { FastifyInstance, FastifyRequest } from "fastify";
import { AppError } from "../util/appError";
import { CreateBrainBody } from "../routes/brain";
import { z } from "zod";
import { isEmpty } from "./commons";
/**
 * Canonical content type values used across the app for items.
 */
export const CONTENT_TYPES = {
  LINK: "link",
  NOTE: "note",
  OTHER: "other",
  TWEET: "tweet",
  YOUTUBE: "youtube",
  VIDEO: "video",
};

/**
 * Build the brain navigation list with flags indicating which content types exist per brain.
 */
export async function getBrainHelper(
  app: FastifyInstance,
  req: FastifyRequest
) {
  const knex = app.knex;
  const { id } = req.user;

  try {
    // Aggregate distinct content types per brain the user owns
    const brainData = await knex
      .table("brains as b")
      .where("b.owner_id", id)
      .leftJoin("items as i", "i.brain_id", "b.id")
      .groupBy("b.id")
      .select({
        id: "b.id",
        name: "b.name",
        is_default: "b.is_default",
        content_types: knex.raw(
          `coalesce(string_agg(distinct i.content_type,','), '')`
        ),
      });

    // Convert aggregated content types to boolean flags for the UI
    const brainNav = brainData.map((r) => {
      const set = new Set(
        r.content_types
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      );

      return {
        id: r.id,
        name: r.name,
        is_default: r.is_default == true,
        [CONTENT_TYPES.TWEET]: set.has(CONTENT_TYPES.TWEET),
        [CONTENT_TYPES.YOUTUBE]: set.has(CONTENT_TYPES.YOUTUBE),
        [CONTENT_TYPES.LINK]: set.has(CONTENT_TYPES.LINK),
        [CONTENT_TYPES.NOTE]: set.has(CONTENT_TYPES.NOTE),
        [CONTENT_TYPES.OTHER]: set.has(CONTENT_TYPES.OTHER),
      };
    });

    return brainNav;
  } catch (error) {
    app.log.info("error in getting brain data" + error);
    throw AppError.internal("BE-01", "issue while getting brain data");
  }
}

/**
 * Return name/description from brains and item counts bucketed by content type.
 */
export async function getBrainDetailHelper(
  app: FastifyInstance,
  req: FastifyRequest
) {
  const knex = app.knex;
  const { id } = req.user;
  const { brainId } = req.params as { brainId: string };

  try {
    // Verify brain ownership and fetch its metadata
    const brain = await knex
      .table("brains")
      .where({ id: brainId, owner_id: id })
      .first<{ id: string; name: string; description: string | null }>([
        "id",
        "name",
        "description",
      ]);

    if (isEmpty(brain)) {
      throw AppError.notFound("BE-10", "Brain not found");
    }

    // Single pass counts across content types using Postgres FILTER
    const row = await knex
      .table("items as i")
      .where("i.brain_id", brainId)
      .first(
        knex.raw(
          `
          count(*)::int as total,
          count(*) filter (where i.content_type = ?)::int as tweets,
          count(*) filter (where i.content_type = ?)::int as videos,
          count(*) filter (where i.content_type = ?)::int as notes,
          count(*) filter (where i.content_type = ?)::int as links,
          count(*) filter (where i.content_type = ?)::int as other,
          count(*) filter (where i.content_type = ?)::int as youtube
        `,
          [
            CONTENT_TYPES.TWEET,
            CONTENT_TYPES.VIDEO,
            CONTENT_TYPES.NOTE,
            CONTENT_TYPES.LINK,
            CONTENT_TYPES.OTHER,
            CONTENT_TYPES.YOUTUBE,
          ]
        )
      );

    const counts = {
      total: row?.total ?? 0,
      tweets: row?.tweets ?? 0,
      videos: row?.videos ?? 0,
      notes: row?.notes ?? 0,
      links: row?.links ?? 0,
      other: row?.other ?? 0,
      youtube: row?.youtube ?? 0,
    } as Record<string, number> as {
      total: number;
      tweets: number;
      videos: number;
      notes: number;
      links: number;
      other: number;
      youtube: number;
    };

    return {
      id: String(brain.id),
      name: brain.name,
      description: brain.description ?? null,
      counts,
    };
  } catch (error) {
    app.log.info("error in getting brain detail" + error);
    throw AppError.internal("BE-02", "issue while getting brain detail");
  }
}

/**
 * Create a new brain for the authenticated user, ensuring name uniqueness.
 */
export async function createBrainHelper(
  app: FastifyInstance,
  req: FastifyRequest
) {
  const knex = app.knex;
  const { id } = req.user;
  const { name, description } = req.body as z.infer<typeof CreateBrainBody>;

  // Enforce brain name uniqueness (global). Adjust if it should be per-user.
  const exists = await knex.table("brains").where({ name, owner_id: id }).first();

  if (!isEmpty(exists)) {
    throw AppError.conflict("BE-09", "Brain name already taken");
  }

  try {
    const brain = await knex
      .table("brains")
      .insert({
        name,
        owner_id: id,
        description,
      })
      .returning("id");

    return {
      id: brain[0].id,
    };
  } catch (error) {
    app.log.info("error in creating brain" + error);
    throw AppError.internal("BE-01", "issue while creating brain");
  }
}
