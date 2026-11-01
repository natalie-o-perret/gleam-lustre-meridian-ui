import lustre/attribute as a
import lustre/element
import lustre/element/html as h
import meridian_ui/button
import meridian_ui/icon
import meridian_ui/tooltip

pub fn view(label, foldable) {
  case foldable {
    False -> element.none()
    True ->
      h.div(
        [
          a.class("meridian-code-tools"),
          a.role("group"),
          a.aria_label(label <> " actions"),
        ],
        [
          action("collapse", "Collapse all code blocks", icon.Minimize),
          action("expand", "Expand all code blocks", icon.Maximize),
        ],
      )
  }
}

pub fn copy() {
  button.view(
    [
      a.class("meridian-code-copy"),
      a.data("code-action", "copy"),
      a.aria_label("Copy code"),
    ],
    [
      icon.view(icon.Clipboard, []),
      h.span([a.data("code-copy-label", "")], [h.text("Copy")]),
    ],
  )
}

fn action(action, label, glyph) {
  button.icon(
    [a.data("code-action", action), a.aria_label(label), tooltip.hint(label)],
    [icon.view(glyph, [])],
  )
}
