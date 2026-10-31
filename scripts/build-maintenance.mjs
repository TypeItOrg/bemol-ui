import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/postcss";

const require = createRequire(import.meta.url);
const postcss = createRequire(require.resolve("@tailwindcss/postcss"))("postcss");
const root = resolve(import.meta.dirname, "..");
const stylesheetPath = resolve(root, "src/app/globals.css");
const templatePath = resolve(root, "src/common/templates/maintenance.html");
const stylesheet = postcss.parse(await readFile(stylesheetPath, "utf8"));

stylesheet.walkAtRules("import", (rule) => {
  if (rule.params === '"tailwindcss"') {
    rule.params = '"tailwindcss" source(none)';
  }
});
stylesheet.append(postcss.atRule({ name: "source", params: '"../common/templates/maintenance.html"' }));

const { css } = await postcss([tailwindcss({ optimize: { minify: true } })]).process(stylesheet.toString(), {
  from: stylesheetPath,
});
const font = await readFile(resolve(root, "public/brand/manrope-latin.woff2"));
const favicon = await readFile(resolve(root, "public/brand/favicon.svg"));
const darkFavicon = await readFile(resolve(root, "public/brand/favicon-dark.svg"));
const originalLogo = (await readFile(resolve(root, "public/brand/logo-dark.svg"), "utf8"))
  .replace(/<\?xml[^>]*\?>\s*/, "")
  .replace(/<title\b[^>]*>[\s\S]*?<\/title>\s*/, "")
  .replace('role="img" aria-labelledby="logo-title"', 'aria-hidden="true" focusable="false"');
const pickPath = originalLogo.match(/<path\b[^>]*\bid="pua"[^>]*>/)?.[0];
const contour = pickPath?.match(/\bd="([^"]+)"/)?.[1];

if (!contour) {
  throw new Error("The Bemol logo must contain its pua contour for the loading animation");
}

const logo = originalLogo.replace(
  "</svg>",
  `<path class="maintenance-contour" d="${contour}" pathLength="100" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-dasharray="18 82" transform="translate(627 627) scale(1.08) translate(-627 -627)" /></svg>`,
);
const html = (await readFile(templatePath, "utf8"))
  .replace("__TAILWIND_STYLES__", css)
  .replace("__MANROPE_FONT__", font.toString("base64"))
  .replace("__BEMOL_FAVICON__", favicon.toString("base64"))
  .replace("__BEMOL_DARK_FAVICON__", darkFavicon.toString("base64"))
  .replace("__BEMOL_LOGO__", logo);

await writeFile(resolve(root, "public/maintenance.html"), html);
