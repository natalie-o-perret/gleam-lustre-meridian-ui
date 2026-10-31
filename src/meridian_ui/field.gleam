import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/element/keyed

/// Supply a label or an `aria-label`, as with a native input.
pub fn input(attrs: List(Attribute(msg))) -> Element(msg) {
  h.input([a.class("input"), ..attrs])
}

/// Native number strings, bounds, steps and constraint validation are preserved.
pub fn number(attrs: List(Attribute(msg))) -> Element(msg) {
  input([a.type_("number"), ..attrs])
}

pub fn colour(attrs: List(Attribute(msg))) -> Element(msg) {
  input([a.type_("color"), a.class("meridian-colour"), ..attrs])
}

/// Grows with content where `field-sizing` is supported, otherwise stays resizable.
/// shortcut: CSS autosizing, add a fallback if older browsers must autosize.
pub fn textarea(attrs: List(Attribute(msg)), value: String) -> Element(msg) {
  h.textarea([a.class("input meridian-textarea"), ..attrs], value)
}

pub fn group(
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.div([a.class("meridian-input-group"), ..attrs], children)
}

pub fn addon(
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.span([a.class("meridian-input-addon"), ..attrs], children)
}

pub fn fluid(
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.div([a.class("meridian-fluid"), ..attrs], children)
}

/// The icon is decorative and must not contain interactive controls.
pub fn icon(
  attrs: List(Attribute(msg)),
  decoration: Element(msg),
  control: Element(msg),
) -> Element(msg) {
  h.div([a.class("meridian-icon-field"), ..attrs], [
    h.span([a.class("meridian-field-icon"), a.aria_hidden(True)], [decoration]),
    control,
  ])
}

pub fn trailing_icon(
  attrs: List(Attribute(msg)),
  decoration: Element(msg),
  control: Element(msg),
) -> Element(msg) {
  icon([a.class("meridian-icon-field-end"), ..attrs], decoration, control)
}

/// Give the control this ID. An empty placeholder lets an empty text label rest inside.
pub fn floating(
  for_id: String,
  label: String,
  attrs: List(Attribute(msg)),
  control: Element(msg),
) -> Element(msg) {
  labelled("meridian-float-field", for_id, label, attrs, control)
}

pub fn inset(
  for_id: String,
  label: String,
  attrs: List(Attribute(msg)),
  control: Element(msg),
) -> Element(msg) {
  labelled("meridian-inset-field", for_id, label, attrs, control)
}

fn labelled(
  class: String,
  for_id: String,
  label: String,
  attrs: List(Attribute(msg)),
  control: Element(msg),
) -> Element(msg) {
  h.div([a.class(class), ..attrs], [
    control,
    h.label([a.for(for_id)], [h.text(label)]),
  ])
}

pub fn select(
  attrs: List(Attribute(msg)),
  options: List(Element(msg)),
) -> Element(msg) {
  h.select(attrs, [picker(), ..options])
}

/// Stable option keys preserve native selection when filtering or reordering.
pub fn keyed_select(
  attrs: List(Attribute(msg)),
  options: List(#(String, Element(msg))),
) -> Element(msg) {
  keyed.element("select", attrs, [#("\u{0}picker", picker()), ..options])
}

fn picker() -> Element(msg) {
  h.button([a.type_("button"), a.class("select-button"), a.tabindex(-1)], [
    element.element("selectedcontent", [], []),
  ])
}

/// Rich option content should be non-interactive and contain no IDs.
/// Browsers clone it into the selected value where supported.
pub fn option(
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  element.element("option", attrs, children)
}

pub fn search(
  label: String,
  icon: Element(msg),
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.label([a.class("search-field")], [
    h.span([a.class("sr-only")], [h.text(label)]),
    icon,
    input([a.type_("search"), ..attrs]),
  ])
}
