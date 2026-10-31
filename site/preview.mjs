import { mount } from "../examples/catalogue/build/dev/javascript/meridian_ui/meridian_ui/browser_ffi.mjs";

const parameters = new URLSearchParams(location.search);
const id = parameters.get("component");
let theme = parameters.get("theme") === "dark" ? "dark" : "light";
let direction = parameters.get("dir") === "rtl" ? "rtl" : "ltr";
const disposers = [];
const settings = () => {
  document.documentElement.dir = direction;
  const root = document.getElementById("demo-root");
  if (root) root.dataset.theme = theme;
};
const notify = (data) => {
  if (parent !== window)
    parent.postMessage({ component: id, ...data }, location.origin);
};
addEventListener("message", (event) => {
  if (
    event.origin !== location.origin ||
    event.source !== parent ||
    event.data?.type !== "meridian-settings"
  )
    return;
  theme = event.data.theme === "dark" ? "dark" : "light";
  direction = event.data.direction === "rtl" ? "rtl" : "ltr";
  settings();
  if (document.documentElement.dataset.ready)
    requestAnimationFrame(() =>
      notify({
        type: "meridian-ready",
        theme,
        direction,
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
  document.title = `${entry.name} - Meridian UI example`;
  const module = await import(
    new URL(`./examples/${entry.family}.js`, import.meta.url).href
  );
  module.start(id);
  await new Promise(requestAnimationFrame);
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
  await document.fonts.ready;
  await new Promise(requestAnimationFrame);
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
  notify({ type: "meridian-ready", theme, direction, height: height() });
} catch (error) {
  const message = document.createElement("p");
  message.setAttribute("role", "alert");
  message.textContent = error.message;
  document.getElementById("demo").replaceChildren(message);
  document.documentElement.dataset.error = "true";
  notify({ type: "meridian-error" });
  console.error(error);
}
