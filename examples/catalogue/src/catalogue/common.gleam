import lustre
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/hierarchy
import meridian_ui/url

pub fn start(
  initial: model,
  update: fn(model, msg) -> model,
  view: fn(model) -> Element(msg),
) -> Nil {
  let app =
    lustre.simple(fn(_) { initial }, update, fn(model) {
      h.div([a.id("demo-root"), a.class("meridian-ui demo-root")], [view(model)])
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
