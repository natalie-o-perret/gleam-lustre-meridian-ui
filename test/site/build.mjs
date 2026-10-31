import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import { serve } from "../browser/server.mjs";

const entries = JSON.parse(await readFile("dist/catalogue.json", "utf8"));

test("the built catalogue has one compiled live example and exact source for all 101 entries", async () => {
  assert.equal(entries.length, 101);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, 101);
  assert.equal(
    entries.filter((entry) => entry.status === "Platform").length,
    5,
  );
  assert.equal(entries.filter((entry) => entry.group === "Advanced").length, 4);
  for (const entry of entries) {
    assert.match(entry.id, /^[a-z]+$/);
    assert.match(entry.family, /^[a-z_]+$/);
    assert.ok(entry.description);
    assert.ok(entry.snippet.startsWith("pub fn "));
    const source = await readFile(`dist/source/${entry.family}.gleam`, "utf8");
    assert.ok(source.includes(entry.snippet));
    assert.equal(
      source,
      await readFile(
        `examples/catalogue/src/catalogue/${entry.family}.gleam`,
        "utf8",
      ),
    );
    await access(`dist/assets/examples/${entry.family}.js`);
    if (entry.module) await access(`src/${entry.module}.gleam`);
  }
  assert.equal(
    entries.find((entry) => entry.id === "filterservice").group,
    "Utilities",
  );
  for (const id of ["codeblock", "timepicker", "datetimepicker"])
    assert.ok(entries.some((entry) => entry.id === id));
});

test("Pages output contains only distributable assets, local art and dependency notices", async () => {
  await access("dist/.nojekyll");
  assert.ok(!(await readdir("dist")).includes("node_modules"));
  assert.equal(
    await readFile("dist/meridian-ui.css", "utf8"),
    await readFile("priv/meridian-ui.css", "utf8"),
  );
  const notices = await readFile("dist/licences.txt", "utf8");
  for (const name of [
    "echarts",
    "@fullcalendar/core",
    "prosemirror-model",
    "imask",
    "lustre",
    "gleam_stdlib",
  ])
    assert.ok(notices.includes(name), `${name} notice`);
  for (const file of ["mark.svg", "landscape.svg", "before.svg"])
    await access(`dist/assets/${file}`);
  await access("dist/fonts/manrope-latin-variable.woff2");
  await access("dist/fonts/OFL.txt");
  assert.ok(notices.includes("Manrope"));
});

test("the site and sources are served beneath a repository prefix with correct MIME types", async () => {
  const server = await serve("dist", "/gleam-lustre-meridian-ui/");
  try {
    for (const [path, type] of [
      ["", "text/html"],
      ["preview.html", "text/html"],
      ["assets/preview.js", "text/javascript"],
      ["catalogue.json", "application/json"],
      ["source/forms.gleam", "text/plain"],
      ["licences.txt", "text/plain"],
    ]) {
      const response = await fetch(
        `${server.url}/gleam-lustre-meridian-ui/${path}`,
      );
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get("content-type"), type);
    }
    assert.equal((await fetch(`${server.url}/catalogue.json`)).status, 404);
  } finally {
    await server.close();
  }
});
