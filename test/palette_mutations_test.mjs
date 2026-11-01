import assert from "node:assert/strict";
import { test } from "node:test";
import { applyPalette, contrast } from "../site/palette.mjs";
import { applySurface } from "../site/surface-palette.mjs";

test("unchanged appearance tokens don't rewrite styles, and clearing removes every override", () => {
  for (const theme of ["light", "dark"]) {
    const values = new Map();
    let mutations = 0;
    const root = {
      dataset: { theme },
      style: {
        getPropertyValue: (name) => values.get(name) ?? "",
        setProperty: (name, value) => {
          mutations++;
          values.set(name, value);
        },
        removeProperty: (name) => {
          mutations++;
          values.delete(name);
        },
      },
      ownerDocument: {
        defaultView: {
          getComputedStyle: () => ({
            getPropertyValue: (name) =>
              name === "--panel" ? values.get(name) : "",
          }),
        },
      },
    };
    applySurface(root, "#64748b");
    applyPalette(root, "#10b981", "#3b82f6");
    assert.equal(values.size, 13);
    assert.equal(mutations, 13);
    for (let index = 0; index < 3; index++) {
      applySurface(root, "#64748b");
      applyPalette(root, "#10b981", "#3b82f6");
      assert.equal(mutations, 13);
    }
    assert.ok(
      contrast(values.get("--accent"), values.get("--on-accent")) >= 4.5,
    );
    applyPalette(root, "", "");
    assert.equal(values.size, 7);
    applySurface(root, "");
    assert.equal(values.size, 0);
    const cleared = mutations;
    applyPalette(root, "", "");
    applySurface(root, "");
    assert.equal(mutations, cleared);
  }
});
