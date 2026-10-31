import assert from "node:assert/strict";
import { test } from "node:test";
import { dialRatio } from "../src/meridian_ui/knob_ffi.mjs";
import {
  positionOverlay,
  preserveScroll,
} from "../src/meridian_ui/overlays_ffi.mjs";
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

test("modal focus preserves scroll through same-origin frames, including failed opens", () => {
  const page = (x, y) => ({
    scrollX: x,
    scrollY: y,
    scrollTo({ left, top }) {
      this.scrollX = left;
      this.scrollY = top;
    },
  });
  const parent = page(4, 300);
  const child = page(0, 20);
  child.frameElement = { ownerDocument: { defaultView: parent } };
  assert.equal(
    preserveScroll(child, () => {
      parent.scrollY = 900;
      child.scrollY = 500;
      return 42;
    }),
    42,
  );
  assert.deepEqual(
    [parent.scrollX, parent.scrollY, child.scrollY],
    [4, 300, 20],
  );
  assert.throws(
    () =>
      preserveScroll(child, () => {
        parent.scrollY = 900;
        throw new Error("Failed open");
      }),
    /Failed open/,
  );
  assert.equal(parent.scrollY, 300);
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
  const popup = {
    offsetWidth: 200,
    offsetHeight: 100,
    style: {
      setProperty(name, value) {
        this[name] = value;
      },
    },
  };
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
  view.document = {
    documentElement: { getBoundingClientRect: () => ({ width: 300 }) },
  };
  view.getComputedStyle = () => ({ direction: "ltr" });
  anchor.getBoundingClientRect = () => ({
    left: 290,
    right: 310,
    top: 560,
    bottom: 580,
  });
  positionOverlay(popup, anchor, view);
  assert.equal(popup.style.left, "92px");
});

test("overlays respect the visible part of scaled frames and visual viewports", () => {
  const parent = {
    innerWidth: 800,
    innerHeight: 600,
    document: { documentElement: {} },
    getComputedStyle: () => ({ scrollPaddingTop: "80px" }),
    visualViewport: { offsetLeft: 0, offsetTop: 0, width: 800, height: 400 },
  };
  const view = {
    innerWidth: 600,
    innerHeight: 1000,
    getComputedStyle: () => ({ direction: "ltr" }),
    frameElement: {
      ownerDocument: { defaultView: parent },
      offsetWidth: 600,
      offsetHeight: 1000,
      clientLeft: 0,
      clientTop: 0,
      getBoundingClientRect: () => ({
        left: 100,
        top: -100,
        width: 1200,
        height: 2000,
      }),
    },
  };
  const style = {
    setProperty(name, value) {
      this[name] = value;
    },
  };
  const popup = { offsetWidth: 200, offsetHeight: 100, style };
  const anchor = {
    getBoundingClientRect: () => ({
      left: 10,
      right: 30,
      top: 230,
      bottom: 250,
    }),
  };
  positionOverlay(popup, anchor, view);
  assert.equal(style["--meridian-overlay-width"], "334px");
  assert.equal(style["--meridian-overlay-height"], "144px");
  assert.equal(style.top, "124px");
  assert.equal(style.left, "10px");
  popup.dataset = { contextX: "500", contextY: "500" };
  positionOverlay(popup, null, view);
  assert.equal(style.left, "142px");
  assert.equal(style.top, "142px");
});
