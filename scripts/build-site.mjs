import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const project = "examples/catalogue";
const output = "dist";
execFileSync("gleam", ["build"], { cwd: project, stdio: "inherit" });

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
  entryPoints[`examples/${family}`] =
    `${project}/build/dev/javascript/meridian_catalogue/catalogue/${family}.mjs`;
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
assert.equal(entries.filter((entry) => entry.section === "Core").length, 93);
assert.equal(entries.filter((entry) => entry.group === "Advanced").length, 4);
assert.equal(
  entries.filter((entry) => entry.section === "Additional controls").length,
  3,
);
assert.equal(
  entries.filter((entry) => entry.section === "Utilities").length,
  1,
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
await build({
  entryPoints,
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  legalComments: "eof",
  outdir: `${output}/assets`,
  entryNames: "[dir]/[name]",
  chunkNames: "chunks/[name]-[hash]",
});

let notices = await readFile(
  "src/meridian_ui/internal/vendor/LICENCES.md",
  "utf8",
);
notices += `\n\n# Manrope\n\n${await readFile("priv/fonts/OFL.txt", "utf8")}`;
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
