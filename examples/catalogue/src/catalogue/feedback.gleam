import catalogue/common
import gleam/int
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
import meridian_ui/message
import meridian_ui/progress
import meridian_ui/skeleton
import meridian_ui/slider
import meridian_ui/spinner
import meridian_ui/tooltip

pub type Model {
  Model(count: Int, visible: Bool, progress: Int)
}

pub type Msg {
  Click
  Remove
  Restore
  Progress(String)
}

pub fn start(component: String) {
  common.start(Model(0, True, 45), update, fn(model) {
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

pub fn button_example(_model: Model) -> Element(Msg) {
  common.row([
    button.primary([e.on_click(Click)], [h.text("Create project")]),
    button.view([e.on_click(Click)], [h.text("Cancel")]),
    button.text([e.on_click(Click)], [h.text("Learn more")]),
    button.icon([a.aria_label("Add a project"), e.on_click(Click)], [
      h.text("+"),
    ]),
    button.view([a.disabled(True)], [h.text("Unavailable")]),
  ])
}

pub fn card_example(_model: Model) -> Element(Msg) {
  card.article([], [
    h.h2([], [h.text("A place for your next idea")]),
    h.p([], [
      h.text(
        "Cards give related content a clear home, without prescribing your layout.",
      ),
    ]),
    button.primary([e.on_click(Click)], [h.text("Start a project")]),
  ])
}

pub fn avatar_example(_model: Model) -> Element(Msg) {
  avatar.group("Project team", [], [
    avatar.label("Alex Morgan", "AM", []),
    avatar.label("Blair Kelly", "BK", []),
    avatar.label("Casey Doyle", "CD", []),
  ])
}

pub fn badge_example(model: Model) -> Element(Msg) {
  common.row([
    badge.counter("Unread notifications", 12 + model.count, 99, []),
    badge.counter("All messages", 125, 99, []),
    badge.dot("New updates", []),
    button.view([e.on_click(Click)], [h.text("Add notification")]),
  ])
}

pub fn chip_example(model: Model) -> Element(Msg) {
  common.row([
    chip.view([], [h.text("Gleam")]),
    case model.visible {
      True -> chip.removable("Design", Remove, [], [h.text("Design")])
      False -> button.view([e.on_click(Restore)], [h.text("Restore chip")])
    },
  ])
}

pub fn divider_example(_model: Model) -> Element(Msg) {
  common.stack([
    h.p([], [h.text("A clear break between related sections.")]),
    divider.view([]),
    divider.label("or", []),
    common.row([h.text("Overview"), divider.vertical([]), h.text("Activity")]),
  ])
}

pub fn message_example(model: Model) -> Element(Msg) {
  common.stack([
    message.view(message.Success, [], [h.text("Your project is ready.")]),
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
    progress.view("Upload", Some(model.progress), []),
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

pub fn progress_spinner(_model: Model) -> Element(Msg) {
  common.row([
    spinner.view("Loading projects", None, []),
    spinner.view("Upload 65 percent", Some(65), []),
  ])
}

pub fn skeleton_example(_model: Model) -> Element(Msg) {
  common.stack([
    common.row([
      skeleton.circle([]),
      skeleton.view([a.style("inline-size", "12rem")]),
    ]),
    skeleton.view([a.style("block-size", "8rem")]),
    skeleton.view([a.style("inline-size", "60%")]),
  ])
}

pub fn tag(_model: Model) -> Element(Msg) {
  common.row([
    badge.view(badge.Success, [], [h.text("Active")]),
    badge.view(badge.Warning, [], [h.text("At risk")]),
    badge.view(badge.Danger, [], [h.text("Blocked")]),
    badge.view(badge.Accent, [], [h.text("In review")]),
  ])
}

pub fn tooltip_example(_model: Model) -> Element(Msg) {
  button.view(
    [
      tooltip.hint("This hint also appears when the button has keyboard focus."),
      e.on_click(Click),
    ],
    [h.text("Hover or focus me")],
  )
}
