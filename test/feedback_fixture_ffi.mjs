export function focusRegion(root, selector) {
  root.querySelector(selector)?.focus({ preventScroll: true });
}
