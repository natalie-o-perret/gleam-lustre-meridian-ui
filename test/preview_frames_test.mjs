import assert from "node:assert/strict";
import { test } from "node:test";
import { responsiveFrames } from "../site/preview-frames.mjs";

test("offscreen preview frames run once, cancel cleanly and restore native scheduling", () => {
  const frames = new Map();
  const timers = new Map();
  let next = 0;
  const view = {
    performance: { now: () => 100 },
    requestAnimationFrame(callback) {
      frames.set(++next, callback);
      return next;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
    setTimeout(callback, delay) {
      assert.equal(delay, 100);
      timers.set(++next, callback);
      return next;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };
  const native = view.requestAnimationFrame;
  const dispose = responsiveFrames(view);
  const called = [];
  view.requestAnimationFrame((timestamp) => called.push(timestamp));
  const first = [...frames.values()][0];
  first(16);
  assert.deepEqual(called, [16]);
  assert.equal(timers.size, 0);
  assert.equal(frames.size, 0);
  view.requestAnimationFrame((timestamp) => called.push(timestamp));
  const suspended = [...frames.values()][0];
  [...timers.values()][0]();
  suspended(200);
  assert.deepEqual(called, [16, 100]);
  assert.equal(frames.size, 0);
  const cancelled = view.requestAnimationFrame(() =>
    assert.fail("cancelled callback"),
  );
  view.cancelAnimationFrame(cancelled);
  assert.equal(timers.size, 0);
  view.requestAnimationFrame(() => assert.fail("disposed callback"));
  dispose();
  assert.equal(frames.size, 0);
  assert.equal(timers.size, 0);
  assert.equal(view.requestAnimationFrame, native);
});
