import { setupOverlays } from "./overlays_ffi.mjs";
import { setupForms } from "./forms_ffi.mjs";
import { setupKnobs } from "./knob_ffi.mjs";
import { setupFocus } from "./focus_ffi.mjs";
import { setupEffects } from "./effects_ffi.mjs";
import { setupTrees } from "./tree_ffi.mjs";
import { setupData } from "./data_ffi.mjs";
import { setupMenus } from "./menu_ffi.mjs";
import { setupToasts } from "./toast_ffi.mjs";
import { setupUploads } from "./upload_ffi.mjs";
import { setupDatePickers } from "./date_picker_ffi.mjs";
import { setupCarousels } from "./carousel_ffi.mjs";

export function keyDestination(key, index, count, orientation, rtl = false) {
  if (!count) return -1;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  const next =
    orientation === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
  const previous =
    orientation === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
  if (key === next) return (index + 1 + count) % count;
  if (key === previous) return (index - 1 + count) % count;
  return -1;
}

export function clampPercent(value, minimum = 0, maximum = 100) {
  const low = Math.max(
    0,
    Math.min(100, Number.isFinite(minimum) ? minimum : 0),
  );
  const high = Math.max(
    low,
    Math.min(100, Number.isFinite(maximum) ? maximum : 100),
  );
  return Math.max(
    low,
    Math.min(high, Number.isFinite(value) ? Math.round(value) : low),
  );
}

export function setupWidgets(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const syncOverlays = setupOverlays(root, signal);
  const syncForms = setupForms(root, signal);
  const syncKnobs = setupKnobs(root, signal);
  const syncFocus = setupFocus(root, signal);
  const syncEffects = setupEffects(root, signal);
  const syncTrees = setupTrees(root, signal);
  const syncData = setupData(root, signal);
  const syncMenus = setupMenus(root, signal);
  const syncToasts = setupToasts(root, signal);
  const syncDatePickers = setupDatePickers(root, signal);
  setupUploads(root, signal);
  setupCarousels(root, signal);
  const belongs = (element) => element?.closest?.(".meridian-ui") === root;
  const visible = (element) =>
    element.getClientRects().length &&
    !element.matches(":disabled, [aria-disabled='true']") &&
    !element.closest("[inert], [hidden]") &&
    view.getComputedStyle(element).visibility !== "hidden";
  const items = (group) =>
    [...group.querySelectorAll("[data-meridian-item]")].filter(
      (element) =>
        belongs(element) &&
        element.closest("[data-meridian-keys]") === group &&
        visible(element),
    );
  const syncGroup = (group) => {
    if (!["tabs", "toolbar"].includes(group.dataset?.meridianKeys)) return;
    const controls = items(group);
    const current =
      controls.find((element) => element === doc.activeElement) ??
      controls.find(
        (element) => element.getAttribute("aria-selected") === "true",
      ) ??
      controls.find((element) => element.tabIndex === 0) ??
      controls[0];
    for (const element of controls)
      element.tabIndex = element === current ? 0 : -1;
    group.tabIndex = controls.length ? -1 : 0;
  };
  const emit = (element, name, detail) =>
    element.dispatchEvent(
      new view.CustomEvent(name, { bubbles: true, detail }),
    );
  const resize = (handle, value) => {
    const result = clampPercent(
      value,
      Number(handle.getAttribute("aria-valuemin")),
      Number(handle.getAttribute("aria-valuemax")),
    );
    if (result !== Number(handle.dataset.value))
      emit(handle, "meridian-resize", { value: result });
  };
  root.addEventListener(
    "focusin",
    (event) => {
      const group = event.target.closest?.("[data-meridian-keys]");
      if (group && belongs(group)) syncGroup(group);
    },
    { signal },
  );
  root.addEventListener(
    "keydown",
    (event) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !belongs(event.target)
      )
        return;
      const handle = event.target.closest?.("[data-meridian-split]");
      if (handle) {
        if (handle.getAttribute("aria-disabled") === "true") return;
        const horizontal =
          handle.getAttribute("aria-orientation") === "vertical";
        const rtl =
          horizontal && view.getComputedStyle(handle).direction === "rtl";
        const value = Number(handle.dataset.value);
        const delta = event.shiftKey ? 10 : 1;
        const next = horizontal
          ? rtl
            ? "ArrowLeft"
            : "ArrowRight"
          : "ArrowDown";
        const previous = horizontal
          ? rtl
            ? "ArrowRight"
            : "ArrowLeft"
          : "ArrowUp";
        const target =
          event.key === "Home"
            ? Number(handle.getAttribute("aria-valuemin"))
            : event.key === "End"
              ? Number(handle.getAttribute("aria-valuemax"))
              : event.key === next
                ? value + delta
                : event.key === previous
                  ? value - delta
                  : null;
        if (target !== null) {
          event.preventDefault();
          resize(handle, target);
          view.requestAnimationFrame(() =>
            view.requestAnimationFrame(() => {
              if (
                !signal.aborted &&
                handle.isConnected &&
                doc.activeElement === handle
              )
                handle.scrollIntoView({ block: "nearest", inline: "nearest" });
            }),
          );
        }
        return;
      }
      const group = event.target.closest?.("[data-meridian-keys]");
      if (!group || !belongs(group)) return;
      if (
        event.target.matches?.(
          "textarea, select, input:not([type='checkbox']):not([type='radio']), [contenteditable='true']",
        )
      )
        return;
      const controls = items(group);
      const current = event.target.closest("[data-meridian-item]");
      const index = controls.indexOf(current);
      if (index < 0) return;
      const target = keyDestination(
        event.key,
        index,
        controls.length,
        group.getAttribute("aria-orientation") ??
          group.dataset.orientation ??
          "horizontal",
        view.getComputedStyle(group).direction === "rtl",
      );
      if (target < 0) return;
      event.preventDefault();
      controls[target].focus();
      if (
        group.dataset.meridianKeys === "rating" ||
        (group.dataset.meridianKeys === "tabs" &&
          group.dataset.activation === "automatic")
      )
        controls[target].click();
      syncGroup(group);
    },
    { signal },
  );
  let drag = null;
  root.addEventListener(
    "pointerdown",
    (event) => {
      const handle = event.target.closest?.("[data-meridian-split]");
      if (
        !handle ||
        !belongs(handle) ||
        event.button !== 0 ||
        handle.getAttribute("aria-disabled") === "true"
      )
        return;
      event.preventDefault();
      handle.focus({ preventScroll: true });
      drag = { handle, pointerId: event.pointerId };
      handle.setPointerCapture?.(event.pointerId);
    },
    { signal },
  );
  doc.addEventListener(
    "pointermove",
    (event) => {
      if (
        !drag ||
        event.pointerId !== drag.pointerId ||
        !drag.handle.isConnected
      )
        return;
      const { handle } = drag;
      const container = handle.parentElement;
      const bounds = container.getBoundingClientRect();
      const horizontal = container.dataset.orientation === "horizontal";
      const size = horizontal ? bounds.width : bounds.height;
      const grip = horizontal ? handle.offsetWidth : handle.offsetHeight;
      if (size <= grip) return;
      const offset = horizontal
        ? event.clientX - bounds.left
        : event.clientY - bounds.top;
      let value = ((offset - grip / 2) / (size - grip)) * 100;
      if (horizontal && view.getComputedStyle(container).direction === "rtl")
        value = 100 - value;
      resize(handle, value);
    },
    { signal },
  );
  const release = () => {
    const active = drag;
    drag = null;
    if (active?.handle.hasPointerCapture?.(active.pointerId)) {
      active.handle.releasePointerCapture(active.pointerId);
    }
  };
  const stop = (event) => {
    if (drag?.pointerId === event.pointerId) release();
  };
  doc.addEventListener("pointerup", stop, { signal });
  doc.addEventListener("pointercancel", stop, { signal });
  root.addEventListener("lostpointercapture", stop, { signal });
  signal.addEventListener("abort", release, { once: true });
  const sync = () => {
    syncOverlays();
    syncForms();
    syncKnobs();
    syncFocus();
    syncEffects();
    syncTrees();
    syncData();
    syncMenus();
    syncToasts();
    syncDatePickers();
    for (const group of root.querySelectorAll("[data-meridian-keys]")) {
      if (belongs(group)) syncGroup(group);
    }
  };
  sync();
  return sync;
}
