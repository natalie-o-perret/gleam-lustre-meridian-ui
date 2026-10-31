import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { test } from "node:test";

const document = await readFile(
  new URL("../COMPONENTS.md", import.meta.url),
  "utf8",
);

test("the coverage ledger accounts for all 95 core entries without duplicate routes", async () => {
  const core = document.split("## Core\n")[1].split("## Advanced\n")[0];
  const sections = [
    ...core.matchAll(/^### (.+) \((\d+)\)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm),
  ];
  assert.equal(sections.length, 10);
  const routes = [];
  for (const [, name, count, body] of sections) {
    const entries = [
      ...body.matchAll(
        /^\|\s+\[([^\]]+)\]\(([^)]+)\)\s+\|\s+(Base|Platform)\s+\|\s+(.+?)\s+\|$/gm,
      ),
    ];
    assert.equal(entries.length, Number(count), name);
    for (const [, name, source, status, coverage] of entries) {
      routes.push(name);
      await access(new URL(`../${source}`, import.meta.url));
      if (status === "Base") {
        const module = coverage.match(/`(meridian_ui\/[a-z_]+)`/)[1];
        await access(new URL(`../src/${module}.gleam`, import.meta.url));
      }
    }
  }
  assert.equal(routes.length, 95);
  assert.equal(new Set(routes).size, 95);
  assert.equal([...core.matchAll(/\| Base\s+\|/g)].length, 90);
  assert.equal([...core.matchAll(/\| Platform\s+\|/g)].length, 5);
});

test("advanced widgets and additional controls have their own modules and examples", async () => {
  const advanced = document
    .split("## Advanced\n")[1]
    .split("## Utilities\n")[0];
  const products = [
    ...advanced.matchAll(
      /^\|\s+\[[^\]]+\]\([^)]+\)\s+\|\s+Base\s+\|\s+`(meridian_ui\/[a-z_]+)`/gm,
    ),
  ];
  assert.equal(products.length, 4);
  for (const [, module] of products)
    await access(new URL(`../src/${module}.gleam`, import.meta.url));
  const additions = document
    .split("## Additional controls\n")[1]
    .split("## Verification")[0];
  const sources = [...additions.matchAll(/^\|\s+\[[^\]]+\]\(([^)]+)\)/gm)];
  assert.equal(sources.length, 1);
  for (const [, source] of sources)
    await access(new URL(`../${source}`, import.meta.url));
});
