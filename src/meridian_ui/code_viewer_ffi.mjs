import { setupCodeCopy } from "./code_copy_ffi.mjs";

export function setupCodeViewers(root, signal) {
  const syncCopy = setupCodeCopy(root, signal);
  const seen = new WeakMap();
  const fold = (viewer, button, collapsed) => {
    const start = Number(button.dataset.codeFold);
    const end = Number(button.dataset.codeEnd);
    const name = button.dataset.codeLabel;
    button.setAttribute("aria-expanded", String(!collapsed));
    button.setAttribute(
      "aria-label",
      `${collapsed ? "Expand" : "Collapse"} ${name}`,
    );
    button.dataset.tooltip = button.getAttribute("aria-label");
    for (const node of viewer.querySelectorAll(
      "[data-code-line], [data-code-number]",
    )) {
      const index = Number(node.dataset.codeLine ?? node.dataset.codeNumber);
      if (index > start && index < end) node.hidden = collapsed;
      if (index === start && node.hasAttribute("data-code-line"))
        node.dataset.codeCollapsed = String(collapsed);
    }
  };
  signal.addEventListener(
    "abort",
    () => {
      for (const viewer of root.querySelectorAll(".meridian-code-viewer"))
        if (viewer.closest(".meridian-ui") === root)
          for (const toggle of viewer.querySelectorAll("[data-code-fold]"))
            fold(viewer, toggle, false);
    },
    { once: true },
  );
  root.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest?.(
        "[data-code-fold], [data-code-action]",
      );
      if (!button || button.closest(".meridian-ui") !== root || button.disabled)
        return;
      const viewer = button.closest(".meridian-code-viewer");
      if (!viewer) return;
      if (button.hasAttribute("data-code-fold")) {
        fold(viewer, button, button.getAttribute("aria-expanded") === "true");
        return;
      }
      const action = button.dataset.codeAction;
      if (action !== "copy") {
        for (const toggle of viewer.querySelectorAll("[data-code-fold]"))
          fold(viewer, toggle, action === "collapse");
      }
    },
    { signal },
  );
  return () => {
    syncCopy();
    for (const viewer of root.querySelectorAll(".meridian-code-viewer")) {
      if (viewer.closest(".meridian-ui") !== root) continue;
      const key = `${viewer.querySelector("code")?.dataset.language}\n${viewer.dataset.codeSource}`;
      if (seen.get(viewer) === key) continue;
      seen.set(viewer, key);
      for (const line of viewer.querySelectorAll(
        "[data-code-line], [data-code-number]",
      )) {
        line.hidden = false;
        delete line.dataset.codeCollapsed;
      }
      for (const toggle of viewer.querySelectorAll("[data-code-fold]"))
        fold(viewer, toggle, false);
      viewer.querySelector(".meridian-code-status").textContent = "";
    }
  };
}
