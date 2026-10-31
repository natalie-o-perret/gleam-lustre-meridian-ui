import gleam/dynamic/decode
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/order_list.{type Item}

pub type Model(msg) {
  Model(source: List(Item(msg)), target: List(Item(msg)))
}

pub type Action {
  ToTarget(String)
  ToSource(String)
  AllToTarget
  AllToSource
  ReorderSource(order_list.Action)
  ReorderTarget(order_list.Action)
}

pub fn transfer(
  source: List(Item(msg)),
  target: List(Item(msg)),
  id: String,
) -> #(List(Item(msg)), List(Item(msg))) {
  case
    list.find(source, fn(item) { item.id == id && !item.disabled }),
    list.any(target, fn(item) { item.id == id })
  {
    Ok(item), False -> #(
      list.filter(source, fn(item) { item.id != id }),
      list.append(target, [item]),
    )
    _, _ -> #(source, target)
  }
}

pub fn update(model: Model(msg), action: Action) -> Model(msg) {
  case action {
    ToTarget(id) -> {
      let #(source, target) = transfer(model.source, model.target, id)
      Model(source, target)
    }
    ToSource(id) -> {
      let #(target, source) = transfer(model.target, model.source, id)
      Model(source, target)
    }
    AllToTarget ->
      list.fold(model.source, model, fn(model, item) {
        update(model, ToTarget(item.id))
      })
    AllToSource ->
      list.fold(model.target, model, fn(model, item) {
        update(model, ToSource(item.id))
      })
    ReorderSource(order_list.Move(id, position)) ->
      Model(..model, source: order_list.move(model.source, id, position))
    ReorderTarget(order_list.Move(id, position)) ->
      Model(..model, target: order_list.move(model.target, id, position))
  }
}

pub fn view(
  source_label: String,
  target_label: String,
  model: Model(msg),
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.div(
    [
      a.class("meridian-pick-list"),
      a.data("meridian-pick", "true"),
      event.on(
        "meridian-transfer",
        decode.at(["detail"], {
          use id <- decode.field("id", decode.string)
          use target <- decode.field("target", decode.string)
          case target {
            "source" -> decode.success(on_action(ToSource(id)))
            "target" -> decode.success(on_action(ToTarget(id)))
            _ -> decode.failure(on_action(ToTarget(id)), "source or target")
          }
        }),
      )
        |> event.stop_propagation,
      ..attrs
    ],
    [
      h.section([a.aria_label(source_label), a.data("pick-side", "source")], [
        h.h3([], [h.text(source_label)]),
        order_list.view(
          source_label,
          fn(action) { on_action(ReorderSource(action)) },
          [],
          list.map(model.source, fn(item) {
            order_list.Item(
              ..item,
              children: list.append(item.children, [
                button.view(
                  [
                    a.disabled(item.disabled),
                    event.on_click(on_action(ToTarget(item.id))),
                  ],
                  [h.text("Add " <> item.label)],
                ),
              ]),
            )
          }),
        ),
      ]),
      h.div([a.class("meridian-pick-actions")], [
        button.view([event.on_click(on_action(AllToTarget))], [
          h.text("Add all"),
        ]),
        button.view([event.on_click(on_action(AllToSource))], [
          h.text("Remove all"),
        ]),
      ]),
      h.section([a.aria_label(target_label), a.data("pick-side", "target")], [
        h.h3([], [h.text(target_label)]),
        order_list.view(
          target_label,
          fn(action) { on_action(ReorderTarget(action)) },
          [],
          list.map(model.target, fn(item) {
            order_list.Item(
              ..item,
              children: list.append(item.children, [
                button.view(
                  [
                    a.disabled(item.disabled),
                    event.on_click(on_action(ToSource(item.id))),
                  ],
                  [h.text("Remove " <> item.label)],
                ),
              ]),
            )
          }),
        ),
      ]),
    ],
  )
}
