import gleam/dynamic/decode
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/internal/attribute

pub fn anchor(id: String) -> Attribute(msg) {
  a.data("meridian-opener", id)
}

pub fn trigger(
  id: String,
  label: String,
  open: Bool,
  on_toggle: msg,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  button.view(
    [
      anchor(id),
      a.aria_label(label),
      a.aria_controls(id),
      a.aria_expanded(open),
      attribute.default(
        attrs,
        "aria-haspopup",
        a.attribute("aria-haspopup", "dialog"),
      ),
      event.on_click(on_toggle),
      ..attrs
    ],
    children,
  )
}

/// Native light dismissal and Escape notify `on_close`. Commit the new closed state.
pub fn view(
  id: String,
  label: String,
  open: Bool,
  on_close: msg,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.div(
    [
      a.id(id),
      a.class("meridian-popover"),
      a.attribute("popover", "auto"),
      attribute.default(attrs, "role", a.role("dialog")),
      a.aria_label(label),
      a.tabindex(-1),
      a.data("meridian-overlay", "popover"),
      a.data("open", case open {
        True -> "true"
        False -> "false"
      }),
      event.on("meridian-close", decode.success(on_close))
        |> event.stop_propagation,
      ..attrs
    ],
    children,
  )
}
