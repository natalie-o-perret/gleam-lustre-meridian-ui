// Project the same-origin example into the page without moving Lustre-owned nodes.
export function previewToasts(frame) {
  const source = frame.contentDocument.getElementById("demo-root");
  const view = frame.contentWindow;
  const doc = frame.ownerDocument;
  const host = doc.createElement("div");
  host.className = "meridian-ui docs-preview-toasts";
  doc.body.append(host);
  const controller = new AbortController();
  const stacks = new Map();
  const pause = (original, paused) =>
    original.dispatchEvent(
      new view.CustomEvent("meridian-toast-pause", {
        bubbles: true,
        detail: paused,
      }),
    );
  const hoverFocus = () => {
    for (const { notices } of stacks.values())
      for (const [original, { copy }] of notices)
        pause(
          original,
          copy.matches(":hover") || copy.contains(doc.activeElement),
        );
  };
  for (const type of ["pointerover", "pointerout", "focusin", "focusout"])
    host.addEventListener(type, () => queueMicrotask(hoverFocus), {
      signal: controller.signal,
    });
  const remove = (original, stack) => {
    original.hidden = false;
    for (const notice of stack.notices.keys()) pause(notice, false);
    stack.copy.remove();
    stacks.delete(original);
  };
  const sync = () => {
    host.dataset.theme = source.dataset.theme;
    host.dataset.style = source.dataset.style;
    host.style.cssText = source.style.cssText;
    host.dir = source.ownerDocument.documentElement.dir;
    for (const [original, stack] of stacks)
      if (
        !source.contains(original) ||
        original.dataset.toastPosition === "inline"
      )
        remove(original, stack);
    for (const original of source.querySelectorAll(
      '.meridian-toasts:not([data-toast-position="inline"])',
    )) {
      let stack = stacks.get(original);
      if (!stack) {
        const copy = original.cloneNode(false);
        copy.removeAttribute("id");
        copy.hidden = false;
        stack = { copy, notices: new Map() };
        stacks.set(original, stack);
        host.append(copy);
      }
      if (!original.hidden) original.hidden = true;
      stack.copy.dataset.toastPosition = original.dataset.toastPosition;
      let restoreFocus = false;
      for (const [notice, { copy }] of stack.notices)
        if (!original.contains(notice)) {
          restoreFocus ||= copy.contains(doc.activeElement);
          copy.remove();
          stack.notices.delete(notice);
        }
      for (const [index, notice] of [...original.children].entries()) {
        let mirrored = stack.notices.get(notice);
        if (!mirrored) {
          const copy = notice.cloneNode(false);
          mirrored = { copy };
          stack.notices.set(notice, mirrored);
          copy.addEventListener(
            "click",
            (event) => {
              if (event.target.closest("button"))
                notice.querySelector("button")?.click();
            },
            { signal: controller.signal },
          );
        }
        const markup = notice.innerHTML;
        if (mirrored.markup !== markup) {
          const focused = mirrored.copy.contains(doc.activeElement);
          mirrored.copy.replaceChildren(...notice.cloneNode(true).childNodes);
          mirrored.markup = markup;
          if (focused)
            mirrored.copy
              .querySelector("button")
              ?.focus({ preventScroll: true });
        }
        if (stack.copy.children[index] !== mirrored.copy)
          stack.copy.insertBefore(
            mirrored.copy,
            stack.copy.children[index] ?? null,
          );
      }
      if (restoreFocus) {
        const next = stack.copy.querySelector("button") ?? stack.copy;
        if (!next.hasAttribute("tabindex")) next.tabIndex = -1;
        next.focus({ preventScroll: true });
      }
    }
    hoverFocus();
  };
  const observer = new MutationObserver(sync);
  observer.observe(source, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true,
  });
  sync();
  return () => {
    observer.disconnect();
    controller.abort();
    for (const [original, stack] of stacks) remove(original, stack);
    host.remove();
  };
}
