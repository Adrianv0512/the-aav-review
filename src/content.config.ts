import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().optional(),
    tags: z.array(z.string().trim().min(1)).min(1),
    draft: z.boolean(),
    featured: z.boolean().default(false),
    demo: z.boolean().default(false),
    accent: z.enum(["blue", "yellow", "red", "green"]).default("blue"),
    illustration: z.string().optional(),
    canonicalURL: z.url().optional(),
    socialImage: z.string().optional(),
  }),
});
export const collections = { blog };
