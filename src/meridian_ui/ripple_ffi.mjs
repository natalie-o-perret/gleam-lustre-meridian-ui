import { rippleTarget } from "./ripple_targets_ffi.mjs";

export function setupRipples(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const ripples = new Map();
  const target = (event) => rippleTarget(event.target, root);
  const ripple = (control, x, y) => {
    if (
      root.dataset.meridianRipples === "false" ||
      control.closest?.(".meridian-ui") !== root ||
      control.matches(":disabled, [aria-disabled='true'], input, img") ||
      view.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      view.matchMedia("(forced-colors: active)").matches
    )
      return;
    const bounds = control.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const previous = ripples.get(control);
    if (previous) {
      view.clearTimeout(previous.timer);
      previous.node.remove();
    }
    const width = control.offsetWidth || bounds.width;
    const height = control.offsetHeight || bounds.height;
    if (x < bounds.left || x > bounds.right) x = bounds.left + bounds.width / 2;
    if (y < bounds.top || y > bounds.bottom) y = bounds.top + bounds.height / 2;
    const size = Math.max(width, height) * 2;
    const clip = doc.createElement("span");
    clip.className = "meridian-ripple-clip";
    clip.setAttribute("aria-hidden", "true");
    const node = doc.createElement("span");
    node.className = "meridian-ripple-effect";
    node.setAttribute("aria-hidden", "true");
    Object.assign(node.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${((x - bounds.left) * width) / bounds.width - (control.clientLeft || 0) - size / 2}px`,
      top: `${((y - bounds.top) * height) / bounds.height - (control.clientTop || 0) - size / 2}px`,
    });
    clip.append(node);
    control.append(clip);
    const timer = view.setTimeout(() => {
      clip.remove();
      ripples.delete(control);
    }, 500);
    ripples.set(control, { node: clip, timer });
  };
  root.addEventListener(
    "pointerdown",
    (event) => {
      const control = target(event);
      if (control && event.button === 0)
        ripple(control, event.clientX, event.clientY);
    },
    { signal },
  );
  root.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === " " &&
        event.target.matches?.("a[href]:not([role='button'])")
      )
        return;
      if (event.key === "Enter" && event.target.matches?.("input")) return;
      const control = target(event);
      if (control && !event.repeat && ["Enter", " "].includes(event.key)) {
        const rect = control.getBoundingClientRect();
        ripple(control, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    },
    { signal, capture: true },
  );
  signal.addEventListener(
    "abort",
    () => {
      for (const { node, timer } of ripples.values()) {
        view.clearTimeout(timer);
        node.remove();
      }
      ripples.clear();
    },
    { once: true },
  );
}
