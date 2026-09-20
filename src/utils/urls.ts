export function url(path = ""): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
export function tagSlug(tag: string): string {
  return encodeURIComponent(tag.trim().toLowerCase().replace(/\s+/g, "-"));
}
