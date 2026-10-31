import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/disclosure

/// Native disabled fieldsets disable controls except those inside the first legend.
pub fn view(
  legend: String,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.fieldset([a.class("meridian-fieldset"), ..attrs], [
    h.legend([], [h.text(legend)]),
    h.div([a.class("meridian-fieldset-content")], children),
  ])
}

/// The caller owns expansion and focus. `id` must be unique in the document.
/// Collapsing hides controls without disabling them or discarding their form values.
pub fn collapsible(
  id: String,
  legend: String,
  expanded: Bool,
  on_toggle: msg,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.fieldset([a.class("meridian-fieldset"), ..attrs], [
    h.legend([], [
      disclosure.toggle(id, legend, expanded, [event.on_click(on_toggle)]),
    ]),
    disclosure.content(
      id,
      expanded,
      [a.class("meridian-fieldset-content")],
      children,
    ),
  ])
}
