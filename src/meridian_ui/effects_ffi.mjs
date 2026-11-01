import { setupRipples } from "./ripple_ffi.mjs";
import { setupScrollTop } from "./scroll_top_ffi.mjs";

export function setupEffects(root, signal) {
  const view = root.ownerDocument.defaultView;
  const owned = (node) => node?.closest?.(".meridian-ui") === root;
  const watched = new Set();
  setupRipples(root, signal);
  setupScrollTop(root, signal);
  const observer = view.IntersectionObserver
    ? new view.IntersectionObserver((entries) => {
        if (signal.aborted) return;
        for (const entry of entries)
          if (entry.isIntersecting)
            entry.target.dataset.meridianEntered = "true";
          else if (entry.target.dataset.revealOnce === "false")
            delete entry.target.dataset.meridianEntered;
      })
    : null;
  root.addEventListener(
    "click",
    (event) => {
      const replay = event.target.closest?.("[data-meridian-replay]");
      if (!replay || !owned(replay) || replay.matches(":disabled")) return;
      const target = root.ownerDocument.getElementById(
        replay.dataset.meridianReplay,
      );
      if (
        !target ||
        !root.contains(target) ||
        !owned(target) ||
        !target.hasAttribute("data-meridian-reveal")
      )
        return;
      observer?.unobserve(target);
      delete target.dataset.meridianEntered;
      target.scrollIntoView({ block: "nearest", behavior: "instant" });
      void view.getComputedStyle(target).opacity;
      if (observer) observer.observe(target);
      else target.dataset.meridianEntered = "true";
    },
    { signal },
  );
  signal.addEventListener(
    "abort",
    () => {
      observer?.disconnect();
      watched.clear();
    },
    { once: true },
  );
  return () => {
    for (const node of watched)
      if (!node.isConnected) {
        observer?.unobserve(node);
        watched.delete(node);
      }
    for (const node of root.querySelectorAll("[data-meridian-reveal]")) {
      if (!owned(node) || !node.dataset?.meridianReveal || watched.has(node))
        continue;
      watched.add(node);
      if (!observer) node.dataset.meridianEntered = "true";
      else {
        node.dataset.meridianRevealReady = "true";
        observer.observe(node);
      }
    }
  };
}
