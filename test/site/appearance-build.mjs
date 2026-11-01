import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("appearance styles are bundled into the versioned catalogue stylesheet", async () => {
  const css = await readFile("dist/catalogue.css", "utf8");
  assert.ok(css.includes(".docs-swatches .meridian-select-choice"));
  assert.ok(css.includes(".docs-appearance-custom"));
  assert.ok(!css.includes("@import"));
});
