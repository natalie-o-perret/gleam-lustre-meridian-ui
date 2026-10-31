export function setupEffects(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const owned = (node) => node?.closest?.(".meridian-ui") === root;
  const ripples = new Map();
  const focusAttributes = new Set();
  const watched = new Set();
  const observer = view.IntersectionObserver
    ? new view.IntersectionObserver((entries) => {
        if (signal.aborted) return;
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.dataset.meridianEntered = "true";
          } else if (entry.target.dataset.revealOnce === "false")
            delete entry.target.dataset.meridianEntered;
      })
    : null;
  const ripple = (control, x, y) => {
    if (
      !owned(control) ||
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
      const control = event.target.closest?.("[data-meridian-ripple]");
      if (control && event.button === 0)
        ripple(control, event.clientX, event.clientY);
    },
    { signal },
  );
  root.addEventListener(
    "keydown",
    (event) => {
      const control = event.target.closest?.("[data-meridian-ripple]");
      if (control && !event.repeat && ["Enter", " "].includes(event.key)) {
        const rect = control.getBoundingClientRect();
        ripple(control, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    },
    { signal },
  );
  root.addEventListener(
    "click",
    (event) => {
      const replay = event.target.closest?.("[data-meridian-replay]");
      if (replay && owned(replay) && !replay.matches(":disabled")) {
        const target = doc.getElementById(replay.dataset.meridianReplay);
        if (
          target &&
          root.contains(target) &&
          owned(target) &&
          target.hasAttribute("data-meridian-reveal")
        ) {
          observer?.unobserve(target);
          delete target.dataset.meridianEntered;
          target.scrollIntoView({ block: "nearest", behavior: "instant" });
          void view.getComputedStyle(target).opacity;
          if (observer) observer.observe(target);
          else target.dataset.meridianEntered = "true";
        }
      }
      const control = event.target.closest?.("[data-meridian-scroll-top]");
      if (
        !control ||
        !owned(control) ||
        control.matches(":disabled, [aria-disabled='true']")
      )
        return;
      const id = control.dataset.meridianScrollTop;
      const target = id ? doc.getElementById(id) : doc.scrollingElement;
      if (
        !target ||
        (id && target !== root && (!root.contains(target) || !owned(target)))
      )
        return;
      const focus = id ? target : (root.querySelector("h1") ?? root);
      if (!focus.hasAttribute("tabindex")) {
        focus.setAttribute("tabindex", "-1");
        focusAttributes.add(focus);
      }
      focus.focus({ preventScroll: true });
      focus.addEventListener(
        "blur",
        () => {
          if (
            focusAttributes.delete(focus) &&
            focus.getAttribute("tabindex") === "-1"
          )
            focus.removeAttribute("tabindex");
        },
        { once: true, signal },
      );
      (id ? target : view).scrollTo({
        top: 0,
        behavior: view.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    },
    { signal },
  );
  signal.addEventListener(
    "abort",
    () => {
      observer?.disconnect();
      for (const { node, timer } of ripples.values()) {
        view.clearTimeout(timer);
        node.remove();
      }
      for (const node of focusAttributes)
        if (node.getAttribute("tabindex") === "-1")
          node.removeAttribute("tabindex");
      focusAttributes.clear();
      ripples.clear();
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
