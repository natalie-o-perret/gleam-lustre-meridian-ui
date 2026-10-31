import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/card
import meridian_ui/disclosure

pub fn view(
  title: String,
  attrs: List(Attribute(msg)),
  actions: List(Element(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  card.section([a.class("meridian-panel"), ..attrs], [
    header(h.text(title), actions),
    h.div([a.class("meridian-panel-content")], children),
  ])
}

/// The caller owns expansion and focus when collapsing content programmatically.
/// `id` must be unique. Hidden content keeps its native form values and validity.
pub fn collapsible(
  id: String,
  title: String,
  expanded: Bool,
  on_toggle: msg,
  attrs: List(Attribute(msg)),
  actions: List(Element(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  card.section([a.class("meridian-panel"), ..attrs], [
    header(
      disclosure.toggle(id, title, expanded, [event.on_click(on_toggle)]),
      actions,
    ),
    disclosure.content(
      id,
      expanded,
      [a.class("meridian-panel-content")],
      children,
    ),
  ])
}

fn header(title: Element(msg), actions: List(Element(msg))) -> Element(msg) {
  h.header([a.class("meridian-panel-header")], [
    h.h2([a.class("meridian-panel-heading")], [title]),
    h.div([a.class("meridian-panel-actions")], actions),
  ])
}
