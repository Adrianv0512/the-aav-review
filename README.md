# The Ascent Report

A lightweight, static editorial blog built with Astro, TypeScript, Markdown, and plain CSS. Restrained editorial topic icons, self-hosted Space Grotesk and Literata fonts, no analytics, no database, and no browser JavaScript required for navigation or reading.

## Run locally

Use Node.js **22.12 or newer** (Node 24 LTS recommended).

```sh
npm install
npm run dev
```

Open the URL printed by Astro, including `/the-aav-review/`.

```sh
npm run check    # Type-check Astro and TypeScript
npm run build    # Type-check and create dist/
npm run preview  # Serve the production build locally
```

## Write an article

Copy `templates/article.md` to `src/content/blog/your-short-title.md`. The filename becomes `/the-aav-review/writing/your-short-title/`. Use lowercase letters and hyphens for filenames.

```yaml
---
title: "Your article title"
description: "One sentence describing the article."
publishedDate: 2026-09-20
category: Politics
tags:
  - Politics
  - Media
draft: false
featured: false
accent: blue
---
```

Required: `title`, `description`, `publishedDate`, `category`, `tags` (at least one), and `draft`.

Optional: `updatedDate`, `author`, `featured`, `readingTimeOverride`, `accent` (`blue`, `yellow`, `red`, `green`), `illustration`, `canonicalURL`, `socialImage`, and `demo`.

Dates use `YYYY-MM-DD` and are displayed in UTC to avoid calendar-day shifts. Posts sort newest first. Topic pages, RSS, sitemap, and related posts update automatically.

`category` is the primary section shown with the article's card icon. `tags` drive the subject archive pages and may contain several values. Reading time is calculated automatically from the Markdown body at 220 words per minute; set `readingTimeOverride` to a positive whole number only when an editorial override is needed. The newest article marked `featured: true` becomes the lead story. If no article is featured, the newest published article leads.

**Drafts are hidden in development and production**, including their article URLs and tag pages. To preview a draft locally, temporarily change `draft` to `false`, then restore it before pushing. Future dates do not schedule publication; use `draft: true` until ready.

Write ordinary Markdown: headings, lists, links, images, blockquotes, tables, fenced code blocks, and footnotes all work. For images in article Markdown, use relative imports from the Markdown file or the full project-prefixed public path, such as `/the-aav-review/images/example.jpg`. Add descriptive alt text to meaningful images. Metadata illustration paths omit the project prefix; the site adds it automatically.

Use direct links to primary sources where possible. Separate factual claims from interpretation, identify uncertainty, and use `updatedDate` for material corrections.

## Publishing Articles

The browser editor is available at **https://adrianv0512.github.io/the-aav-review/admin/** after the OAuth setup below has been completed and these repository changes have been deployed.

### Recommended: browser editor

1. Open the admin URL and choose **Login with GitHub**.
2. Select **Articles**, then **New Article** (or open an existing article).
3. Enter the title, description, primary section, tags, publication date, and body.
4. Leave **Draft** on while the article is unfinished. Turn it off when the article should become public.
5. Optionally mark the article **Featured** or provide a reading-time override.
6. Save. Decap commits the Markdown file directly to `main`.
7. Check the repository's **Actions** tab. The public site updates only after the GitHub Pages workflow succeeds, normally within a few minutes.

The CMS uses Decap CMS 3.15.1, pinned in `public/admin/index.html`. Its collection edits the same files in `src/content/blog`; there is no database or proprietary content format. Open Authoring is not enabled. GitHub ultimately permits writes only for accounts that can push to this repository. If another collaborator has write access, that collaborator can technically authenticate through the CMS too.

### Drafts and publishing

Decap's Save/Publish action creates a Git commit, but public visibility is controlled by the article's `draft` field. New articles default to `draft: true`. Draft articles are excluded by the shared content query from the home page, archive, article routes, tag pages, related articles, RSS, and the generated sitemap. Turn **Draft** off and save to publish on the next successful Pages deployment. Future dates are not scheduled publication.

### Taxonomy and editor fields

The CMS configuration is `public/admin/config.yml`.

- Edit the **Primary section** options to change the broad category list. The content schema in `src/content.config.ts` must be updated to the same allowed values.
- Edit the **Tags** options to expand or revise the controlled tag list.
- Article cards currently use the publication-wide editorial label **Opinion**. It is not article metadata, so the CMS does not present a misleading article-type field.
- Accent color and the existing optional author, illustration, canonical URL, social-image, updated-date, and demo fields remain editable so updating an existing article does not discard its metadata.

Uploaded media is committed under `public/images/uploads/`. Markdown receives the GitHub Pages-safe public prefix `/the-aav-review/images/uploads/`. Optional `illustration` and `socialImage` metadata fields use paths without the project prefix because the site's URL helper adds it.

### Local CMS testing

Run the site and Decap's local proxy in separate terminals:

```sh
npm run dev
npx decap-server
```

Open the local Astro URL ending in `/the-aav-review/admin/index.html`. (Astro's development server does not add the directory-index redirect that GitHub Pages provides in production.) `local_backend: true` activates only for the local proxy; production continues to use the GitHub backend. Local CMS saves modify the working tree, so review changes before committing. Decap's local backend does not support Editorial Workflow; this project uses the simpler direct-save workflow anyway.

### Authentication architecture and one-time setup

Authentication follows this path:

```text
Decap CMS → Cloudflare OAuth Worker → GitHub OAuth → GitHub repository
```

`oauth-worker/` is a deployable Cloudflare Worker based on the Worker template linked by Decap's current documentation. It adds a short-lived, secure, HTTP-only OAuth state cookie, validates that state on callback, validates Decap's site identifier, limits the GitHub scope to `public_repo`, and sends the resulting token only to the exact CMS origin. The OAuth client secret is never part of the Astro site or browser bundle.

One-time owner setup:

1. From `oauth-worker/`, run `npm install`, then `npx wrangler login` and approve Cloudflare access.
2. Run `npm run deploy`. The deployed Worker for this project is `https://the-aav-review-cms-auth.the-aav-review-cms-auth.workers.dev`. A new Cloudflare account must register its `workers.dev` subdomain once before that URL becomes reachable.
3. In GitHub **Settings → Developer settings → OAuth Apps**, create **The Ascent Report CMS**. Use the public site as its homepage and `<worker-url>/callback` as its exact authorization callback URL.
4. In `oauth-worker/`, store the app credentials with `npx wrangler secret put GITHUB_OAUTH_ID` and `npx wrangler secret put GITHUB_OAUTH_SECRET`, then deploy again. These values live only in Cloudflare's encrypted secret storage.
5. Confirm `backend.base_url` in `public/admin/config.yml` matches the Worker URL, commit, and push.
6. Visit the production admin URL and test login, creating/editing/deleting a temporary draft, and publishing only after its content is ready.

The repository is public, so the Worker requests GitHub's narrow `public_repo` scope. If the repository becomes private, change `GITHUB_REPO_PRIVATE` to `"1"` in `oauth-worker/wrangler.toml`; the Worker will then request the broader `repo` scope required by GitHub.

Preserve the GitHub OAuth App client secret and Cloudflare account access. Never add the secret, a GitHub token, or a Cloudflare token to this repository or to a local `.dev.vars` file that is not ignored. The project ignores `.env*`, `.dev.vars*`, and `.wrangler/` state.

If login fails, check the browser console, Cloudflare Worker logs, the exact OAuth callback URL, and the GitHub account's repository write permission. If an article commit succeeds but the site does not update, check the repository's GitHub Actions run for content-schema or Pages deployment errors.

### Manual fallback and recovery

The original workflow always remains available: create or edit an ordinary Markdown file in `src/content/blog`, run `npm run build`, commit, and push to `main`. If Decap or the OAuth Worker is unavailable, no content is lost or locked away; every article and its history remains in Git. Deleting through the CMS is also a normal Git commit and can be recovered from Git history.

## Replace the demo content

Three published sample entries have `demo: true`, producing a visible sample label and article notice. Delete or replace these entries before your public launch. Keep `draft-example.md` as a hidden authoring example or delete it. The About page identifies Adrian as a student and explains the publication’s editorial approach; edit it in `src/pages/about.astro`. For original writing, omit `demo` or set it to `false`.

## Publish with GitHub Pages

The site is configured for **https://adrianv0512.github.io/the-aav-review/**.

1. In the repository’s **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
2. Commit and push to `main`:

```sh
git add .
git commit -m "Add article"
git push -u origin main
```

3. Open the repository’s **Actions** tab. The **Deploy to GitHub Pages** workflow checks types, builds, uploads, and deploys the site. A failed build does not publish.

The workflow uses the current [official Astro Pages deployment approach](https://docs.astro.build/en/guides/deploy/github/). GitHub authentication with repository write access is needed to push; use your normal Git credential manager or SSH setup. Never store access tokens in this repository.

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
- `public/admin/`: static Decap CMS application and content model
- `oauth-worker/`: Cloudflare Worker for GitHub OAuth (deployed separately)
- `.github/workflows/deploy.yml`: automatic deployment

RSS lives at `/the-aav-review/rss.xml`; the sitemap index is `/the-aav-review/sitemap-index.xml`. The project-level robots file is generated for custom-domain readiness; on a GitHub project site, crawlers use the account host’s root robots file.

## Privacy and future work

No cookies, tracking, forms, accounts, comments, or third-party font requests. If analytics become useful, start with repository traffic insights or evaluate privacy-friendly services such as Plausible or Umami. Nothing is installed by default. MDX, search, series, and interactive explainers can be added later without replacing the Markdown collection.

## Publication branding

The publication name is The Ascent Report. The supplied mountain logo is stored unchanged at `public/brand/mountain-logo.jpg`; the header uses a clipped display of its surrounding white space. It also serves as the browser icon. The original AAV News banner is not used because it carries the previous name. The repository and GitHub Pages project path still use the legacy `the-aav-review` identifier so existing links, CMS authentication, and deployment settings remain stable.
