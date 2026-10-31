import gleam/dict.{type Dict}
import gleam/dynamic/decode
import gleam/float
import gleam/int
import gleam/list
import gleam/result
import lustre
import lustre/attribute.{type Attribute} as a
import lustre/effect
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/hierarchy
import meridian_ui/orientation.{type Orientation, Horizontal, Vertical}
import meridian_ui/selection.{type Mode, Multiple, Single}
import meridian_ui/url

pub type Properties =
  Dict(String, String)

pub fn property(props: Properties, name: String, fallback: String) -> String {
  dict.get(props, name) |> result.unwrap(fallback)
}

pub fn flag(props: Properties, name: String, fallback: Bool) -> Bool {
  case property(props, name, "") {
    "true" -> True
    "false" -> False
    _ -> fallback
  }
}

pub fn number(props: Properties, name: String, fallback: Int) -> Int {
  property(props, name, "") |> int.parse |> result.unwrap(fallback)
}

pub fn decimal(props: Properties, name: String, fallback: Float) -> Float {
  let value = property(props, name, "")
  case float.parse(value) {
    Ok(value) -> value
    Error(_) ->
      int.parse(value) |> result.map(int.to_float) |> result.unwrap(fallback)
  }
}

pub fn attrs(
  props: Properties,
  attrs: List(Attribute(msg)),
) -> List(Attribute(msg)) {
  list.fold(
    [
      #("disabled", a.disabled(flag(props, "disabled", False))),
      #("required", a.required(flag(props, "required", False))),
      #("placeholder", a.placeholder(property(props, "placeholder", ""))),
      #("readonly", a.readonly(flag(props, "readonly", False))),
      ..list.map(
        ["min", "max", "step", "minlength", "maxlength", "rows", "pattern"],
        fn(name) { #(name, a.attribute(name, property(props, name, ""))) },
      )
    ],
    attrs,
    fn(attrs, entry) {
      case dict.has_key(props, entry.0) {
        True -> [
          entry.1,
          ..list.filter(attrs, fn(attr) { attr.name != entry.0 })
        ]
        False -> attrs
      }
    },
  )
}

pub fn mode(props: Properties, fallback: Mode) -> Mode {
  case flag(props, "multiple", fallback == Multiple) {
    True -> Multiple
    False -> Single
  }
}

pub fn orientation(props: Properties, fallback: Orientation) -> Orientation {
  case flag(props, "vertical", fallback == Vertical) {
    True -> Vertical
    False -> Horizontal
  }
}

pub fn selected(
  props: Properties,
  values: List(String),
  fallback: Mode,
) -> List(String) {
  case mode(props, fallback) {
    Multiple -> values
    Single -> list.take(values, 1)
  }
}

pub fn items(props: Properties, items: List(item)) -> List(item) {
  case flag(props, "empty", False) {
    True -> []
    False -> items
  }
}

pub fn start(
  initial: model,
  update: fn(model, msg) -> model,
  on_properties: fn(Properties) -> msg,
  view: fn(model) -> Element(msg),
) -> Nil {
  start_with_effect(
    initial,
    fn(model, msg) { #(update(model, msg), effect.none()) },
    on_properties,
    view,
  )
}

pub fn start_with_effect(
  initial: model,
  update: fn(model, msg) -> #(model, effect.Effect(msg)),
  on_properties: fn(Properties) -> msg,
  view: fn(model) -> Element(msg),
) -> Nil {
  let app =
    lustre.application(fn(_) { #(initial, effect.none()) }, update, fn(model) {
      h.div(
        [
          a.id("demo-root"),
          a.class("meridian-ui demo-root"),
          event.on(
            "meridian-properties",
            decode.at(["detail"], decode.dict(decode.string, decode.string))
              |> decode.map(on_properties),
          ),
        ],
        [view(model)],
      )
    })
  let assert Ok(_) = lustre.start(app, "#demo", Nil)
  Nil
}

pub fn field(label: String, control: Element(msg)) -> Element(msg) {
  h.label([a.class("demo-field")], [h.span([], [h.text(label)]), control])
}

pub fn stack(children: List(Element(msg))) -> Element(msg) {
  h.div([a.class("demo-stack")], children)
}

pub fn row(children: List(Element(msg))) -> Element(msg) {
  h.div([a.class("demo-row")], children)
}

pub fn nodes() -> List(hierarchy.Node) {
  [
    hierarchy.Node("design", "Design", False, [
      hierarchy.Node("tokens", "Tokens", False, []),
      hierarchy.Node("components", "Components", False, []),
    ]),
    hierarchy.Node("engineering", "Engineering", False, [
      hierarchy.Node("web", "Web", False, []),
      hierarchy.Node("api", "API", False, []),
    ]),
  ]
}

pub fn destination() -> url.Url {
  let assert Ok(destination) = url.parse("#example")
  destination
}

pub fn image() -> url.Url {
  let assert Ok(image) = url.parse("./assets/landscape.svg")
  image
}

pub fn missing() -> Element(msg) {
  h.p([a.role("alert")], [h.text("This example could not be found.")])
}
