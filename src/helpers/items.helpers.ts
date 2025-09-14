import { FastifyInstance, FastifyRequest } from "fastify";
import { AppError } from "../util/appError";
import { CreateItemBody } from "../routes/item";
import z from "zod";


/**
 * Simple random color picker to assign a color to newly created tags.
 */
function getRandomColorName(){

    const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'gray', 'black', 'white'];
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];

}

// Build Twitter/X oEmbed endpoint URL (omit script for embeddable HTML only)
const getoEmbedUrl = (url:string) => `https://publish.twitter.com/oembed?url=${url}&omit_script=1&hide_thread=1`

type oEmbedUrlResp = {
    url:string,
    author_name:string,
    author_url:string,
    html:string,
    width:number,
    height:number,
    type:string,
    cache_age:string,
    provider_name:string,
    provider_url:string,
    version:string
}

/**
 * Fetch oEmbed metadata for a Twitter/X URL (best-effort; returns null on failure).
 */
async function getXMetadata(url:string|undefined|null):Promise<oEmbedUrlResp | null>{

    if(!url){
        return null;
    }


    try{

        const response = await fetch(getoEmbedUrl(url), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        return data as oEmbedUrlResp;

    }catch(error){
        console.log('error occurred while fetching metadata')
        return null;
    }


}




/**
 * Create a tweet item, upsert tags per brain, and link item <-> tags within a transaction.
 */
export async function createTweetItemHelper(
  app: FastifyInstance,
  req: FastifyRequest
) {

    const knex = app.knex;
    const trx = await knex.transaction();

  try {
    console.log('got request', req.body)
    
  // @ts-ignore
  const { id } = req.user;
  const { title,content,tags,url,brainId,pinned } = req.body as z.infer<typeof CreateItemBody>;

  // Try to fetch oEmbed metadata for the tweet URL if present
  const metadata = await getXMetadata(url);

  console.log('got metadata',metadata);


    // Create the item row
    const itemId = await trx.table('items').insert({
        title,
        content,
        content_type: 'tweet',
        url,
        brain_id:brainId,
        is_pinned:pinned,
        metadata,
        created_by:id
    }).returning('id')

    const currItemId = itemId[0].id;

    console.log('got item id', currItemId)

    // From the provided tags remove duplicates, then upsert for this brain
    const uniqueTags = [...new Set(tags)];
    // Upsert tags by composite key (brain_id, name) so tag names can repeat across brains
    const tagIds = await trx
      .table('tags')
      .insert(
        uniqueTags.map((tag) => ({ name: tag, brain_id: brainId, color: getRandomColorName() }))
      )
      .onConflict(['brain_id', 'name'])
      .merge()
      .returning('id');

    console.log('got tag ids', tagIds)
    // Create item_tag link rows
    const tagIdsToInsert = tagIds.map(tag => ({item_id:currItemId, tag_id:tag.id}));
    await trx.table('item_tags').insert(tagIdsToInsert);

    await trx.commit();

    return {
        id:currItemId
    }

  } catch (err) {
    console.log(err);

    await trx.rollback();

    throw AppError.internal("BE-Internal", "Something Went Wrong");
  }
}
