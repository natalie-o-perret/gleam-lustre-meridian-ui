pub type Orientation {
  Horizontal
  Vertical
}

pub fn name(orientation: Orientation) -> String {
  case orientation {
    Horizontal -> "horizontal"
    Vertical -> "vertical"
  }
}
