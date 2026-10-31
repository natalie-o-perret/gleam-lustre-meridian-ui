import catalogue/common
import gleam/dict
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/avatar
import meridian_ui/badge
import meridian_ui/button
import meridian_ui/card
import meridian_ui/chip
import meridian_ui/divider
import meridian_ui/icon
import meridian_ui/message
import meridian_ui/progress
import meridian_ui/skeleton
import meridian_ui/slider
import meridian_ui/spinner
import meridian_ui/tooltip
import meridian_ui/url

pub type Model {
  Model(count: Int, visible: Bool, progress: Int, props: common.Properties)
}

pub type Msg {
  Click
  Remove
  Restore
  Progress(String)
  Properties(common.Properties)
}

pub fn start(component: String) {
  common.start(Model(0, True, 45, dict.new()), update, Properties, fn(model) {
    common.stack([
      case component {
        "button" -> button_example(model)
        "card" -> card_example(model)
        "avatar" -> avatar_example(model)
        "badge" -> badge_example(model)
        "chip" -> chip_example(model)
        "divider" -> divider_example(model)
        "message" -> message_example(model)
        "progressbar" -> progress_bar(model)
        "progressspinner" -> progress_spinner(model)
        "skeleton" -> skeleton_example(model)
        "tag" -> tag(model)
        "tooltip" -> tooltip_example(model)
        _ -> common.missing()
      },
      h.p([a.role("status"), a.class("demo-status")], [
        h.text("Actions: " <> int.to_string(model.count)),
      ]),
    ])
  })
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Properties(props) ->
      Model(
        props: dict.merge(model.props, props),
        count: common.number(props, "count", model.count),
        progress: common.number(props, "value", model.progress),
        visible: common.flag(props, "visible", model.visible),
      )
    Click -> Model(..model, count: model.count + 1)
    Remove -> Model(..model, visible: False)
    Restore -> Model(..model, visible: True)
    Progress(value) ->
      case int.parse(value) {
        Ok(value) -> Model(..model, progress: value)
        Error(_) -> model
      }
  }
}

pub fn button_example(model: Model) -> Element(Msg) {
  let variant = common.property(model.props, "variant", "primary")
  let render = case variant {
    "plain" -> button.view
    "text" -> button.text
    "icon" -> button.icon
    _ -> button.primary
  }
  let label = common.property(model.props, "label", "Create project")
  let glyph = case common.property(model.props, "icon", "none") {
    "add" -> icon.Plus
    "download" -> icon.Download
    "arrow" -> icon.ArrowRight
    _ -> icon.Check
  }
  let content = case variant {
    "icon" -> [icon.view(glyph, [])]
    _ -> {
      let decoration = case common.property(model.props, "icon", "none") {
        "none" -> []
        _ -> [icon.view(glyph, [])]
      }
      case common.property(model.props, "iconPosition", "leading") {
        "trailing" -> list.append([h.text(label)], decoration)
        _ -> list.append(decoration, [h.text(label)])
      }
    }
  }
  common.row([
    render(
      common.attrs(model.props, [e.on_click(Click), a.aria_label(label)]),
      content,
    ),
    button.view([e.on_click(Click)], [h.text("Cancel")]),
    button.text([e.on_click(Click)], [h.text("Learn more")]),
    button.icon([a.aria_label("Add a project"), e.on_click(Click)], [
      h.text("+"),
    ]),
    button.view([a.disabled(True)], [h.text("Unavailable")]),
  ])
}

pub fn card_example(model: Model) -> Element(Msg) {
  card.article([], [
    h.h2([], [
      h.text(common.property(model.props, "title", "A place for your next idea")),
    ]),
    h.p([], [
      h.text(common.property(
        model.props,
        "text",
        "Cards give related content a clear home, without prescribing your layout.",
      )),
    ]),
    case common.flag(model.props, "actions", True) {
      True -> button.primary([e.on_click(Click)], [h.text("Start a project")])
      False -> h.text("")
    },
  ])
}

pub fn avatar_example(model: Model) -> Element(Msg) {
  let label = common.property(model.props, "label", "Alex Morgan")
  let attrs = [
    a.style("inline-size", common.property(model.props, "size", "40") <> "px"),
    a.style("block-size", common.property(model.props, "size", "40") <> "px"),
  ]
  avatar.group("Project team", [], [
    case common.property(model.props, "content", "initials") {
      "image" -> avatar.image(url.to_string(common.image()), label, attrs)
      "icon" -> avatar.view(label, attrs, [icon.view(icon.User, [])])
      _ ->
        avatar.label(
          label,
          common.property(model.props, "initials", "AM"),
          attrs,
        )
    },
    avatar.label("Blair Kelly", "BK", []),
    avatar.label("Casey Doyle", "CD", []),
  ])
}

pub fn badge_example(model: Model) -> Element(Msg) {
  common.row([
    badge.counter(
      "Unread notifications",
      12 + model.count,
      common.number(model.props, "maximum", 99),
      [],
    ),
    badge.counter(
      "All messages",
      125,
      common.number(model.props, "maximum", 99),
      [],
    ),
    badge.dot("New updates", []),
    button.view([e.on_click(Click)], [h.text("Add notification")]),
  ])
}

pub fn chip_example(model: Model) -> Element(Msg) {
  common.row([
    chip.view([], [h.text(common.property(model.props, "text", "Gleam"))]),
    case model.visible {
      True -> chip.removable("Design", Remove, [], [h.text("Design")])
      False -> button.view([e.on_click(Restore)], [h.text("Restore chip")])
    },
  ])
}

pub fn divider_example(model: Model) -> Element(Msg) {
  common.stack([
    h.p([], [h.text("A clear break between related sections.")]),
    case common.flag(model.props, "vertical", False) {
      True -> divider.vertical([])
      False -> divider.view([])
    },
    divider.label(common.property(model.props, "label", "or"), []),
    common.row([h.text("Overview"), divider.vertical([]), h.text("Activity")]),
  ])
}

pub fn message_example(model: Model) -> Element(Msg) {
  common.stack([
    message.view(
      case common.property(model.props, "tone", "success") {
        "warning" -> message.Warning
        "info" -> message.Info
        "danger" -> message.Danger
        _ -> message.Success
      },
      [],
      [h.text(common.property(model.props, "text", "Your project is ready."))],
    ),
    message.view(message.Warning, [], [
      h.text("Review the details before continuing."),
    ]),
    case model.visible {
      True ->
        message.dismissible(message.Info, Remove, [], [
          h.text("This message can be dismissed."),
        ])
      False -> button.view([e.on_click(Restore)], [h.text("Restore message")])
    },
  ])
}

pub fn progress_bar(model: Model) -> Element(Msg) {
  common.stack([
    progress.view(
      common.property(model.props, "label", "Upload"),
      case common.flag(model.props, "indeterminate", False) {
        True -> None
        False -> Some(model.progress)
      },
      [],
    ),
    progress.view("Processing", None, []),
    common.field(
      "Progress",
      slider.view([
        a.min("0"),
        a.max("100"),
        a.value(int.to_string(model.progress)),
        e.on_input(Progress),
      ]),
    ),
  ])
}

pub fn progress_spinner(model: Model) -> Element(Msg) {
  common.row([
    spinner.view(
      common.property(model.props, "label", "Loading projects"),
      None,
      [],
    ),
    spinner.view(
      "Upload progress",
      Some(common.number(model.props, "value", 65)),
      [],
    ),
  ])
}

pub fn skeleton_example(model: Model) -> Element(Msg) {
  let loaded = common.flag(model.props, "loaded", False)
  let attrs = [
    a.style("animation", case common.flag(model.props, "animate", True) {
      True -> "meridian-skeleton 1.4s linear infinite"
      False -> "none"
    }),
  ]
  let cover = [
    a.style("inline-size", "100%"),
    a.style(
      "block-size",
      int.to_string(common.number(model.props, "imageHeight", 128)) <> "px",
    ),
  ]
  h.section(
    [
      a.class("demo-stack demo-skeleton-card"),
      a.aria_label("Matching loading and loaded card"),
      a.aria_busy(!loaded),
      a.style(
        "max-inline-size",
        int.to_string(common.number(model.props, "width", 560)) <> "px",
      ),
    ],
    [
      h.p([a.class("muted")], [
        h.text(
          "These placeholders are sized to this card by the caller. Switch Loaded content to compare.",
        ),
      ]),
      common.row([
        case common.flag(model.props, "avatar", True), loaded {
          False, _ -> h.text("")
          True, True ->
            avatar.label("Alex Morgan", "AM", [
              a.style("inline-size", "40px"),
              a.style("block-size", "40px"),
            ])
          True, False -> skeleton.circle(attrs)
        },
        h.div(
          [
            a.style("inline-size", "12rem"),
            a.style("max-inline-size", "100%"),
            a.style("block-size", "24px"),
          ],
          [
            case loaded {
              True ->
                h.h2([a.style("margin", "0"), a.style("font-size", "1rem")], [
                  h.text("Project Meridian"),
                ])
              False -> skeleton.view([a.style("block-size", "24px"), ..attrs])
            },
          ],
        ),
      ]),
      case common.flag(model.props, "image", True), loaded {
        False, _ -> h.text("")
        True, True ->
          h.img([
            a.src(url.to_string(common.image())),
            a.alt("A mountain landscape at sunrise"),
            a.style("object-fit", "cover"),
            ..cover
          ])
        True, False -> skeleton.view(list.append(cover, attrs))
      },
      ..list.index_map(
        list.repeat(Nil, common.number(model.props, "lines", 3)),
        fn(_, index) {
          let width = case index == 0 {
            True -> "60%"
            False -> "100%"
          }
          case loaded {
            True ->
              h.p(
                [a.class("demo-skeleton-line"), a.style("inline-size", width)],
                [h.text("Make room for your team's next idea.")],
              )
            False -> skeleton.view([a.style("inline-size", width), ..attrs])
          }
        },
      )
    ],
  )
}

pub fn tag(model: Model) -> Element(Msg) {
  common.row([
    badge.view(
      case common.property(model.props, "tone", "success") {
        "warning" -> badge.Warning
        "danger" -> badge.Danger
        "accent" -> badge.Accent
        _ -> badge.Success
      },
      [],
      [h.text(common.property(model.props, "text", "Active"))],
    ),
    badge.view(badge.Warning, [], [h.text("At risk")]),
    badge.view(badge.Danger, [], [h.text("Blocked")]),
    badge.view(badge.Accent, [], [h.text("In review")]),
  ])
}

pub fn tooltip_example(model: Model) -> Element(Msg) {
  button.view(
    [
      tooltip.hint(common.property(
        model.props,
        "hint",
        "This hint also appears when the button has keyboard focus.",
      )),
      e.on_click(Click),
    ],
    [h.text("Hover or focus me")],
  )
}
