import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import { serve } from "../browser/server.mjs";
import { validateProperties } from "../../site/catalogue-properties.mjs";
import { createHash } from "node:crypto";

const entries = JSON.parse(await readFile("dist/catalogue.json", "utf8"));
const assets = await readdir("dist/assets", { recursive: true });
const scripts = new Map();
for (const [page, name] of [
  ["index", "catalogue"],
  ["preview", "preview"],
]) {
  const html = await readFile(`dist/${page}.html`, "utf8");
  scripts.set(name, /<script type="module" src="\.\/([^"]+)"/.exec(html)?.[1]);
  if (page === "index")
    assert.match(html, /data-preview-version="[a-f0-9]{12}"/);
}

test("all JavaScript URLs are content-hashed, including lazy examples", async () => {
  for (const [name, path] of scripts) {
    assert.match(path, new RegExp(`^assets/${name}-[A-Z0-9]{8}\\.js$`));
    await access(`dist/${path}`);
  }
  for (const path of assets.filter((path) => path.endsWith(".js")))
    assert.match(path, /-[A-Z0-9]{8}\.js$/);
});

test("stylesheet URLs carry their exact content version", async () => {
  for (const page of ["index", "preview"]) {
    const html = await readFile(`dist/${page}.html`, "utf8");
    for (const match of html.matchAll(
      /href="\.\/([^"?]+\.css)\?v=([a-f0-9]{12})"/g,
    ))
      assert.equal(
        match[2],
        createHash("sha256")
          .update(await readFile(`dist/${match[1]}`))
          .digest("hex")
          .slice(0, 12),
      );
    assert.equal([...html.matchAll(/\.css\?v=/g)].length, 2);
  }
});

test("the built catalogue has one compiled live example and exact source for all 104 entries", async () => {
  assert.equal(entries.length, 104);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, 104);
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
    assert.ok(
      assets.some((path) =>
        new RegExp(`^chunks/${entry.family}-[A-Z0-9]{8}\\.js$`).test(path),
      ),
      `${entry.name}: hashed example bundle`,
    );
    if (entry.module) await access(`src/${entry.module}.gleam`);
  }
  assert.equal(
    entries.find((entry) => entry.id === "filterservice").group,
    "Utilities",
  );
  for (const id of ["codeblock", "timepicker", "datetimepicker"])
    assert.ok(entries.some((entry) => entry.id === id));
  for (const id of ["datepicker", "timepicker", "datetimepicker"])
    assert.equal(entries.find((entry) => entry.id === id).group, "Form");
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
  assert.ok(notices.includes("GitHub's logo guidelines"));
});

test("every page has a public API or platform reference, editable properties and validated distinct presets", () => {
  for (const entry of entries) {
    assert.ok(entry.properties.length > 0, entry.id);
    assert.equal(
      new Set(entry.properties.map((property) => property.name)).size,
      entry.properties.length,
      entry.id,
    );
    assert.ok(entry.examples.length >= 2, entry.id);
    assert.equal(
      new Set(entry.examples.map((example) => JSON.stringify(example.values)))
        .size,
      entry.examples.length,
      entry.id,
    );
    for (const example of entry.examples)
      assert.ok(
        validateProperties(entry.properties, example.values),
        `${entry.id} ${example.name}`,
      );
    if (entry.module) {
      assert.ok(entry.api.functions.length, entry.id);
      assert.ok(
        entry.api.functions.every((fn) =>
          fn.arguments.every((arg) => arg.name && arg.type),
        ),
        entry.id,
      );
    } else assert.equal(entry.status, "Platform", entry.id);
  }
});

test("the site and sources are served beneath a repository prefix with correct MIME types", async () => {
  const server = await serve("dist", "/gleam-lustre-meridian-ui/");
  try {
    for (const [path, type] of [
      ["", "text/html"],
      ["preview.html", "text/html"],
      [scripts.get("preview"), "text/javascript"],
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
