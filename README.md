# Adrian’s Notebook

A lightweight, static editorial blog built with Astro, TypeScript, Markdown, and plain CSS. Restrained editorial topic icons, self-hosted Space Grotesk and Literata fonts, no analytics, no database, and no browser JavaScript required for navigation or reading.

## Run locally

Use Node.js **22.12 or newer** (Node 24 LTS recommended).

```sh
npm install
npm run dev
```

Open the URL printed by Astro, including `/aav_blog_site/`.

```sh
npm run check    # Type-check Astro and TypeScript
npm run build    # Type-check and create dist/
npm run preview  # Serve the production build locally
```

## Write an article

Copy `templates/article.md` to `src/content/blog/your-short-title.md`. The filename becomes `/aav_blog_site/writing/your-short-title/`. Use lowercase letters and hyphens for filenames.

```yaml
---
title: "Your article title"
description: "One sentence describing the article."
publishedDate: 2026-09-20
tags:
  - Politics
  - Media
draft: false
accent: blue
---
```

Required: `title`, `description`, `publishedDate`, `tags` (at least one), `draft`.

Optional: `updatedDate`, `author`, `featured`, `accent` (`blue`, `yellow`, `red`, `green`), `illustration`, `canonicalURL`, `socialImage`, and `demo`.

Dates use `YYYY-MM-DD` and are displayed in UTC to avoid calendar-day shifts. Posts sort newest first. Reading time is calculated at 220 words per minute. Topic pages, RSS, sitemap, and related posts update automatically. `featured` is stored for future curation; the home page currently displays the newest three posts.

**Drafts are hidden in development and production**, including their article URLs and tag pages. To preview a draft locally, temporarily change `draft` to `false`, then restore it before pushing. Future dates do not schedule publication; use `draft: true` until ready.

Write ordinary Markdown: headings, lists, links, images, blockquotes, tables, fenced code blocks, and footnotes all work. For images in article Markdown, use relative imports from the Markdown file or the full project-prefixed public path, such as `/aav_blog_site/images/example.jpg`. Add descriptive alt text to meaningful images. Metadata illustration paths omit the project prefix; the site adds it automatically.

Use direct links to primary sources where possible. Separate factual claims from interpretation, identify uncertainty, and use `updatedDate` for material corrections.

## Replace the demo content

Three published sample entries have `demo: true`, producing a visible sample label and article notice. Delete or replace these entries before your public launch. Keep `draft-example.md` as a hidden authoring example or delete it. The About page identifies Adrian as a student and explains the publication’s editorial approach; edit it in `src/pages/about.astro`. For original writing, omit `demo` or set it to `false`.

## Publish with GitHub Pages

The site is configured for **https://adrianv0512.github.io/aav_blog_site/**.

1. In the repository’s **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
2. Commit and push to `main`:

```sh
git add .
git commit -m "Add article"
git push -u origin main
```

3. Open the repository’s **Actions** tab. The **Deploy to GitHub Pages** workflow checks types, builds, uploads, and deploys the site. A failed build does not publish.

The workflow uses the current [official Astro Pages deployment approach](https://docs.astro.build/en/guides/deploy/github/). The initial empty repository needs its first commit before the workflow can run. GitHub authentication with repository write access is needed to push; use your normal Git credential manager or SSH setup. Never store access tokens in this repository.

## Site settings

| Change                                 | File                                                   |
| -------------------------------------- | ------------------------------------------------------ |
| Name, author, description, GitHub link | `src/settings.ts`                                      |
| Homepage copy and wordmark             | `src/pages/index.astro`, `src/components/Header.astro` |
| Biography                              | `src/pages/about.astro`                                |
| Colors, fonts, widths                  | `src/styles/tokens.css`                                |
| Shared styles                          | `src/styles/global.css`                                |
| Reading layout                         | `src/styles/article.css`                               |
| Hostname and repository prefix         | `astro.config.mjs`                                     |
| Content schema                         | `src/content.config.ts`                                |

Subject icons live in `src/components/TopicIcon.astro` and are decorative. The homepage uses a lead article and recent commentary; the archive uses typography-led article listings. Optional article illustrations can still be added through the `illustration` field, using your own public assets. Social preview images are optional: set `socialImage` to an absolute URL or a local public path to a PNG/JPEG and the SEO component will generate its metadata.

## Custom domain later

Follow GitHub’s domain verification and DNS instructions. Change `site` in `astro.config.mjs` to your HTTPS domain, change `base` to `/`, and add `public/CNAME` containing the domain. All component links and metadata use the shared base-path helper. Update any manually written absolute public paths in Markdown. No domain is configured or purchased by this project.

## Project map

- `src/content/blog/`: Markdown articles
- `src/components/`: navigation, cards, tags, illustrations, metadata
- `src/layouts/`: shared page and reading layouts
- `src/pages/`: homepage, archive, articles, topics, About, 404, RSS, robots
- `src/utils/`: content queries, dates, reading time, URLs
- `.github/workflows/deploy.yml`: automatic deployment

RSS lives at `/aav_blog_site/rss.xml`; the sitemap index is `/aav_blog_site/sitemap-index.xml`. The project-level robots file is generated for custom-domain readiness; on a GitHub project site, crawlers use the account host’s root robots file.

## Privacy and future work

No cookies, tracking, forms, accounts, comments, or third-party font requests. If analytics become useful, start with repository traffic insights or evaluate privacy-friendly services such as Plausible or Umami. Nothing is installed by default. MDX, search, series, and interactive explainers can be added later without replacing the Markdown collection.
