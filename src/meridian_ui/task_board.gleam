import gleam/dynamic/decode
import gleam/int
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/disclosure
import meridian_ui/field
import meridian_ui/order_list

pub type Card {
  Card(id: String, title: String, description: String, disabled: Bool)
}

pub type Column {
  Column(id: String, label: String, cards: List(Card))
}

pub type Action {
  Move(id: String, source: String, target: String, position: Int)
  Rename(id: String, title: String)
  Describe(id: String, description: String)
  Remove(String)
  Add(column: String, card: Card)
}

pub fn update(
  columns: List(Column),
  action: Action,
) -> Result(List(Column), String) {
  case action {
    Move(id, source, target, position) -> {
      use origin <- result.try(
        list.find(columns, fn(column) { column.id == source })
        |> result.replace_error("Unknown source column"),
      )
      use destination <- result.try(
        list.find(columns, fn(column) { column.id == target })
        |> result.replace_error("Unknown target column"),
      )
      use card <- result.try(
        list.find(origin.cards, fn(card) { card.id == id && !card.disabled })
        |> result.replace_error("Card cannot be moved"),
      )
      let rest = list.filter(destination.cards, fn(other) { other.id != id })
      let #(before, after) =
        list.split(rest, int.clamp(position, 0, list.length(rest)))
      let cards = list.append(before, [card, ..after])
      Ok(
        list.map(columns, fn(column) {
          case column.id == target, column.id == source {
            True, _ -> Column(..column, cards: cards)
            False, True ->
              Column(
                ..column,
                cards: list.filter(column.cards, fn(other) { other.id != id }),
              )
            _, _ -> column
          }
        }),
      )
    }
    Rename(id, title) ->
      case string.trim(title) == "" {
        True -> Error("A card needs a title")
        False ->
          Ok(
            list.map(columns, fn(column) {
              Column(
                ..column,
                cards: list.map(column.cards, fn(card) {
                  case card.id == id && !card.disabled {
                    True -> Card(..card, title: title)
                    False -> card
                  }
                }),
              )
            }),
          )
      }
    Describe(id, description) ->
      Ok(
        list.map(columns, fn(column) {
          Column(
            ..column,
            cards: list.map(column.cards, fn(card) {
              case card.id == id && !card.disabled {
                True -> Card(..card, description: description)
                False -> card
              }
            }),
          )
        }),
      )
    Remove(id) ->
      Ok(
        list.map(columns, fn(column) {
          Column(
            ..column,
            cards: list.filter(column.cards, fn(card) {
              card.id != id || card.disabled
            }),
          )
        }),
      )
    Add(target, card) ->
      case
        card.id == ""
        || string.trim(card.title) == ""
        || list.any(columns, fn(column) {
          list.any(column.cards, fn(other) { other.id == card.id })
        })
        || !list.any(columns, fn(column) { column.id == target })
      {
        True -> Error("A card needs a unique ID, title and existing column")
        False ->
          Ok(
            list.map(columns, fn(column) {
              case column.id == target {
                True ->
                  Column(..column, cards: list.append(column.cards, [card]))
                False -> column
              }
            }),
          )
      }
  }
}

pub fn view(
  label: String,
  columns: List(Column),
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.section(
    [
      a.class("meridian-task-board"),
      a.aria_label(label),
      a.data("meridian-board", "true"),
      event.on(
        "meridian-card-move",
        decode.at(["detail"], {
          use id <- decode.field("id", decode.string)
          use source <- decode.field("source", decode.string)
          use target <- decode.field("target", decode.string)
          use position <- decode.field("position", decode.int)
          decode.success(on_action(Move(id, source, target, position)))
        }),
      )
        |> event.stop_propagation,
      ..attrs
    ],
    list.map(columns, fn(column) {
      h.section(
        [
          a.class("meridian-task-column"),
          a.aria_label(column.label),
          a.data("board-column", column.id),
        ],
        [
          h.h3([], [h.text(column.label)]),
          order_list.view(
            column.label <> " cards",
            fn(action) {
              let order_list.Move(id, position) = action
              on_action(Move(id, column.id, column.id, position))
            },
            [],
            list.map(column.cards, fn(card) {
              order_list.Item(card.id, card.title, card.disabled, [
                h.p([], [h.text(card.description)]),
                h.details([], [
                  disclosure.summary("Edit " <> card.title, []),
                  h.label([], [
                    h.span([], [h.text("Title")]),
                    field.input([
                      a.value(card.title),
                      a.disabled(card.disabled),
                      event.on_input(fn(value) {
                        on_action(Rename(card.id, value))
                      }),
                    ]),
                  ]),
                  h.label([], [
                    h.span([], [h.text("Description")]),
                    field.textarea(
                      [
                        a.disabled(card.disabled),
                        event.on_input(fn(value) {
                          on_action(Describe(card.id, value))
                        }),
                      ],
                      card.description,
                    ),
                  ]),
                ]),
                h.label([], [
                  h.span([], [h.text("Move " <> card.title <> " to")]),
                  field.select(
                    [
                      a.aria_label("Move " <> card.title <> " to"),
                      a.disabled(card.disabled),
                      event.on_input(fn(target) {
                        on_action(Move(card.id, column.id, target, 0))
                      }),
                    ],
                    list.map(columns, fn(target) {
                      h.option(
                        [a.value(target.id), a.selected(target.id == column.id)],
                        target.label,
                      )
                    }),
                  ),
                ]),
                button.text(
                  [
                    a.disabled(card.disabled),
                    event.on_click(on_action(Remove(card.id))),
                  ],
                  [h.text("Remove " <> card.title)],
                ),
              ])
            }),
          ),
        ],
      )
    }),
  )
}
