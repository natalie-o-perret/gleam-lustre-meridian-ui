export function setupTrees(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const motion = view.matchMedia("(prefers-reduced-motion: reduce)");
  const branches = new Map();
  const syncTables = setupTreeTables(root, signal, motion);
  const settle = (branch, state) => {
    state.animation?.cancel();
    state.animation = undefined;
    branch.style.removeProperty("display");
    branch.style.removeProperty("overflow");
    branch.inert = false;
    branch.removeAttribute("aria-hidden");
  };
  const animate = (branch) => {
    const expanded = !branch.hidden;
    const state = branches.get(branch);
    if (!state) {
      branches.set(branch, { expanded });
      return;
    }
    const still =
      motion.matches || branch.closest('[data-tree-animate="false"]');
    if (state.expanded === expanded) {
      if (still && state.animation) settle(branch, state);
      return;
    }
    const interrupted = state.animation
      ? branch.getBoundingClientRect().height
      : null;
    branch.style.setProperty("display", "grid", "important");
    const from = interrupted ?? (state.expanded ? branch.scrollHeight : 0);
    state.animation?.cancel();
    state.expanded = expanded;
    if (still || typeof branch.animate !== "function") {
      settle(branch, state);
      return;
    }
    branch.inert = !expanded;
    if (!expanded) branch.setAttribute("aria-hidden", "true");
    else branch.removeAttribute("aria-hidden");
    branch.style.overflow = "hidden";
    const animation = branch.animate(
      [
        { height: `${from}px`, opacity: from ? 1 : 0 },
        {
          height: `${expanded ? branch.scrollHeight : 0}px`,
          opacity: expanded ? 1 : 0,
        },
      ],
      { duration: 180, easing: "ease-out" },
    );
    state.animation = animation;
    animation.onfinish = () => {
      if (state.animation === animation) settle(branch, state);
    };
  };
  motion.addEventListener(
    "change",
    () => {
      if (motion.matches)
        for (const [branch, state] of branches) settle(branch, state);
    },
    { signal },
  );
  signal.addEventListener(
    "abort",
    () => {
      for (const [branch, state] of branches) settle(branch, state);
      branches.clear();
    },
    { once: true },
  );
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
    syncTables();
    for (const [branch, state] of branches)
      if (!branch.isConnected || !owned(branch)) {
        settle(branch, state);
        branches.delete(branch);
      }
    for (const tree of root.querySelectorAll("[data-meridian-tree]"))
      if (owned(tree)) {
        for (const branch of tree.querySelectorAll('[role="group"]'))
          animate(branch);
        sync(tree);
      }
  };
}

function setupTreeTables(root, signal, motion) {
  const pending = new Map();
  const animations = new Set();
  const ghosts = new Set();
  const stop = () => {
    for (const animation of animations) animation.cancel();
    for (const ghost of ghosts) ghost.remove();
    ghosts.clear();
    animations.clear();
  };
  signal.addEventListener("abort", stop, { once: true });
  motion.addEventListener(
    "change",
    () => {
      if (motion.matches) stop();
    },
    { signal },
  );
  root.addEventListener(
    "click",
    (event) => {
      const toggle = event.target.closest?.("[data-tree-table-toggle]");
      if (!toggle || toggle.disabled || toggle.closest(".meridian-ui") !== root)
        return;
      const table = toggle.closest("table");
      if (motion.matches || table.closest('[data-tree-animate="false"]'))
        return;
      stop();
      pending.set(table, {
        id: toggle.dataset.treeTableToggle,
        expanded: toggle.getAttribute("aria-expanded"),
        rows: [...table.tBodies[0].rows].map((row, index) => ({
          id: row.dataset.treeRow,
          index,
          copy: row.cloneNode(true),
        })),
      });
    },
    { signal, capture: true },
  );
  const animate = (node, frames) => {
    const animation = node.animate(frames, {
      duration: 180,
      easing: "ease-out",
    });
    animations.add(animation);
    return animation.finished
      .catch(() => {})
      .finally(() => animations.delete(animation));
  };
  return () => {
    for (const [table, previous] of pending) {
      if (!table.isConnected) {
        pending.delete(table);
        continue;
      }
      const toggle = [
        ...table.querySelectorAll("[data-tree-table-toggle]"),
      ].find((node) => node.dataset.treeTableToggle === previous.id);
      if (toggle?.getAttribute("aria-expanded") === previous.expanded) continue;
      pending.delete(table);
      if (motion.matches || table.closest('[data-tree-animate="false"]'))
        continue;
      const body = table.tBodies[0];
      const rows = [...body.rows];
      for (const row of rows)
        if (!previous.rows.some((old) => old.id === row.dataset.treeRow))
          animate(row, [
            { opacity: 0, translate: "0 -4px" },
            { opacity: 1, translate: "0 0" },
          ]);
      for (const { id, index, copy } of previous.rows) {
        if (rows.some((row) => row.dataset.treeRow === id)) continue;
        copy.removeAttribute("data-tree-row");
        copy.setAttribute("aria-hidden", "true");
        copy.inert = true;
        for (const node of copy.querySelectorAll("[id]"))
          node.removeAttribute("id");
        for (const control of copy.querySelectorAll(
          "input, select, textarea, button",
        ))
          control.disabled = true;
        ghosts.add(copy);
        body.insertBefore(copy, body.rows[index] ?? null);
        const shrinking = [...copy.cells].map((cell) => {
          const height = cell.getBoundingClientRect().height;
          const content = root.ownerDocument.createElement("div");
          content.style.overflow = "hidden";
          content.append(...cell.childNodes);
          cell.style.paddingBlock = "0";
          cell.append(content);
          return animate(content, [
            { height: `${height}px`, opacity: 1 },
            { height: "0px", opacity: 0 },
          ]);
        });
        Promise.all(shrinking).then(() => {
          copy.remove();
          ghosts.delete(copy);
        });
      }
    }
  };
}
