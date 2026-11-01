import {
  start_source,
  toggle_markup,
  theme_markup,
  code_markup,
  snippet_markup,
  github_markup,
} from "../examples/catalogue/build/dev/javascript/meridian_catalogue/catalogue_docs.mjs";
import starterSource from "../examples/catalogue/src/getting_started.gleam";
import { componentDocs } from "./component-docs.mjs";
import { previewToasts } from "./preview-toasts.mjs";
import { applyPalette, validColour, validPrimary } from "./palette.mjs";
import { applySurface } from "./surface-palette.mjs";
import { appearanceMenu, syncAppearance } from "./appearance.mjs";
import { mount } from "../examples/catalogue/build/dev/javascript/meridian_ui/meridian_ui/browser_ffi.mjs";
import {
  next,
  is_dark,
} from "../examples/catalogue/build/dev/javascript/meridian_ui/meridian_ui/theme.mjs";

const repository =
  "https://github.com/natalie-o-perret/gleam-lustre-meridian-ui";
const root = document.body;
document.getElementById("github-icon").innerHTML = github_markup();
const closeAppearance = appearanceMenu();
const main = document.getElementById("main");
const search = document.getElementById("component-search");
const navigation = document.getElementById("component-navigation");
const dialog = document.getElementById("navigation-dialog");
const navContent = document.getElementById("navigation-content");
const menuButton = document.getElementById("open-navigation");
const themeButton = document.getElementById("theme");
const themeMotion = matchMedia("(prefers-reduced-motion: reduce)");
themeMotion.addEventListener("change", () => {
  if (themeMotion.matches)
    for (const animation of themeButton.getAnimations({ subtree: true }))
      animation.cancel();
});
const directionButton = document.getElementById("direction");
const styleControl = document.getElementById("style");
const primaryControl = document.getElementById("primary-colour");
const secondaryControl = document.getElementById("secondary-colour");
const mobile = matchMedia("(max-width: 900px)");
const headerSize = new ResizeObserver(([entry]) => {
  document.documentElement.style.scrollPaddingTop = `${Math.ceil(entry.target.getBoundingClientRect().height) + 8}px`;
  const frame = main.querySelector("iframe");
  if (frame) sizePreview(frame);
});
headerSize.observe(document.querySelector(".docs-header"));
let entries = [];
let current;
let systemDark = matchMedia("(prefers-color-scheme: dark)").matches;
let preference = "system";
let theme = systemDark ? "dark" : "light";
let direction = "ltr";
let style = "rounded";
let primary = "";
let secondary = "";
let surface = "";
let ripple = false;
let stopSource = () => {};
let stopToasts = () => {};
const collapsedNavigation = new Set();
try {
  const saved = JSON.parse(
    localStorage.getItem("meridian-catalogue") ?? "null",
  );
  if (["light", "dark", "system"].includes(saved?.theme))
    preference = saved.theme;
  if (["ltr", "rtl"].includes(saved?.direction)) direction = saved.direction;
  if (["rounded", "square", "playful", "fantasy"].includes(saved?.style))
    style = saved.style;
  if (validPrimary(saved?.primary)) primary = saved.primary;
  if (validColour(saved?.secondary)) secondary = saved.secondary;
  if (validColour(saved?.surface)) surface = saved.surface;
  if (typeof saved?.ripple === "boolean") ripple = saved.ripple;
} catch {
  // Preferences are optional when browser storage is unavailable.
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

const route = (entry) => `#/components/${entry.id}`;
const normalise = (value) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
const groups = () => [...new Set(entries.map((entry) => entry.group))];

function previewURL(entry) {
  return `./preview.html?${new URLSearchParams({ component: entry.id, theme, dir: direction, style, primary, secondary, surface, ripple, v: root.dataset.previewVersion })}`;
}

function sizePreview(frame) {
  const content = Math.min(
    1100,
    Math.max(1, Number(frame.dataset.contentHeight) || 1),
  );
  const header = document
    .querySelector(".docs-header")
    .getBoundingClientRect().height;
  const slot = frame.parentElement;
  const preview = frame.contentDocument?.documentElement;
  if (frame.dataset.overlayDialog === "true") {
    const bounds = slot.getBoundingClientRect();
    const scale = bounds.width / slot.offsetWidth || 1;
    const top = (visualViewport?.offsetTop ?? 0) + header + 8;
    const origin = document.documentElement.getBoundingClientRect().left;
    slot.style.height = `${content}px`;
    Object.assign(frame.style, {
      position: "fixed",
      zIndex: "20",
      background: "transparent",
      left: `${(bounds.left - origin) / scale}px`,
      top: `${top / scale}px`,
      width: `${bounds.width / scale}px`,
      height: `${Math.max(0, (visualViewport?.height ?? innerHeight) - header - 16) / scale}px`,
    });
    preview?.style.setProperty(
      "--meridian-preview-offset",
      `${(bounds.top - top) / scale}px`,
    );
    preview?.style.setProperty("--meridian-preview-background", "transparent");
  } else {
    slot.style.removeProperty("height");
    for (const property of [
      "position",
      "z-index",
      "left",
      "top",
      "width",
      "background",
    ])
      frame.style.removeProperty(property);
    frame.style.height = `${frame.dataset.overlayOpen === "true" ? Math.max(content, (visualViewport?.height ?? innerHeight) - header - 16) : content}px`;
    preview?.style.removeProperty("--meridian-preview-offset");
    preview?.style.removeProperty("--meridian-preview-background");
  }
  frame.contentWindow?.postMessage(
    { type: "meridian-viewport" },
    location.origin,
  );
}
const resizePreview = () => {
  const frame = main.querySelector("iframe");
  if (frame) sizePreview(frame);
};
addEventListener("resize", resizePreview);
addEventListener(
  "scroll",
  () => {
    const frame = main.querySelector('iframe[data-overlay-open="true"]');
    if (frame) sizePreview(frame);
  },
  { passive: true },
);
visualViewport?.addEventListener("resize", resizePreview);

function settings() {
  theme = is_dark(preference, systemDark) ? "dark" : "light";
  for (const [name, value] of [
    ["theme", theme],
    ["style", style],
    ["meridianRipples", String(ripple)],
  ])
    if (root.dataset[name] !== value) root.dataset[name] = value;
  applySurface(root, surface);
  applyPalette(root, primary, secondary);
  const colours = getComputedStyle(root);
  primaryControl.value = validColour(primary)
    ? primary
    : colours.getPropertyValue("--accent").trim();
  secondaryControl.value =
    secondary || colours.getPropertyValue("--secondary").trim();
  for (const [id, value] of [
    ["primary-colour-value", primaryControl.value],
    ["secondary-colour-value", secondaryControl.value],
  ]) {
    const code = document.getElementById(id);
    if (code.textContent !== value) code.textContent = value;
  }
  syncAppearance({ style, primary, surface, ripple });
  if (document.documentElement.dir !== direction)
    document.documentElement.dir = direction;
  const label = preference[0].toUpperCase() + preference.slice(1);
  const hint = `Theme: ${label}. Switch to ${next(preference)} theme`;
  const previous = themeButton.dataset.preference;
  if (previous !== preference) {
    themeButton.setAttribute("aria-label", hint);
    themeButton.dataset.tooltip = hint;
    themeButton.dataset.preference = preference;
    themeButton.innerHTML = theme_markup(preference);
    if (previous && !themeMotion.matches)
      themeButton.firstElementChild.animate(
        [
          { opacity: 0, transform: "rotate(-30deg) scale(.65)" },
          { opacity: 1, transform: "rotate(0) scale(1)" },
        ],
        { duration: 160, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
  }
  const pressed = String(direction === "rtl");
  if (directionButton.getAttribute("aria-pressed") !== pressed)
    directionButton.setAttribute("aria-pressed", pressed);
  const frame = main.querySelector("iframe");
  frame?.contentWindow.postMessage(
    {
      type: "meridian-settings",
      theme,
      direction,
      style,
      primary,
      secondary,
      surface,
      ripple,
    },
    location.origin,
  );
  const standalone = document.getElementById("standalone-preview");
  if (
    standalone &&
    current &&
    standalone.getAttribute("href") !== previewURL(current)
  )
    standalone.href = previewURL(current);
}

function saveSettings() {
  settings();
  try {
    localStorage.setItem(
      "meridian-catalogue",
      JSON.stringify({
        theme: preference,
        direction,
        style,
        primary,
        secondary,
        surface,
        ripple,
      }),
    );
  } catch {
    // The current page still works without persistent preferences.
  }
}

function closeNavigation() {
  if (dialog.open) dialog.close();
  document.getElementById("navigation-panel").append(navContent);
}

function openNavigation() {
  if (!mobile.matches) return;
  dialog.append(navContent);
  dialog.showModal();
  search.focus();
}

menuButton.addEventListener("click", openNavigation);
document.querySelector(".docs-skip").addEventListener("click", (event) => {
  event.preventDefault();
  main.focus();
});
document
  .getElementById("close-navigation")
  .addEventListener("click", closeNavigation);
dialog.addEventListener("close", closeNavigation);
mobile.addEventListener("change", closeNavigation);
themeButton.addEventListener("click", () => {
  preference = next(preference);
  saveSettings();
});

root.addEventListener("click", (event) => {
  const toggle = event.target.closest(".docs-toggle");
  if (!toggle) return;
  const content = document.getElementById(toggle.getAttribute("aria-controls"));
  if (!content) return;
  const expanded = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(expanded));
  content.hidden = !expanded;
  const group = toggle.closest(".docs-nav-group")?.dataset.group;
  if (group && !search.value) {
    if (expanded) collapsedNavigation.delete(group);
    else collapsedNavigation.add(group);
  }
});
directionButton.addEventListener("click", () => {
  direction = direction === "rtl" ? "ltr" : "rtl";
  saveSettings();
});
styleControl.addEventListener("change", (event) => {
  style = event.target.value;
  saveSettings();
});
primaryControl.addEventListener("change", () => {
  primary = primaryControl.value;
  saveSettings();
});
secondaryControl.addEventListener("change", () => {
  secondary = secondaryControl.value;
  saveSettings();
});
document.getElementById("reset-colours").addEventListener("click", () => {
  primary = secondary = surface = "";
  saveSettings();
});
document
  .getElementById("primary-presets")
  .addEventListener("change", (event) => {
    primary = event.target.value;
    saveSettings();
  });
document
  .getElementById("surface-presets")
  .addEventListener("change", (event) => {
    surface = event.target.value;
    saveSettings();
  });
document.getElementById("ripple").addEventListener("change", (event) => {
  ripple = event.target.checked;
  saveSettings();
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.target.closest("input, textarea, select, [contenteditable]")
  ) {
    event.preventDefault();
    if (mobile.matches && !dialog.open) openNavigation();
    search.focus();
  }
});

let navigationQuery;
function renderNavigation() {
  const query = normalise(search.value);
  // Keep mounted links so route changes don't cancel their feedback or focus.
  if (query === navigationQuery) {
    for (const link of navigation.querySelectorAll("a")) {
      const active = link.dataset.component
        ? link.dataset.component === current?.id
        : !current && ["", "#/"].includes(location.hash);
      if (active && link.getAttribute("aria-current") !== "page")
        link.setAttribute("aria-current", "page");
      else if (!active && link.hasAttribute("aria-current"))
        link.removeAttribute("aria-current");
    }
    for (const section of navigation.querySelectorAll(".docs-nav-group")) {
      const expanded =
        Boolean(query) ||
        current?.group === section.dataset.group ||
        !collapsedNavigation.has(section.dataset.group);
      const toggle = section.querySelector("button");
      if (toggle.getAttribute("aria-expanded") !== String(expanded))
        toggle.setAttribute("aria-expanded", String(expanded));
      const list = section.querySelector("ul");
      if (list.hidden !== !expanded) list.hidden = !expanded;
    }
    return;
  }
  navigationQuery = query;
  const matches = entries.filter((entry) =>
    normalise(`${entry.name} ${entry.group} ${entry.module ?? ""}`).includes(
      query,
    ),
  );
  navigation.replaceChildren();
  const gettingStarted = node("a", "docs-start-link", "Getting started");
  gettingStarted.href = "#/";
  if (!current && ["", "#/"].includes(location.hash))
    gettingStarted.setAttribute("aria-current", "page");
  navigation.append(gettingStarted);
  for (const group of groups()) {
    const members = matches.filter((entry) => entry.group === group);
    if (!members.length) continue;
    const section = node("section", "docs-nav-group");
    section.dataset.group = group;
    const expanded =
      Boolean(query) ||
      current?.group === group ||
      !collapsedNavigation.has(group);
    const id = `navigation-${normalise(group)}`;
    const heading = node("h2", "docs-nav-heading");
    heading.innerHTML = toggle_markup(id, group, expanded);
    section.append(heading);
    const list = node("ul");
    list.id = `${id}-content`;
    list.hidden = !expanded;
    for (const entry of members) {
      const link = node("a", "docs-nav-link", entry.name);
      link.href = route(entry);
      link.dataset.component = entry.id;
      if (current?.id === entry.id) link.setAttribute("aria-current", "page");
      const item = node("li");
      item.append(link);
      list.append(item);
    }
    section.append(list);
    navigation.append(section);
  }
  document.getElementById("search-status").textContent = query
    ? `${matches.length} of ${entries.length} entries${matches.length ? "" : ". Try another search."}`
    : `${entries.length} entries. Find your next building block.`;
}

search.addEventListener("input", renderNavigation);
navigation.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  closeNavigation();
  if (link.hash === location.hash) main.focus();
});

function gettingStarted() {
  main.innerHTML = `
    <header class="docs-component-heading">
      <p class="eyebrow">Meridian UI</p><h1>Getting started</h1>
      <p class="docs-lead">Add Meridian to your Lustre app, load the styles and render a component.</p>
    </header>
    <div class="docs-setup">
      <section aria-labelledby="setup-dependency">
        <h2 id="setup-dependency">1. Add the dependency</h2>
        <p>Use Gleam 1.19.2 or newer, Lustre 5.7 and the JavaScript target. Meridian is experimental and not on Hex yet. Add this to your app's <code>gleam.toml</code>:</p>
        ${snippet_markup("Git dependency", "toml", `[dependencies]\nmeridian_ui = { git = "${repository}.git", ref = "main" }`)}
        <p>Pin a commit instead of <code>main</code> for reproducible builds, then run <code>gleam deps download</code>.</p>
      </section>
      <section aria-labelledby="setup-styles">
        <h2 id="setup-styles">2. Load the styles</h2>
        <p>Copy <code>build/packages/meridian_ui/priv/</code> into your public assets as <code>meridian-ui/</code>. Keep the <code>fonts/</code> directory and its licence beside the stylesheet. Load it before your app's styles:</p>
        ${snippet_markup("Stylesheet link", "html", '<link rel="stylesheet" href="./meridian-ui/meridian-ui.css" />')}
      </section>
      <section aria-labelledby="setup-component">
        <h2 id="setup-component">3. Render a component</h2>
        <p>Use this view in your Lustre app. Pass your save message to <code>view</code>. The themed root keeps Meridian's styles scoped to your UI.</p>
        ${code_markup("Component example", starterSource)}
      </section>
      <section aria-labelledby="setup-interactions">
        <h2 id="setup-interactions">4. Mount interactions</h2>
        <p>Import <code>meridian_ui</code> and call this once after <code>app-ui</code> has rendered, for example in a Lustre <code>before_paint</code> effect. It enables themed pickers, tooltips, drag gestures and shared keyboard controls.</p>
        ${code_markup("Mount after rendering", 'let dispose = meridian_ui.mount("app-ui", fn(_) { Nil }, fn() { Nil })')}
        <p>Call <code>dispose()</code> if you shut down the app without removing its root. The two callbacks let your app react to system theme and desktop layout changes.</p>
      </section>
      <p><a href="#/components/button">Try the Button example</a>, find a component in the navigation, or <a href="${repository}#shell-and-lifecycle">read the lifecycle guide</a>.</p>
    </div>`;
}

function component(entry) {
  main.innerHTML = `
    <header class="docs-component-heading">
      <p id="component-group" class="eyebrow"></p><h1 id="component-name"></h1>
      <p id="component-description" class="docs-lead"></p>
      <div class="docs-component-links"><span id="component-status" class="docs-status"></span><a id="api-source">Component source <span aria-hidden="true">↗</span></a><a id="example-source">Full example on GitHub <span aria-hidden="true">↗</span></a></div>
    </header>
    <section class="panel docs-example" aria-labelledby="preview-heading">
      <div class="docs-section-bar"><h2 id="preview-heading">${toggle_markup("preview-section", "Live example", true)}</h2><a id="standalone-preview" target="_blank" rel="noopener">Open preview <span aria-hidden="true">↗</span><span class="sr-only"> (new tab)</span></a></div>
      <div id="preview-section-content" role="region" aria-labelledby="preview-section-toggle">
      <p id="preview-status" class="sr-only" role="status">Loading preview...</p>
      <div id="preview-container"></div>
      </div>
    </section>
    <div id="component-docs"></div>
    <div id="source-demo"></div>
    <p class="docs-native-note muted">Examples run locally in your browser. Reload the preview to reset its state. Business data, persistence and server validation belong to your application.</p>`;
  document.getElementById("component-group").textContent = entry.group;
  document.getElementById("component-name").textContent = entry.name;
  const description =
    entry.description[0].toUpperCase() + entry.description.slice(1);
  document.getElementById("component-description").textContent = description;
  const status = document.getElementById("component-status");
  if (entry.status === "Platform")
    status.textContent = "Native platform example";
  else status.remove();
  const api = document.getElementById("api-source");
  api.href = entry.module
    ? `${repository}/blob/main/src/${entry.module}.gleam`
    : `${repository}#use-it`;
  document.getElementById("example-source").href =
    `${repository}/blob/main/examples/catalogue/src/catalogue/${entry.family}.gleam`;
  document.getElementById("standalone-preview").href = previewURL(entry);
  const frame = document.createElement("iframe");
  frame.title = `${entry.name} interactive example`;
  frame.src = previewURL(entry);
  frame.style.height = "1px";
  frame.style.visibility = "hidden";
  frame.addEventListener("load", () => {
    if (!frame.isConnected) return;
    frame.contentDocument.addEventListener("pointerdown", closeAppearance, {
      capture: true,
    });
    stopToasts();
    stopToasts = () => {};
    if (
      entry.id === "toast" &&
      frame.contentDocument.getElementById("demo-root")
    )
      stopToasts = previewToasts(frame);
  });
  document.getElementById("preview-container").append(frame);
  document
    .getElementById("component-docs")
    .append(...componentDocs(entry, frame));
  stopSource = start_source("source-demo", entry.snippet, entry.family);
}

function render(focus = false) {
  closeAppearance();
  stopToasts();
  stopToasts = () => {};
  stopSource();
  stopSource = () => {};
  const hash = location.hash;
  current = entries.find((entry) => route(entry) === hash);
  if (current) component(current);
  else if (["", "#/", "#main"].includes(hash)) gettingStarted();
  else {
    main.innerHTML =
      '<h1>Component not found</h1><p>That link is not in this catalogue. <a href="#/">Getting started</a> or try the search.</p>';
  }
  document.title = `${current?.name ?? "Getting started"} - Meridian UI`;
  main.setAttribute("aria-busy", "false");
  renderNavigation();
  if (focus) {
    closeNavigation();
    main.focus({ preventScroll: true });
    scrollTo(0, 0);
  }
}

addEventListener("message", (event) => {
  const frame = main.querySelector("iframe");
  if (
    !frame ||
    event.origin !== location.origin ||
    event.source !== frame.contentWindow ||
    event.data?.component !== current?.id
  )
    return;
  if (
    event.data.type === "meridian-height" &&
    Number.isFinite(event.data.height)
  ) {
    frame.dataset.contentHeight = String(event.data.height);
    sizePreview(frame);
  }
  if (
    event.data.type === "meridian-overlay" &&
    typeof event.data.open === "boolean"
  ) {
    frame.dataset.overlayOpen = String(event.data.open);
    frame.dataset.overlayDialog = String(
      event.data.open && event.data.dialog === true,
    );
    sizePreview(frame);
  }
  if (event.data.type === "meridian-ready") {
    if (
      event.data.theme !== theme ||
      event.data.direction !== direction ||
      event.data.style !== style ||
      event.data.primary !== primary ||
      event.data.secondary !== secondary ||
      event.data.surface !== surface ||
      event.data.ripple !== ripple
    ) {
      settings();
      return;
    }
    if (!Number.isFinite(event.data.height)) return;
    frame.dataset.contentHeight = String(event.data.height);
    sizePreview(frame);
    frame.dispatchEvent(new Event("meridian-preview-ready"));
  }
  if (
    event.data.type === "meridian-configured" &&
    Number.isFinite(event.data.height)
  ) {
    frame.dataset.contentHeight = String(event.data.height);
    sizePreview(frame);
    frame.dataset.ready = current.id;
    frame.style.visibility = "visible";
    if (
      current.id === "toast" &&
      !document.querySelector(".docs-preview-toasts")
    )
      stopToasts = previewToasts(frame);
    document.getElementById("preview-status").textContent = "Preview ready.";
  }
  if (event.data.type === "meridian-error") {
    const status = document.getElementById("preview-status");
    status.classList.remove("sr-only");
    status.textContent =
      "The preview could not be loaded. Try opening it in a new tab.";
  }
});
settings();
const stopInteractions = mount(
  "docs-root",
  (dark) => {
    systemDark = dark;
    settings();
  },
  () => {},
);
addEventListener("pagehide", (event) => {
  if (!event.persisted) {
    stopSource();
    stopToasts();
    stopInteractions();
    headerSize.disconnect();
  }
});
try {
  const response = await fetch("./catalogue.json");
  if (!response.ok) throw new Error("Catalogue unavailable");
  entries = await response.json();
  render();
  addEventListener("hashchange", () => {
    if (location.hash !== "#main") render(true);
  });
} catch {
  main.innerHTML = `<h1>The catalogue could not be loaded</h1><p>Try reloading, or <a href="${repository}/blob/main/COMPONENTS.md">browse the component coverage on GitHub</a>.</p>`;
  main.setAttribute("aria-busy", "false");
  document.getElementById("search-status").textContent =
    "Catalogue unavailable.";
}
