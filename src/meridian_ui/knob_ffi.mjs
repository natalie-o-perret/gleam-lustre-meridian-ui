export function dialRatio(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || Math.hypot(x, y) < 1)
    return null;
  const angle = ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360;
  let sweep = (angle - 225 + 360) % 360;
  if (sweep > 270) sweep = sweep > 315 ? 0 : 270;
  return sweep / 270;
}

export function setupKnobs(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const owned = (element) => element?.closest?.(".meridian-ui") === root;
  const syncKnob = (group) => {
    const input = group.querySelector("[data-meridian-knob-input]");
    if (!input) return;
    const min = input.min === "" ? 0 : Number(input.min);
    const max = input.max === "" ? 100 : Number(input.max);
    const ratio =
      max > min
        ? Math.max(0, Math.min(1, (Number(input.value) - min) / (max - min)))
        : 0;
    group.style.setProperty("--knob-angle", `${ratio * 270}deg`);
    const output = group.querySelector("[data-knob-value]");
    if (output.textContent !== input.value) output.textContent = input.value;
  };
  root.addEventListener(
    "input",
    (event) => {
      if (owned(event.target) && event.target.dataset?.meridianKnobInput)
        syncKnob(event.target.closest("[data-meridian-knob]"));
    },
    { signal },
  );
  let drag = null;
  const sample = (event) => {
    const input = drag.input;
    const bounds = input.getBoundingClientRect();
    const ratio = dialRatio(
      event.clientX - bounds.left - bounds.width / 2,
      event.clientY - bounds.top - bounds.height / 2,
    );
    if (ratio === null) return;
    const min = input.min === "" ? 0 : Number(input.min);
    const max = input.max === "" ? 100 : Number(input.max);
    const previous = input.value;
    input.value = String(min + ratio * (max - min));
    if (input.value !== previous)
      input.dispatchEvent(new view.Event("input", { bubbles: true }));
    syncKnob(input.closest("[data-meridian-knob]"));
  };
  root.addEventListener(
    "pointerdown",
    (event) => {
      const input = event.target;
      if (
        !owned(input) ||
        !input.dataset?.meridianKnobInput ||
        input.matches(":disabled") ||
        event.button !== 0 ||
        event.isPrimary === false ||
        view.matchMedia("(forced-colors: active)").matches
      )
        return;
      event.preventDefault();
      input.focus({ preventScroll: true });
      drag = { input, pointerId: event.pointerId };
      input.setPointerCapture(event.pointerId);
      sample(event);
    },
    { signal },
  );
  doc.addEventListener(
    "pointermove",
    (event) => {
      if (drag?.pointerId === event.pointerId && drag.input.isConnected)
        sample(event);
    },
    { signal },
  );
  const release = () => {
    const previous = drag;
    drag = null;
    if (previous?.input.hasPointerCapture(previous.pointerId))
      previous.input.releasePointerCapture(previous.pointerId);
  };
  const stop = (event) => {
    if (drag?.pointerId === event.pointerId) release();
  };
  doc.addEventListener("pointerup", stop, { signal });
  doc.addEventListener("pointercancel", stop, { signal });
  root.addEventListener("lostpointercapture", stop, { signal });
  signal.addEventListener("abort", release, { once: true });
  return () => {
    for (const group of root.querySelectorAll("[data-meridian-knob]"))
      if (owned(group) && group.dataset?.meridianKnob) syncKnob(group);
  };
}
