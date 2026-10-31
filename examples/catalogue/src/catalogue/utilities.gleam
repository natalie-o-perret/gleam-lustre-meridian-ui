import catalogue/common
import gleam/dict
import gleam/int
import gleam/list
import gleam/string
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/animate_on_scroll
import meridian_ui/badge
import meridian_ui/block_ui
import meridian_ui/button
import meridian_ui/carousel
import meridian_ui/compare
import meridian_ui/field
import meridian_ui/file_upload
import meridian_ui/focus_trap
import meridian_ui/gallery
import meridian_ui/icon
import meridian_ui/inplace
import meridian_ui/message
import meridian_ui/meter_group
import meridian_ui/orientation
import meridian_ui/ripple
import meridian_ui/scroll_area
import meridian_ui/scroll_top
import meridian_ui/terminal
import meridian_ui/toast
import meridian_ui/url

pub type Model {
  Model(
    flag: Bool,
    text: String,
    draft: String,
    slide: Int,
    percent: Int,
    notices: List(toast.Notice),
    count: Int,
    terminal: terminal.Model,
    files: List(file_upload.File),
    errors: List(String),
    props: common.Properties,
  )
}

pub type Msg {
  Toggle
  Edit
  Save
  Cancel
  Text(String)
  Slide(Int)
  Percent(String)
  Notify
  Dismiss(String)
  Terminal(terminal.Action)
  Files(file_upload.Selection)
  Properties(common.Properties)
}

pub fn start(component: String) {
  common.start(
    Model(
      False,
      "Project Meridian",
      "",
      0,
      50,
      [],
      0,
      terminal.Model("", [], [], -1),
      [],
      [],
      dict.new(),
    ),
    update,
    Properties,
    fn(model) {
      case component {
        "animateonscroll" -> animate_on_scroll_example(model)
        "autofocus" -> auto_focus(model)
        "bind" -> bind(model)
        "blockui" -> block_ui_example(model)
        "classnames" -> class_names(model)
        "fluid" -> fluid(model)
        "focustrap" -> focus_trap_example(model)
        "inplace" -> inplace_example(model)
        "icons" -> icons_example(model)
        "metergroup" -> meter_group_example(model)
        "ripple" -> ripple_example(model)
        "scrolltop" -> scroll_top_example(model)
        "styleclass" -> style_class(model)
        "terminal" -> terminal_example(model)
        "carousel" -> carousel_example(model)
        "gallery" -> gallery_example(model)
        "compare" -> compare_example(model)
        "fileupload" -> file_upload_example(model)
        "toast" -> toast_example(model)
        _ -> common.missing()
      }
    },
  )
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Properties(props) ->
      Model(
        ..model,
        props: dict.merge(model.props, props),
        flag: common.flag(props, "active", model.flag),
        text: common.property(props, "text", model.text),
        draft: common.property(props, "text", model.draft),
        slide: common.number(props, "slide", model.slide),
        percent: common.number(props, "value", model.percent),
        terminal: terminal.Model(
          ..model.terminal,
          draft: common.property(props, "draft", model.terminal.draft),
        ),
        notices: case dict.has_key(props, "timeout") {
          True -> [
            toast.Notice(
              "preview",
              message.Success,
              common.property(props, "text", "Project saved."),
              common.number(props, "timeout", 4000),
            ),
          ]
          False -> model.notices
        },
      )
    Toggle -> Model(..model, flag: !model.flag)
    Edit -> Model(..model, flag: True, draft: model.text)
    Save -> Model(..model, flag: False, text: model.draft)
    Cancel -> Model(..model, flag: False)
    Text(value) -> Model(..model, draft: value)
    Slide(value) -> Model(..model, slide: value)
    Percent(value) ->
      case int.parse(value) {
        Ok(value) -> Model(..model, percent: value)
        Error(_) -> model
      }
    Notify ->
      Model(
        ..model,
        count: model.count + 1,
        notices: list.append(model.notices, [
          toast.Notice(
            int.to_string(model.count),
            message.Success,
            common.property(
              model.props,
              "text",
              "Project saved. Notice " <> int.to_string(model.count + 1),
            ),
            common.number(model.props, "timeout", 4000),
          ),
        ]),
      )
    Dismiss(id) -> Model(..model, notices: toast.remove(model.notices, id))
    Terminal(terminal.Submit) ->
      case string.trim(model.terminal.draft) {
        "" -> model
        command ->
          case common.flag(model.props, "readonly", False) {
            True -> model
            False -> {
              let submitted = terminal.update(model.terminal, terminal.Submit)
              let output = case command {
                "help" ->
                  "help    Show available commands\nstatus  Show project status\nclear   Clear the screen\necho    Print your text"
                "status" ->
                  "Project Meridian: ready\nNo background jobs running"
                _ ->
                  case string.starts_with(command, "echo ") {
                    True -> string.drop_start(command, 5)
                    False ->
                      "Unknown command: "
                      <> command
                      <> "\nType help for available commands"
                  }
              }
              Model(
                ..model,
                terminal: terminal.Model(..submitted, entries: case command {
                  "clear" -> []
                  _ ->
                    list.append(model.terminal.entries, [
                      terminal.Entry(command, output),
                    ])
                }),
              )
            }
          }
      }
    Terminal(action) ->
      Model(..model, terminal: terminal.update(model.terminal, action))
    Files(value) -> Model(..model, files: value.files, errors: value.errors)
  }
}

pub fn animate_on_scroll_example(model: Model) -> Element(Msg) {
  common.stack([
    h.p([], [
      h.text(
        "Scroll inside the panel to reveal the card, or replay the animation.",
      ),
    ]),
    button.view([animate_on_scroll.replay("reveal-card")], [
      h.text("Replay animation"),
    ]),
    scroll_area.view("Animation viewport", [a.style("block-size", "240px")], [
      h.div([a.style("block-size", "260px"), a.aria_hidden(True)], []),
      animate_on_scroll.view_with(
        case common.property(model.props, "animation", "slide-up") {
          "fade" -> animate_on_scroll.Fade
          "slide-left" -> animate_on_scroll.SlideLeft
          "slide-right" -> animate_on_scroll.SlideRight
          "zoom" -> animate_on_scroll.Zoom
          _ -> animate_on_scroll.SlideUp
        },
        common.flag(model.props, "once", False),
        [
          a.id("reveal-card"),
          a.class("demo-project"),
          a.style(
            "--meridian-reveal-duration",
            int.to_string(common.number(model.props, "duration", 300)) <> "ms",
          ),
        ],
        [
          h.h2([], [h.text("Hello, viewport")]),
          h.p([], [
            h.text(common.property(
              model.props,
              "text",
              "This content is revealed when it enters the viewport. Reduced motion keeps it still and visible.",
            )),
          ]),
        ],
      ),
    ]),
  ])
}

pub fn icons_example(model: Model) -> Element(Msg) {
  let query = common.property(model.props, "query", "") |> string.lowercase
  let category = common.property(model.props, "category", "all")
  let icons =
    icon.all()
    |> list.filter(fn(glyph) {
      string.contains(string.lowercase(icon.name(glyph)), query)
      && { category == "all" || icon.category(glyph) == category }
    })
  common.stack([
    h.p([a.role("status")], [
      h.text(
        int.to_string(list.length(icons))
        <> " of "
        <> int.to_string(list.length(icon.all()))
        <> " icons",
      ),
    ]),
    h.div(
      [a.class("demo-icon-grid")],
      list.map(icons, fn(glyph) {
        h.div([], [
          icon.view_with(
            glyph,
            case common.property(model.props, "style", "auto") {
              "outline" -> icon.Outline
              "soft" -> icon.Soft
              "duotone" -> icon.Duotone
              _ -> icon.Auto
            },
            [
              a.style(
                "--icon-stroke",
                case common.property(model.props, "stroke", "auto") {
                  "auto" -> "inherit"
                  value -> value
                },
              ),
              a.style(
                "color",
                case common.property(model.props, "colour", "accent") {
                  "ink" -> "var(--ink)"
                  "muted" -> "var(--muted)"
                  _ -> "var(--accent)"
                },
              ),
              a.style(
                "inline-size",
                int.to_string(common.number(model.props, "size", 32)) <> "px",
              ),
              a.style(
                "block-size",
                int.to_string(common.number(model.props, "size", 32)) <> "px",
              ),
            ],
          ),
          h.span([], [h.text(icon.name(glyph))]),
        ])
      }),
    ),
  ])
}

pub fn auto_focus(model: Model) -> Element(Msg) {
  common.field(
    "This input requests native autofocus",
    field.input(
      common.attrs(model.props, [
        a.autofocus(common.flag(model.props, "autofocus", True)),
        a.placeholder("Start typing"),
      ]),
    ),
  )
}

pub fn bind(model: Model) -> Element(Msg) {
  common.stack([
    common.field(
      "Project name",
      field.input([a.value(model.draft), e.on_input(Text)]),
    ),
    h.p([a.role("status")], [h.text("Current value: " <> model.draft)]),
  ])
}

pub fn block_ui_example(model: Model) -> Element(Msg) {
  common.stack([
    block_ui.view(
      common.property(model.props, "label", "Saving changes"),
      model.flag,
      [],
      [
        button.primary([e.on_click(Toggle)], [h.text("Start saving")]),
        common.field(
          "Project notes",
          field.input([
            a.default_value("This control becomes inert while saving."),
          ]),
        ),
      ],
    ),
    button.view([a.disabled(!model.flag), e.on_click(Toggle)], [
      h.text("Finish saving"),
    ]),
  ])
}

pub fn class_names(model: Model) -> Element(Msg) {
  common.stack([
    button.view([e.on_click(Toggle)], [h.text("Toggle highlight")]),
    h.p([a.classes([#("demo-highlight", model.flag)])], [
      h.text("Lustre merges ordinary class attributes."),
    ]),
  ])
}

pub fn fluid(model: Model) -> Element(Msg) {
  field.fluid([], [
    common.field(
      "Project name",
      field.input(
        common.attrs(model.props, [a.placeholder("Full-width input")]),
      ),
    ),
    common.field(
      "Notes",
      field.textarea([], "Every field fills the available space."),
    ),
  ])
}

pub fn focus_trap_example(model: Model) -> Element(Msg) {
  common.stack([
    button.view([e.on_click(Toggle), a.disabled(model.flag)], [
      h.text("Activate focus trap"),
    ]),
    focus_trap.view("Trapped actions", model.flag, [], [
      common.row([
        button.view([], [h.text("First action")]),
        button.view([], [h.text("Second action")]),
        button.primary([e.on_click(Toggle), a.disabled(!model.flag)], [
          h.text("Release focus trap"),
        ]),
      ]),
    ]),
  ])
}

pub fn inplace_example(model: Model) -> Element(Msg) {
  inplace.view(
    "project name",
    model.flag,
    Edit,
    Cancel,
    [],
    [h.p([], [h.text(model.text)])],
    [
      common.field(
        "Project name",
        field.input([a.value(model.draft), e.on_input(Text)]),
      ),
      button.primary([e.on_click(Save)], [h.text("Save project name")]),
    ],
  )
}

pub fn meter_group_example(model: Model) -> Element(Msg) {
  meter_group.view(
    "Workspace storage",
    common.number(model.props, "maximum", 100),
    [],
    [
      meter_group.Meter(
        "Documents",
        common.number(model.props, "value", 40),
        badge.Accent,
      ),
      meter_group.Meter(
        "Images",
        common.number(model.props, "images", 25),
        badge.Success,
      ),
      meter_group.Meter(
        "Backups",
        common.number(model.props, "backups", 15),
        badge.Warning,
      ),
    ],
  )
}

pub fn ripple_example(model: Model) -> Element(Msg) {
  button.primary(common.attrs(model.props, [ripple.enabled()]), [
    h.text(common.property(model.props, "label", "Pointer and keyboard ripple")),
  ])
}

pub fn scroll_top_example(model: Model) -> Element(Msg) {
  scroll_area.view(
    "Scrollable release notes",
    [
      a.id("release-notes"),
      a.style(
        "block-size",
        int.to_string(common.number(model.props, "height", 224)) <> "px",
      ),
    ],
    [
      h.div([a.style("block-size", "32rem")], [
        h.p([], [h.text("Scroll down to find the return button.")]),
      ]),
      scroll_top.view("release-notes", "Back to the top", []),
    ],
  )
}

pub fn style_class(model: Model) -> Element(Msg) {
  common.stack([
    button.view([e.on_click(Toggle)], [h.text("Toggle emphasis")]),
    h.div(
      [a.class("demo-project"), a.classes([#("demo-highlight", model.flag)])],
      [
        h.text(
          "Classes follow application state, without a DOM-mutation directive.",
        ),
      ],
    ),
  ])
}

pub fn terminal_example(model: Model) -> Element(Msg) {
  common.stack([
    h.p([], [
      h.text(
        "Try help, status, echo or clear. The caller handles commands. No code or processes are executed.",
      ),
    ]),
    terminal.view_with(
      common.property(model.props, "label", "Example terminal"),
      common.property(model.props, "prompt", "user@meridian:~ $"),
      common.flag(model.props, "readonly", False),
      model.terminal,
      Terminal,
      [
        a.style(
          "--meridian-terminal-height",
          int.to_string(common.number(model.props, "height", 200)) <> "px",
        ),
        a.style(
          "--meridian-terminal-wrap",
          case common.flag(model.props, "wrap", True) {
            True -> "pre-wrap"
            False -> "pre"
          },
        ),
      ],
    ),
  ])
}

pub fn carousel_example(model: Model) -> Element(Msg) {
  carousel.view(
    common.property(model.props, "label", "Project highlights"),
    model.slide,
    Slide,
    [],
    [
      h.article([a.class("demo-slide")], [
        h.h2([], [h.text("Make room for ideas")]),
        h.p([], [
          h.text("A carousel stays still until you choose another slide."),
        ]),
      ]),
      h.article([a.class("demo-slide")], [
        h.h2([], [h.text("Build something useful")]),
        h.p([], [h.text("Keyboard-friendly buttons work without autoplay.")]),
      ]),
      h.article([a.class("demo-slide")], [
        h.h2([], [h.text("Share it with your team")]),
        h.p([], [h.text("Hidden slides retain their content and state.")]),
      ]),
    ],
  )
}

pub fn gallery_example(model: Model) -> Element(Msg) {
  gallery.view(
    "landscape-preview",
    "Landscape gallery",
    model.slide,
    model.flag,
    Slide,
    Toggle,
    Cancel,
    [],
    [
      gallery.Image(
        common.image(),
        "A mountain landscape at sunrise",
        "Morning in the mountains",
      ),
      gallery.Image(
        before_image(),
        "A mountain landscape at dusk",
        "Evening in the mountains",
      ),
    ],
  )
}

pub fn compare_example(model: Model) -> Element(Msg) {
  compare.view_with(
    common.property(model.props, "label", "Compare colour palettes"),
    before_image(),
    common.property(model.props, "beforeLabel", "Original palette"),
    common.image(),
    common.property(model.props, "afterLabel", "Updated palette"),
    model.percent,
    common.orientation(model.props, orientation.Horizontal),
    common.flag(model.props, "draggable", True),
    fn(value) { Percent(int.to_string(value)) },
    [],
  )
}

pub fn file_upload_example(model: Model) -> Element(Msg) {
  common.stack([
    h.p([], [
      h.text("Files stay in your browser. This catalogue does not upload them."),
    ]),
    file_upload.view(
      "Attachments",
      common.property(model.props, "accept", ".txt,image/*"),
      common.number(model.props, "maxBytes", 1_048_576),
      common.flag(model.props, "multiple", True),
      Files,
      [],
    ),
    h.ul(
      [a.aria_live("polite")],
      list.map(model.files, fn(file) {
        h.li([], [
          h.text(
            file_upload.name(file)
            <> " ("
            <> int.to_string(file_upload.size(file))
            <> " bytes)",
          ),
        ])
      }),
    ),
    h.ul(
      [a.role("status")],
      list.map(model.errors, fn(error) { h.li([], [h.text(error)]) }),
    ),
  ])
}

pub fn toast_example(model: Model) -> Element(Msg) {
  common.stack([
    button.primary([e.on_click(Notify)], [h.text("Save project")]),
    toast.view_with(
      "Project notifications",
      case common.property(model.props, "position", "inline") {
        "top-left" -> toast.TopLeft
        "top-centre" -> toast.TopCentre
        "top-right" -> toast.TopRight
        "centre" -> toast.Centre
        "bottom-left" -> toast.BottomLeft
        "bottom-centre" -> toast.BottomCentre
        "bottom-right" -> toast.BottomRight
        _ -> toast.Inline
      },
      common.flag(model.props, "closable", True),
      list.map(model.notices, fn(notice) {
        toast.Notice(
          ..notice,
          tone: case common.property(model.props, "tone", "success") {
            "info" -> message.Info
            "warning" -> message.Warning
            "danger" -> message.Danger
            _ -> message.Success
          },
        )
      }),
      Dismiss,
      [],
    ),
  ])
}

fn before_image() -> url.Url {
  let assert Ok(image) = url.parse("./assets/before.svg")
  image
}
