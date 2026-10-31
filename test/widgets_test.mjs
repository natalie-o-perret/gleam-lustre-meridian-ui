import assert from "node:assert/strict";
import { test } from "node:test";
import { dialRatio } from "../src/meridian_ui/knob_ffi.mjs";
import { positionOverlay } from "../src/meridian_ui/overlays_ffi.mjs";
import {
  keyDestination,
  clampPercent,
} from "../src/meridian_ui/widgets_ffi.mjs";

test("roving keys wrap, respect orientation/RTL and ignore unrelated keys", () => {
  assert.equal(keyDestination("ArrowRight", 2, 3, "horizontal"), 0);
  assert.equal(keyDestination("ArrowLeft", 0, 3, "horizontal"), 2);
  assert.equal(keyDestination("ArrowLeft", 0, 3, "horizontal", true), 1);
  assert.equal(keyDestination("ArrowDown", 0, 3, "vertical", true), 1);
  assert.equal(keyDestination("ArrowUp", 0, 3, "vertical"), 2);
  assert.equal(keyDestination("Home", 2, 3, "vertical"), 0);
  assert.equal(keyDestination("End", 0, 3, "horizontal"), 2);
  assert.equal(keyDestination("ArrowDown", 0, 3, "horizontal"), -1);
  assert.equal(keyDestination("Enter", 0, 3, "horizontal"), -1);
  assert.equal(keyDestination("Home", 0, 0, "horizontal"), -1);
});

test("split percentages round and clamp invalid values and bounds", () => {
  assert.equal(clampPercent(35.7, 10, 90), 36);
  assert.equal(clampPercent(-20, 10, 90), 10);
  assert.equal(clampPercent(200, 10, 90), 90);
  assert.equal(clampPercent(20, 80, 10), 80);
  assert.equal(clampPercent(NaN), 0);
  assert.equal(clampPercent(Infinity), 0);
  assert.equal(clampPercent(50, -100, 200), 50);
});

test("dial geometry follows the arc, handles its gap and ignores the centre", () => {
  assert.equal(dialRatio(-10, 10), 0);
  assert.equal(dialRatio(-10, -10), 1 / 3);
  assert.equal(dialRatio(10, -10), 2 / 3);
  assert.equal(dialRatio(10, 10), 1);
  assert.equal(dialRatio(0, 0), null);
  assert.equal(dialRatio(NaN, 0), null);
});

test("anchored overlays flip above and stay within either viewport edge", () => {
  const popup = { offsetWidth: 200, offsetHeight: 100, style: {} };
  const anchor = {
    getBoundingClientRect: () => ({
      left: 290,
      right: 310,
      top: 560,
      bottom: 580,
    }),
  };
  const view = {
    innerWidth: 320,
    innerHeight: 600,
    getComputedStyle: () => ({ direction: "ltr" }),
  };
  positionOverlay(popup, anchor, view);
  assert.equal(popup.style.left, "112px");
  assert.equal(popup.style.top, "454px");
  anchor.getBoundingClientRect = () => ({
    left: 0,
    right: 20,
    top: 0,
    bottom: 20,
  });
  view.getComputedStyle = () => ({ direction: "rtl" });
  positionOverlay(popup, anchor, view);
  assert.equal(popup.style.left, "8px");
  assert.equal(popup.style.top, "26px");
});
