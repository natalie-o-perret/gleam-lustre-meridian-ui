import gleam/dynamic/decode
import gleam/list
import gleam/string
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/chip
import meridian_ui/field
import meridian_ui/fieldset

pub type Model {
  Model(values: List(String), draft: String)
}

pub type Action {
  Edit(String)
  Add(String)
  Remove(String)
  RemoveLast
}

/// Apply actions to the latest model so rapid edits cannot overwrite earlier tags.
pub fn update(model: Model, action: Action) -> Model {
  case action {
    Edit(value) -> Model(..model, draft: value)
    Add(value) -> add(model, value)
    Remove(value) -> remove(model, value)
    RemoveLast ->
      Model(
        ..model,
        values: list.take(model.values, list.length(model.values) - 1),
      )
  }
}

pub fn add(model: Model, draft: String) -> Model {
  let value = string.trim(draft)
  case value == "" || list.contains(model.values, value) {
    True -> Model(model.values, "")
    False -> Model(list.append(model.values, [value]), "")
  }
}

pub fn remove(model: Model, value: String) -> Model {
  Model(list.filter(model.values, fn(item) { item != value }), model.draft)
}

/// Native form data also includes any non-empty uncommitted draft, avoiding lost text.
pub fn view(
  id: String,
  label: String,
  name: String,
  required: Bool,
  model: Model,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  fieldset.view(
    label,
    [
      a.class("meridian-tags"),
      a.data("meridian-tags", "true"),
      a.data("name", name),
      ..attrs
    ],
    [
      h.div(
        [a.class("meridian-tags-values")],
        list.map(model.values, fn(value) {
          h.span([], [
            chip.removable(value, on_action(Remove(value)), [], [
              h.text(value),
            ]),
            h.input([a.type_("hidden"), a.name(name), a.value(value)]),
          ])
        }),
      ),
      field.input([
        a.id(id),
        a.aria_label(label),
        a.value(model.draft),
        a.required(required && model.values == []),
        a.data("meridian-tag-input", "true"),
        a.name(case string.trim(model.draft) == "" {
          True -> ""
          False -> name
        }),
        event.on_input(fn(value) { on_action(Edit(value)) }),
        event.on(
          "meridian-add",
          decode.at(["detail", "value"], decode.string)
            |> decode.map(fn(value) { on_action(Add(value)) }),
        )
          |> event.stop_propagation,
        event.on("meridian-remove-last", decode.success(on_action(RemoveLast)))
          |> event.stop_propagation,
      ]),
    ],
  )
}
