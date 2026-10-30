import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/tooltip

/// Native checkbox attributes include `checked`, `disabled`, and `on_check`.
/// Set the native `indeterminate` property for a mixed selection.
pub fn view(
  label: String,
  hint: String,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.label([a.class("selection-checkbox"), tooltip.hint(hint)], [
    h.input([
      a.type_("checkbox"),
      a.aria_label(label),
      tooltip.hint(hint),
      ..attrs
    ]),
    h.span([a.class("checkbox-mark"), a.aria_hidden(True)], []),
  ])
}
