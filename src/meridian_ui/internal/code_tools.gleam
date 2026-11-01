import lustre/attribute as a
import lustre/element
import lustre/element/html as h
import meridian_ui/button
import meridian_ui/icon
import meridian_ui/tooltip

pub fn view(label, foldable) {
  h.div(
    [
      a.class("meridian-code-tools"),
      a.role("group"),
      a.aria_label(label <> " actions"),
    ],
    [
      button.view(
        [
          a.class("meridian-code-copy"),
          a.data("code-action", "copy"),
          a.aria_label("Copy code"),
        ],
        [
          icon.view(icon.Copy, []),
          h.span([a.data("code-copy-label", "")], [h.text("Copy")]),
        ],
      ),
      case foldable {
        True -> action("collapse", "Collapse all code blocks", icon.Minimize)
        False -> element.none()
      },
      case foldable {
        True -> action("expand", "Expand all code blocks", icon.Maximize)
        False -> element.none()
      },
      h.span([a.class("meridian-code-status"), a.role("status")], []),
    ],
  )
}

fn action(action, label, glyph) {
  button.icon(
    [a.data("code-action", action), a.aria_label(label), tooltip.hint(label)],
    [icon.view(glyph, [])],
  )
}
