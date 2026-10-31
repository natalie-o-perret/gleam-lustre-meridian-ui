export function setupCarousels(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const interactive =
    "a, button, input, select, textarea, [contenteditable]:not([contenteditable='false']), [draggable='true']";
  let drag;
  let suppressClick;
  const release = () => {
    const active = drag;
    drag = undefined;
    if (!active) return;
    delete active.area.dataset.dragging;
    active.slide.style.translate = "";
    if (active.area.hasPointerCapture(active.id))
      active.area.releasePointerCapture(active.id);
  };
  root.addEventListener(
    "pointerdown",
    (event) => {
      suppressClick = undefined;
      if (event.button !== 0 || !event.isPrimary || drag) return;
      const area = event.target.closest?.(".meridian-carousel-slides");
      const carousel = area?.closest("[data-meridian-carousel]");
      if (
        !carousel ||
        carousel.closest(".meridian-ui") !== root ||
        area.children.length < 2 ||
        event.target.closest(interactive)
      )
        return;
      const slide = [...area.children].find((node) => !node.hidden);
      if (slide)
        drag = {
          area,
          carousel,
          slide,
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          moved: false,
        };
    },
    { signal },
  );
  doc.addEventListener(
    "pointermove",
    (event) => {
      if (drag?.id !== event.pointerId) return;
      const { area, slide } = drag;
      if (!area.isConnected || slide.hidden) {
        release();
        return;
      }
      const x = event.clientX - drag.x;
      const y = event.clientY - drag.y;
      if (!drag.moved) {
        if (Math.abs(y) > 12 && Math.abs(y) >= Math.abs(x)) {
          release();
          return;
        }
        if (Math.abs(x) < 12 || Math.abs(x) <= Math.abs(y)) return;
        drag.moved = true;
        area.dataset.dragging = "true";
        area.setPointerCapture(event.pointerId);
        view.getSelection()?.removeAllRanges();
      }
      event.preventDefault();
      slide.style.translate = `${x}px 0`;
    },
    { signal, passive: false },
  );
  doc.addEventListener(
    "pointerup",
    (event) => {
      if (drag?.id !== event.pointerId) return;
      const { area, carousel, slide, moved, x } = drag;
      const distance = event.clientX - x;
      const threshold = Math.min(80, Math.max(30, area.clientWidth * 0.2));
      const change =
        moved &&
        Math.abs(distance) >= threshold &&
        area.isConnected &&
        !slide.hidden;
      if (moved) suppressClick = area;
      release();
      if (change) {
        const rtl = view.getComputedStyle(carousel).direction === "rtl";
        carousel.dispatchEvent(
          new view.CustomEvent("meridian-swipe", {
            bubbles: true,
            detail: (distance < 0 ? 1 : -1) * (rtl ? -1 : 1),
          }),
        );
      }
    },
    { signal },
  );
  const cancel = (event) => {
    if (drag?.id === event.pointerId) release();
  };
  doc.addEventListener("pointercancel", cancel, { signal });
  root.addEventListener(
    "lostpointercapture",
    (event) => {
      if (event.target === drag?.area) cancel(event);
    },
    { signal },
  );
  root.addEventListener(
    "dragstart",
    (event) => {
      if (
        drag &&
        drag.area.contains(event.target) &&
        !event.target.closest(interactive)
      )
        event.preventDefault();
    },
    { signal },
  );
  root.addEventListener(
    "click",
    (event) => {
      if (event.detail && suppressClick?.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressClick = undefined;
      }
    },
    { signal, capture: true },
  );
  signal.addEventListener("abort", release, { once: true });
}
