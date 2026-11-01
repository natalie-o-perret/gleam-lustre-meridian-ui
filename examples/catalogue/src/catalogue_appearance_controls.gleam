import catalogue_appearance_palettes as palettes
import lustre/attribute as a
import lustre/element
import lustre/element/html as h
import meridian_ui/disclosure
import meridian_ui/select_button.{Choice}
import meridian_ui/selection
import meridian_ui/toggle_switch

pub fn view() {
  element.fragment([
    choices(
      "primary-presets",
      "Primary",
      [a.class("docs-swatches")],
      palettes.primary(),
    ),
    choices(
      "surface-presets",
      "Surface",
      [a.class("docs-swatches")],
      palettes.surface(),
    ),
    choices("style", "Theme", [a.class("docs-style")], [
      Choice("rounded", "Rounded", False),
      Choice("square", "Squared", False),
      Choice("playful", "Playful", False),
      Choice("fantasy", "Fantasy", False),
    ]),
    toggle_switch.view("Ripple", [a.id("ripple")]),
    h.details([a.class("docs-appearance-custom")], [
      disclosure.summary("Custom colours", []),
      h.div([a.id("appearance-custom")], []),
    ]),
  ])
}

fn choices(id, label, attrs, options) {
  select_button.view(
    label,
    id,
    selection.Single,
    True,
    [""],
    fn(_) { Nil },
    [a.id(id), ..attrs],
    options,
  )
}
