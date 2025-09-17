import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

type PrefillMeta = { title?: string; description?: string };

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isTwitter(u: URL) {
  return /(^|\.)twitter\.com$/i.test(u.hostname) || /(^|\.)x\.com$/i.test(u.hostname);
}

function isYouTube(u: URL) {
  return /(^|\.)youtube\.com$/i.test(u.hostname) || /(^|\.)youtu\.be$/i.test(u.hostname);
}

function stripHtmlToText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchTwitterOEmbed(url: string): Promise<PrefillMeta | null> {
  try {
    const res = await fetch(
      `https://publish.twitter.com/oembed?omit_script=1&hide_thread=1&dnt=1&url=${encodeURIComponent(url)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const text = typeof data.html === "string" ? stripHtmlToText(data.html) : undefined;
    const author = typeof data.author_name === "string" ? data.author_name : undefined;
    return {
      title: text ? (text.length > 100 ? text.slice(0, 100) + "…" : text) : author ? `Tweet by ${author}` : undefined,
      description: text,
    };
  } catch {
    return null;
  }
}

async function fetchYouTubeOEmbed(url: string): Promise<PrefillMeta | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const title: string | undefined = data?.title;
    const author: string | undefined = data?.author_name;
    return {
      title: title,
      description: author ? `by ${author}` : undefined,
    };
  } catch {
    return null;
  }
}

async function fetchNoEmbed(url: string): Promise<PrefillMeta | null> {
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data: any = await res.json();
    const html: string | undefined = data?.html;
    const title: string | undefined = data?.title;
    const author: string | undefined = data?.author_name;
    const text = html ? stripHtmlToText(html) : undefined;
    return {
      title: title || (text ? (text.length > 100 ? text.slice(0, 100) + "…" : text) : undefined),
      description: text || author,
    };
  } catch {
    return null;
  }
}

function findMetaContent(html: string, attr: "property" | "name", key: string): string | undefined {
  const re = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
  const m = html.match(re);
  return m?.[1];
}

async function fetchOpenGraph(url: string): Promise<PrefillMeta | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const html = await res.text();
    const ogTitle = findMetaContent(html, "property", "og:title") || findMetaContent(html, "name", "twitter:title");
    const ogDesc =
      findMetaContent(html, "property", "og:description") ||
      findMetaContent(html, "name", "description") ||
      findMetaContent(html, "name", "twitter:description");
    let title = ogTitle;
    if (!title) {
      const mt = html.match(/<title>([^<]+)<\/title>/i);
      title = mt?.[1]?.trim();
    }
    const description = ogDesc?.trim();
    if (!title && !description) return null;
    return { title, description };
  } catch {
    return null;
  }
}

const PrefillQuery = z.object({ url: z.string().url() });
const PrefillResp = z.object({ title: z.string().optional(), description: z.string().optional() });

/**
 * Prefill metadata for a URL (Twitter/YouTube/noembed/OG). Public, rate-limited by global settings.
 */
const plugin: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/prefill",
    {
      schema: {
        querystring: PrefillQuery,
        response: { 200: PrefillResp },
      },
    },
    async (req) => {
      const { url } = req.query as z.infer<typeof PrefillQuery>;
      const u = new URL(url);

      if (isTwitter(u)) {
        const tw = await fetchTwitterOEmbed(url);
        if (tw) return tw;
      }
      if (isYouTube(u)) {
        const yt = await fetchYouTubeOEmbed(url);
        if (yt) return yt;
      }
      const ne = await fetchNoEmbed(url);
      if (ne) return ne;
      const og = await fetchOpenGraph(url);
      return og || {};
    }
  );
};

export default plugin;

