const documents = new WeakMap();
const focusSelector =
  'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex], [contenteditable="true"]';

function visible(element, view) {
  return (
    element.isConnected &&
    element.getClientRects().length &&
    !element.closest("[hidden], [inert]") &&
    !element.matches(":disabled, [aria-disabled='true']") &&
    view.getComputedStyle(element).visibility !== "hidden"
  );
}

function controls(element, view) {
  return [...element.querySelectorAll(focusSelector)]
    .filter((node) => node.tabIndex >= 0 && visible(node, view))
    .sort(
      (a, b) =>
        (a.tabIndex > 0 ? a.tabIndex : Infinity) -
        (b.tabIndex > 0 ? b.tabIndex : Infinity),
    );
}

function manager(doc) {
  if (documents.has(doc)) return documents.get(doc);
  const view = doc.defaultView;
  const controller = new view.AbortController();
  const roots = new Set();
  const traps = new Map();
  const active = () => {
    const modal = doc.activeElement?.closest?.("dialog:modal");
    return [...traps.keys()]
      .reverse()
      .find((node) => visible(node, view) && (!modal || modal.contains(node)));
  };
  doc.addEventListener(
    "focusin",
    () => {
      const trap = active();
      if (trap && !trap.contains(doc.activeElement))
        (controls(trap, view)[0] ?? trap).focus({ preventScroll: true });
    },
    { signal: controller.signal },
  );
  doc.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Tab" || event.defaultPrevented) return;
      const trap = active();
      if (!trap) return;
      const items = controls(trap, view);
      const first = items[0] ?? trap;
      const last = items.at(-1) ?? trap;
      if (
        !items.length ||
        !trap.contains(doc.activeElement) ||
        (event.shiftKey && doc.activeElement === first) ||
        (!event.shiftKey && doc.activeElement === last)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      }
    },
    { signal: controller.signal },
  );
  const result = {
    roots,
    traps,
    remove(root) {
      roots.delete(root);
      for (const [node, owner] of traps) if (owner === root) traps.delete(node);
      if (!roots.size) {
        controller.abort();
        documents.delete(doc);
      }
    },
  };
  documents.set(doc, result);
  return result;
}

export function setupFocus(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const states = new Map();
  let lastFocus = doc.activeElement;
  let traps = null;
  const owned = (element) => element?.closest?.(".meridian-ui") === root;
  root.addEventListener(
    "focusin",
    (event) => {
      if (owned(event.target)) lastFocus = event.target;
    },
    { signal },
  );
  const restore = (node, state, target = state.previous) => {
    if (
      target &&
      visible(target, view) &&
      (node.contains(doc.activeElement) || doc.activeElement === doc.body)
    )
      target.focus({ preventScroll: true });
  };
  const unregister = (node, state) => {
    traps?.traps.delete(node);
    restore(node, state);
  };
  root.addEventListener(
    "keydown",
    (event) => {
      if (
        event.defaultPrevented ||
        event.key !== "Escape" ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const node = event.target.closest?.('[data-meridian-inplace="true"]');
      if (
        !node ||
        !owned(node) ||
        event.target.closest("[popover]:popover-open") ||
        event.target.matches("select, input[list]")
      )
        return;
      const modal = event.target.closest("dialog:modal");
      if (modal && node.contains(modal)) return;
      event.preventDefault();
      node.dispatchEvent(
        new view.CustomEvent("meridian-cancel", { bubbles: true }),
      );
    },
    { signal },
  );
  signal.addEventListener(
    "abort",
    () => {
      const active = [...states].find(
        ([node, state]) =>
          state.kind === "trap" &&
          state.active &&
          (node.contains(doc.activeElement) || doc.activeElement === doc.body),
      );
      traps?.remove(root);
      if (active) restore(active[0], active[1]);
      states.clear();
    },
    { once: true },
  );
  return () => {
    for (const [node, state] of states) {
      if (!node.isConnected || !owned(node)) {
        if (state.kind === "trap") unregister(node, state);
        states.delete(node);
      }
    }
    for (const node of root.querySelectorAll(
      "[data-meridian-trap], [data-meridian-block], [data-meridian-inplace]",
    )) {
      if (!owned(node)) continue;
      const kind =
        node.dataset.meridianTrap !== undefined
          ? "trap"
          : node.dataset.meridianBlock !== undefined
            ? "block"
            : node.dataset.meridianInplace !== undefined
              ? "inplace"
              : null;
      if (!kind) continue;
      const active =
        node.dataset[
          {
            trap: "meridianTrap",
            block: "meridianBlock",
            inplace: "meridianInplace",
          }[kind]
        ] === "true";
      const state = states.get(node) ?? { kind, active: false, previous: null };
      if (active && !state.active) {
        state.previous =
          doc.activeElement === doc.body && node.contains(lastFocus)
            ? lastFocus
            : doc.activeElement;
        if (kind === "trap") {
          traps ??= manager(doc);
          traps.roots.add(root);
          traps.traps.set(node, root);
          if (!node.contains(doc.activeElement))
            (controls(node, view)[0] ?? node).focus({ preventScroll: true });
        } else if (kind === "block") {
          if (
            node
              .querySelector("[data-meridian-block-content]")
              .contains(state.previous)
          )
            node
              .querySelector("[data-meridian-block-status]")
              .focus({ preventScroll: true });
        } else {
          const editor = node.querySelector("[data-meridian-inplace-editor]");
          (controls(editor, view)[0] ?? editor).focus({ preventScroll: true });
        }
      } else if (!active && state.active) {
        if (kind === "trap") unregister(node, state);
        else if (kind === "block") restore(node, state);
        else
          restore(
            node,
            state,
            node.querySelector("[data-meridian-inplace-trigger]"),
          );
      }
      state.active = active;
      states.set(node, state);
    }
  };
}
