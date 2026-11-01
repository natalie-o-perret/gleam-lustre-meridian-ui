import assert from "node:assert/strict";
import { test } from "node:test";
import { positionOverlay } from "../src/meridian_ui/overlays_ffi.mjs";

test("tall anchored lists shrink beside the input instead of covering it", () => {
  for (const [top, bottom, expectedTop, available] of [
    [100, 140, 146, 246],
    [260, 300, 8, 246],
  ]) {
    const style = {
      setProperty(name, value) {
        this[name] = value;
      },
    };
    const popup = {
      offsetWidth: 200,
      get offsetHeight() {
        return Math.min(320, parseFloat(style["--meridian-overlay-height"]));
      },
      style,
    };
    positionOverlay(
      popup,
      {
        getBoundingClientRect: () => ({ left: 20, right: 220, top, bottom }),
      },
      {
        innerWidth: 320,
        innerHeight: 400,
        getComputedStyle: () => ({ direction: "ltr" }),
      },
      true,
    );
    assert.equal(style["--meridian-overlay-height"], `${available}px`);
    assert.equal(parseFloat(style.top), expectedTop);
    assert.ok(
      parseFloat(style.top) >= bottom ||
        parseFloat(style.top) + popup.offsetHeight <= top,
    );
  }
});

test("header anchors leave room for the protected header before sizing the popup", () => {
  const style = {
    setProperty(name, value) {
      this[name] = value;
    },
  };
  const popup = {
    offsetWidth: 200,
    get offsetHeight() {
      return parseFloat(style["--meridian-overlay-height"]);
    },
    style,
  };
  positionOverlay(
    popup,
    {
      getBoundingClientRect: () => ({
        left: 20,
        right: 60,
        top: 12,
        bottom: 50,
      }),
    },
    {
      document: { documentElement: {} },
      innerWidth: 320,
      innerHeight: 568,
      getComputedStyle: () => ({ scrollPaddingTop: "72px", direction: "ltr" }),
    },
    true,
  );
  assert.equal(style["--meridian-overlay-height"], "480px");
  assert.equal(style.top, "80px");
  assert.ok(parseFloat(style.top) + popup.offsetHeight <= 560);
});
