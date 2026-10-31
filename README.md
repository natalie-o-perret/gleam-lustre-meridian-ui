# Meridian UI

A small styled UI package for Lustre 5.7, extracted from the
[Meridian dashboard](https://github.com/natalie-o-perret/spa-dashboards/tree/main/gleam-lustre).
[Explore the component catalogue](https://natalie-o-perret.github.io/gleam-lustre-meridian-ui/)
or [see the original dashboard](https://natalie-o-perret.github.io/spa-dashboards/gleam-lustre/).
The API is experimental and the package is not published to Hex.

The library includes 96 core entries, four advanced widgets, FilterService,
FormValidation, CodeBlock and Icons. Components share Meridian's design and native browser semantics, with
optional open-source engines for richer widgets.
[Component catalogue](COMPONENTS.md) lists their APIs and limits.

No Tailwind, remote fonts or icon assets are required. Applications use Lustre and
Gleam's standard library. Optional masks, charts, calendars and rich-text editing
use locally bundled open-source engines. There are no CDN imports or runtime npm
installs. See [engine licence notices](src/meridian_ui/internal/vendor/LICENCES.md).

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

| Module                      | Exports                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `meridian_ui/button`        | `view`, `primary`, `text`, `icon`                                |
| `meridian_ui/card`          | `section`, `article`                                             |
| `meridian_ui/badge`         | `view` with `Success`, `Warning`, `Danger`, `Accent`             |
| `meridian_ui/field`         | Native fields, labels, icons, addons, groups and fluid layouts   |
| `meridian_ui/checkbox`      | `view` with an accessible label and optional hint text           |
| `meridian_ui/tooltip`       | `hint` attribute, activated by `meridian_ui.mount`               |
| `meridian_ui/theme`         | Light/Dark/System cycle, OS preference and keyed persistence     |
| `meridian_ui/shell`         | Responsive shell, menu/close buttons and scoped focus helpers    |
| `meridian_ui/skeleton`      | Decorative loading placeholders and circles                      |
| `meridian_ui/spinner`       | Labelled determinate and indeterminate progress rings            |
| `meridian_ui/progress`      | Native percentage bars and unknown-duration loading bars         |
| `meridian_ui/message`       | Status messages, tones and controlled dismissal                  |
| `meridian_ui/avatar`        | Named initials, images, custom content and groups                |
| `meridian_ui/chip`          | Content chips with optional labelled removal                     |
| `meridian_ui/divider`       | Native, vertical and labelled separators                         |
| `meridian_ui/radio`         | Labelled native radio inputs                                     |
| `meridian_ui/toggle_switch` | Native checkbox with switch semantics                            |
| `meridian_ui/toggle_button` | Native button with controlled pressed state                      |
| `meridian_ui/slider`        | Native scalar range input                                        |
| `meridian_ui/password`      | Labelled masked field and controlled reveal                      |
| `meridian_ui/panel`         | Headed panels, independent actions and controlled collapse       |
| `meridian_ui/fieldset`      | Native grouping, legends, disabled state and controlled collapse |
| `meridian_ui/scroll_area`   | Labelled, keyboard-focusable native scrolling                    |

The [coverage ledger](COMPONENTS.md) lists the complete catalogue. Additional
families live in their own modules:

- Forms: `autocomplete`, `cascade_select`, `date_picker`, `input_mask`, `input_otp`,
  `input_tags`, `key_filter`, `knob`, `listbox`, `rating`, `select`, `select_button`,
  `tree_select` and `validation`.
- Layout: `accordion`, `splitter`, `stepper`, `tabs` and `toolbar`.
- Overlays: `dialog`, `drawer`, `confirm_dialog`, `confirm_popup` and `popover`.
- Navigation: `breadcrumb`, `command_menu`, `context_menu`, `dock`, `mega_menu`,
  `menu`, `menubar`, `sidebar`, `speed_dial`, `split_button` and `tiered_menu`.
- Data: `data_view`, `order_list`, `org_chart`, `paginator`, `pick_list`, `table`,
  `timeline`, `tree`, `tree_table`, `virtual_scroller` and `filter_service`.
- Media and utilities: `animate_on_scroll`, `block_ui`, `carousel`, `compare`,
  `file_upload`, `file_tree`, `focus_trap`, `gallery`, `inplace`, `meter_group`, `ripple`,
  `scroll_top`, `terminal` and `toast`.
- Advanced widgets: `charts`, `scheduler`, `task_board` and `text_editor`.

Give icon-only buttons an `aria-label`. Give inputs and selects a visible or
accessible label. Tooltips are supplementary descriptions, not accessible names.
Checkboxes stay native, including the `indeterminate` property and forced-colour
fallback. Selects use native keyboard behaviour, with styled pickers where supported.

`field.option` accepts elements such as a badge. Supporting browsers display that
content in both the picker and selected value. Other browsers keep native text
labels. Keep option content non-interactive and avoid IDs because it is cloned
into the selected value.
`select.view_with` accepts an `fn(select.Option) -> Element(msg)` callback for the
same custom content, including tags. Search still uses the option's label, form
submission uses its value, and filtered-out selections stay selected.

Tooltips open after 100ms of hover, or immediately on keyboard focus. Moving
within the same control doesn't restart the hover delay. A short fade respects
reduced-motion preferences, and the hide grace period lets you move onto the hint.

### Loading and feedback

`spinner.view(label, value, attrs)` and `progress.view(label, value, attrs)` use
`Some(percent)` for known progress or `None` for an unknown duration. Percentages
are clamped to 0-100. Skeletons are hidden from assistive technology. Mark their
containing region busy and replace them when data arrives:

```gleam
import gleam/option.{None}
import lustre/attribute as a
import lustre/element/html as h
import meridian_ui/skeleton
import meridian_ui/spinner

pub fn loading() {
  h.section([a.aria_label("Projects"), a.aria_busy(True)], [
    spinner.view("Loading projects", None, []),
    skeleton.circle([]),
    skeleton.view([a.style("width", "60%")]),
  ])
}
```

Messages default to polite `status` announcements. Pass `a.role("alert")` only
when an urgent interruption is needed. `message.dismissible` and `chip.removable`
emit the supplied message through native buttons. Your update function owns
removal, so the DOM stays in sync with Lustre state.
When removing a focused control, restore focus to the next relevant control or
region after painting. The library cannot choose that application-specific target.

`avatar.label(name, initials, attrs)` keeps the full accessible name while showing
initials. `avatar.image(src, description, attrs)` uses a native image alternative.
Keep custom avatar content non-interactive, such as a decorative icon.
Use `--avatar-size`, ordinary styles and classes for sizing and shape. Group
avatars with `avatar.group(label, attrs, avatars)`. Dividers provide `view`,
`vertical` and `label` variants.

After `make check`, serve the package root with a static HTTP server and open
`test/feedback.html` for an interactive preview of these components. The fixture
shows caller-owned state updates and focus restoration after removal.

### Native forms

`field.input`, `number`, `colour`, `textarea`, `select` and `option` preserve native
values and events. Number fields keep strings rather than parsing or formatting
money. Bounds, steps, required fields, read-only fields and disabled controls use
the browser's constraint validation. Validate submitted data again at the
application boundary.

`field.textarea(attrs, value)` uses native CSS autosizing where supported and
otherwise remains manually resizable. `slider.view(attrs)` is a native single-value
range input. `slider.range` uses two separately labelled native thumbs and clamps
them so they cannot cross. Numeric currency/localised formatting is not provided.

`radio.view(label, attrs)` uses native radio groups. Give related radios the same
`name`. `toggle_switch.view(label, attrs)` uses a native checkbox with switch
semantics. Checked values, disabled state and keyboard behaviour stay native.
Unchecked and disabled controls are omitted from native form data.

`toggle_button.view(pressed, attrs, children)` exposes a lowercase `aria-pressed`
state. Handle clicks in the caller and keep its label stable. It is a button, not
a successful form control. Add an application-owned hidden field if you need its
state included in a form submission.

`password.view(id, label, visible, on_toggle, attrs)` leaves the value and reveal
state in the caller. The ID must be unique. Disabling its native input also
disables the reveal button. It does not invent a password-strength policy.

Join inputs, `field.addon` content and ordinary buttons with `field.group`.
The group owns the field focus border. `field.fluid` makes descendant fields fill
their container. Use `field.icon` or `field.trailing_icon` for one decorative icon
beside an input or textarea. Use groups instead for interactive addons.

`field.floating` and `field.inset` reference the actual control's ID. A single-space
placeholder lets an empty floating label rest inside its input or textarea:

```gleam
import lustre/attribute as a
import lustre/event
import meridian_ui/field

pub fn title_input(value, on_change) {
  field.floating("project-title", "Project title", [], field.input([
    a.id("project-title"),
    a.placeholder(" "),
    a.value(value),
    event.on_input(on_change),
  ]))
}
```

Long floating/inset labels truncate visually without shortening their accessible
names. Reset controlled values in your model. A browser-only form reset does not
update application state.

`field.floating_label` wraps one control in its label when an explicit ID isn't
needed. Tables use it for search, page number and page-size controls.

`validation.check(form_id)` reads native constraint errors without opening browser
validation bubbles. Give validated fields unique IDs. Add caller-owned cross-field
errors as `validation.FieldError(field_id, message)`, then render
`validation.attributes` on the control and `validation.message` beside it.
Keep other hints in `aria-describedby` too. Use `novalidate` on a form that renders
these messages itself, and validate again on the server. The FormValidation
example combines required/email/length constraints with matching passwords.

After `make check`, `test/forms.html` demonstrates independent forms, native
submission, validation, disabled/read-only fields and controlled password reveal.

### Selection and structured fields

`listbox` preserves native multi-selection, typeahead and repeated form values.
`select` adds search around the existing enhanced native picker. Searching does
not silently clear a filtered-out selected value. `select_button` and `rating`
use real radio or checkbox inputs rather than simulated form controls.
Apply `select_button.Action` and `cascade_select.Action` with their `update`
functions against the latest selection, so rapid edits don't overwrite each other.

`input_tags` emits actions. Apply them with `input_tags.update(latest_model,
action)` in your update function. Enter or comma commits a trimmed unique value.
Backspace in an empty draft removes the last tag. Non-empty drafts also participate
in form submission. Use the latest model when processing actions and submission.

`input_otp` is one native string input, so leading zeroes, paste and one-time-code
autofill survive. `key_filter.pattern` adds validation without deleting invalid
text or interfering with composition. `autocomplete` retains native datalists as
its fallback. Mount interactions for a themed, scrollable popup with filtering,
arrow-key selection and Escape dismissal. Replace suggestions in your model when
async results arrive. Input values and form submission stay native.

`cascade_select` consumes validated `hierarchy.Node` values and only submits an
enabled leaf. Changing a parent truncates stale descendants. Date pickers retain
native ISO strings. Date/time inputs are zone-less local values, not automatic
time-zone conversions. `knob` retains a native range input and uses that input
directly in forced-colour mode.

### Controlled interactions

Mount the themed root once with `meridian_ui.mount` for keyboard, pointer, overlay
and utility interactions. The caller still owns state. Use unique IDs for tabs,
disclosures, overlays and menus. Commit emitted actions to the latest model.

- Tabs support automatic or manual activation and both orientations. Inactive
  panels retain their DOM. Linear steppers require preceding steps to be complete.
- Splitters emit clamped percentages and support pointer dragging, arrow keys,
  Shift+arrow, Home and End. Collapsed panes are inert.
- Dialogs use native modal or non-modal lifecycle methods without scrolling the
  page on open. Drawers support physical Left/Right and logical Start/End sides,
  plus Top/Bottom, with reduced-motion-aware slide transitions.
  Popovers use the native top layer, Escape and outside dismissal. Closing
  restores focus unless the user has moved it elsewhere. A dynamic dialog is an
  ordinary `dialog.view` whose title and children come from application state.
  Give its opener `a.data("meridian-opener", dialog_id)` for reliable focus return,
  including browsers that don't focus a button when it is clicked.
- Menus use roving focus, Home/End, typeahead and nested disclosure. Mega-menu
  navigation uses native details and links. Construct link destinations with
  `url.parse`, which rejects executable URL schemes.
- Trees share expansion/selection state with tree selects and tree tables. Tree
  branches animate expansion and collapse unless reduced motion is requested.
  Pass `tree.appearance(lines, boxed_toggles, animated)` as attributes to Tree,
  TreeSelect, FileTree or TreeTable to configure dashed lines, tiny +/- boxes and
  animation independently. These options default to enabled.
  `tree.view_with` accepts a node-render callback for custom non-interactive
  content. Include its visible label for keyboard typeahead and accessible naming.
  Tree tables retain native table navigation and disclosure buttons.
- Tables accept typed column comparators, stable row keys and caller-rendered
  cells, including editors. `table.view` filters, sorts and pages local data.
  `table.page` renders an already-filtered remote page and total.
- Order lists, pick lists and task boards provide native move controls alongside
  drag/drop, with a live destination preview before drop. Keep IDs unique.
  Task-board updates return errors for invalid moves.
- Paginators have labelled arrow controls and a numeric page field with bounded
  autocomplete suggestions. Page state stays zero-based.
- Virtual scrolling uses an explicit uniform row height, overscan and measured
  viewport size. Variable-height rows need a different measured layout.

`file_tree.view(label, mode, model, on_action, attrs, entries)` adds file and folder
icons to the shared tree behaviour. Supply `file_tree.File(id, name, disabled)`
and `file_tree.Folder(id, name, disabled, children)` entries, with unique IDs across
the whole tree. Empty folders keep their folder icon. The caller owns a
`tree.Model` and applies actions with `tree.update(model, action, mode)`.
FileTree does not access a filesystem, open files or mutate them.

### Media, notifications and utilities

Carousels are manually advanced. Autoplay is not enabled by default. If an app
adds autoplay, pause it for hover, focus and reduced motion. Galleries add image
alternatives, thumbnails and modal previews. Compare controls retain a labelled
native range as their keyboard alternative.
`compare.view_with` adds horizontal/vertical comparison and an optional on-image
drag handle. It uses the same native range for pointer and keyboard input.

File uploads expose native selection, drop validation and repeated files. Size
limits are bytes per file. `file_upload.upload` sends multipart `files` fields,
reports progress and returns a cancel function. Status zero means a network error
or cancellation. Check HTTP status in the caller and validate uploads again on
the server. Client-side type and size checks are not a security boundary.

Toasts keep their queue in the caller. Timers pause for hover, focus and hidden
pages. A zero timeout is persistent. BlockUI uses native `inert`, not just a
painted overlay. Focus traps yield to native modal dialogs. Inplace keeps editor
nodes mounted and transfers focus between display and editing.

Ripple and scroll reveal respect reduced motion. Scroll-to-top also moves focus
to the destination. Terminal commands are plain text delivered to the application.
The library never evaluates them or starts a process.

### Optional engines

`input_mask`, `charts`, `scheduler` and `text_editor` each expose `mount(id)`.
Call it after that component renders and keep its idempotent cleanup function.
Removing the component disposes its engine. Mounting it again replaces the old
instance. These mounts are separate from the themed-root mount, so ordinary
dashboard controls do not import the large engines.

- IMask handles masked editing, paste and composition. Pattern tokens are `0`
  for digits, `a` for letters and `*` for either. Mask changes emit masked/raw
  strings and a completion flag.
- ECharts renders SVG chart families with typed data, selection events, responsive
  sizing and an adjacent data alternative with native selection buttons.
  `charts.validate` checks series/data
  compatibility. Candlestick ranges are open, close, low, high. Box plots are
  minimum, lower quartile, median, upper quartile, maximum.
  Selection indices match the engine. Hierarchies use preorder indices starting
  at `1`, after the implicit series root. Other series start at `0`.
- FullCalendar provides month/week/day/agenda views, time zones, recurrence and
  pointer edits. The caller commits proposed event changes. All-day ends are
  exclusive. Weekly recurrence uses Monday `0` through Sunday `6`. Event-list
  buttons expose the same selection action for application-owned native editors.
  Recurring duration is elapsed time, calculated in the configured zone. Use
  explicit ISO offsets when a local time repeats during a clock change.
- ProseMirror owns rich-text selection, composition, history, lists and tables.
  Store its canonical JSON document. `text_editor.parse` validates imported JSON.
  The toolbar's text colour picker preserves validated hex colours in JSON and
  rendered HTML. These authored colours aren't remapped when the theme changes.
  `text_editor.parse_markdown` imports CommonMark and
  `text_editor.to_markdown` exports it. Export returns an error rather than losing
  text colours, underline, strike-through or tables, which require JSON.
  Pasted HTML is reduced to the schema and unsafe URLs are rejected. `to_html`
  serialises that schema in the browser. This is not a general-purpose sanitiser
  for arbitrary HTML outside the editor.

`code_block.view` keeps the Gleam viewer defaults. Use
`code_block.view_language` with `Json`, `Toml` or `Html` for other source snippets.
All viewers preserve source selection, line numbers and full-source copy.
Gleam additionally supports function/type folding.

The pinned engine sources are build-time npm dependencies. Committed local bundles
and their notices allow Git consumers to build without npm engine resolution.
Run `npm run build:engines` after an intentional engine update. `make check`
rebuilds them in memory and compares the bytes and licence notices. Preserve the
notices when redistributing an application that bundles those engines.

### Panels and scrolling

`panel.view(title, attrs, actions, children)` adds a heading and independent
header actions to a Meridian card. `panel.collapsible(id, title, expanded,
on_toggle, attrs, actions, children)` adds a native non-submit toggle button and
an associated labelled content region. The caller owns expansion.

`fieldset.view(legend, attrs, children)` uses native fieldset/legend grouping.
`fieldset.collapsible(id, legend, expanded, on_toggle, attrs, children)` adds the
same controlled disclosure behaviour. Native disabled fieldsets disable their
controls, except those in the first legend. Its legend toggle therefore remains
operable while its content controls are disabled.

Collapsible IDs must be unique. Collapsing retains the content DOM and native
form values. It does not disable controls or remove their validation constraints.
Move focus to a relevant visible control if your application hides currently
focused content programmatically.

`scroll_area.view(label, attrs, children)` is a named, focusable native scroll
region with Meridian's existing scrollbar styling. It supports vertical and
horizontal scrolling without replacing the browser's keyboard, wheel or touch
behaviour. The default maximum height is `20rem`. Set sizes through ordinary CSS.
Scrollbar visibility follows browser/OS preferences, not a simulated overlay.

After `make check`, `test/panels.html` demonstrates these behaviours with two
independent instances, retained native inputs, disabled fieldsets and scroll areas.

## Themes and scope

Set `data-theme="light"` or `data-theme="dark"` on each `.meridian-ui` root.
`theme.is_dark(preference, system_dark)` resolves the System preference.
Each root has its own tokens, so siblings can use different themes.

Styles and resets stay inside `.meridian-ui`. Set CSS variables on the root to
customise it, for example `--accent`, `--accent-soft`, `--bg`, `--panel`, `--ink`,
`--muted`, `--border` and `--font`. The default font is locally bundled Manrope,
with a system sans-serif fallback. Keep `priv/fonts/` beside the stylesheet when
copying it. Its [OFL licence](priv/fonts/OFL.txt) ships with the font.
Branding, additional fonts and icons belong to the consuming application.

Cards have 24px padding by default. Panels with their own headers manage their
content spacing separately. Applications can override these defaults with CSS.

`code_block.view(label, source, attrs)` renders escaped, selectable Gleam source
with syntax colours, line numbers, a left-to-right code layout and keyboard
scrolling. Line numbers stay out of selected and copied text. It does not evaluate
HTML or source code. Compose it with `tabs.view` and ordinary buttons to build a
multi-file example, as the catalogue does.
Each viewer has a native expand/collapse control. With interactions mounted, its
own toolbar copies the full source or expands/collapses function and type bodies.
Gutter buttons fold individual bodies. Folding ignores braces in comments and
strings. Source text is retained when folded.

`icon.view(icon.Home, attrs)` renders one of Meridian's 128 SVG icons.
Icons inherit the surrounding colour and are decorative by default. Label their
button or link. `icon.all()`, `icon.name()` and `icon.category()` power the gallery.
`icon.view_with` offers Auto, Outline, Soft and Duotone treatments. Auto follows the
root's component style. The GitHub mark is official GitHub artwork, not Meridian's.
Brand marks retain their official shape and fill.

Set `data-style` on the themed root to `rounded`, `square`, `playful` or `fantasy`.
Rounded is the default. Controls, panels and icons share the preset.
Square uses crisp corners and strokes.
Playful uses softer shapes and tinted icons. Fantasy adds asymmetric corners and
duotone icons. These are CSS tokens, not separate component implementations.
Override `--radius`, `--radius-small` or the `--icon-*` tokens for your own style.
The catalogue's primary/accent and secondary colour controls derive readable
foreground/background shades and sync them across previews, notices and themes.
They show a compact colour swatch and its hex value. Icon-choice menus include
the corresponding SVG in the options and selected value where customisable native
selects are supported.

`date_picker.view`, `date_picker.month`, `date_picker.time` and
`date_picker.date_time` share styled controls and native min/max, step, required
and form behaviour. `date_picker.range` and `date_picker.date_time_range` select
both endpoints in one calendar and highlight the span. Date/time ranges have a
time editor for each endpoint. Apply commits both values. Escape leaves them
unchanged. The independently named native start/end fields and cross-bounds
remain available for forms and keyboard editing. Time values are local times,
not time-zone conversions.
With browser interactions mounted, clicking a field or pressing Alt+ArrowDown
opens a themed calendar or time dialog. Escape closes it and returns focus.
The calendar heading drills up to month and decade-sized year grids. Choosing a
year or month navigates without committing a new day or range.
Native keyboard editing remains available, as do native pickers without the mount.
Time dialogs have hour, minute and second listboxes. Time inputs default to
`step="1"`, but keep an explicit caller step. Fractional values or steps expose a
millisecond field. Native validity still checks bounds and step before applying.
Now uses the selected zone and the input's step. Optional `zoned_time` and
`zoned_date_time` helpers keep the entered clock time when the zone changes.
They submit the clock value and `name-zone` separately. An empty zone uses the
browser's IANA zone. Apply commits zone edits. Cancel leaves the stored values alone.

`rating.range` accepts an optional float value, minimum, maximum and step, including
half-stars. None means unrated, even when zero is a valid score. Native radios keep
keyboard and form behaviour. Invalid or excessive ranges render an alert.

`table.remote` renders server rows unchanged and accepts the server's matching
total, loading state and error. Use `table.ServerColumn` for server sort keys.
Handle `table.Action` with `table.update`, then fetch when `table.request` changes.
The request contains query, sort, offset and limit. Selection alone does not fetch.
The caller owns transport, debouncing, cancellation, stale-response guards and
retries. Clamp or reset its page when server results shrink. The catalogue
demonstrates this with a delayed local mock, not a real API.

`paginator.with_sizes` adds page-size choices. Mounted page inputs suggest bounded
prefix matches as you type, without allocating an option for every possible page.
The caller resets or clamps its page state after changing sizes.

`scheduler.view_with` adds first weekday, weekend visibility, week numbers, current
time, slots, visible hours, event limits and read-only options. Events retain the
existing all-day, editability and recurrence settings. Calendar fetching belongs
to the caller.

`terminal.view_with` adds a custom inline prompt and read-only mode. Set
`--meridian-terminal-height` and `--meridian-terminal-wrap` through ordinary styles.
The terminal sends actions to your application. It never executes a shell.

`toast.view_with` supports inline and viewport placements, tones and optional
dismissal. Timed notices pause on hover or focus. The embedded catalogue projects
positioned notices into the browser page, rather than clipping them to its iframe.

`field.colour` keeps its native form input and opens a themed hex/HSV dialog when
mounted. Cancel leaves the value unchanged. Alpha and wide-gamut colours, and
browsers without native dialogs, keep the browser's colour picker.

Popups fit the visible viewport, including zoom and same-origin ancestor frames.
They open above or below their field when space allows, otherwise within the
usable area. Dialogs centre in that area. The catalogue temporarily resizes its
preview while an overlay is open and restores its content height on close.

`carousel.view` and `gallery.view` support horizontal pointer/touch dragging when
browser interactions are mounted, including full-size gallery previews. Buttons
remain available for keyboard users. Vertical touch scrolling is preserved.
Dragging at least half the slide area's width changes slides on release. Shorter
drags return to the current slide.

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

Mounting installs delegated interactions, tooltips, the mobile focus trap and media listeners.
It returns an idempotent disposer. Call it before shutting down a still-mounted
app. Removing the root also disposes its listeners, pending tooltip timer and
tooltip element. Mounting the same root again replaces its previous listeners.
Browser hooks target the JavaScript browser runtime, not SSR or Shadow DOM.

## Check it

### Component catalogue

The GitHub Pages catalogue includes live examples and copyable Gleam source for
all 104 entries. Its getting-started page covers the Git dependency, stylesheet,
themed root and interaction mount. Search the collapsible navigation, open a component's deep link,
or cycle Light, Dark and System themes with the dashboard's icon control. RTL
previews work independently. Preview and source sections collapse without losing
state. Source tabs use Meridian's own Tabs and CodeBlock components.
Every entry has editable preview controls, distinct example presets and a reset
button. Individual edits preserve unrelated example state. Presets configure the
whole example, and Reset reloads it. The source shows the default setup.

Each entry also has an API reference. Public argument and return types come from
`gleam export package-interface`, with checked argument names from the source.
Function tables distinguish required Gleam arguments, callbacks and custom content
from preview settings and example defaults. Platform entries describe native
Lustre composition instead of inventing a Meridian API.

To build and browse it locally:

```sh
npm ci --ignore-scripts
npm run build:site
npm run serve:site
```

Open the local URL printed by the server. It uses the same repository subdirectory
as GitHub Pages. The static output is in `dist/`. The inventory comes from
`COMPONENTS.md`, and the displayed snippets come from the compiled
`examples/catalogue/` project. Chart, calendar and editor engines load with their
examples, not with the documentation shell. Full source files load when their
tabs open. Detailed API tables render when their disclosures open. Build checks
keep advanced engines out of the shell and preview bootstrap, with static gzip
budgets of 90 kB and 40 kB respectively. Script names are content-hashed and
stylesheet URLs carry their content version.

The Pages workflow publishes `main` through GitHub Actions. Set the repository's
Pages source to **GitHub Actions** before its first deployment.

### Library and site checks

With Gleam 1.19.2 and Node.js 24 installed:

```sh
npm ci --ignore-scripts
make check
npx playwright install --with-deps chromium firefox webkit
make browser-check
```

Checks include Gleam formatting/compilation, component and state tests, pinned
Prettier, listener lifecycle tests, reproducible engine bundles, catalogue coverage
and browser fixtures with WCAG checks. Browser tests serve only local static files.
Use `BROWSER=chromium` or `SUITE=selection,data` to focus a local run.
Use `npm run test:site:browser` after a site build to check the catalogue alone.

Business data, authorisation and persistence belong to the consuming application.
