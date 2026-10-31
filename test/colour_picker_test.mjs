import assert from "node:assert/strict";
import { test } from "node:test";
import { hexToHsv, hsvToHex } from "../src/meridian_ui/colour_picker_ffi.mjs";

test("colour conversion preserves opaque sRGB values, greys and hue wrapping", () => {
  for (const value of [
    "#000000",
    "#ffffff",
    "#b41472",
    "#316a91",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#808080",
  ]) {
    assert.equal(hsvToHex(...hexToHsv(value)), value);
  }
  for (let colour = 0; colour <= 0xffffff; colour += 65521) {
    const value = `#${colour.toString(16).padStart(6, "0")}`;
    assert.equal(hsvToHex(...hexToHsv(value)), value);
  }
  assert.equal(hsvToHex(360, 100, 100), "#ff0000");
  assert.equal(hsvToHex(-120, 100, 100), "#0000ff");
  assert.equal(hsvToHex(NaN, 100, 100), "");
  for (const value of ["#fff", "#gg0000", "red", "<script>", "#00000000"])
    assert.equal(hexToHsv(value), null);
});
