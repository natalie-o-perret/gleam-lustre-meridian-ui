export function tooltipPosition(target, tip, viewport) {
  const gap = 8;
  return {
    left: Math.max(
      gap,
      Math.min(
        target.left + (target.width - tip.width) / 2,
        viewport.width - tip.width - gap,
      ),
    ),
    top: Math.max(
      gap,
      target.bottom + tip.height + gap * 2 <= viewport.height
        ? target.bottom + gap
        : target.top - tip.height - gap,
    ),
  };
}

export function setupTooltips(root, signal) {
  const document = root.ownerDocument;
  const view = document.defaultView;
  const tip = document.createElement("div");
  tip.id = `${root.id}-tooltip`;
  tip.className = "tooltip-popover";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  if (tip.showPopover) tip.setAttribute("popover", "manual");
  root.append(tip);
  let trigger;
  let pendingTarget;
  let timer;

  function hide() {
    clearTimeout(timer);
    if (tip.hidePopover && tip.matches(":popover-open")) tip.hidePopover();
    tip.hidden = true;
    if (trigger) {
      const ids = (trigger.getAttribute("aria-describedby") || "")
        .split(/\s+/)
        .filter((id) => id && id !== tip.id);
      if (ids.length) trigger.setAttribute("aria-describedby", ids.join(" "));
      else trigger.removeAttribute("aria-describedby");
    }
    trigger = undefined;
    pendingTarget = undefined;
  }

  function position() {
    if (!trigger || tip.hidden) return;
    tip.style.left = "0px";
    tip.style.top = "0px";
    const bounds = tooltipPosition(
      trigger.getBoundingClientRect(),
      tip.getBoundingClientRect(),
      { width: view.innerWidth, height: view.innerHeight },
    );
    tip.style.left = `${bounds.left}px`;
    tip.style.top = `${bounds.top}px`;
  }

  function hasFocus() {
    return (trigger ?? pendingTarget)?.contains(document.activeElement);
  }

  function show(target, delay) {
    if (target === tip) {
      clearTimeout(timer);
      return;
    }
    const next = target.closest?.("[data-tooltip]");
    if (!next || next.closest(".meridian-ui") !== root) return;
    if (next === trigger) {
      clearTimeout(timer);
      return;
    }
    hide();
    pendingTarget = next;
    timer = setTimeout(() => {
      if (signal.aborted || !next.isConnected || !root.contains(next)) return;
      trigger = next;
      pendingTarget = undefined;
      tip.textContent = next.dataset.tooltip;
      tip.hidden = false;
      tip.showPopover?.();
      trigger.setAttribute(
        "aria-describedby",
        [trigger.getAttribute("aria-describedby"), tip.id]
          .filter(Boolean)
          .join(" "),
      );
      position();
    }, delay);
  }

  const options = { signal };
  root.addEventListener(
    "pointerover",
    (event) => show(event.target, 300),
    options,
  );
  root.addEventListener("focusin", (event) => show(event.target, 0), options);
  root.addEventListener(
    "pointerout",
    (event) => {
      if (
        hasFocus() ||
        trigger?.contains(event.relatedTarget) ||
        event.relatedTarget === tip
      )
        return;
      clearTimeout(timer);
      timer = setTimeout(hide, 100);
    },
    options,
  );
  tip.addEventListener("pointerenter", () => clearTimeout(timer), options);
  tip.addEventListener(
    "pointerleave",
    () => {
      if (!hasFocus()) hide();
    },
    options,
  );
  root.addEventListener("focusout", hide, options);
  root.addEventListener("click", hide, options);
  root.addEventListener("transitionend", position, options);
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") hide();
    },
    options,
  );
  // Keep keyboard hints visible while focus scrolls the control into view.
  const updatePosition = () => (hasFocus() ? position() : hide());
  document.addEventListener("scroll", updatePosition, {
    signal,
    capture: true,
  });
  view.addEventListener("resize", updatePosition, options);
  return () => {
    hide();
    tip.remove();
  };
}
