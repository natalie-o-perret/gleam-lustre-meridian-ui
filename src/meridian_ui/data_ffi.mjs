export function setupData(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const owned = (node) => node?.closest?.(".meridian-ui") === root;
  const emit = (node, name, detail) =>
    node.dispatchEvent(new view.CustomEvent(name, { bubbles: true, detail }));
  let drag = null;
  root.addEventListener(
    "dragstart",
    (event) => {
      const item = event.target.closest?.("[data-order-id]");
      const group = item?.closest("[data-meridian-order]");
      if (!group || !owned(group) || item.draggable !== true) return;
      drag = {
        group,
        id: item.dataset.orderId,
        board: group.closest("[data-meridian-board]"),
        pick: group.closest("[data-meridian-pick]"),
        pickSource: group.closest("[data-pick-side]")?.dataset.pickSide,
        source: group.closest("[data-board-column]")?.dataset.boardColumn,
      };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.dataset.orderId);
    },
    { signal },
  );
  root.addEventListener(
    "dragover",
    (event) => {
      if (
        drag &&
        (event.target.closest?.("[data-meridian-order]") === drag.group ||
          (drag.board &&
            event.target.closest?.("[data-meridian-board]") === drag.board) ||
          (drag.pick &&
            event.target.closest?.("[data-meridian-pick]") === drag.pick))
      ) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }
    },
    { signal },
  );
  root.addEventListener(
    "drop",
    (event) => {
      if (
        !drag ||
        (event.target.closest?.("[data-meridian-order]") !== drag.group &&
          !(
            drag.board &&
            event.target.closest?.("[data-meridian-board]") === drag.board
          ) &&
          !(
            drag.pick &&
            event.target.closest?.("[data-meridian-pick]") === drag.pick
          ))
      )
        return;
      event.preventDefault();
      const item = event.target.closest("[data-order-id]");
      if (drag.board) {
        const column = event.target.closest("[data-board-column]");
        if (column)
          emit(drag.board, "meridian-card-move", {
            id: drag.id,
            source: drag.source,
            target: column.dataset.boardColumn,
            position: item
              ? Number(item.dataset.orderIndex)
              : column.querySelectorAll("[data-order-id]").length,
          });
      } else if (
        drag.pick &&
        event.target.closest("[data-pick-side]")?.dataset.pickSide !==
          drag.pickSource
      ) {
        const target =
          event.target.closest("[data-pick-side]")?.dataset.pickSide;
        if (target)
          emit(drag.pick, "meridian-transfer", { id: drag.id, target });
      } else if (item)
        emit(drag.group, "meridian-reorder", {
          id: drag.id,
          position: Number(item.dataset.orderIndex),
        });
      drag = null;
    },
    { signal },
  );
  root.addEventListener(
    "dragend",
    () => {
      drag = null;
    },
    { signal },
  );
  const watched = new Set();
  const sizes = new WeakMap();
  const measure = (node) => {
    const value = {
      top: Math.round(node.scrollTop),
      height: node.clientHeight,
    };
    const previous = sizes.get(node);
    if (
      !previous ||
      value.top !== previous.top ||
      value.height !== previous.height
    ) {
      sizes.set(node, value);
      emit(node, "meridian-viewport", value);
    }
  };
  const observer = view.ResizeObserver
    ? new view.ResizeObserver((entries) => {
        for (const { target } of entries) measure(target);
      })
    : null;
  root.addEventListener(
    "scroll",
    (event) => {
      if (owned(event.target) && event.target.dataset?.meridianVirtual)
        measure(event.target);
    },
    { signal, capture: true, passive: true },
  );
  view.addEventListener(
    "resize",
    () => {
      for (const node of watched) measure(node);
    },
    { signal },
  );
  signal.addEventListener(
    "abort",
    () => {
      drag = null;
      observer?.disconnect();
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
    for (const node of root.querySelectorAll("[data-meridian-virtual]"))
      if (owned(node)) {
        if (!watched.has(node)) {
          watched.add(node);
          observer?.observe(node);
        }
        measure(node);
      }
  };
}
