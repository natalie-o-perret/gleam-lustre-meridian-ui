import assert from "node:assert/strict";
import { test } from "node:test";
import {
  readTheme,
  saveTheme,
  systemDark,
  watchSystemTheme,
} from "../src/meridian_ui/theme_ffi.mjs";

test("theme persistence is optional when storage is unavailable", () => {
  const storage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const media = globalThis.matchMedia;
  try {
    globalThis.matchMedia = () => ({ matches: true });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Storage blocked");
      },
    });
    assert.equal(readTheme("one"), "system");
    assert.equal(systemDark(), true);
    assert.doesNotThrow(() => saveTheme("one", "light"));
  } finally {
    if (storage) Object.defineProperty(globalThis, "localStorage", storage);
    else delete globalThis.localStorage;
    if (media) globalThis.matchMedia = media;
    else delete globalThis.matchMedia;
  }
});

test("validates stored preferences and keeps application storage keys independent", () => {
  const storage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map();
  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key) => values.get(key),
        setItem: (key, value) => values.set(key, value),
      },
    });
    assert.equal(readTheme("one"), "system");
    values.set("one", "invalid");
    assert.equal(readTheme("one"), "system");
    saveTheme("two", "dark");
    for (const mode of ["light", "dark", "system"]) {
      saveTheme("one", mode);
      assert.equal(readTheme("one"), mode);
      assert.equal(readTheme("two"), "dark");
    }
    saveTheme("two", "invalid");
    assert.equal(readTheme("two"), "dark");
  } finally {
    if (storage) Object.defineProperty(globalThis, "localStorage", storage);
    else delete globalThis.localStorage;
  }
});

test("system subscription reports changes and unsubscribes", () => {
  const original = globalThis.matchMedia;
  const media = Object.assign(new EventTarget(), { matches: true });
  const seen = [];
  try {
    globalThis.matchMedia = (query) => {
      assert.equal(query, "(prefers-color-scheme: dark)");
      return media;
    };
    const stop = watchSystemTheme((dark) => seen.push(dark));
    media.dispatchEvent(Object.assign(new Event("change"), { matches: false }));
    assert.deepEqual(seen, [true, false]);
    stop();
    media.dispatchEvent(Object.assign(new Event("change"), { matches: true }));
    assert.deepEqual(seen, [true, false]);
    delete globalThis.matchMedia;
    assert.equal(systemDark(), false);
    assert.doesNotThrow(() =>
      watchSystemTheme(() => assert.fail("No media API"))(),
    );
  } finally {
    if (original) globalThis.matchMedia = original;
    else delete globalThis.matchMedia;
  }
});
