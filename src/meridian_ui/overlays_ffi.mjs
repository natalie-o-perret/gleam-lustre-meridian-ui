export function positionOverlay(popup, anchor, view) {
  if (!anchor) return;
  const bounds = anchor.getBoundingClientRect();
  const width = popup.offsetWidth;
  const height = popup.offsetHeight;
  const below = view.innerHeight - bounds.bottom;
  const top =
    below >= height + 8 || below >= bounds.top
      ? bounds.bottom + 6
      : bounds.top - height - 6;
  const rtl = view.getComputedStyle(anchor).direction === "rtl";
  const left = rtl ? bounds.right - width : bounds.left;
  popup.style.left = `${Math.max(8, Math.min(left, view.innerWidth - width - 8))}px`;
  popup.style.top = `${Math.max(8, Math.min(top, view.innerHeight - height - 8))}px`;
}

export function setupOverlays(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const states = new Map();
  const owned = (element) => element?.closest?.(".meridian-ui") === root;
  const emitClose = (element) =>
    element.dispatchEvent(
      new view.CustomEvent("meridian-close", { bubbles: true }),
    );
  const focusable = (element) =>
    [
      ...element.querySelectorAll(
        "[autofocus], button, a[href], input, select, textarea, [tabindex]",
      ),
    ].find(
      (node) =>
        !node.matches(":disabled, [tabindex='-1']") &&
        !node.closest("[inert], [hidden]") &&
        node.getClientRects().length,
    );
  const restore = (element, state) => {
    if (
      doc.activeElement !== doc.body &&
      doc.activeElement !== state.previous &&
      !element.contains(doc.activeElement)
    )
      return;
    const previous = state.previous;
    if (
      previous?.isConnected &&
      previous.getClientRects().length &&
      !previous.closest?.("[inert], [hidden]")
    ) {
      previous.focus({ preventScroll: true });
    } else {
      const fallback = [
        ...root.querySelectorAll("[data-meridian-opener]"),
      ].find((node) => node.dataset.meridianOpener === element.id);
      fallback?.focus({ preventScroll: true });
    }
  };
  const nativeClosed = (element, before = false) => {
    const state = states.get(element);
    if (!state || state.suppress || element.dataset.open !== "true") return;
    state.desired = false;
    element.dataset.open = "false";
    emitClose(element);
    if (before) state.nativeDismissed = true;
    else restore(element, state);
  };
  root.addEventListener(
    "cancel",
    (event) => {
      const element = event.target;
      if (!owned(element) || element.dataset?.meridianOverlay !== "dialog")
        return;
      event.preventDefault();
      emitClose(element);
    },
    { signal, capture: true },
  );
  root.addEventListener(
    "close",
    (event) => {
      if (
        owned(event.target) &&
        event.target.dataset?.meridianOverlay === "dialog"
      )
        nativeClosed(event.target);
    },
    { signal, capture: true },
  );
  root.addEventListener(
    "beforetoggle",
    (event) => {
      if (
        owned(event.target) &&
        event.target.dataset?.meridianOverlay === "popover" &&
        event.newState === "closed"
      )
        nativeClosed(event.target, true);
    },
    { signal, capture: true },
  );
  root.addEventListener(
    "toggle",
    (event) => {
      if (
        owned(event.target) &&
        event.target.dataset?.meridianOverlay === "popover" &&
        event.newState === "closed"
      ) {
        const state = states.get(event.target);
        if (state?.nativeDismissed) {
          state.nativeDismissed = false;
          restore(event.target, state);
        }
      }
    },
    { signal, capture: true },
  );
  const reposition = () => {
    for (const [element, state] of states) {
      if (
        state.desired &&
        element.dataset.meridianOverlay === "popover" &&
        element.matches(":popover-open")
      ) {
        const anchor = [
          ...root.querySelectorAll("[data-meridian-opener]"),
        ].find((node) => node.dataset.meridianOpener === element.id);
        if (element.dataset.contextX !== undefined) {
          element.style.left = `${Math.max(8, Math.min(Number(element.dataset.contextX), view.innerWidth - element.offsetWidth - 8))}px`;
          element.style.top = `${Math.max(8, Math.min(Number(element.dataset.contextY), view.innerHeight - element.offsetHeight - 8))}px`;
        } else positionOverlay(element, anchor, view);
      }
    }
  };
  view.addEventListener("resize", reposition, { signal });
  doc.addEventListener(
    "pointerdown",
    (event) => {
      for (const [element, state] of states) {
        if (
          !state.desired ||
          element.dataset.meridianOverlay !== "popover" ||
          !element.matches(":popover-open") ||
          element.contains(event.target)
        )
          continue;
        const opener = event.target.closest?.("[data-meridian-opener]");
        if (opener?.dataset.meridianOpener !== element.id)
          element.hidePopover();
      }
    },
    { signal, capture: true },
  );
  doc.addEventListener("scroll", reposition, {
    signal,
    capture: true,
    passive: true,
  });
  const sync = () => {
    for (const [element] of states)
      if (!element.isConnected || !owned(element)) states.delete(element);
    for (const element of root.querySelectorAll("[data-meridian-overlay]")) {
      if (!owned(element) || !element.dataset?.meridianOverlay) continue;
      const state = states.get(element) ?? {
        desired: false,
        suppress: false,
        previous: null,
      };
      states.set(element, state);
      const desired = element.dataset.open === "true";
      const dialog = element.dataset.meridianOverlay === "dialog";
      const visible = dialog ? element.open : element.matches(":popover-open");
      if (desired && !visible) {
        state.previous = doc.activeElement;
        state.desired = true;
        if (dialog) {
          if (element.dataset.modal === "false") element.show();
          else element.showModal();
        } else {
          element.showPopover();
          reposition();
          (
            element.querySelector("[autofocus]") ??
            focusable(element) ??
            element
          ).focus({ preventScroll: true });
        }
      } else if (!desired && visible) {
        state.desired = false;
        state.suppress = true;
        if (dialog) element.close();
        else element.hidePopover();
        state.suppress = false;
        restore(element, state);
      } else state.desired = desired;
    }
    reposition();
  };
  signal.addEventListener(
    "abort",
    () => {
      for (const [element] of states) {
        if (element.dataset.meridianOverlay === "dialog" && element.open)
          element.close();
        else if (
          element.dataset.meridianOverlay === "popover" &&
          element.matches(":popover-open")
        )
          element.hidePopover();
      }
      states.clear();
    },
    { once: true },
  );
  return sync;
}
