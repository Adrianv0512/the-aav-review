import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts } from "../utils/posts";
import { settings } from "../settings";
import { url } from "../utils/urls";
export async function GET(context: APIContext) {
  return rss({
    title: settings.title,
    description: settings.description,
    site: new URL(url(), context.site!).href,
    items: (await getPosts()).map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedDate,
      link: url(`writing/${post.id}/`),
      categories: post.data.tags,
    })),
    customData: "<language>en-us</language>",
  });
}
