import {
  start_source,
  toggle_markup,
} from "../examples/catalogue/build/dev/javascript/meridian_catalogue/catalogue_docs.mjs";
import { mount } from "../examples/catalogue/build/dev/javascript/meridian_ui/meridian_ui/browser_ffi.mjs";
import {
  next,
  is_dark,
} from "../examples/catalogue/build/dev/javascript/meridian_ui/meridian_ui/theme.mjs";

const repository =
  "https://github.com/natalie-o-perret/gleam-lustre-meridian-ui";
const root = document.body;
const main = document.getElementById("main");
const search = document.getElementById("component-search");
const navigation = document.getElementById("component-navigation");
const dialog = document.getElementById("navigation-dialog");
const navContent = document.getElementById("navigation-content");
const menuButton = document.getElementById("open-navigation");
const themeButton = document.getElementById("theme");
const directionButton = document.getElementById("direction");
const mobile = matchMedia("(max-width: 900px)");
let entries = [];
let current;
let systemDark = matchMedia("(prefers-color-scheme: dark)").matches;
let preference = "system";
let theme = systemDark ? "dark" : "light";
let direction = "ltr";
let stopSource = () => {};
const collapsedNavigation = new Set();
try {
  const saved = JSON.parse(
    localStorage.getItem("meridian-catalogue") ?? "null",
  );
  if (["light", "dark", "system"].includes(saved?.theme))
    preference = saved.theme;
  if (["ltr", "rtl"].includes(saved?.direction)) direction = saved.direction;
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
  return `./preview.html?${new URLSearchParams({ component: entry.id, theme, dir: direction })}`;
}

function settings() {
  theme = is_dark(preference, systemDark) ? "dark" : "light";
  root.dataset.theme = theme;
  document.documentElement.dir = direction;
  const label = preference[0].toUpperCase() + preference.slice(1);
  const hint = `Theme: ${label}. Switch to ${next(preference)} theme`;
  themeButton.setAttribute("aria-label", hint);
  themeButton.dataset.tooltip = hint;
  themeButton.dataset.preference = preference;
  const glyph = {
    light:
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    dark: '<path d="M21 12.8A9 9 0 0 1 11.2 3 9 9 0 1 0 21 12.8Z"/>',
    system:
      '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  }[preference];
  themeButton.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${glyph}</svg>`;
  directionButton.setAttribute("aria-pressed", String(direction === "rtl"));
  const frame = main.querySelector("iframe");
  frame?.contentWindow.postMessage(
    { type: "meridian-settings", theme, direction },
    location.origin,
  );
  const standalone = document.getElementById("standalone-preview");
  if (standalone && current) standalone.href = previewURL(current);
}

function saveSettings() {
  settings();
  try {
    localStorage.setItem(
      "meridian-catalogue",
      JSON.stringify({ theme: preference, direction }),
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

function renderNavigation() {
  const query = normalise(search.value);
  const matches = entries.filter((entry) =>
    normalise(`${entry.name} ${entry.group} ${entry.module ?? ""}`).includes(
      query,
    ),
  );
  navigation.replaceChildren();
  const overview = node("a", "docs-overview-link", "Overview");
  overview.href = "#/";
  if (!current && ["", "#/"].includes(location.hash))
    overview.setAttribute("aria-current", "page");
  navigation.append(overview);
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

function overview() {
  main.innerHTML = `
    <section class="docs-hero">
      <p class="eyebrow">The Meridian component catalogue</p>
      <h1>Small components.<br />Room for ideas.</h1>
      <p class="docs-lead">Native foundations, Gleam types and a considered design. Explore every building block, try it live and take the source with you.</p>
      <div class="docs-hero-actions"><a class="button primary-button" href="#/components/button">Explore the components <span aria-hidden="true">→</span></a><a class="button" href="${repository}#use-it">Get started with Gleam</a></div>
      <div class="docs-stats"><span><strong>93</strong> core entries</span><span><strong>4</strong> advanced widgets</span><span><strong>4</strong> utilities and additions</span></div>
    </section>
    <section class="docs-intro" aria-labelledby="catalogue-heading">
      <div><p class="eyebrow">A place for everything</p><h2 id="catalogue-heading">Find your building block</h2></div>
      <p class="muted">Every entry includes a live preview and the Gleam code that renders it. Switch the theme or direction at any time.</p>
    </section>
    <div id="category-grid" class="docs-category-grid"></div>
    <section class="panel docs-note"><h2>Native by design</h2><p>Meridian builds on browser semantics, with shared styling, keyboard access and application-owned state. Native popup interiors follow your browser and OS. Optional engines are bundled locally and loaded with their examples.</p><a href="${repository}/blob/main/COMPONENTS.md">Read the component guide <span aria-hidden="true">↗</span></a></section>`;
  const grid = document.getElementById("category-grid");
  for (const group of groups()) {
    const members = entries.filter((entry) => entry.group === group);
    const section = node("section", "panel docs-category");
    const heading = node("div", "docs-category-heading");
    const title = node("h3");
    const id = `category-${normalise(group)}`;
    title.innerHTML = toggle_markup(id, group, true);
    heading.append(
      title,
      node("span", "docs-category-count", String(members.length)),
    );
    section.append(heading);
    const list = node("ul", "docs-category-links");
    list.id = `${id}-content`;
    for (const entry of members) {
      const item = node("li");
      const link = node("a", "", entry.name);
      link.href = route(entry);
      item.append(link);
      list.append(item);
    }
    section.append(list);
    grid.append(section);
  }
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
    <div id="source-demo"></div>
    <p class="docs-native-note muted">Examples run locally in your browser. Reload the preview to reset its state. Business data, persistence and server validation belong to your application.</p>`;
  document.getElementById("component-group").textContent = entry.group;
  document.getElementById("component-name").textContent = entry.name;
  const description =
    entry.description[0].toUpperCase() + entry.description.slice(1);
  document.getElementById("component-description").textContent = description;
  document.getElementById("component-status").textContent =
    entry.status === "Platform"
      ? "Native platform feature"
      : "Meridian component";
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
  frame.style.height = "360px";
  document.getElementById("preview-container").append(frame);
  stopSource = start_source("source-demo", entry.snippet, entry.family);
}

function render(focus = false) {
  stopSource();
  stopSource = () => {};
  const hash = location.hash;
  current = entries.find((entry) => route(entry) === hash);
  if (current) component(current);
  else if (["", "#/", "#main"].includes(hash)) overview();
  else {
    main.innerHTML =
      '<h1>Component not found</h1><p>That link is not in this catalogue. <a href="#/">Browse all components</a> or try the search.</p>';
  }
  document.title = `${current?.name ?? "Component catalogue"} - Meridian UI`;
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
  )
    frame.style.height = `${Math.min(1100, Math.max(340, event.data.height))}px`;
  if (event.data.type === "meridian-ready") {
    frame.dataset.ready = current.id;
    document.getElementById("preview-status").textContent = "Preview ready.";
    settings();
  }
  if (event.data.type === "meridian-error")
    document.getElementById("preview-status").textContent =
      "The preview could not be loaded. Try opening it in a new tab.";
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
    stopInteractions();
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
