# Meridian UI

A small styled UI package for Lustre 5.7, extracted from the
[Meridian dashboard](https://github.com/natalie-o-perret/spa-dashboards/tree/main/gleam-lustre).
[See the design in action](https://natalie-o-perret.github.io/spa-dashboards/gleam-lustre/).
The API is experimental and the package is not published to Hex.

No Tailwind, JavaScript UI framework, remote fonts or icon assets are required.
The runtime dependencies are Lustre and Gleam's standard library.

## Use it

Add a Git dependency to your app's `gleam.toml`:

```toml
[dependencies]
meridian_ui = { git = "https://github.com/natalie-o-perret/gleam-lustre-meridian-ui.git", ref = "main" }
```

Pin a commit instead of `main` when you need reproducible updates.
Run `gleam deps download`, then copy
`build/packages/meridian_ui/priv/meridian-ui.css` to your public assets and load it
before application styles. Wrap the components in a themed root:

```gleam
import lustre/attribute as a
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/card

pub fn view(on_save) {
  h.div([a.class("meridian-ui"), a.data("theme", "light")], [
    card.section([a.aria_label("Settings")], [
      button.primary([event.on_click(on_save)], [h.text("Save")]),
    ]),
  ])
}
```

Components accept ordinary Lustre attributes and children. Native form events,
disabled controls and form submission work as usual. Buttons default to
`type="button"`, which you can override with `a.type_("submit")`.

## Components

| Module                 | Exports                                                       |
| ---------------------- | ------------------------------------------------------------- |
| `meridian_ui/button`   | `view`, `primary`, `text`, `icon`                             |
| `meridian_ui/card`     | `section`, `article`                                          |
| `meridian_ui/badge`    | `view` with `Success`, `Warning`, `Danger`, `Accent`          |
| `meridian_ui/field`    | `input`, `search`, `select` with native options               |
| `meridian_ui/checkbox` | `view` with an accessible label and optional hint text        |
| `meridian_ui/tooltip`  | `hint` attribute, activated by `meridian_ui.mount`            |
| `meridian_ui/theme`    | Light/Dark/System cycle, OS preference and keyed persistence  |
| `meridian_ui/shell`    | Responsive shell, menu/close buttons and scoped focus helpers |

Give icon-only buttons an `aria-label`. Give inputs and selects a visible or
accessible label. Tooltips are supplementary descriptions, not accessible names.
Checkboxes stay native, including the `indeterminate` property and forced-colour
fallback. Selects use native keyboard behaviour, with styled pickers where supported.

## Themes and scope

Set `data-theme="light"` or `data-theme="dark"` on each `.meridian-ui` root.
`theme.is_dark(preference, system_dark)` resolves the System preference.
Each root has its own tokens, so siblings can use different themes.

Styles and resets stay inside `.meridian-ui`. Set CSS variables on the root to
customise it, for example `--accent`, `--accent-soft`, `--bg`, `--panel`, `--ink`,
`--muted`, `--border` and `--font`. The default font is the system sans-serif.
Branding, font files and icons belong to the consuming application.

For a full-page application, optionally put `class="meridian-page"` on `<html>`.
This opts the page's native scrollbar into the same theme and 8px grab area.
It follows dark mode when any UI root is dark, so omit it when embedding multiple
independently themed roots. Modern CSS nesting and `:has()` are required.

## Shell and lifecycle

`shell.view` receives a unique root ID, resolved theme, menu state, dismiss
message, root attributes and `shell.Content` slots for the topbar, sidebar,
main content and footer. The app owns all slot content and menu state.

Use `shell.menu_button` with the same ID, include `shell.close_button` in the
sidebar, and close the menu when a navigation link is activated. Supply decorative
icons as Lustre elements. The shell reserves `<id>-main`, `<id>-navigation` and
`<id>-tooltip` IDs. It provides a skip link, modal drawer semantics and an inert
background while the menu is open. A mobile modal drawer locks page scrolling.

Call `meridian_ui.mount(id, on_system_theme, on_desktop)` in a Lustre
`before_paint` effect, after the root has rendered. The desktop callback should
close the menu. Use `shell.focus_navigation(id)` after opening it and
`shell.focus_menu(id)` after closing it, from `after_paint` effects.

Mounting installs delegated tooltips, the mobile focus trap and media listeners.
It returns an idempotent disposer. Call it before shutting down a still-mounted
app. Removing the root also disposes its listeners, pending tooltip timer and
tooltip element. Mounting the same root again replaces its previous listeners.
Browser hooks target the JavaScript browser runtime, not SSR or Shadow DOM.

## Check it

With Gleam 1.19.2 and Node.js 24 installed:

```sh
make check
```

This runs Gleam formatting, compilation, component/state tests, pinned Prettier
checks and dependency-free Node tests for persistence, tooltip positioning, focus
isolation and listener cleanup. npm downloads Prettier on its first run.

Project data, charts, filtering, sorting, pagination and CSV exports deliberately
stay in the dashboard. There is no generic data-grid API.
