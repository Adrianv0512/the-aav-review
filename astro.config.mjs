import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://adrianv0512.github.io",
  base: "/the-aav-review",
  trailingSlash: "always",
  output: "static",
  integrations: [sitemap()],
  markdown: { shikiConfig: { theme: "github-light" } },
});
