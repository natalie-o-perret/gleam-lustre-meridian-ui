export function setupCodeCopy(root, signal) {
  const view = root.ownerDocument.defaultView;
  const active = new Map();
  const reset = (viewer) => {
    view.clearTimeout(active.get(viewer)?.timer);
    active.delete(viewer);
    const button = viewer.querySelector('[data-code-action="copy"]');
    if (button) {
      delete button.dataset.copied;
      button.classList.remove("primary-button");
      button.querySelector("[data-code-copy-label]").textContent = "Copy";
    }
    const status = viewer.querySelector(".meridian-code-status");
    status.textContent = "";
    status.classList.remove("sr-only");
  };
  signal.addEventListener(
    "abort",
    () => {
      for (const viewer of active.keys()) reset(viewer);
    },
    { once: true },
  );
  root.addEventListener(
    "click",
    async (event) => {
      const button = event.target.closest?.('[data-code-action="copy"]');
      if (
        !button ||
        button.closest(".meridian-ui") !== root ||
        button.matches(":disabled, [aria-disabled='true']")
      )
        return;
      const viewer = button.closest(".meridian-code-viewer");
      if (!viewer) return;
      reset(viewer);
      const state = {
        source: viewer.dataset.codeSource,
        language: viewer.querySelector("code")?.dataset.language,
      };
      active.set(viewer, state);
      let success = true;
      try {
        await view.navigator.clipboard.writeText(state.source);
      } catch {
        success = false;
      }
      if (signal.aborted || !viewer.isConnected || active.get(viewer) !== state)
        return;
      const status = viewer.querySelector(".meridian-code-status");
      status.classList.toggle("sr-only", success);
      if (!success) {
        active.delete(viewer);
        status.textContent = "Copy unavailable. Select and copy the code.";
        return;
      }
      button.dataset.copied = "true";
      button.classList.add("primary-button");
      button.querySelector("[data-code-copy-label]").textContent = "Copied";
      status.textContent = "Copied.";
      state.timer = view.setTimeout(() => reset(viewer), 3000);
    },
    { signal },
  );
  return () => {
    for (const [viewer, state] of active)
      if (
        !root.contains(viewer) ||
        viewer.closest(".meridian-ui") !== root ||
        viewer.dataset.codeSource !== state.source ||
        viewer.querySelector("code")?.dataset.language !== state.language
      )
        reset(viewer);
  };
}
