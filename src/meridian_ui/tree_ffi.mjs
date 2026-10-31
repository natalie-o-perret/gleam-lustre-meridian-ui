export function setupTrees(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const owned = (node) => node?.closest?.(".meridian-ui") === root;
  const items = (tree) =>
    [...tree.querySelectorAll('[role="treeitem"]')].filter(
      (item) =>
        item.closest('[role="tree"]') === tree &&
        !item.closest("[hidden], [inert]") &&
        item.getAttribute("aria-disabled") !== "true",
    );
  const sync = (tree) => {
    const nodes = items(tree);
    const selected =
      nodes.find((node) => node === doc.activeElement) ??
      nodes.find((node) => node.tabIndex === 0) ??
      nodes.find((node) => node.getAttribute("aria-selected") === "true") ??
      nodes[0];
    for (const node of tree.querySelectorAll('[role="treeitem"]'))
      node.tabIndex = node === selected ? 0 : -1;
    tree.tabIndex = nodes.length ? -1 : 0;
  };
  let typed = "";
  let time = 0;
  root.addEventListener(
    "click",
    (event) => {
      const item = event.target.closest?.('[role="treeitem"]');
      if (
        item &&
        owned(item) &&
        item.getAttribute("aria-disabled") !== "true"
      ) {
        item.focus({ preventScroll: true });
        sync(item.closest('[role="tree"]'));
      }
    },
    { signal, capture: true },
  );
  root.addEventListener(
    "keydown",
    (event) => {
      const item = event.target.closest?.('[role="treeitem"]');
      const tree = item?.closest("[data-meridian-tree]");
      if (
        !tree ||
        !owned(tree) ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        event.isComposing
      )
        return;
      const nodes = items(tree);
      const index = nodes.indexOf(item);
      if (index < 0) return;
      const rtl = view.getComputedStyle(tree).direction === "rtl";
      const expand = rtl ? "ArrowLeft" : "ArrowRight";
      const collapse = rtl ? "ArrowRight" : "ArrowLeft";
      const button = item.querySelector(
        ":scope > .meridian-tree-row [data-tree-expand]",
      );
      let target;
      if (event.key === "ArrowDown")
        target = nodes[Math.min(index + 1, nodes.length - 1)];
      else if (event.key === "ArrowUp") target = nodes[Math.max(index - 1, 0)];
      else if (event.key === "Home") target = nodes[0];
      else if (event.key === "End") target = nodes.at(-1);
      else if (event.key === expand) {
        if (button && item.getAttribute("aria-expanded") !== "true")
          button.click();
        else if (nodes[index + 1]?.dataset.treeParent === item.dataset.treeId)
          target = nodes[index + 1];
      } else if (event.key === collapse) {
        if (button && item.getAttribute("aria-expanded") === "true")
          button.click();
        else
          target = nodes.find(
            (node) => node.dataset.treeId === item.dataset.treeParent,
          );
      } else if (event.key === " " || event.key === "Enter")
        item
          .querySelector(":scope > .meridian-tree-row [data-tree-select]")
          ?.click();
      else if (event.key.length === 1 && !event.ctrlKey) {
        const now = Date.now();
        typed = now - time < 700 ? typed + event.key : event.key;
        time = now;
        target = [...nodes.slice(index + 1), ...nodes.slice(0, index + 1)].find(
          (node) =>
            node
              .querySelector(":scope > .meridian-tree-row [data-tree-select]")
              .textContent.toLocaleLowerCase()
              .startsWith(typed.toLocaleLowerCase()),
        );
      } else return;
      event.preventDefault();
      target?.focus();
      sync(tree);
    },
    { signal },
  );
  return () => {
    for (const tree of root.querySelectorAll("[data-meridian-tree]"))
      if (owned(tree)) sync(tree);
  };
}
