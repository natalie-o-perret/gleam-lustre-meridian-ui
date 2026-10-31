import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button

pub type Tone {
  Info
  Success
  Warning
  Danger
}

/// Messages are polite status updates. Supply `a.role("alert")` for urgent ones.
pub fn view(
  tone: Tone,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  let colour = case tone {
    Info -> "info"
    Success -> "success"
    Warning -> "warning"
    Danger -> "danger"
  }
  let role = case list.any(attrs, fn(attr) { attr.name == "role" }) {
    True -> a.none()
    False -> a.role("status")
  }
  h.div(
    [a.class("meridian-message meridian-message-" <> colour), role, ..attrs],
    children,
  )
}

/// The caller removes the message from its model when `on_dismiss` arrives.
pub fn dismissible(
  tone: Tone,
  on_dismiss: msg,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  view(tone, attrs, [
    h.div([a.class("meridian-message-content")], children),
    button.icon(
      [
        a.class("meridian-message-dismiss"),
        a.aria_label("Dismiss message"),
        event.on_click(on_dismiss),
      ],
      [h.text("×")],
    ),
  ])
}
