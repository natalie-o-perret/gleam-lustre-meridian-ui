export function setupToasts(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const states = new Map();
  const owned = (node) => node?.closest?.(".meridian-ui") === root;
  let lastFocus = null;
  root.addEventListener(
    "focusin",
    (event) => {
      const toast = event.target.closest?.("[data-meridian-toast]");
      if (toast && owned(toast)) lastFocus = toast;
    },
    { signal },
  );
  const pause = (state) => {
    if (state.timer !== null) {
      view.clearTimeout(state.timer);
      state.remaining = Math.max(
        0,
        state.remaining - (view.performance.now() - state.started),
      );
      state.timer = null;
    }
  };
  const update = (node, state) => {
    const blocked =
      doc.hidden || node.matches(":hover") || node.contains(doc.activeElement);
    if (blocked) pause(state);
    else if (!state.expired && state.timeout > 0 && state.timer === null) {
      state.started = view.performance.now();
      state.timer = view.setTimeout(() => {
        state.timer = null;
        state.expired = true;
        node.dispatchEvent(
          new view.CustomEvent("meridian-timeout", { bubbles: true }),
        );
      }, state.remaining);
    }
  };
  const refresh = () => {
    for (const [node, state] of states) update(node, state);
  };
  for (const type of ["pointerover", "pointerout", "focusin", "focusout"])
    root.addEventListener(type, () => view.queueMicrotask(refresh), { signal });
  doc.addEventListener("visibilitychange", refresh, { signal });
  signal.addEventListener(
    "abort",
    () => {
      for (const state of states.values()) pause(state);
      states.clear();
    },
    { once: true },
  );
  return () => {
    for (const [node, state] of states)
      if (!node.isConnected) {
        pause(state);
        states.delete(node);
        if (node === lastFocus && doc.activeElement === doc.body) {
          const next =
            root.querySelector("[data-meridian-toast] button") ??
            root.querySelector(".meridian-toasts");
          if (next) {
            if (!next.hasAttribute("tabindex")) next.tabIndex = -1;
            next.focus({ preventScroll: true });
          }
        }
      }
    for (const node of root.querySelectorAll("[data-meridian-toast]"))
      if (owned(node)) {
        const timeout = Math.max(0, Number(node.dataset.timeout) || 0);
        let state = states.get(node);
        if (!state || state.timeout !== timeout) {
          if (state) pause(state);
          state = {
            timeout,
            remaining: timeout,
            started: 0,
            timer: null,
            expired: false,
          };
          states.set(node, state);
        }
        update(node, state);
      }
  };
}
