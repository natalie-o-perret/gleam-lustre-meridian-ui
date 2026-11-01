import {
  markup,
  navigation_icon,
} from "../examples/catalogue/build/dev/javascript/meridian_catalogue/catalogue_appearance.mjs";

export function appearanceMenu() {
  document.getElementById("open-navigation").innerHTML = navigation_icon();
  document
    .getElementById("palette-tools")
    .insertAdjacentHTML("afterbegin", markup());
  const button = document.getElementById("palette");
  const popup = document.getElementById("palette-popup");
  const controls = document.getElementById("palette-controls");
  document.getElementById("appearance-custom").append(controls);
  controls.hidden = false;
  for (const input of popup.querySelectorAll(".docs-swatches input")) {
    const colour =
      input.value === "mono"
        ? "#ffffff"
        : input.value ||
          (input.name === "primary-presets"
            ? "var(--docs-brand-accent)"
            : "#808080");
    input.closest("label").style.setProperty("--swatch", colour);
  }
  for (const group of popup.querySelectorAll(".docs-swatches")) {
    const name = document.createElement("span");
    name.className = "docs-swatch-name";
    name.setAttribute("aria-hidden", "true");
    group.querySelector("legend").append(name);
    const selectedName = () => {
      const text =
        group.querySelector("input:checked")?.nextElementSibling.textContent ||
        "Custom";
      if (name.textContent !== text) name.textContent = text;
    };
    const showName = (event) => {
      const label = event.target.closest(".meridian-select-choice");
      if (label && name.textContent !== label.textContent)
        name.textContent = label.textContent;
    };
    for (const type of ["pointerover", "focusin"])
      group.addEventListener(type, showName);
    for (const type of ["pointerleave", "focusout"])
      group.addEventListener(type, selectedName);
  }
  const setOpen = (open) => {
    popup.dataset.open = String(open);
    button.setAttribute("aria-expanded", String(open));
  };
  button.addEventListener("click", (event) => {
    event.preventDefault();
    button.focus({ preventScroll: true });
    setOpen(popup.dataset.open !== "true");
  });
  popup.addEventListener("meridian-close", () => setOpen(false));
  return () => {
    if (popup.dataset.open === "true") setOpen(false);
  };
}

export function syncAppearance({ style, primary, surface, ripple }) {
  for (const [id, value] of [
    ["style", style],
    ["primary-presets", primary],
    ["surface-presets", surface],
  ]) {
    const group = document.getElementById(id);
    for (const input of group.querySelectorAll("input")) {
      const checked = input.value === value;
      if (input.checked !== checked) input.checked = checked;
      if (id === "primary-presets" && input.autofocus !== checked)
        input.autofocus = checked;
    }
    const name = group.querySelector(".docs-swatch-name");
    const text =
      group.querySelector("input:checked")?.nextElementSibling.textContent ||
      "Custom";
    if (name && name.textContent !== text) name.textContent = text;
  }
  const control = document.getElementById("ripple");
  if (control.checked !== ripple) control.checked = ripple;
}
