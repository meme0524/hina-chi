import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tags: z.array(z.string()).default([]),
    desc: z.string(),
  }),
});

export const collections = { blog };
