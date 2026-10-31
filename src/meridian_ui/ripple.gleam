import lustre/attribute.{type Attribute} as a

/// Apply to a button or link. Disabled controls and reduced motion do not animate.
pub fn enabled() -> Attribute(msg) {
  a.data("meridian-ripple", "true")
}
