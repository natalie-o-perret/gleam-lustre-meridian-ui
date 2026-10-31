import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { test } from "node:test";

const document = await readFile(
  new URL("../COMPONENTS.md", import.meta.url),
  "utf8",
);

test("the coverage ledger accounts for all 93 core entries without duplicate routes", async () => {
  const core = document.split("## Core\n")[1].split("## PRO\n")[0];
  const sections = [
    ...core.matchAll(/^### (.+) \((\d+)\)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm),
  ];
  assert.equal(sections.length, 10);
  const routes = [];
  for (const [, name, count, body] of sections) {
    const entries = [
      ...body.matchAll(
        /^\|\s+\[([^\]]+)\]\(https:\/\/primeng\.dev\/([^)]+)\)\s+\|\s+(Base|Partial|Platform|Pending)\s+\|\s+(.+?)\s+\|$/gm,
      ),
    ];
    assert.equal(entries.length, Number(count), name);
    for (const [, , route, status, coverage] of entries) {
      routes.push(route);
      if (status === "Base") {
        const module = coverage.match(/`(meridian_ui\/[a-z_]+)`/)[1];
        await access(new URL(`../src/${module}.gleam`, import.meta.url));
      }
    }
  }
  assert.equal(routes.length, 93);
  assert.equal(new Set(routes).size, 93);
  assert.equal([...core.matchAll(/\| Base\s+\|/g)].length, 88);
  assert.equal([...core.matchAll(/\| Platform\s+\|/g)].length, 5);
});

test("all released PRO products have modules and future products remain separate", async () => {
  const pro = document.split("## PRO\n")[1];
  const products = [
    ...pro.matchAll(
      /^\|\s+\[[^\]]+\]\(https:\/\/angular\.primeuipro\.dev\/[^)]+\)\s+\|\s+Base\s+\|\s+`(meridian_ui\/[a-z_]+)`/gm,
    ),
  ];
  assert.equal(products.length, 4);
  for (const [, module] of products)
    await access(new URL(`../src/${module}.gleam`, import.meta.url));
  assert.equal(
    [...pro.matchAll(/^\|\s+[^|]+\s+\|\s+Planned\s+\|/gm)].length,
    5,
  );
});
