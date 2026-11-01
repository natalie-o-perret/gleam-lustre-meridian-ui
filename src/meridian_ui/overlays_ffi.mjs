export function viewportBounds(view) {
  const visual = view.visualViewport;
  const padding = view.document
    ? view.getComputedStyle(view.document.documentElement)
    : {};
  const inset = (value, size) =>
    value?.endsWith("%")
      ? (parseFloat(value) * size) / 100
      : parseFloat(value) || 0;
  const width = visual?.width ?? view.innerWidth;
  const height = visual?.height ?? view.innerHeight;
  const layoutWidth =
    view.document?.documentElement.getBoundingClientRect?.().width ??
    view.innerWidth;
  const area = {
    left: (visual?.offsetLeft ?? 0) + inset(padding.scrollPaddingLeft, width),
    top: (visual?.offsetTop ?? 0) + inset(padding.scrollPaddingTop, height),
    right:
      Math.min((visual?.offsetLeft ?? 0) + width, layoutWidth) -
      inset(padding.scrollPaddingRight, width),
    bottom:
      (visual?.offsetTop ?? 0) +
      height -
      inset(padding.scrollPaddingBottom, height),
  };
  // Cross-origin hosts own their frame's visible area.
  try {
    const frame = view.frameElement;
    if (frame) {
      const parent = viewportBounds(frame.ownerDocument.defaultView);
      const rect = frame.getBoundingClientRect();
      const scaleX = rect.width / frame.offsetWidth || 1;
      const scaleY = rect.height / frame.offsetHeight || 1;
      const left = rect.left + frame.clientLeft * scaleX;
      const top = rect.top + frame.clientTop * scaleY;
      area.left = Math.max(area.left, (parent.left - left) / scaleX);
      area.top = Math.max(area.top, (parent.top - top) / scaleY);
      area.right = Math.min(area.right, (parent.right - left) / scaleX);
      area.bottom = Math.min(area.bottom, (parent.bottom - top) / scaleY);
    }
  } catch {
    // The frame's own viewport still constrains cross-origin embeds.
  }
  return area;
}

export function watchViewport(view, reposition, signal) {
  while (view) {
    view.addEventListener("resize", reposition, { signal });
    view.document?.addEventListener("scroll", reposition, {
      signal,
      capture: true,
      passive: true,
    });
    for (const type of ["resize", "scroll"])
      view.visualViewport?.addEventListener(type, reposition, { signal });
    try {
      view = view.frameElement?.ownerDocument.defaultView;
    } catch {
      break;
    }
  }
}

export function positionOverlay(
  popup,
  anchor,
  view,
  keepAnchorVisible = false,
) {
  const context = popup.dataset?.contextX !== undefined;
  if (!anchor && !context) return;
  const area = viewportBounds(view);
  const scale = popup.getBoundingClientRect?.().width / popup.offsetWidth || 1;
  for (const edge of ["left", "top", "right", "bottom"]) area[edge] /= scale;
  popup.style.setProperty(
    "--meridian-overlay-width",
    `${Math.max(0, area.right - area.left - 16)}px`,
  );
  const anchorBounds = context
    ? {
        left: Number(popup.dataset.contextX),
        top: Number(popup.dataset.contextY),
      }
    : anchor.getBoundingClientRect();
  const bounds = {
    left: anchorBounds.left / scale,
    top: anchorBounds.top / scale,
    right: anchorBounds.right / scale,
    bottom: anchorBounds.bottom / scale,
  };
  const belowTop = Math.max(area.top + 8, bounds.bottom + 6);
  const aboveBottom = Math.min(area.bottom - 8, bounds.top - 6);
  const below = Math.max(0, area.bottom - belowTop - 8);
  const above = Math.max(0, aboveBottom - area.top - 8);
  popup.style.setProperty(
    "--meridian-overlay-height",
    `${keepAnchorVisible && !context ? Math.max(below, above) : Math.max(0, area.bottom - area.top - 16)}px`,
  );
  const width = popup.offsetWidth;
  const height = popup.offsetHeight;
  const top = context
    ? bounds.top
    : below >= height || (keepAnchorVisible && below >= above)
      ? belowTop
      : above >= height || keepAnchorVisible
        ? aboveBottom - height
        : area.top + (area.bottom - area.top - height) / 2;
  const rtl = !context && view.getComputedStyle(anchor).direction === "rtl";
  const left = rtl ? bounds.right - width : bounds.left;
  popup.style.left = `${Math.max(area.left + 8, Math.min(left, area.right - width - 8))}px`;
  popup.style.top = `${Math.max(area.top + 8, Math.min(top, area.bottom - height - 8))}px`;
}

export function preserveScroll(view, action) {
  const positions = [];
  while (view) {
    positions.push([view, view.scrollX, view.scrollY]);
    try {
      view = view.frameElement?.ownerDocument.defaultView;
    } catch {
      break;
    }
  }
  try {
    return action();
  } finally {
    for (const [page, left, top] of positions)
      page.scrollTo({ left, top, behavior: "instant" });
  }
}

function positionDialog(dialog, view) {
  const area = viewportBounds(view);
  const drawer = dialog.classList.contains("meridian-drawer");
  const gap = drawer ? 0 : 16;
  dialog.style.setProperty(
    "--meridian-overlay-width",
    `${Math.max(0, area.right - area.left - gap * 2)}px`,
  );
  dialog.style.setProperty(
    "--meridian-overlay-height",
    `${Math.max(0, area.bottom - area.top - gap * 2)}px`,
  );
  dialog.style.inset = "auto";
  if (drawer) {
    const side = dialog.dataset.side;
    const rtl = view.getComputedStyle(dialog).direction === "rtl";
    const left =
      side === "left" ||
      (side === "start" && !rtl) ||
      (side === "end" && rtl) ||
      side === "top" ||
      side === "bottom";
    dialog.style.left = `${left ? area.left : area.right - dialog.offsetWidth}px`;
    dialog.style.top = `${side === "bottom" ? area.bottom - dialog.offsetHeight : area.top}px`;
    return;
  }
  dialog.style.left = `${Math.max(area.left + 16, area.left + (area.right - area.left - dialog.offsetWidth) / 2)}px`;
  dialog.style.top = `${Math.max(area.top + 16, area.top + (area.bottom - area.top - dialog.offsetHeight) / 2)}px`;
}

export function setupOverlays(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const states = new Map();
  const owned = (element) => element?.closest?.(".meridian-ui") === root;
  let opener;
  root.addEventListener(
    "pointerdown",
    (event) => {
      const target = event.target.closest?.("[data-meridian-opener]");
      opener = owned(target) ? target : undefined;
    },
    { signal, capture: true },
  );
  const emitClose = (element) =>
    element.dispatchEvent(
      new view.CustomEvent("meridian-close", { bubbles: true }),
    );
  const focusable = (element) =>
    [
      ...element.querySelectorAll(
        "[autofocus], button, a[href], input, select, textarea, [tabindex]",
      ),
    ].find(
      (node) =>
        !node.matches(":disabled, [tabindex='-1']") &&
        !node.closest("[inert], [hidden]") &&
        node.getClientRects().length,
    );
  const restore = (element, state) => {
    if (
      doc.activeElement !== doc.body &&
      doc.activeElement !== state.previous &&
      !element.contains(doc.activeElement)
    )
      return;
    const frame = view.frameElement;
    // Firefox may need its embedded window reactivated after a modal closes.
    if (frame && frame.ownerDocument.activeElement === frame) view.focus();
    const previous = state.previous;
    if (
      previous?.isConnected &&
      previous.getClientRects().length &&
      !previous.closest?.("[inert], [hidden]")
    ) {
      previous.focus({ preventScroll: true });
    } else {
      const fallback = [
        ...root.querySelectorAll("[data-meridian-opener]"),
      ].find((node) => node.dataset.meridianOpener === element.id);
      fallback?.focus({ preventScroll: true });
    }
  };
  const nativeClosed = (element, before = false) => {
    const state = states.get(element);
    if (!state || state.suppress || element.dataset.open !== "true") return;
    state.desired = false;
    element.dataset.open = "false";
    emitClose(element);
    if (before) state.nativeDismissed = true;
    else restore(element, state);
  };
  root.addEventListener(
    "cancel",
    (event) => {
      const element = event.target;
      if (!owned(element) || element.dataset?.meridianOverlay !== "dialog")
        return;
      event.preventDefault();
      emitClose(element);
    },
    { signal, capture: true },
  );
  root.addEventListener(
    "close",
    (event) => {
      if (
        owned(event.target) &&
        event.target.dataset?.meridianOverlay === "dialog"
      )
        nativeClosed(event.target);
    },
    { signal, capture: true },
  );
  root.addEventListener(
    "beforetoggle",
    (event) => {
      if (
        owned(event.target) &&
        event.target.dataset?.meridianOverlay === "popover" &&
        event.newState === "closed"
      )
        nativeClosed(event.target, true);
    },
    { signal, capture: true },
  );
  root.addEventListener(
    "toggle",
    (event) => {
      if (
        owned(event.target) &&
        event.target.dataset?.meridianOverlay === "popover" &&
        event.newState === "closed"
      ) {
        const state = states.get(event.target);
        if (state?.nativeDismissed) {
          state.nativeDismissed = false;
          restore(event.target, state);
        }
      }
    },
    { signal, capture: true },
  );
  const reposition = () => {
    for (const [element, state] of states) {
      if (
        state.desired &&
        element.open &&
        element.classList.contains("meridian-dialog")
      )
        positionDialog(element, view);
      if (
        state.desired &&
        element.dataset.meridianOverlay === "popover" &&
        element.matches(":popover-open")
      ) {
        const anchor = [
          ...root.querySelectorAll("[data-meridian-opener]"),
        ].find((node) => node.dataset.meridianOpener === element.id);
        positionOverlay(element, anchor, view);
      }
    }
  };
  watchViewport(view, reposition, signal);
  doc.addEventListener(
    "pointerdown",
    (event) => {
      for (const [element, state] of states) {
        if (
          !state.desired ||
          element.dataset.meridianOverlay !== "popover" ||
          !element.matches(":popover-open") ||
          element.contains(event.target)
        )
          continue;
        const opener = event.target.closest?.("[data-meridian-opener]");
        if (opener?.dataset.meridianOpener !== element.id)
          element.hidePopover();
      }
    },
    { signal, capture: true },
  );
  const sync = () => {
    for (const [element] of states)
      if (!element.isConnected || !owned(element)) states.delete(element);
    for (const element of root.querySelectorAll("[data-meridian-overlay]")) {
      if (!owned(element) || !element.dataset?.meridianOverlay) continue;
      const state = states.get(element) ?? {
        desired: false,
        suppress: false,
        previous: null,
      };
      states.set(element, state);
      const desired = element.dataset.open === "true";
      const dialog = element.dataset.meridianOverlay === "dialog";
      const visible = dialog ? element.open : element.matches(":popover-open");
      if (desired && !visible) {
        state.previous =
          opener?.dataset.meridianOpener === element.id
            ? opener
            : doc.activeElement;
        opener = undefined;
        state.desired = true;
        if (dialog) {
          preserveScroll(view, () => {
            if (element.dataset.modal === "false") element.show();
            else element.showModal();
            reposition();
          });
        } else {
          element.showPopover();
          reposition();
          (
            element.querySelector("[autofocus]") ??
            focusable(element) ??
            element
          ).focus({ preventScroll: true });
        }
      } else if (!desired && visible) {
        state.desired = false;
        state.suppress = true;
        if (dialog) element.close();
        else element.hidePopover();
        state.suppress = false;
        restore(element, state);
      } else state.desired = desired;
    }
    reposition();
  };
  signal.addEventListener(
    "abort",
    () => {
      for (const [element] of states) {
        if (element.dataset.meridianOverlay === "dialog" && element.open)
          element.close();
        else if (
          element.dataset.meridianOverlay === "popover" &&
          element.matches(":popover-open")
        )
          element.hidePopover();
      }
      states.clear();
    },
    { once: true },
  );
  return sync;
}
