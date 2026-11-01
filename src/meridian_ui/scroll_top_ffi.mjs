export function setupScrollTop(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const focusAttributes = new Set();
  root.addEventListener(
    "click",
    (event) => {
      const control = event.target.closest?.("[data-meridian-scroll-top]");
      if (
        !control ||
        control.closest?.(".meridian-ui") !== root ||
        control.matches(":disabled, [aria-disabled='true']")
      )
        return;
      const id = control.dataset.meridianScrollTop;
      const target = id ? doc.getElementById(id) : doc.scrollingElement;
      if (
        !target ||
        (id &&
          target !== root &&
          (!root.contains(target) || target.closest?.(".meridian-ui") !== root))
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
      for (const node of focusAttributes)
        if (node.getAttribute("tabindex") === "-1")
          node.removeAttribute("tabindex");
      focusAttributes.clear();
    },
    { once: true },
  );
}
