import assert from "node:assert/strict";
import { test } from "node:test";
import { mountEngine } from "../src/meridian_ui/engine_mount_ffi.mjs";

test("engine resizing leaves observer delivery, coalesces frames and cancels on disposal", (t) => {
  const original = globalThis.document;
  t.after(() => {
    if (original) globalThis.document = original;
    else delete globalThis.document;
  });
  const frames = new Map();
  let next = 0;
  let resized = 0;
  let destroyed = 0;
  let resize;
  const view = {
    getComputedStyle: () => ({ direction: "ltr" }),
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    ResizeObserver: class {
      constructor(callback) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
    requestAnimationFrame(callback) {
      frames.set(++next, callback);
      return next;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
  };
  const element = {
    isConnected: true,
    ownerDocument: { defaultView: view },
    getAttribute: () => "{}",
    closest: () => ({ dataset: { theme: "light" } }),
  };
  globalThis.document = { getElementById: () => element };
  const dispose = mountEngine("calendar", "data-calendar", () => ({
    update() {},
    resize() {
      resized++;
    },
    destroy() {
      destroyed++;
    },
  }));
  resize();
  resize();
  assert.equal(resized, 0);
  assert.equal(frames.size, 1);
  const [id, callback] = [...frames][0];
  frames.delete(id);
  callback();
  assert.equal(resized, 1);
  resize();
  const pending = [...frames.values()][0];
  dispose();
  assert.equal(frames.size, 0);
  assert.equal(destroyed, 1);
  pending();
  assert.equal(resized, 1);
  dispose();
  assert.equal(destroyed, 1);
});
