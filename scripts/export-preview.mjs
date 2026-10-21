import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const output = resolve(process.argv[2] || "dist/preview.html");
let html = await readFile("dist/index.html", "utf8");
const script = html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/);
const style = html.match(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/);
if (!script || !style)
  throw new Error("Run npm run build before exporting a preview.");
const js = (
  await readFile(resolve("dist", script[1].replace(/^\//, "")), "utf8")
).replace(/<\/script/gi, "<\\/script");
const css = (
  await readFile(resolve("dist", style[1].replace(/^\//, "")), "utf8")
).replace(/@import\s*(?:url\([^)]*\)|"[^"]*"|'[^']*')\s*;/g, "");
html = html
  .replace(script[0], () => `<script type="module">${js}</script>`)
  .replace(style[0], () => `<style>${css}</style>`);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`Saved standalone preview: ${output}`);
