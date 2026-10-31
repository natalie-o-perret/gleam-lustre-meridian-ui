import lustre/attribute as a
import lustre/element
import lustre/element/html as h
import meridian_ui/icon
import meridian_ui/popover
import meridian_ui/tooltip

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
      [h.h2([], [h.text("Appearance")])],
    ),
  ])
  |> element.to_string
}
