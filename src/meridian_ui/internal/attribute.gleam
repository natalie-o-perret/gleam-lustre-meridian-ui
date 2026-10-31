import gleam/list
import lustre/attribute.{type Attribute} as a

pub fn default(
  attrs: List(Attribute(msg)),
  name: String,
  fallback: Attribute(msg),
) -> Attribute(msg) {
  case list.any(attrs, fn(attr) { attr.name == name }) {
    True -> a.none()
    False -> fallback
  }
}
