import { defineConfig } from "astro/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(root, "src/content/blog");

function blogSlugs() {
  if (!fs.existsSync(blogDir)) return [];
  return fs
    .readdirSync(blogDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/i, ""));
}

function htmlRedirect(to) {
  return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0;url=${to}" />
    <link rel="canonical" href="${to}" />
    <title>Redirecting…</title>
  </head>
  <body>
    <a href="${to}">Continue</a>
  </body>
</html>
`;
}

function legacyBlogHtmlRedirects() {
  return {
    name: "legacy-blog-html-redirects",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const outDir = fileURLToPath(dir);
        const postDir = path.join(outDir, "blog", "p");
        fs.mkdirSync(postDir, { recursive: true });
        for (const slug of blogSlugs()) {
          const filePath = path.join(postDir, `${slug}.html`);
          const dirPath = filePath;
          if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            fs.rmSync(dirPath, { recursive: true, force: true });
          }
          fs.writeFileSync(filePath, htmlRedirect(`/blog/p/${slug}/`), "utf8");
        }
      },
    },
  };
}

export default defineConfig({
  site: "https://www.hina-chi.jp",
  trailingSlash: "always",
  integrations: [legacyBlogHtmlRedirects()],
});
