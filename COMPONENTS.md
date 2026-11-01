# Component catalogue

Meridian UI provides styled Gleam and Lustre components built on native browser
semantics. Load `priv/meridian-ui.css` once inside a `.meridian-ui` root. The same
defaults apply in an application and in the [live catalogue](https://natalie-o-perret.github.io/gleam-lustre-meridian-ui/).

- **Base**: a Meridian component with the behaviour described below.
- **Platform**: an existing HTML or Lustre feature, demonstrated without a wrapper.

The catalogue contains **104 entries**: **96 core entries**, **four advanced widgets**,
FilterService, FormValidation, CodeBlock and Icons. The examples are compiled against the library.
Applications own business data, persistence, authorisation, formatting policies and
server-side validation. Optional engines are bundled locally, not loaded from a CDN.

## Core

### Form (30)

| Component                                             | Status   | Meridian coverage                                                                                                                               |
| ----------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [AutoComplete](src/meridian_ui/autocomplete.gleam)    | Base     | `meridian_ui/autocomplete`, suggestions on typing or arrow keys, input-safe popups, caller-updated async results and native datalist fallback   |
| [CascadeSelect](src/meridian_ui/cascade_select.gleam) | Base     | `meridian_ui/cascade_select`, validated hierarchies, independent level actions and enabled-leaf form values                                     |
| [Checkbox](src/meridian_ui/checkbox.gleam)            | Base     | `meridian_ui/checkbox`, native checked, indeterminate and disabled state                                                                        |
| [DatePicker](src/meridian_ui/date_picker.gleam)       | Base     | `meridian_ui/date_picker`, themed calendars for dates, months and single-calendar ranges, with native values and validation                     |
| [DateTimePicker](src/meridian_ui/date_picker.gleam)   | Base     | `meridian_ui/date_picker`, single values and ranges, time-unit selectors, Now and optional staged IANA zones that preserve clock time           |
| [FloatLabel](src/meridian_ui/field.gleam)             | Base     | `meridian_ui/field`, floating native labels with explicit control IDs or implicit label/control composition                                     |
| [IconField](src/meridian_ui/field.gleam)              | Base     | `meridian_ui/field`, leading and trailing decorative icons                                                                                      |
| [IftaLabel](src/meridian_ui/field.gleam)              | Base     | `meridian_ui/field`, permanent inset labels                                                                                                     |
| [InputColor](src/meridian_ui/field.gleam)             | Base     | `meridian_ui/field`, themed hex/HSV popup, native form values and native alpha/wide-gamut fallback                                              |
| [InputGroup](src/meridian_ui/field.gleam)             | Base     | `meridian_ui/field`, joined inputs, addons and native action buttons                                                                            |
| [InputMask](src/meridian_ui/input_mask.gleam)         | Base     | `meridian_ui/input_mask`, optional IMask editing engine, masked/raw values, paste and composition                                               |
| [InputNumber](src/meridian_ui/field.gleam)            | Base     | `meridian_ui/field`, native numeric strings, bounds, steps and validity. Applications own currency formatting                                   |
| [InputOtp](src/meridian_ui/input_otp.gleam)           | Base     | `meridian_ui/input_otp`, string entry, leading zeroes, exact constraints, paste and autofill                                                    |
| [InputPassword](src/meridian_ui/password.gleam)       | Base     | `meridian_ui/password`, controlled reveal, retained input, constraints and disabled state. Applications own strength policies                   |
| [InputTags](src/meridian_ui/input_tags.gleam)         | Base     | `meridian_ui/input_tags`, deduplicated tokens, draft submission, keyboard removal and latest-model actions                                      |
| [InputText](src/meridian_ui/field.gleam)              | Base     | `meridian_ui/field`, native labelled input attributes                                                                                           |
| [KeyFilter](src/meridian_ui/key_filter.gleam)         | Base     | `meridian_ui/key_filter`, Unicode-aware native validation without deleting paste or composition                                                 |
| [Knob](src/meridian_ui/knob.gleam)                    | Base     | `meridian_ui/knob`, pointer dial, native range keyboard/form behaviour and forced-colour fallback                                               |
| [Label](examples/catalogue/src/catalogue/forms.gleam) | Platform | Native Lustre HTML labels and for attributes                                                                                                    |
| [Listbox](src/meridian_ui/listbox.gleam)              | Base     | `meridian_ui/listbox`, native single/multiple selection, disabled options, constraints and repeated form values                                 |
| [RadioButton](src/meridian_ui/radio.gleam)            | Base     | `meridian_ui/radio`, labelled native groups, values and keyboard behaviour                                                                      |
| [Rating](src/meridian_ui/rating.gleam)                | Base     | `meridian_ui/rating`, native integer/fractional radios, min/max/step, valid zero, RTL keyboard navigation, optional clear and read-only display |
| [Select](src/meridian_ui/select.gleam)                | Base     | `meridian_ui/select`, searchable native picker, keyed options, retained filtered selection and custom item-render callback                      |
| [SelectButton](src/meridian_ui/select_button.gleam)   | Base     | `meridian_ui/select_button`, native radio/checkbox groups, required selection and latest-model actions                                          |
| [Slider](src/meridian_ui/slider.gleam)                | Base     | `meridian_ui/slider`, scalar ranges and separately named dual native thumbs that cannot cross                                                   |
| [Textarea](src/meridian_ui/field.gleam)               | Base     | `meridian_ui/field`, multiline input, native CSS autosizing and manual-resize fallback                                                          |
| [TimePicker](src/meridian_ui/date_picker.gleam)       | Base     | `meridian_ui/date_picker`, themed time dialogs, Now, optional IANA zone, native editing, min/max, step and form values                          |
| [ToggleButton](src/meridian_ui/toggle_button.gleam)   | Base     | `meridian_ui/toggle_button`, controlled native button with pressed state                                                                        |
| [ToggleSwitch](src/meridian_ui/toggle_switch.gleam)   | Base     | `meridian_ui/toggle_switch`, labelled native checkbox, keyboard and form values                                                                 |
| [TreeSelect](src/meridian_ui/tree_select.gleam)       | Base     | `meridian_ui/tree_select`, inline hierarchical single/multiple selection, summary and hidden form values                                        |

### Button (3)

| Component                                         | Status | Meridian coverage                                                                |
| ------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| [Button](src/meridian_ui/button.gleam)            | Base   | `meridian_ui/button`, native, primary, text and labelled icon controls           |
| [SpeedDial](src/meridian_ui/speed_dial.gleam)     | Base   | `meridian_ui/speed_dial`, top-layer action menu with caller-owned submenu state  |
| [SplitButton](src/meridian_ui/split_button.gleam) | Base   | `meridian_ui/split_button`, independent primary action and keyboard command menu |

### Data (10)

| Component                                                 | Status | Meridian coverage                                                                                                                        |
| --------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [DataView](src/meridian_ui/data_view.gleam)               | Base   | `meridian_ui/data_view`, typed list/grid rendering, empty state and pagination                                                           |
| [OrderList](src/meridian_ui/order_list.gleam)             | Base   | `meridian_ui/order_list`, stable item keys, native move buttons and drag/drop                                                            |
| [OrgChart](src/meridian_ui/org_chart.gleam)               | Base   | `meridian_ui/org_chart`, nested reporting hierarchy, caller-rendered nodes and native scrolling                                          |
| [Paginator](src/meridian_ui/paginator.gleam)              | Base   | `meridian_ui/paginator`, controlled zero-based pages, arrow navigation, bounded page autocomplete and page-size choices                  |
| [PickList](src/meridian_ui/pick_list.gleam)               | Base   | `meridian_ui/pick_list`, individual/all transfers, reordering, disabled items and drag/drop                                              |
| [Table](src/meridian_ui/table.gleam)                      | Base   | `meridian_ui/table`, three-state sorting, filtering, selection, keyed editors and caller-owned remote requests with loading/error states |
| [Timeline](src/meridian_ui/timeline.gleam)                | Base   | `meridian_ui/timeline`, both orientations, start/end/alternate alignment and custom marker, opposite and content renderers               |
| [Tree](src/meridian_ui/tree.gleam)                        | Base   | `meridian_ui/tree`, validated hierarchy, expansion, selection, keyboard navigation and custom node-render callback                       |
| [TreeTable](src/meridian_ui/tree_table.gleam)             | Base   | `meridian_ui/tree_table`, hierarchical rows and native disclosure buttons, not a simulated treegrid                                      |
| [VirtualScroller](src/meridian_ui/virtual_scroller.gleam) | Base   | `meridian_ui/virtual_scroller`, fixed-height windowing, overscan, measured viewport and native scrolling                                 |

### Panel (10)

| Component                                       | Status | Meridian coverage                                                                                                |
| ----------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| [Accordion](src/meridian_ui/accordion.gleam)    | Base   | `meridian_ui/accordion`, controlled single/multiple panels, disabled items and keyboard navigation               |
| [Card](src/meridian_ui/card.gleam)              | Base   | `meridian_ui/card`, semantic content containers                                                                  |
| [Divider](src/meridian_ui/divider.gleam)        | Base   | `meridian_ui/divider`, horizontal, vertical and labelled separators                                              |
| [Fieldset](src/meridian_ui/fieldset.gleam)      | Base   | `meridian_ui/fieldset`, native legend/disabled semantics and controlled disclosure                               |
| [Panel](src/meridian_ui/panel.gleam)            | Base   | `meridian_ui/panel`, headings, independent actions and controlled disclosure                                     |
| [ScrollArea](src/meridian_ui/scroll_area.gleam) | Base   | `meridian_ui/scroll_area`, labelled two-axis scrolling with keyboard access. Scrollbar visibility follows the OS |
| [Splitter](src/meridian_ui/splitter.gleam)      | Base   | `meridian_ui/splitter`, pointer/keyboard resizing, clamped bounds, RTL and inert collapsed panes                 |
| [Stepper](src/meridian_ui/stepper.gleam)        | Base   | `meridian_ui/stepper`, controlled steps, completion state and linear prerequisites                               |
| [Tabs](src/meridian_ui/tabs.gleam)              | Base   | `meridian_ui/tabs`, automatic/manual activation, both orientations, roving focus and retained panels             |
| [Toolbar](src/meridian_ui/toolbar.gleam)        | Base   | `meridian_ui/toolbar`, labelled groups, disabled-item skipping and orientation-aware keyboard navigation         |

### Overlay (7)

| Component                                             | Status | Meridian coverage                                                                                          |
| ----------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| [ConfirmDialog](src/meridian_ui/confirm_dialog.gleam) | Base   | `meridian_ui/confirm_dialog`, alert dialog, cancel-first focus, controlled approval and focus return       |
| [ConfirmPopup](src/meridian_ui/confirm_popup.gleam)   | Base   | `meridian_ui/confirm_popup`, anchored confirmation with native dismissal and keyboard actions              |
| [Dialog](src/meridian_ui/dialog.gleam)                | Base   | `meridian_ui/dialog`, native modal/non-modal lifecycle, nested dialogs, retained content and focus return  |
| [Drawer](src/meridian_ui/drawer.gleam)                | Base   | `meridian_ui/drawer`, sliding modal drawers on physical left/right, logical start/end and top/bottom sides |
| [DynamicDialog](src/meridian_ui/dialog.gleam)         | Base   | `meridian_ui/dialog`, application-controlled titles and content through the ordinary dialog API            |
| [Popover](src/meridian_ui/popover.gleam)              | Base   | `meridian_ui/popover`, native top layer, viewport-aware anchoring, Escape and outside dismissal            |
| [Tooltip](src/meridian_ui/tooltip.gleam)              | Base   | `meridian_ui/tooltip`, scoped hover/focus hints and cleanup                                                |

### Menu (9)

| Component                                         | Status | Meridian coverage                                                                                        |
| ------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| [Breadcrumb](src/meridian_ui/breadcrumb.gleam)    | Base   | `meridian_ui/breadcrumb`, validated links, hierarchy and current-page semantics                          |
| [CommandMenu](src/meridian_ui/command_menu.gleam) | Base   | `meridian_ui/command_menu`, modal command search, disabled commands and keyboard activation              |
| [ContextMenu](src/meridian_ui/context_menu.gleam) | Base   | `meridian_ui/context_menu`, pointer, ContextMenu and Shift+F10 opening with viewport positioning         |
| [Dock](src/meridian_ui/dock.gleam)                | Base   | `meridian_ui/dock`, labelled icon/link navigation and current-page state without required animation      |
| [MegaMenu](src/meridian_ui/mega_menu.gleam)       | Base   | `meridian_ui/mega_menu`, responsive column groups, native details and ordinary navigation links          |
| [Menu](src/meridian_ui/menu.gleam)                | Base   | `meridian_ui/menu`, inline/popup menus, nested state, typeahead and roving focus                         |
| [Menubar](src/meridian_ui/menubar.gleam)          | Base   | `meridian_ui/menubar`, horizontal RTL-aware keyboard navigation and nested menus                         |
| [Sidebar](src/meridian_ui/sidebar.gleam)          | Base   | `meridian_ui/sidebar`, collapsible aside with caller-owned navigation content                            |
| [TieredMenu](src/meridian_ui/tiered_menu.gleam)   | Base   | `meridian_ui/tiered_menu`, nested overlay menus, keyboard focus return and viewport-aware side placement |

### Messages (2)

| Component                                | Status | Meridian coverage                                                                                                                    |
| ---------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| [Message](src/meridian_ui/message.gleam) | Base   | `meridian_ui/message`, tones, live-region semantics and controlled dismissal                                                         |
| [Toast](src/meridian_ui/toast.gleam)     | Base   | `meridian_ui/toast`, inline/viewport placements, caller-owned queues, tones, timed notices, hover/focus pause and optional dismissal |

### Media (3)

| Component                                  | Status | Meridian coverage                                                                                                              |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| [Carousel](src/meridian_ui/carousel.gleam) | Base   | `meridian_ui/carousel`, drag/swipe and button navigation, wrapping, announcements and retained hidden slides                   |
| [Gallery](src/meridian_ui/gallery.gleam)   | Base   | `meridian_ui/gallery`, image alternatives, thumbnails, drag/swipe navigation and modal previews                                |
| [Compare](src/meridian_ui/compare.gleam)   | Base   | `meridian_ui/compare`, horizontal/vertical images, optional on-image drag handle, descriptive text and a native keyboard range |

### File (2)

| Component                                       | Status | Meridian coverage                                                                                                                      |
| ----------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| [FileUpload](src/meridian_ui/file_upload.gleam) | Base   | `meridian_ui/file_upload`, selection/drop validation, normalised FileList, multipart transport, progress and cancellation              |
| [FileTree](src/meridian_ui/file_tree.gleam)     | Base   | `meridian_ui/file_tree`, typed files and folders, controlled expansion/selection, disabled entries and shared tree keyboard navigation |

### Misc (20)

| Component                                                      | Status   | Meridian coverage                                                                                                                 |
| -------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [AnimateOnScroll](src/meridian_ui/animate_on_scroll.gleam)     | Base     | `meridian_ui/animate_on_scroll`, visibility-triggered reveal and reduced-motion fallback                                          |
| [AutoFocus](examples/catalogue/src/catalogue/utilities.gleam)  | Platform | Native autofocus and application-owned Lustre effects                                                                             |
| [Avatar](src/meridian_ui/avatar.gleam)                         | Base     | `meridian_ui/avatar`, accessible labels, images, custom content and groups                                                        |
| [Badge](src/meridian_ui/badge.gleam)                           | Base     | `meridian_ui/badge`, exact accessible counts, capped visual counters and labelled notification dots                               |
| [Bind](examples/catalogue/src/catalogue/utilities.gleam)       | Platform | Ordinary Lustre attributes and event handlers                                                                                     |
| [BlockUI](src/meridian_ui/block_ui.gleam)                      | Base     | `meridian_ui/block_ui`, busy status, native inert content, focus transfer and restoration                                         |
| [Chip](src/meridian_ui/chip.gleam)                             | Base     | `meridian_ui/chip`, custom content and controlled keyboard removal                                                                |
| [ClassNames](examples/catalogue/src/catalogue/utilities.gleam) | Platform | Lustre merges class attributes                                                                                                    |
| [Fluid](src/meridian_ui/field.gleam)                           | Base     | `meridian_ui/field`, scoped full-width field layout                                                                               |
| [FocusTrap](src/meridian_ui/focus_trap.gleam)                  | Base     | `meridian_ui/focus_trap`, nested traps, Tab wrapping, modal precedence and disposal                                               |
| [Inplace](src/meridian_ui/inplace.gleam)                       | Base     | `meridian_ui/inplace`, retained editor nodes, display/edit focus transfer and Escape cancellation                                 |
| [MeterGroup](src/meridian_ui/meter_group.gleam)                | Base     | `meridian_ui/meter_group`, bounded visual measurements and exact labels/totals                                                    |
| [ProgressBar](src/meridian_ui/progress.gleam)                  | Base     | `meridian_ui/progress`, clamped percentages and unknown-duration state                                                            |
| [ProgressSpinner](src/meridian_ui/spinner.gleam)               | Base     | `meridian_ui/spinner`, determinate and indeterminate accessible rings                                                             |
| [Ripple](src/meridian_ui/ripple.gleam)                         | Base     | `meridian_ui/ripple`, pointer/keyboard feedback, reduced-motion/forced-colour suppression and cleanup                             |
| [ScrollTop](src/meridian_ui/scroll_top.gleam)                  | Base     | `meridian_ui/scroll_top`, page/container scrolling, reduced-motion behaviour and destination focus                                |
| [Skeleton](src/meridian_ui/skeleton.gleam)                     | Base     | `meridian_ui/skeleton`, decorative shapes and reduced-motion loading state                                                        |
| [StyleClass](examples/catalogue/src/catalogue/utilities.gleam) | Platform | Class attributes and controlled Lustre state without DOM mutation                                                                 |
| [Tag](src/meridian_ui/badge.gleam)                             | Base     | `meridian_ui/badge`, semantic status tones with custom content                                                                    |
| [Terminal](src/meridian_ui/terminal.gleam)                     | Base     | `meridian_ui/terminal`, inline prompt, plain-text commands, history, output sizing/wrapping, read-only mode and native submission |

## Advanced

| Component                                        | Status | Meridian coverage                                                                                                                                                                                         |
| ------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Charts](src/meridian_ui/charts.gleam)           | Base   | `meridian_ui/charts`, 14 typed SVG chart families, responsive sizing, pointer/native-button selection and data tables. Optional ECharts engine                                                            |
| [Scheduler](src/meridian_ui/scheduler.gleam)     | Base   | `meridian_ui/scheduler`, calendar views, zones, recurrence, slots, visible hours, week numbers, event limits, read-only mode and native editing. Optional FullCalendar engine                             |
| [Task Board](src/meridian_ui/task_board.gleam)   | Base   | `meridian_ui/task_board`, typed columns/cards, title/description editing, transfers, removal, drag/drop and native move controls                                                                          |
| [Text Editor](src/meridian_ui/text_editor.gleam) | Base   | `meridian_ui/text_editor`, validated JSON documents, Markdown import/export, text colours, lists/tables, selection, history, filtered paste, HTML output and read-only state. Optional ProseMirror engine |

## Utilities

| Component                                             | Status | Meridian coverage                                                                                                        |
| ----------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| [FilterService](src/meridian_ui/filter_service.gleam) | Base   | `meridian_ui/filter_service`, Unicode-normalised text matching, numeric comparisons and combined predicates              |
| [FormValidation](src/meridian_ui/validation.gleam)    | Base   | `meridian_ui/validation`, native constraint errors, caller-owned cross-field rules and linked accessible inline feedback |

## Additional controls

### Code (1)

| Component                                     | Status | Meridian coverage                                                                                                                             |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [CodeBlock](src/meridian_ui/code_block.gleam) | Base   | `meridian_ui/code_block`, escaped Gleam/JSON/TOML/HTML source, syntax colours, line numbers, Gleam function/type folding and full-source copy |

### Visual (1)

| Component                           | Status | Meridian coverage                                                                                                                                              |
| ----------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Icons](src/meridian_ui/icon.gleam) | Base   | `meridian_ui/icon`, 200 SVG icons including S3/cloud infrastructure and the official GitHub mark, searchable categories, synced styles and per-icon treatments |

## Verification and limits

`make check` runs formatting, compilation, state/markup/lifecycle tests and
reproducible bundle/licence checks. `make browser-check` exercises the library and
every catalogue route in Chromium, Firefox and WebKit, with WCAG checks.

The fixtures cover native constraints and FormData, rapid selection actions,
retained editors, overlays and focus return, menu/tree keyboard behaviour,
virtualisation, uploads against a local fake endpoint, chart families, calendar
views and pointer edits, task transfers, clipboard paste and engine remounts.
Every catalogue entry has editable controls, distinct presets and an API reference.
Build checks validate property schemas and compiler-derived API types. Browser
checks exercise the presets and verify that control edits update the examples.

Date/time inputs keep their native ISO values, editing and form constraints.
Mount browser interactions for themed calendar, time and colour dialogs. Time
selectors include seconds and expose milliseconds for fractional values or steps.
Without the mount, native pickers remain available. Alpha and wide-gamut colours
use the native colour popup. Virtual rows have an explicit fixed height. Carousels
are manual by default and require a half-width drag to change slides. Rich-text
HTML export runs in the browser. These limits are part of the components'
documented behaviour, not hidden catalogue-only substitutions.
Rich select templates render where customisable native selects are supported.
Other engines retain text labels, native values and keyboard behaviour. FileTree
renders caller-owned entries without filesystem access or file mutations.
Tree, TreeSelect, FileTree and TreeTable share `tree.appearance` for independent
dashed lines, boxed +/- toggles and expand/collapse animation. Reduced motion
disables animation regardless of that setting.
