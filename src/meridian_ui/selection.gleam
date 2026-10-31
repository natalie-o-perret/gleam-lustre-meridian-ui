import gleam/list

pub type Mode {
  Single
  Multiple
}

pub fn toggle(values: List(String), value: String, mode: Mode) -> List(String) {
  case list.contains(values, value), mode {
    True, _ -> list.filter(values, fn(item) { item != value })
    False, Single -> [value]
    False, Multiple -> list.append(values, [value])
  }
}
