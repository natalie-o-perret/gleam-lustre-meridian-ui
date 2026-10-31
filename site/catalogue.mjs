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
let theme = matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";
let direction = "ltr";
try {
  const saved = JSON.parse(
    localStorage.getItem("meridian-catalogue") ?? "null",
  );
  if (["light", "dark"].includes(saved?.theme)) theme = saved.theme;
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
  root.dataset.theme = theme;
  document.documentElement.dir = direction;
  themeButton.setAttribute("aria-pressed", String(theme === "dark"));
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
      JSON.stringify({ theme, direction }),
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
  theme = theme === "dark" ? "light" : "dark";
  saveSettings();
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
    section.append(node("h2", "docs-nav-heading", group));
    const list = node("ul");
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
      <div class="docs-stats"><span><strong>93</strong> core entries</span><span><strong>4</strong> advanced widgets</span><span><strong>1</strong> filter utility</span></div>
    </section>
    <section class="docs-intro" aria-labelledby="catalogue-heading">
      <div><p class="eyebrow">A place for everything</p><h2 id="catalogue-heading">Find your building block</h2></div>
      <p class="muted">Every entry includes a live preview and the Gleam code that renders it. Switch the theme or direction at any time.</p>
    </section>
    <div id="category-grid" class="docs-category-grid"></div>
    <section class="panel docs-note"><h2>Meridian, not a PrimeNG port</h2><p>These are independent Gleam and Lustre equivalents, not Angular compatibility or a claim of feature parity. Native pickers follow your browser and OS. Optional engines are bundled locally and loaded with their examples.</p><a href="${repository}/blob/main/COMPONENTS.md">Read the coverage and limits <span aria-hidden="true">↗</span></a></section>`;
  const grid = document.getElementById("category-grid");
  for (const group of groups()) {
    const members = entries.filter((entry) => entry.group === group);
    const section = node("section", "panel docs-category");
    const heading = node("div", "docs-category-heading");
    heading.append(
      node("h3", "", group),
      node("span", "docs-category-count", String(members.length)),
    );
    section.append(heading);
    const list = node("ul", "docs-category-links");
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
      <div class="docs-section-bar"><div><span class="docs-live-dot" aria-hidden="true"></span><h2 id="preview-heading">Live example</h2></div><a id="standalone-preview" target="_blank" rel="noopener">Open preview <span aria-hidden="true">↗</span><span class="sr-only"> (new tab)</span></a></div>
      <p id="preview-status" class="sr-only" role="status">Loading preview...</p>
      <div id="preview-container"></div>
    </section>
    <section class="panel docs-source" aria-labelledby="source-heading">
      <div class="docs-section-bar"><h2 id="source-heading">Gleam example</h2><button id="copy-source" type="button">Copy code</button></div>
      <p class="docs-source-note muted">The view below uses the example's model, messages and shared helpers. Open the full module for its state and update function.</p>
      <pre tabindex="0" aria-label="Gleam example source" dir="ltr"><code id="example-code"></code></pre>
      <div class="docs-source-actions"><button id="toggle-source" type="button" aria-pressed="false">Show full module</button><a href="./source/common.gleam">Shared example helpers</a><span id="copy-status" role="status"></span></div>
    </section>
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
  const code = document.getElementById("example-code");
  code.textContent = entry.snippet;
  const copyStatus = document.getElementById("copy-status");
  document.getElementById("copy-source").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      copyStatus.textContent = "Copied.";
    } catch {
      copyStatus.textContent =
        "Copy unavailable. Select the code to copy it manually.";
    }
  });
  const toggle = document.getElementById("toggle-source");
  let fullSource;
  toggle.addEventListener("click", async () => {
    toggle.disabled = true;
    try {
      if (!fullSource) {
        const response = await fetch(`./source/${entry.family}.gleam`);
        if (!response.ok) throw new Error("Source unavailable");
        fullSource = await response.text();
      }
      const full = toggle.getAttribute("aria-pressed") !== "true";
      code.textContent = full ? fullSource : entry.snippet;
      toggle.setAttribute("aria-pressed", String(full));
      toggle.textContent = full ? "Show view only" : "Show full module";
      copyStatus.textContent = "";
    } catch {
      copyStatus.textContent =
        "The full source could not be loaded. Use the GitHub link above.";
    } finally {
      toggle.disabled = false;
    }
  });
}

function render(focus = false) {
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
