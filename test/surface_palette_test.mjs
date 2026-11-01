import assert from "node:assert/strict";
import { test } from "node:test";
import { contrast, validPrimary } from "../site/palette.mjs";
import { applySurface } from "../site/surface-palette.mjs";

test("surface palettes preserve readable text in both themes and clear invalid overrides", () => {
  for (const theme of ["light", "dark"])
    for (const colour of [
      "#000000",
      "#ffffff",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#64748b",
      "#8e7c86",
      "#687c71",
    ]) {
      const tokens = new Map();
      const root = {
        dataset: { theme },
        style: {
          setProperty: (name, value) => tokens.set(name, value),
          getPropertyValue: (name) => tokens.get(name),
          removeProperty: (name) => tokens.delete(name),
        },
      };
      applySurface(root, colour);
      assert.equal(tokens.size, 7);
      assert.ok(contrast(tokens.get("--ink"), tokens.get("--panel")) >= 4.5);
      assert.ok(contrast(tokens.get("--muted"), tokens.get("--panel")) >= 4.5);
      assert.ok(
        [...tokens.values()].every((value) => /^#[0-9a-f]{6}$/.test(value)),
      );
      applySurface(root, "red;background:url(bad)");
      assert.equal(tokens.size, 0);
    }
});

test("monochrome is an explicit primary preset, not an arbitrary CSS value", () => {
  assert.equal(validPrimary("mono"), true);
  assert.equal(validPrimary("#10b981"), true);
  for (const value of ["monochrome", "var(--ink)", null, false])
    assert.equal(validPrimary(value), false);
});
