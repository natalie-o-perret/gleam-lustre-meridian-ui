import catalogue_appearance_controls as controls
import lustre/attribute as a
import lustre/element
import meridian_ui/icon
import meridian_ui/popover
import meridian_ui/tooltip

pub fn navigation_icon() -> String {
  icon.view(icon.Menu, []) |> element.to_string
}

pub fn markup() -> String {
  element.fragment([
    popover.trigger(
      "palette-popup",
      "Customise appearance",
      False,
      Nil,
      [
        a.id("palette"),
        a.class("icon-button"),
        a.attribute("popovertarget", "palette-popup"),
        tooltip.hint("Customise appearance"),
      ],
      [icon.view(icon.Palette, [])],
    ),
    popover.view(
      "palette-popup",
      "Appearance",
      False,
      Nil,
      [a.class("docs-palette")],
      [controls.view()],
    ),
  ])
  |> element.to_string
}
