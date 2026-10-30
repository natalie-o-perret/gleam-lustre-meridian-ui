import assert from "node:assert/strict";
import { setMaxListeners } from "node:events";
import { test } from "node:test";
import { setTimeout } from "node:timers/promises";
import {
  focusMenu,
  focusNavigation,
  mount,
} from "../src/meridian_ui/browser_ffi.mjs";

// A small DOM stand-in keeps the listener lifecycle tests dependency-free.
function fixture(t) {
  setMaxListeners(0);
  const original = globalThis.document;
  const observers = new Set();
  const roots = new Map();
  const media = new Map();
  const document = new EventTarget();
  class Element extends EventTarget {
    constructor(root) {
      super();
      this.root = root;
      this.ownerDocument = document;
      this.attributes = new Map();
      this.dataset = {};
      this.children = [];
      this.isConnected = true;
      this.visible = true;
      this.tabIndex = 0;
      this.style = {};
    }
    setAttribute(key, value) {
      this.attributes.set(key, value);
    }
    getAttribute(key) {
      return this.attributes.get(key) ?? null;
    }
    removeAttribute(key) {
      this.attributes.delete(key);
    }
    getClientRects() {
      return this.visible ? [{}] : [];
    }
    getBoundingClientRect() {
      return { left: 20, top: 20, bottom: 40, width: 20, height: 20 };
    }
    closest(selector) {
      if (selector === ".meridian-ui") return this.root;
      if (selector === "[data-tooltip]")
        return this.dataset.tooltip ? this : null;
      return null;
    }
    contains(node) {
      return this === node || this === node?.root;
    }
    matches() {
      return Boolean(this.disabled);
    }
    append(node) {
      node.root = this;
      this.children.push(node);
    }
    remove() {
      this.isConnected = false;
      this.root.children = this.root.children.filter((node) => node !== this);
    }
    focus(options) {
      document.activeElement = this;
      this.focusOptions = options;
    }
  }
  document.defaultView = Object.assign(new EventTarget(), {
    getComputedStyle: () => ({ visibility: "visible" }),
    innerWidth: 800,
    innerHeight: 600,
    AbortController,
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {
        observers.add(this);
      }
      disconnect() {
        observers.delete(this);
      }
    },
    matchMedia(query) {
      if (!media.has(query))
        media.set(query, Object.assign(new EventTarget(), { matches: true }));
      return media.get(query);
    },
  });
  document.createElement = () => new Element();
  document.getElementById = (id) => roots.get(id);
  globalThis.document = document;
  const disposers = [];
  t.after(() => {
    for (const dispose of disposers) dispose();
    if (original) globalThis.document = original;
    else delete globalThis.document;
  });
  return {
    document,
    observers,
    root(id) {
      const root = new Element();
      root.root = root;
      root.id = id;
      root.open = true;
      root.classList = { contains: () => root.open };
      root.controls = [new Element(root), new Element(root), new Element(root)];
      root.opener = new Element(root);
      root.querySelectorAll = () => root.controls;
      root.querySelector = (selector) =>
        selector === ".menu-button" ? root.opener : root.controls[1];
      roots.set(id, root);
      return root;
    },
    mount(root, onTheme = () => {}, onDesktop = () => {}) {
      const dispose = mount(root.id, onTheme, onDesktop);
      disposers.push(dispose);
      return dispose;
    },
    changed(query, matches) {
      const target = media.get(query);
      target.matches = matches;
      target.dispatchEvent(Object.assign(new Event("change"), { matches }));
    },
    removed(root) {
      root.isConnected = false;
      for (const observer of [...observers]) observer.callback();
    },
    hint(root, target, type = "focusin") {
      target.dataset.tooltip = "Hint";
      root.dispatchEvent(
        Object.defineProperty(new Event(type), "target", {
          value: target,
        }),
      );
    },
  };
}

test("drawer focus is root-scoped, wraps, restores without scrolling and stops after disposal", (t) => {
  const f = fixture(t);
  const one = f.root("one");
  const two = f.root("two");
  let closed = 0;
  const dispose = f.mount(one, undefined, () => closed++);
  f.mount(two);
  focusNavigation("two");
  assert.equal(f.document.activeElement, two.controls[1]);
  focusMenu("one");
  assert.equal(f.document.activeElement, one.opener);
  assert.deepEqual(one.opener.focusOptions, { preventScroll: true });
  one.opener.visible = false;
  focusMenu("one");
  assert.equal(f.document.activeElement, one.controls[0]);
  const tab = (shiftKey = false) =>
    one.dispatchEvent(
      Object.assign(new Event("keydown", { cancelable: true }), {
        key: "Tab",
        shiftKey,
      }),
    );
  one.controls[2].focus();
  tab();
  assert.equal(f.document.activeElement, one.controls[0]);
  tab(true);
  assert.equal(f.document.activeElement, one.controls[2]);
  one.open = false;
  tab();
  assert.equal(f.document.activeElement, one.controls[2]);
  f.changed("(max-width: 800px)", false);
  assert.equal(closed, 1);
  dispose();
  f.changed("(max-width: 800px)", false);
  assert.equal(closed, 1);
  assert.doesNotThrow(() => focusMenu("missing"));
  assert.throws(
    () =>
      mount(
        "missing",
        () => {},
        () => {},
      ),
    /root not found/,
  );
});

test("mount replaces listeners and removal disposes only that root", (t) => {
  const f = fixture(t);
  const one = f.root("one");
  const two = f.root("two");
  const old = [];
  const seenOne = [];
  const seenTwo = [];
  const oldDispose = f.mount(one, (dark) => old.push(dark));
  f.mount(one, (dark) => seenOne.push(dark));
  f.mount(two, (dark) => seenTwo.push(dark));
  oldDispose();
  assert.equal(one.children.length, 1);
  assert.equal(f.observers.size, 2);
  f.changed("(prefers-color-scheme: dark)", false);
  assert.deepEqual(old, [true]);
  assert.deepEqual(seenOne, [true, false]);
  f.removed(one);
  assert.equal(one.children.length, 0);
  assert.equal(f.observers.size, 1);
  f.changed("(prefers-color-scheme: dark)", true);
  assert.deepEqual(seenOne, [true, false]);
  assert.deepEqual(seenTwo, [true, false, true]);
});

test("tooltips have independent IDs and cleanup preserves existing descriptions and cancels timers", async (t) => {
  const f = fixture(t);
  const one = f.root("one");
  const two = f.root("two");
  const dispose = f.mount(one);
  f.mount(two);
  const trigger = one.controls[0];
  trigger.setAttribute("aria-describedby", "existing-help");
  f.hint(one, trigger);
  f.hint(two, two.controls[0]);
  await setTimeout(10);
  assert.equal(one.children[0].id, "one-tooltip");
  assert.equal(two.children[0].id, "two-tooltip");
  assert.equal(
    trigger.getAttribute("aria-describedby"),
    "existing-help one-tooltip",
  );
  dispose();
  assert.equal(trigger.getAttribute("aria-describedby"), "existing-help");
  assert.equal(two.children[0].hidden, false);
  f.document.dispatchEvent(
    Object.assign(new Event("keydown"), { key: "Escape" }),
  );
  assert.equal(two.children[0].hidden, true);
  const disposeAgain = f.mount(one);
  f.hint(one, trigger);
  disposeAgain();
  await setTimeout(10);
  assert.equal(one.children.length, 0);
  assert.equal(trigger.getAttribute("aria-describedby"), "existing-help");
});

test("hover hints open in 100ms without restarting inside the control", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture(t);
  const root = f.root("one");
  f.mount(root);
  const trigger = root.controls[0];
  const tip = root.children[0];
  f.hint(root, trigger, "pointerover");
  t.mock.timers.tick(50);
  root.dispatchEvent(
    Object.assign(new Event("pointerout"), { relatedTarget: trigger }),
  );
  f.hint(root, trigger, "pointerover");
  t.mock.timers.tick(49);
  assert.equal(tip.hidden, true);
  t.mock.timers.tick(1);
  assert.equal(tip.hidden, false);
  root.dispatchEvent(new Event("pointerout"));
  t.mock.timers.tick(99);
  assert.equal(tip.hidden, false);
  t.mock.timers.tick(1);
  assert.equal(tip.hidden, true);
  f.hint(root, trigger, "pointerover");
  t.mock.timers.tick(50);
  root.dispatchEvent(new Event("pointerout"));
  t.mock.timers.tick(25);
  f.hint(root, trigger, "pointerover");
  t.mock.timers.tick(99);
  assert.equal(tip.hidden, true);
  t.mock.timers.tick(1);
  assert.equal(tip.hidden, false);
});

test("keyboard hints preempt hover and disconnected hover targets can retry", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture(t);
  const root = f.root("one");
  f.mount(root);
  const trigger = root.controls[0];
  const tip = root.children[0];
  f.hint(root, trigger, "pointerover");
  t.mock.timers.tick(50);
  f.hint(root, trigger);
  t.mock.timers.tick(0);
  assert.equal(tip.hidden, false);
  root.dispatchEvent(new Event("focusout"));
  trigger.isConnected = false;
  f.hint(root, trigger, "pointerover");
  t.mock.timers.tick(100);
  assert.equal(tip.hidden, true);
  trigger.isConnected = true;
  f.hint(root, trigger, "pointerover");
  t.mock.timers.tick(100);
  assert.equal(tip.hidden, false);
});
