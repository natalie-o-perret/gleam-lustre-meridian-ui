import { setupTooltips } from "./tooltip_ffi.mjs";
import { watchSystemTheme } from "./theme_ffi.mjs";
import { setupWidgets } from "./widgets_ffi.mjs";

const mounted = new WeakMap();
const controls = (root) =>
  [
    ...root.querySelectorAll(
      '.sidebar a[href], .sidebar button:not(:disabled), .sidebar input:not(:disabled), .sidebar select:not(:disabled), .sidebar textarea:not(:disabled), .sidebar [tabindex]:not([tabindex="-1"])',
    ),
  ].filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled") &&
      element.getClientRects().length &&
      root.ownerDocument.defaultView.getComputedStyle(element).visibility !==
        "hidden" &&
      !element.closest("[inert]") &&
      element.closest(".meridian-ui") === root,
  );

export function focusMenu(id) {
  const root = document.getElementById(id);
  if (!root) return;
  const button = root.querySelector(".menu-button");
  const target = button?.getClientRects().length ? button : controls(root)[0];
  target?.focus({ preventScroll: true });
}

export function focusNavigation(id) {
  const root = document.getElementById(id);
  if (!root) return;
  (root.querySelector(".drawer-close") ?? controls(root)[0])?.focus({
    preventScroll: true,
  });
}

export function mount(id, onSystemTheme, onDesktop) {
  const root = document.getElementById(id);
  if (!root) throw new Error(`Meridian UI root not found: ${id}`);
  mounted.get(root)?.();
  const view = root.ownerDocument.defaultView;
  const controller = new view.AbortController();
  const { signal } = controller;
  const removeTooltips = setupTooltips(root, signal);
  const stopTheme = watchSystemTheme(onSystemTheme, view);
  const syncWidgets = setupWidgets(root, signal);
  const mobile = view.matchMedia?.("(max-width: 800px)");
  mobile?.addEventListener(
    "change",
    (event) => {
      if (!event.matches) onDesktop();
    },
    { signal },
  );
  root.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !== "Tab" ||
        !mobile?.matches ||
        !root.classList.contains("menu-open")
      )
        return;
      const elements = controls(root);
      const first = elements[0];
      const last = elements.at(-1);
      const active = root.ownerDocument.activeElement;
      if (!first) return;
      if (event.shiftKey && (active === first || !elements.includes(active))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !elements.includes(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    },
    { signal },
  );
  // Lustre applications have no unmount effect, so also dispose removed roots.
  const observer = new view.MutationObserver((records) => {
    if (!root.isConnected) dispose();
    else if (records?.some((record) => root.contains(record.target)))
      syncWidgets();
  });
  observer.observe(root.ownerDocument, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "aria-selected",
      "hidden",
      "disabled",
      "data-meridian-keys",
      "data-open",
      "data-meridian-trap",
      "data-meridian-block",
      "data-meridian-inplace",
      "data-value",
      "data-context-x",
      "data-context-y",
      "data-timeout",
      "min",
      "max",
      "step",
      "required",
      "open",
    ],
  });
  function dispose() {
    if (signal.aborted) return;
    controller.abort();
    observer.disconnect();
    removeTooltips();
    stopTheme();
    mounted.delete(root);
  }
  mounted.set(root, dispose);
  return dispose;
}
