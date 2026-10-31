import { markup } from "../examples/catalogue/build/dev/javascript/meridian_catalogue/catalogue_appearance.mjs";

export function appearanceMenu() {
  document
    .getElementById("palette-tools")
    .insertAdjacentHTML("afterbegin", markup());
  const button = document.getElementById("palette");
  const popup = document.getElementById("palette-popup");
  const controls = document.getElementById("palette-controls");
  popup.append(controls);
  controls.hidden = false;
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
