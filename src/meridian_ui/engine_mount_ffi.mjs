const mounted = new WeakMap();

export function mountEngine(id, attribute, create) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Meridian engine container not found: ${id}`);
  mounted.get(element)?.();
  const view = element.ownerDocument.defaultView;
  const engine = create(element, view);
  let disposed = false;
  let data = null;
  let theme = null;
  let direction = null;
  const sync = () => {
    if (!element.isConnected) {
      dispose();
      return;
    }
    const next = element.getAttribute(attribute);
    const root = element.closest(".meridian-ui");
    const nextTheme = root?.dataset.theme ?? "light";
    const nextDirection = view.getComputedStyle(element).direction;
    if (next !== data || nextTheme !== theme || nextDirection !== direction) {
      data = next;
      theme = nextTheme;
      direction = nextDirection;
      engine.update(JSON.parse(next), theme, direction);
    }
  };
  const observer = new view.MutationObserver(sync);
  observer.observe(element.ownerDocument, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [attribute, "data-theme", "dir"],
  });
  let frame = null;
  const resize = view.ResizeObserver
    ? new view.ResizeObserver(() => {
        // Auto-sized engines can change the observed height while resizing.
        if (frame === null)
          frame = view.requestAnimationFrame(() => {
            frame = null;
            if (!disposed && element.isConnected) engine.resize?.();
          });
      })
    : null;
  resize?.observe(element);
  function dispose() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    resize?.disconnect();
    if (frame !== null) view.cancelAnimationFrame(frame);
    engine.destroy();
    mounted.delete(element);
  }
  sync();
  mounted.set(element, dispose);
  return dispose;
}
