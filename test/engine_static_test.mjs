import assert from "node:assert/strict";
import { test } from "node:test";
import { mountEngine } from "../src/meridian_ui/engine_mount_ffi.mjs";

test("engines without a resize handler don't allocate an unused observer", (t) => {
  const original = globalThis.document;
  t.after(() => {
    if (original) globalThis.document = original;
    else delete globalThis.document;
  });
  let observed = 0;
  let updates = 0;
  const view = {
    getComputedStyle: () => ({ direction: "ltr" }),
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    ResizeObserver: class {
      constructor() {
        observed++;
      }
      observe() {}
      disconnect() {}
    },
  };
  const element = {
    isConnected: true,
    ownerDocument: { defaultView: view },
    getAttribute: () => "{}",
    closest: () => ({ dataset: { theme: "light" } }),
  };
  globalThis.document = { getElementById: () => element };
  t.after(
    mountEngine("editor", "data-editor", () => ({
      update() {
        updates++;
      },
      destroy() {},
    })),
  );
  assert.equal(updates, 1);
  assert.equal(observed, 0);
});
