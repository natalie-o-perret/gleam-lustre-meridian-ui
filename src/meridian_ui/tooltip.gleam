import gleam/string
import lustre/attribute.{type Attribute}

/// Tooltips supplement a visible label or accessible name, never replace it.
pub fn hint(text: String) -> Attribute(msg) {
  case string.trim(text) {
    "" -> attribute.none()
    text -> attribute.data("tooltip", text)
  }
}
