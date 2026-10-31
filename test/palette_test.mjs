import assert from "node:assert/strict";
import { test } from "node:test";
import { colourTokens, contrast, validColour } from "../site/palette.mjs";

test("custom palettes reject CSS injection and retain readable foregrounds in both themes", () => {
  assert.equal(validColour("red;display:none"), false);
  assert.equal(validColour("#fff"), false);
  assert.equal(colourTokens("var(--bad)", "#ffffff"), null);
  for (const panel of ["#fffefd", "#18191c"])
    for (const colour of [
      "#ffffff",
      "#000000",
      "#ffff00",
      "#ff0000",
      "#00ffff",
      "#ff00ff",
      "#228b22",
      "#663399",
    ]) {
      const tokens = colourTokens(colour, panel);
      assert.ok(tokens, `${colour} on ${panel}`);
      assert.ok(contrast(tokens.colour, tokens.soft) >= 4.5);
      assert.ok(contrast(tokens.colour, tokens.on) >= 4.5);
    }
});
