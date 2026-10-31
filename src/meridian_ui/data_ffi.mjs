export function setupData(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const owned = (node) => node?.closest?.(".meridian-ui") === root;
  const emit = (node, name, detail) =>
    node.dispatchEvent(new view.CustomEvent(name, { bubbles: true, detail }));
  let drag = null;
  const clearPreview = () => {
    if (!drag) return;
    for (const [item, order] of drag.orders) item.style.order = order;
    drag.orders.clear();
    drag.preview?.remove();
    drag.preview = undefined;
  };
  const endDrag = () => {
    if (!drag) return;
    clearPreview();
    delete drag.item.dataset.dragging;
    drag = null;
  };
  const destination = (event) =>
    event.target.closest?.("[data-meridian-order]") ??
    event.target
      .closest?.("[data-board-column], [data-pick-side]")
      ?.querySelector("[data-meridian-order]");
  const preview = (event) => {
    const group = destination(event);
    if (!group || !owned(group)) return;
    const items = [
      ...group.querySelectorAll(":scope > [data-order-id]"),
    ].filter((item) => item !== drag.item);
    let position = items.findIndex((item) => {
      const bounds = item.getBoundingClientRect();
      return event.clientY < bounds.top + bounds.height / 2;
    });
    if (position < 0) position = items.length;
    clearPreview();
    drag.destination = group;
    drag.position = position;
    if (group === drag.group) {
      items.splice(position, 0, drag.item);
      items.forEach((item, index) => {
        drag.orders.set(item, item.style.order);
        item.style.order = String(index);
      });
    } else {
      const placeholder = drag.item.cloneNode(true);
      placeholder.removeAttribute("id");
      delete placeholder.dataset.orderId;
      delete placeholder.dataset.orderIndex;
      delete placeholder.dataset.dragging;
      placeholder.draggable = false;
      placeholder.inert = true;
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.classList.add("meridian-order-preview");
      for (const node of placeholder.querySelectorAll("[id], [name]")) {
        node.removeAttribute("id");
        node.removeAttribute("name");
      }
      group.insertBefore(placeholder, items[position] ?? null);
      drag.preview = placeholder;
    }
  };
  root.addEventListener(
    "dragstart",
    (event) => {
      const item = event.target.closest?.("[data-order-id]");
      const group = item?.closest("[data-meridian-order]");
      if (!group || !owned(group) || item.draggable !== true) return;
      endDrag();
      drag = {
        group,
        item,
        orders: new Map(),
        position: Number(item.dataset.orderIndex),
        destination: group,
        id: item.dataset.orderId,
        board: group.closest("[data-meridian-board]"),
        pick: group.closest("[data-meridian-pick]"),
        pickSource: group.closest("[data-pick-side]")?.dataset.pickSide,
        source: group.closest("[data-board-column]")?.dataset.boardColumn,
      };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.dataset.orderId);
      item.dataset.dragging = "true";
    },
    { signal },
  );
  for (const type of ["dragenter", "dragover"])
    root.addEventListener(
      type,
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
          preview(event);
        } else if (drag) {
          clearPreview();
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
      preview(event);
      const state = drag;
      endDrag();
      if (state.board) {
        const column = event.target.closest("[data-board-column]");
        if (column)
          emit(state.board, "meridian-card-move", {
            id: state.id,
            source: state.source,
            target: column.dataset.boardColumn,
            position: state.position,
          });
      } else if (
        state.pick &&
        event.target.closest("[data-pick-side]")?.dataset.pickSide !==
          state.pickSource
      ) {
        const target =
          event.target.closest("[data-pick-side]")?.dataset.pickSide;
        if (target)
          emit(state.pick, "meridian-transfer", { id: state.id, target });
      } else if (state.destination === state.group)
        emit(state.group, "meridian-reorder", {
          id: state.id,
          position: state.position,
        });
    },
    { signal },
  );
  root.addEventListener("dragend", endDrag, { signal });
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
      endDrag();
      observer?.disconnect();
      watched.clear();
    },
    { once: true },
  );
  return () => {
    if (drag && (!drag.item.isConnected || !owned(drag.item))) endDrag();
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
