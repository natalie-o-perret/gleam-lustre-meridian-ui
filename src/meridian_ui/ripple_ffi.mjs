export function setupRipples(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const ripples = new Map();
  const target = (event) =>
    event.target.closest?.(
      root.dataset.meridianRipples === "true"
        ? "button, [role='button'], [data-meridian-ripple]"
        : "[data-meridian-ripple]",
    );
  const ripple = (control, x, y) => {
    if (
      root.dataset.meridianRipples === "false" ||
      control.closest?.(".meridian-ui") !== root ||
      control.matches(":disabled, [aria-disabled='true'], input, img") ||
      view.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      view.matchMedia("(forced-colors: active)").matches
    )
      return;
    const previous = ripples.get(control);
    if (previous) {
      view.clearTimeout(previous.timer);
      previous.node.remove();
    }
    const bounds = control.getBoundingClientRect();
    const size = Math.max(bounds.width, bounds.height) * 2;
    const node = doc.createElement("span");
    node.className = "meridian-ripple-effect";
    node.setAttribute("aria-hidden", "true");
    Object.assign(node.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${x - bounds.left - size / 2}px`,
      top: `${y - bounds.top - size / 2}px`,
    });
    control.append(node);
    const timer = view.setTimeout(() => {
      node.remove();
      ripples.delete(control);
    }, 500);
    ripples.set(control, { node, timer });
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
      const control = target(event);
      if (control && !event.repeat && ["Enter", " "].includes(event.key)) {
        const rect = control.getBoundingClientRect();
        ripple(control, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    },
    { signal },
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
