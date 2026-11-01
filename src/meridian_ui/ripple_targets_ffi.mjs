const automatic = [
  "button",
  "a[href]",
  "summary",
  "[role='button']",
  "[role^='menuitem']",
  "[role='tab']",
  "[role='option']",
  "[role='treeitem']",
  ".meridian-select-choice",
  ".selection-checkbox",
  ".meridian-radio-field",
  ".meridian-switch",
  ".meridian-rating-choice",
  "[data-meridian-ripple]:not(input, img)",
].join(",");

export function rippleTarget(target, root) {
  const control = target.closest?.(
    root.dataset.meridianRipples === "true"
      ? automatic
      : "[data-meridian-ripple]",
  );
  if (
    !control ||
    control.closest(".meridian-ui") !== root ||
    control.matches(":disabled, [aria-disabled='true'], input, img") ||
    control.querySelector(":scope > input:disabled")
  )
    return;
  if (control.matches(".meridian-select-choice"))
    return control.querySelector(":scope > span");
  if (control.matches(".selection-checkbox"))
    return control.querySelector(".checkbox-mark");
  if (control.matches(".meridian-switch"))
    return control.querySelector(".meridian-switch-track");
  if (control.matches("[role='treeitem']"))
    return control.querySelector(":scope > .meridian-tree-row") ?? control;
  return control;
}
