import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { moduleAPI } from "./catalogue-api.mjs";
import { propertiesFor } from "../site/catalogue-properties.mjs";

const project = "examples/catalogue";
const output = "dist";
execFileSync("gleam", ["build"], { cwd: project, stdio: "inherit" });
const publicAPI = JSON.parse(
  execFileSync("gleam", ["export", "package-interface"], { encoding: "utf8" }),
);

const examples = new Map();
const entryPoints = {
  catalogue: "site/catalogue.mjs",
  preview: "site/preview.mjs",
};
const sources = new Map();
for (const file of (await readdir(`${project}/src/catalogue`)).sort()) {
  if (!file.endsWith(".gleam")) continue;
  const family = file.slice(0, -6);
  const source = await readFile(`${project}/src/catalogue/${file}`, "utf8");
  sources.set(file, source);
  if (family === "common") continue;
  for (const match of source.matchAll(/^pub fn (\w+)\(/gm)) {
    if (match[1] === "start") continue;
    const id = match[1].replace(/_example$/, "").replaceAll("_", "");
    assert.ok(!examples.has(id), `Duplicate example: ${id}`);
    const end = source.indexOf("\n}", match.index) + 2;
    assert.ok(end > match.index, `Unclosed example: ${id}`);
    examples.set(id, { family, snippet: source.slice(match.index, end) });
  }
}

const entries = [];
let group;
let section;
const ledger = await readFile("COMPONENTS.md", "utf8");
for (const line of ledger.split("\n")) {
  const category = /^## (.+)$/.exec(line);
  if (category) section = group = category[1];
  const heading = /^### (.+) \(\d+\)$/.exec(line);
  if (heading) group = heading[1];
  const row =
    /^\| \[([^\]]+)\]\(([^)]+)\)\s*\| (Base|Platform)\s*\| (.+?)\s*\|$/.exec(
      line,
    );
  if (!row) continue;
  const [, name, , status, coverage] = row;
  const id =
    name === "OrgChart"
      ? "organizationchart"
      : name.toLowerCase().replaceAll(" ", "");
  const module = /`(meridian_ui\/[^`]+)`/.exec(coverage)?.[1];
  entries.push({
    id,
    name,
    group,
    section,
    status,
    module,
    description: coverage.replace(/^`[^`]+`, /, "").replaceAll("`", ""),
  });
}
assert.equal(entries.filter((entry) => entry.section === "Core").length, 96);
assert.equal(entries.filter((entry) => entry.group === "Advanced").length, 4);
assert.equal(
  entries.filter((entry) => entry.section === "Additional controls").length,
  2,
);
assert.equal(
  entries.filter((entry) => entry.section === "Utilities").length,
  2,
);
assert.equal(
  examples.size,
  entries.length,
  "Every example needs a catalogue entry",
);
assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
for (const entry of entries) {
  assert.ok(examples.has(entry.id), `Missing example: ${entry.name}`);
  Object.assign(entry, examples.get(entry.id));
  Object.assign(entry, propertiesFor(entry.id));
  if (entry.module)
    entry.api = moduleAPI(
      await readFile(`src/${entry.module}.gleam`, "utf8"),
      publicAPI.modules[entry.module],
    );
}

await rm(output, { recursive: true, force: true });
await mkdir(`${output}/source`, { recursive: true });
await cp("site", output, {
  recursive: true,
  filter: (path) => !path.endsWith(".mjs"),
});
await cp("priv/meridian-ui.css", `${output}/meridian-ui.css`);
await cp("priv/fonts", `${output}/fonts`, { recursive: true });
await writeFile(`${output}/catalogue.json`, JSON.stringify(entries));
for (const [file, source] of sources)
  await writeFile(`${output}/source/${file}`, source);
await writeFile(`${output}/.nojekyll`, "");
const result = await build({
  entryPoints,
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  loader: { ".gleam": "text" },
  minify: true,
  metafile: true,
  legalComments: "eof",
  outdir: `${output}/assets`,
  entryNames: "[dir]/[name]-[hash]",
  chunkNames: "chunks/[name]-[hash]",
});
await build({
  entryPoints: ["site/catalogue.css"],
  bundle: true,
  outfile: `${output}/catalogue.css`,
});
const styles = new Map(
  await Promise.all(
    ["meridian-ui.css", "catalogue.css", "preview.css"].map(async (file) => [
      file,
      createHash("sha256")
        .update(await readFile(`${output}/${file}`))
        .digest("hex")
        .slice(0, 12),
    ]),
  ),
);
const version = createHash("sha256")
  .update(Object.keys(result.metafile.outputs).sort().join("\n"))
  .update([...styles.values()].join("\n"))
  .digest("hex")
  .slice(0, 12);
for (const [name, entryPoint] of Object.entries(entryPoints)) {
  const script = Object.entries(result.metafile.outputs).find(
    ([, asset]) => asset.entryPoint === entryPoint,
  )?.[0];
  assert.ok(script, `Missing script: ${name}`);
  const pending = [script];
  const visited = new Set();
  let bytes = 0;
  while (pending.length) {
    const path = pending.pop();
    if (visited.has(path)) continue;
    visited.add(path);
    const asset = result.metafile.outputs[path];
    assert.ok(asset, `Missing static dependency: ${path}`);
    assert.ok(
      !Object.keys(asset.inputs).some((input) =>
        /\/internal\/vendor\/(?:charts|calendar|editor|mask)\.mjs$/.test(input),
      ),
      `${name} must not eagerly load an advanced engine`,
    );
    bytes += gzipSync(await readFile(path)).length;
    pending.push(
      ...asset.imports
        .filter((item) => !item.external && item.kind !== "dynamic-import")
        .map((item) => item.path),
    );
  }
  assert.ok(
    bytes < (name === "catalogue" ? 90_000 : 40_000),
    `${name} static gzip budget exceeded: ${bytes}`,
  );
  console.log(
    `${name}: ${visited.size} static modules, ${bytes} bytes gzip, advanced engines lazy`,
  );
  const page = `${output}/${name === "catalogue" ? "index" : "preview"}.html`;
  let html = await readFile(page, "utf8");
  for (const [file, hash] of styles)
    html = html.replaceAll(`href="./${file}"`, `href="./${file}?v=${hash}"`);
  await writeFile(
    page,
    html
      .replace(`./assets/${name}.js`, script.replace(`${output}/`, "./"))
      .replace('data-preview-version=""', `data-preview-version="${version}"`),
  );
}

let notices = await readFile(
  "src/meridian_ui/internal/vendor/LICENCES.md",
  "utf8",
);
notices += `\n\n# Manrope\n\n${await readFile("priv/fonts/OFL.txt", "utf8")}`;
notices += `\n\n${await readFile("priv/ICON-NOTICES.md", "utf8")}`;
for (const item of await readdir(`${project}/build/packages`, {
  withFileTypes: true,
})) {
  if (!item.isDirectory()) continue;
  const name = item.name;
  const directory = `${project}/build/packages/${name}`;
  for (const file of await readdir(directory)) {
    if (/^licen[cs]e(?:\.|$)/i.test(file))
      notices += `\n\n# ${name}\n\n${await readFile(`${directory}/${file}`, "utf8")}`;
  }
}
await writeFile(`${output}/licences.txt`, notices);
console.log(`Built ${entries.length} live examples in ${output}/`);
