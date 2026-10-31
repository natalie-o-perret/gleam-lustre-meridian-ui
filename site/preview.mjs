import { mount } from "../examples/catalogue/build/dev/javascript/meridian_ui/meridian_ui/browser_ffi.mjs";
import { validateProperties } from "./catalogue-properties.mjs";
import { responsiveFrames } from "./preview-frames.mjs";
import { applyPalette, validColour } from "./palette.mjs";

const parameters = new URLSearchParams(location.search);
const id = parameters.get("component");
let theme = parameters.get("theme") === "dark" ? "dark" : "light";
let direction = parameters.get("dir") === "rtl" ? "rtl" : "ltr";
const styles = ["rounded", "square", "playful", "fantasy"];
let style = styles.includes(parameters.get("style"))
  ? parameters.get("style")
  : "rounded";
let primary = validColour(parameters.get("primary"))
  ? parameters.get("primary")
  : "";
let secondary = validColour(parameters.get("secondary"))
  ? parameters.get("secondary")
  : "";
const disposers = [];
if (parent !== window) disposers.push(responsiveFrames(window));
let properties = [];
const settings = () => {
  document.documentElement.dir = direction;
  const root = document.getElementById("demo-root");
  if (root) {
    root.dataset.theme = theme;
    root.dataset.style = style;
    applyPalette(root, primary, secondary);
  }
};
const notify = (data) => {
  if (parent !== window)
    parent.postMessage({ component: id, ...data }, location.origin);
};
addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.source !== parent) return;
  if (event.data?.type === "meridian-viewport") {
    requestAnimationFrame(() => dispatchEvent(new Event("resize")));
    return;
  }
  if (
    event.data?.type === "meridian-properties" &&
    event.data.component === id
  ) {
    const values = validateProperties(properties, event.data.values);
    if (values) {
      document.getElementById("demo-root")?.dispatchEvent(
        new CustomEvent("meridian-properties", {
          bubbles: true,
          detail: values,
        }),
      );
      requestAnimationFrame(() => {
        const root = document.getElementById("demo-root");
        if (root)
          notify({
            type: "meridian-configured",
            height: Math.ceil(root.getBoundingClientRect().height),
          });
      });
    }
    return;
  }
  if (event.data?.type !== "meridian-settings") return;
  theme = event.data.theme === "dark" ? "dark" : "light";
  direction = event.data.direction === "rtl" ? "rtl" : "ltr";
  style = styles.includes(event.data.style) ? event.data.style : "rounded";
  primary = validColour(event.data.primary) ? event.data.primary : "";
  secondary = validColour(event.data.secondary) ? event.data.secondary : "";
  settings();
  if (document.documentElement.dataset.ready)
    queueMicrotask(() =>
      notify({
        type: "meridian-ready",
        theme,
        direction,
        style,
        primary,
        secondary,
        height: Math.ceil(
          document.getElementById("demo-root").getBoundingClientRect().height,
        ),
      }),
    );
});
addEventListener("pagehide", (event) => {
  if (!event.persisted) for (const dispose of disposers) dispose();
});

try {
  const response = await fetch("./catalogue.json");
  if (!response.ok) throw new Error("The catalogue could not be loaded.");
  const entries = await response.json();
  const entry = entries.find((entry) => entry.id === id);
  if (!entry) throw new Error("This example could not be found.");
  properties = entry.properties;
  document.title = `${entry.name} - Meridian UI example`;
  const module = await import(
    `../examples/catalogue/build/dev/javascript/meridian_catalogue/catalogue/${entry.family}.mjs`
  );
  module.start(id);
  settings();
  disposers.push(
    mount(
      "demo-root",
      () => {},
      () => {},
    ),
  );
  if (id === "inputmask") {
    const { mount } =
      await import("../examples/catalogue/build/dev/javascript/meridian_ui/meridian_ui/mask_ffi.mjs");
    disposers.push(mount("telephone"));
  }
  if (id === "charts") {
    const { mount } =
      await import("../examples/catalogue/build/dev/javascript/meridian_ui/meridian_ui/charts_ffi.mjs");
    disposers.push(mount("requests-chart"));
  }
  if (id === "scheduler") {
    const { mount } =
      await import("../examples/catalogue/build/dev/javascript/meridian_ui/meridian_ui/scheduler_ffi.mjs");
    disposers.push(mount("project-calendar"));
  }
  if (id === "texteditor") {
    const { mount } =
      await import("../examples/catalogue/build/dev/javascript/meridian_ui/meridian_ui/editor_ffi.mjs");
    disposers.push(mount("project-notes"));
  }
  const root = document.getElementById("demo-root");
  let overlayOpen = false;
  let dialogOpen = false;
  const reportOverlay = () => {
    const open = Boolean(
      root.querySelector(
        'dialog[open], [popover]:popover-open:not([role="tooltip"])',
      ),
    );
    const dialog = Boolean(root.querySelector("dialog[open]"));
    if (open === overlayOpen && dialog === dialogOpen) return;
    overlayOpen = open;
    dialogOpen = dialog;
    notify({ type: "meridian-overlay", open, dialog });
  };
  const overlays = new MutationObserver(reportOverlay);
  overlays.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["open"],
  });
  root.addEventListener("toggle", reportOverlay, true);
  disposers.push(() => {
    overlays.disconnect();
    root.removeEventListener("toggle", reportOverlay, true);
  });
  reportOverlay();
  await document.fonts.ready;
  const height = () => Math.ceil(root.getBoundingClientRect().height);
  const observer = new ResizeObserver(() =>
    notify({
      type: "meridian-height",
      height: height(),
    }),
  );
  observer.observe(root);
  disposers.push(() => observer.disconnect());
  document.documentElement.dataset.ready = id;
  notify({
    type: "meridian-ready",
    theme,
    direction,
    style,
    primary,
    secondary,
    height: height(),
  });
} catch (error) {
  const message = document.createElement("p");
  message.setAttribute("role", "alert");
  message.textContent = error.message;
  document.getElementById("demo").replaceChildren(message);
  document.documentElement.dataset.error = "true";
  notify({ type: "meridian-error" });
  console.error(error);
}
