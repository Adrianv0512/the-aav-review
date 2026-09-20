import { getCollection, type CollectionEntry } from "astro:content";
export type Post = CollectionEntry<"blog">;

export async function getPosts(): Promise<Post[]> {
  return (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) =>
      b.data.publishedDate.getTime() - a.data.publishedDate.getTime() ||
      a.id.localeCompare(b.id),
  );
}
export function readingTime(body = ""): string {
  const text = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "");
  return `${Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 220))} min read`;
}
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
export function allTags(posts: Post[]): string[] {
  return [...new Set(posts.flatMap((post) => post.data.tags))].sort();
}
