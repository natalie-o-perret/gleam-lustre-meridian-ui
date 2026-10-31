# Component coverage

Target: independent Gleam/Lustre equivalents of the current PrimeNG component
catalogue and released PrimeUI PRO products, keeping Meridian's existing design.
This is a coverage ledger, not a claim of PrimeNG API or feature parity.

Snapshot: 2026-10-30, PrimeNG 22.1.4. The [core catalogue](https://primeng.dev/components)
contains 93 entries. The [PRO announcement](https://primeui.dev/nextchapter) lists
four released products and five future products. Blocks, application templates,
Figma tooling and Angular compatibility are not component implementations.

No PrimeNG packages, commercial source, styles or assets are bundled. PrimeNG 22+
uses [Community/Commercial licensing](https://primeui.dev/nextchapter), unlike
earlier MIT releases. Its [commercial licence](https://primeui.dev/licenses/commercial)
does not permit publishing the software as another component library.

- **Base**: usable Meridian implementation of the behaviour listed below.
  This does not imply every PrimeNG variant, option or API is reproduced.
- **Platform**: the underlying feature already belongs to HTML or Lustre.

Coverage: **88 Base + 5 Platform = 93 core entries**, the separate FilterService
utility and **4 Base released PRO equivalents**. The five announced products stay
separate. Their future scope is not included in these totals.

## Core

### Form (28)

| Component                                          | Status   | Meridian coverage                                                                                                            |
| -------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [AutoComplete](https://primeng.dev/autocomplete)   | Base     | `meridian_ui/autocomplete`, native suggestions, keyboard behaviour and caller-updated async results                          |
| [CascadeSelect](https://primeng.dev/cascadeselect) | Base     | `meridian_ui/cascade_select`, validated hierarchies, independent level actions and enabled-leaf form values                  |
| [Checkbox](https://primeng.dev/checkbox)           | Base     | `meridian_ui/checkbox`, native checked/indeterminate/disabled state                                                          |
| [DatePicker](https://primeng.dev/datepicker)       | Base     | `meridian_ui/date_picker`, native date/time/month inputs, locale display and constrained ranges                              |
| [FloatLabel](https://primeng.dev/floatlabel)       | Base     | `meridian_ui/field`, floating native labels with explicit control IDs                                                        |
| [IconField](https://primeng.dev/iconfield)         | Base     | `meridian_ui/field`, leading/trailing decorative icons                                                                       |
| [IftaLabel](https://primeng.dev/iftalabel)         | Base     | `meridian_ui/field`, permanent inset labels                                                                                  |
| [InputColor](https://primeng.dev/inputcolor)       | Base     | `meridian_ui/field`, native colour picker and form values                                                                    |
| [InputGroup](https://primeng.dev/inputgroup)       | Base     | `meridian_ui/field`, joined inputs, addons and native action buttons                                                         |
| [InputMask](https://primeng.dev/inputmask)         | Base     | `meridian_ui/input_mask`, optional IMask editing engine, masked/raw values, paste and composition                            |
| [InputNumber](https://primeng.dev/inputnumber)     | Base     | `meridian_ui/field`, native numeric strings, bounds, steps and validity. Application-owned currency formatting               |
| [InputOtp](https://primeng.dev/inputotp)           | Base     | `meridian_ui/input_otp`, native string entry, leading zeroes, exact constraints, paste and autofill                          |
| [InputPassword](https://primeng.dev/inputpassword) | Base     | `meridian_ui/password`, controlled reveal, retained input, constraints and disabled state. Application-owned strength policy |
| [InputTags](https://primeng.dev/inputtags)         | Base     | `meridian_ui/input_tags`, deduplicated tokens, draft submission, keyboard removal and latest-model actions                   |
| [InputText](https://primeng.dev/inputtext)         | Base     | `meridian_ui/field`, native labelled input attributes                                                                        |
| [KeyFilter](https://primeng.dev/keyfilter)         | Base     | `meridian_ui/key_filter`, Unicode-aware native validation without deleting paste or composition                              |
| [Knob](https://primeng.dev/knob)                   | Base     | `meridian_ui/knob`, pointer dial, native range keyboard/form behaviour and forced-colour fallback                            |
| [Label](https://primeng.dev/label)                 | Platform | Native Lustre HTML labels and `for` attributes                                                                               |
| [Listbox](https://primeng.dev/listbox)             | Base     | `meridian_ui/listbox`, native single/multiple selection, disabled options, constraints and repeated form values              |
| [RadioButton](https://primeng.dev/radiobutton)     | Base     | `meridian_ui/radio`, labelled native groups, values and keyboard behaviour                                                   |
| [Rating](https://primeng.dev/rating)               | Base     | `meridian_ui/rating`, named native radios, RTL keyboard navigation, optional clear and read-only display                     |
| [Select](https://primeng.dev/select)               | Base     | `meridian_ui/select`, searchable enhanced native picker with keyed options and retained filtered selection                   |
| [SelectButton](https://primeng.dev/selectbutton)   | Base     | `meridian_ui/select_button`, native radio/checkbox groups, required selection and latest-model actions                       |
| [Slider](https://primeng.dev/slider)               | Base     | `meridian_ui/slider`, scalar ranges and separately named dual native thumbs that cannot cross                                |
| [Textarea](https://primeng.dev/textarea)           | Base     | `meridian_ui/field`, multiline input, native CSS autosizing and manual-resize fallback                                       |
| [ToggleButton](https://primeng.dev/togglebutton)   | Base     | `meridian_ui/toggle_button`, controlled native button with pressed state                                                     |
| [ToggleSwitch](https://primeng.dev/toggleswitch)   | Base     | `meridian_ui/toggle_switch`, labelled native checkbox, keyboard and form values                                              |
| [TreeSelect](https://primeng.dev/treeselect)       | Base     | `meridian_ui/tree_select`, inline hierarchical single/multiple selection, summary and hidden form values                     |

### Button (3)

| Component                                      | Status | Meridian coverage                                                                |
| ---------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| [Button](https://primeng.dev/button)           | Base   | `meridian_ui/button`, native, primary, text and labelled icon controls           |
| [SpeedDial](https://primeng.dev/speeddial)     | Base   | `meridian_ui/speed_dial`, top-layer action menu with caller-owned submenu state  |
| [SplitButton](https://primeng.dev/splitbutton) | Base   | `meridian_ui/split_button`, independent primary action and keyboard command menu |

### Data (10)

| Component                                              | Status | Meridian coverage                                                                                           |
| ------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------- |
| [DataView](https://primeng.dev/dataview)               | Base   | `meridian_ui/data_view`, typed list/grid rendering, empty state and pagination                              |
| [OrderList](https://primeng.dev/orderlist)             | Base   | `meridian_ui/order_list`, stable item keys, native move buttons and drag/drop                               |
| [OrgChart](https://primeng.dev/organizationchart)      | Base   | `meridian_ui/org_chart`, nested reporting hierarchy, caller-rendered nodes and native scrolling             |
| [Paginator](https://primeng.dev/paginator)             | Base   | `meridian_ui/paginator`, controlled zero-based pages, navigation and shrinking-result clamping              |
| [PickList](https://primeng.dev/picklist)               | Base   | `meridian_ui/pick_list`, individual/all transfers, reordering, disabled items and drag/drop                 |
| [Table](https://primeng.dev/table)                     | Base   | `meridian_ui/table`, typed sorting, filtering, selection, keyed editor cells, local paging and remote pages |
| [Timeline](https://primeng.dev/timeline)               | Base   | `meridian_ui/timeline`, labelled event history, native date/time markup and both orientations               |
| [Tree](https://primeng.dev/tree)                       | Base   | `meridian_ui/tree`, validated hierarchy, expansion, single/multiple selection, roving focus and typeahead   |
| [TreeTable](https://primeng.dev/treetable)             | Base   | `meridian_ui/tree_table`, hierarchical rows and native disclosure buttons, not a simulated treegrid         |
| [VirtualScroller](https://primeng.dev/virtualscroller) | Base   | `meridian_ui/virtual_scroller`, fixed-height windowing, overscan, measured viewport and native scrolling    |

### Panel (10)

| Component                                    | Status | Meridian coverage                                                                                           |
| -------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| [Accordion](https://primeng.dev/accordion)   | Base   | `meridian_ui/accordion`, controlled single/multiple panels, disabled items and keyboard navigation          |
| [Card](https://primeng.dev/card)             | Base   | `meridian_ui/card`, semantic content containers                                                             |
| [Divider](https://primeng.dev/divider)       | Base   | `meridian_ui/divider`, horizontal, vertical and labelled separators                                         |
| [Fieldset](https://primeng.dev/fieldset)     | Base   | `meridian_ui/fieldset`, native legend/disabled semantics and controlled disclosure                          |
| [Panel](https://primeng.dev/panel)           | Base   | `meridian_ui/panel`, headings, independent actions and controlled disclosure                                |
| [ScrollArea](https://primeng.dev/scrollarea) | Base   | `meridian_ui/scroll_area`, labelled native two-axis scrolling with keyboard access. OS scrollbar visibility |
| [Splitter](https://primeng.dev/splitter)     | Base   | `meridian_ui/splitter`, pointer/keyboard resizing, clamped bounds, RTL and inert collapsed panes            |
| [Stepper](https://primeng.dev/stepper)       | Base   | `meridian_ui/stepper`, controlled steps, completion state and linear prerequisites                          |
| [Tabs](https://primeng.dev/tabs)             | Base   | `meridian_ui/tabs`, automatic/manual activation, both orientations, roving focus and retained panels        |
| [Toolbar](https://primeng.dev/toolbar)       | Base   | `meridian_ui/toolbar`, labelled groups, disabled-item skipping and orientation-aware keyboard navigation    |

### Overlay (7)

| Component                                          | Status | Meridian coverage                                                                                         |
| -------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| [ConfirmDialog](https://primeng.dev/confirmdialog) | Base   | `meridian_ui/confirm_dialog`, alert dialog, cancel-first focus, controlled approval and focus return      |
| [ConfirmPopup](https://primeng.dev/confirmpopup)   | Base   | `meridian_ui/confirm_popup`, anchored confirmation with native dismissal and keyboard actions             |
| [Dialog](https://primeng.dev/dialog)               | Base   | `meridian_ui/dialog`, native modal/non-modal lifecycle, nested dialogs, retained content and focus return |
| [Drawer](https://primeng.dev/drawer)               | Base   | `meridian_ui/drawer`, generic modal drawers on logical start/end/top/bottom sides                         |
| [DynamicDialog](https://primeng.dev/dynamicdialog) | Base   | `meridian_ui/dialog`, application-controlled titles and content through the ordinary dialog API           |
| [Popover](https://primeng.dev/popover)             | Base   | `meridian_ui/popover`, native top layer, viewport-aware anchoring, Escape and outside dismissal           |
| [Tooltip](https://primeng.dev/tooltip)             | Base   | `meridian_ui/tooltip`, scoped hover/focus hints and cleanup                                               |

### Menu (9)

| Component                                      | Status | Meridian coverage                                                                                        |
| ---------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| [Breadcrumb](https://primeng.dev/breadcrumb)   | Base   | `meridian_ui/breadcrumb`, validated links, hierarchy and current-page semantics                          |
| [CommandMenu](https://primeng.dev/commandmenu) | Base   | `meridian_ui/command_menu`, modal command search, disabled commands and keyboard activation              |
| [ContextMenu](https://primeng.dev/contextmenu) | Base   | `meridian_ui/context_menu`, pointer/ContextMenu/Shift+F10 opening and viewport positioning               |
| [Dock](https://primeng.dev/dock)               | Base   | `meridian_ui/dock`, labelled icon/link navigation and current-page state without required animation      |
| [MegaMenu](https://primeng.dev/megamenu)       | Base   | `meridian_ui/mega_menu`, responsive column groups, native details and ordinary navigation links          |
| [Menu](https://primeng.dev/menu)               | Base   | `meridian_ui/menu`, inline/popup menus, nested state, typeahead and roving focus                         |
| [Menubar](https://primeng.dev/menubar)         | Base   | `meridian_ui/menubar`, horizontal RTL-aware keyboard navigation and nested menus                         |
| [Sidebar](https://primeng.dev/sidebar)         | Base   | `meridian_ui/sidebar`, generic collapsible aside with caller-owned navigation content                    |
| [TieredMenu](https://primeng.dev/tieredmenu)   | Base   | `meridian_ui/tiered_menu`, nested overlay menus, keyboard focus return and viewport-aware side placement |

### Messages (2)

| Component                              | Status | Meridian coverage                                                                                        |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| [Message](https://primeng.dev/message) | Base   | `meridian_ui/message`, tones, live-region semantics and controlled dismissal                             |
| [Toast](https://primeng.dev/toast)     | Base   | `meridian_ui/toast`, caller-owned queues, persistent/timed notices, hover/focus pause and safe dismissal |

### Media (3)

| Component                                | Status | Meridian coverage                                                                                   |
| ---------------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| [Carousel](https://primeng.dev/carousel) | Base   | `meridian_ui/carousel`, manual slide navigation, wrapping, announcements and retained hidden slides |
| [Gallery](https://primeng.dev/gallery)   | Base   | `meridian_ui/gallery`, image alternatives, thumbnails, slide navigation and modal previews          |
| [Compare](https://primeng.dev/compare)   | Base   | `meridian_ui/compare`, before/after images, descriptive text and a native keyboard range            |

### File (1)

| Component                                    | Status | Meridian coverage                                                                                                         |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| [FileUpload](https://primeng.dev/fileupload) | Base   | `meridian_ui/file_upload`, selection/drop validation, normalised FileList, multipart transport, progress and cancellation |

### Misc (20)

| Component                                              | Status   | Meridian coverage                                                                                     |
| ------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------- |
| [AnimateOnScroll](https://primeng.dev/animateonscroll) | Base     | `meridian_ui/animate_on_scroll`, visibility-triggered reveal and reduced-motion fallback              |
| [AutoFocus](https://primeng.dev/autofocus)             | Platform | Native autofocus and application-owned Lustre effects                                                 |
| [Avatar](https://primeng.dev/avatar)                   | Base     | `meridian_ui/avatar`, accessible labels, images, custom content and groups                            |
| [Badge](https://primeng.dev/badge)                     | Base     | `meridian_ui/badge`, exact accessible counts, capped visual counters and labelled notification dots   |
| [Bind](https://primeng.dev/bind)                       | Platform | Ordinary Lustre attributes and event handlers                                                         |
| [BlockUI](https://primeng.dev/blockui)                 | Base     | `meridian_ui/block_ui`, busy status, native inert content, focus transfer and restoration             |
| [Chip](https://primeng.dev/chip)                       | Base     | `meridian_ui/chip`, custom content and controlled keyboard removal                                    |
| [ClassNames](https://primeng.dev/classnames)           | Platform | Lustre merges class attributes                                                                        |
| [Fluid](https://primeng.dev/fluid)                     | Base     | `meridian_ui/field`, scoped full-width field layout                                                   |
| [FocusTrap](https://primeng.dev/focustrap)             | Base     | `meridian_ui/focus_trap`, generic nested traps, Tab wrapping, modal precedence and disposal           |
| [Inplace](https://primeng.dev/inplace)                 | Base     | `meridian_ui/inplace`, retained editor nodes, display/edit focus transfer and Escape cancellation     |
| [MeterGroup](https://primeng.dev/metergroup)           | Base     | `meridian_ui/meter_group`, bounded visual measurements and exact text labels/totals                   |
| [ProgressBar](https://primeng.dev/progressbar)         | Base     | `meridian_ui/progress`, clamped percentages and unknown-duration state                                |
| [ProgressSpinner](https://primeng.dev/progressspinner) | Base     | `meridian_ui/spinner`, determinate and indeterminate accessible rings                                 |
| [Ripple](https://primeng.dev/ripple)                   | Base     | `meridian_ui/ripple`, pointer/keyboard feedback, reduced-motion/forced-colour suppression and cleanup |
| [ScrollTop](https://primeng.dev/scrolltop)             | Base     | `meridian_ui/scroll_top`, page/container scrolling, reduced-motion behaviour and destination focus    |
| [Skeleton](https://primeng.dev/skeleton)               | Base     | `meridian_ui/skeleton`, decorative shapes and reduced-motion loading state                            |
| [StyleClass](https://primeng.dev/styleclass)           | Platform | Class attributes and controlled Lustre state. No DOM-mutation directive                               |
| [Tag](https://primeng.dev/tag)                         | Base     | `meridian_ui/badge`, semantic status tones with custom content                                        |
| [Terminal](https://primeng.dev/terminal)               | Base     | `meridian_ui/terminal`, plain-text command input, history, asynchronous output and native submission  |

The separate [FilterService utility](https://primeng.dev/filterservice) is covered
by `meridian_ui/filter_service`: Unicode-normalised text matching, numeric
comparisons and combined predicates. It is not one of the 93 component-index entries.

## PRO

| Product                                                  | Status | Main work                                                                                                                                                                              |
| -------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Charts](https://angular.primeuipro.dev/charts)          | Base   | `meridian_ui/charts`, 14 typed SVG chart families, category/value scales, responsive sizing, pointer/native-button selection and data tables. Optional ECharts engine                  |
| [Scheduler](https://angular.primeuipro.dev/scheduler)    | Base   | `meridian_ui/scheduler`, month/week/day/agenda, named zones, recurrence, drag/resize and native date/event editing alternatives. Optional FullCalendar engine                          |
| [Task Board](https://angular.primeuipro.dev/taskboard)   | Base   | `meridian_ui/task_board`, typed columns/cards, title/description editing, transfers, removal, drag/drop and native move controls                                                       |
| [Text Editor](https://angular.primeuipro.dev/texteditor) | Base   | `meridian_ui/text_editor`, validated JSON documents, formatting, lists/tables, selection, history, schema-filtered paste, HTML output and read-only state. Optional ProseMirror engine |

### Announced, not released

| Product     | Status  | Note                                                  |
| ----------- | ------- | ----------------------------------------------------- |
| DataGrid    | Planned | Separate from the core Table component                |
| Sheet       | Planned | Spreadsheet editing and calculation                   |
| Gantt Chart | Planned | Project scheduling and dependencies                   |
| Diagram     | Planned | Graph editing and layout                              |
| PDF Viewer  | Planned | Viewing and navigation, no bundled proprietary viewer |

## Verification and limits

`make check` runs formatting, compilation, state/markup/lifecycle tests and
reproducible bundle/licence checks. `make browser-check` exercises nine fixtures
in Chromium, Firefox and WebKit across six viewport/theme/direction/motion/colour
scenarios, with WCAG checks. See `test/browser/` for the exact interactions.

The fixtures cover native constraints and FormData, rapid selection actions,
retained editors, overlays and focus return, menu/tree keyboard behaviour,
virtualisation, uploads against a local fake endpoint, chart families, calendar
views and pointer edits, task transfers, real clipboard paste and engine remounts.
`scripts/check-consumer.mjs` checks a separately built Git consumer dashboard.

Native date pickers, colour pickers, datalists and scrollbar presentation follow
the browser and OS. Virtual rows have an explicit fixed height. Carousels are
manual by default. Rich-text HTML export runs in the browser. Applications own
business data, persistence, authorisation, formatting policies and server-side
validation. These are independent Meridian APIs, not Angular compatibility.
