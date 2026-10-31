export function setupMenus(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const owned = (node) => node?.closest?.(".meridian-ui") === root;
  const openContext = (region, x, y) =>
    region.dispatchEvent(
      new view.CustomEvent("meridian-context", {
        bubbles: true,
        detail: { x: Math.round(x), y: Math.round(y) },
      }),
    );
  root.addEventListener(
    "contextmenu",
    (event) => {
      const region = event.target.closest?.("[data-meridian-context]");
      if (
        !region ||
        !owned(region) ||
        event.target.closest("[data-meridian-overlay]")
      )
        return;
      event.preventDefault();
      openContext(region, event.clientX, event.clientY);
    },
    { signal },
  );
  root.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "ArrowDown" && event.target.dataset?.commandSearch) {
        const command = event.target.closest("[data-meridian-command]");
        const first = command?.querySelector(
          "[data-command-item]:not(:disabled)",
        );
        if (first) {
          event.preventDefault();
          first.focus();
        }
      }
      if (
        event.key !== "ContextMenu" &&
        !(event.shiftKey && event.key === "F10")
      )
        return;
      const region = event.target.closest?.("[data-meridian-context]");
      if (!region || !owned(region)) return;
      event.preventDefault();
      const bounds = event.target.getBoundingClientRect();
      openContext(region, bounds.left, bounds.bottom);
    },
    { signal },
  );
  const items = (menu) =>
    [...menu.querySelectorAll('[role="menuitem"]')].filter(
      (node) =>
        node.closest("[data-meridian-menu]") === menu &&
        !node.matches(':disabled, [aria-disabled="true"]') &&
        !node.closest("[hidden], [inert]"),
    );
  const sync = (menu) => {
    const controls = items(menu);
    const current =
      controls.find((node) => node === doc.activeElement) ??
      controls.find((node) => node.tabIndex === 0) ??
      controls[0];
    for (const node of controls) node.tabIndex = node === current ? 0 : -1;
  };
  const position = (menu) => {
    if (
      menu.hidden ||
      !menu.dataset.menuParent ||
      !menu.closest(".meridian-tiered-menu")
    )
      return;
    const parent = doc.getElementById(menu.dataset.menuParent);
    if (!parent) return;
    const bounds = parent.getBoundingClientRect();
    const width = menu.offsetWidth;
    const rtl = view.getComputedStyle(menu).direction === "rtl";
    let left = rtl ? bounds.left - width - 4 : bounds.right + 4;
    if (left < 8 || left + width > view.innerWidth - 8)
      left = rtl ? bounds.right + 4 : bounds.left - width - 4;
    menu.style.left = `${Math.max(8, Math.min(left, view.innerWidth - width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(bounds.top, view.innerHeight - menu.offsetHeight - 8))}px`;
  };
  const reposition = () => {
    for (const menu of root.querySelectorAll(
      ".meridian-tiered-menu [data-menu-parent]",
    ))
      if (owned(menu)) position(menu);
  };
  view.addEventListener("resize", reposition, { signal });
  doc.addEventListener("scroll", reposition, {
    signal,
    capture: true,
    passive: true,
  });
  root.addEventListener(
    "focusin",
    (event) => {
      const menu = event.target.closest?.("[data-meridian-menu]");
      if (menu && owned(menu)) sync(menu);
    },
    { signal },
  );
  let pending = null;
  let typed = "";
  let time = 0;
  root.addEventListener(
    "keydown",
    (event) => {
      const menu = event.target.closest?.("[data-meridian-menu]");
      if (
        !menu ||
        !owned(menu) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.isComposing
      )
        return;
      const controls = items(menu);
      const current = event.target.closest('[role="menuitem"]');
      const index = controls.indexOf(current);
      if (index < 0) return;
      const horizontal = menu.getAttribute("role") === "menubar";
      const rtl = view.getComputedStyle(menu).direction === "rtl";
      const next = horizontal
        ? rtl
          ? "ArrowLeft"
          : "ArrowRight"
        : "ArrowDown";
      const prev = horizontal ? (rtl ? "ArrowRight" : "ArrowLeft") : "ArrowUp";
      const expand = horizontal
        ? "ArrowDown"
        : rtl
          ? "ArrowLeft"
          : "ArrowRight";
      const collapse = rtl ? "ArrowRight" : "ArrowLeft";
      let target;
      if (event.key === next) target = controls[(index + 1) % controls.length];
      else if (event.key === prev)
        target = controls[(index - 1 + controls.length) % controls.length];
      else if (event.key === "Home") target = controls[0];
      else if (event.key === "End") target = controls.at(-1);
      else if (event.key === expand && current.dataset.menuToggle) {
        if (current.getAttribute("aria-expanded") !== "true") current.click();
        pending = current.getAttribute("aria-controls");
      } else if (
        (event.key === collapse || event.key === "Escape") &&
        menu.dataset.menuParent
      ) {
        const parent = doc.getElementById(menu.dataset.menuParent);
        if (parent?.getAttribute("aria-expanded") === "true") parent.click();
        target = parent;
      } else if (event.key === "Tab") return;
      else if (event.key.length === 1 && event.key !== " ") {
        const now = Date.now();
        typed = now - time < 700 ? typed + event.key : event.key;
        time = now;
        target = [
          ...controls.slice(index + 1),
          ...controls.slice(0, index + 1),
        ].find((node) =>
          node.textContent
            .trim()
            .toLocaleLowerCase()
            .startsWith(typed.toLocaleLowerCase()),
        );
      } else return;
      event.preventDefault();
      target?.focus();
      sync(menu);
    },
    { signal },
  );
  return () => {
    for (const menu of root.querySelectorAll("[data-meridian-menu]"))
      if (owned(menu)) {
        sync(menu);
        position(menu);
      }
    if (pending) {
      const menu = doc.getElementById(pending);
      if (menu && owned(menu) && !menu.hidden) {
        items(menu)[0]?.focus();
        pending = null;
      }
    }
  };
}
