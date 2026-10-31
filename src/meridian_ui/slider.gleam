import gleam/int
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/fieldset

/// Native scalar range input. Supply a label, bounds, step and ordinary events.
pub fn view(attrs: List(Attribute(msg))) -> Element(msg) {
  h.input([a.type_("range"), a.class("meridian-slider"), ..attrs])
}

pub type Bounds {
  Bounds(lower: Int, upper: Int)
}

pub type Action {
  Lower(Int)
  Upper(Int)
}

pub fn update(
  bounds: Bounds,
  action: Action,
  minimum: Int,
  maximum: Int,
) -> Bounds {
  let maximum = int.max(maximum, minimum)
  let lower = int.clamp(bounds.lower, minimum, maximum)
  let upper = int.clamp(bounds.upper, lower, maximum)
  case action {
    Lower(value) -> Bounds(int.clamp(value, minimum, upper), upper)
    Upper(value) -> Bounds(lower, int.clamp(value, lower, maximum))
  }
}

/// Both native thumbs remain separately named and keyboard reachable.
pub fn range(
  label: String,
  name: String,
  minimum: Int,
  maximum: Int,
  bounds: Bounds,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let bounds = update(bounds, Lower(bounds.lower), minimum, maximum)
  fieldset.view(label, [a.class("meridian-range"), ..attrs], [
    h.label([], [
      h.span([], [h.text("Minimum: " <> int.to_string(bounds.lower))]),
      view([
        a.name(name <> "-min"),
        a.min(int.to_string(minimum)),
        a.max(int.to_string(bounds.upper)),
        a.value(int.to_string(bounds.lower)),
        event.on_input(fn(value) {
          on_action(Lower(int.parse(value) |> unwrap(bounds.lower)))
        }),
      ]),
    ]),
    h.label([], [
      h.span([], [h.text("Maximum: " <> int.to_string(bounds.upper))]),
      view([
        a.name(name <> "-max"),
        a.min(int.to_string(bounds.lower)),
        a.max(int.to_string(int.max(maximum, minimum))),
        a.value(int.to_string(bounds.upper)),
        event.on_input(fn(value) {
          on_action(Upper(int.parse(value) |> unwrap(bounds.upper)))
        }),
      ]),
    ]),
  ])
}

fn unwrap(value: Result(Int, Nil), fallback: Int) -> Int {
  case value {
    Ok(value) -> value
    Error(_) -> fallback
  }
}
