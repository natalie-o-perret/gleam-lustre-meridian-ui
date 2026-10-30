import lustre/attribute.{type Attribute}

/// Tooltips supplement a visible label or accessible name, never replace it.
pub fn hint(text: String) -> Attribute(msg) {
  attribute.data("tooltip", text)
}
