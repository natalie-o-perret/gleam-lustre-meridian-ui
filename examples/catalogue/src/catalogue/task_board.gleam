import catalogue/common
import gleam/dict
import gleam/int
import gleam/list
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/button
import meridian_ui/task_board

pub type Model {
  Model(
    columns: List(task_board.Column),
    error: String,
    props: common.Properties,
    next: Int,
  )
}

pub type Msg {
  Board(task_board.Action)
  Properties(common.Properties)
  Add
}

pub fn start(_component: String) {
  common.start(
    Model(
      [
        task_board.Column("todo", "To do", [
          task_board.Card(
            "tokens",
            "Review colour tokens",
            "Check contrast in both themes.",
            False,
          ),
          task_board.Card(
            "docs",
            "Write examples",
            "Keep examples small and runnable.",
            False,
          ),
        ]),
        task_board.Column("progress", "In progress", [
          task_board.Card(
            "catalogue",
            "Build the catalogue",
            "Make every component easy to find.",
            False,
          ),
        ]),
        task_board.Column("done", "Done", []),
      ],
      "",
      dict.new(),
      1,
    ),
    update,
    Properties,
    task_board_example,
  )
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Properties(props) ->
      Model(
        ..model,
        props: dict.merge(model.props, props),
        columns: list.map(model.columns, fn(column) {
          task_board.Column(
            ..column,
            cards: list.map(column.cards, fn(card) {
              case card.id {
                "tokens" ->
                  task_board.Card(
                    ..card,
                    title: common.property(props, "title", card.title),
                    description: common.property(
                      props,
                      "description",
                      card.description,
                    ),
                  )
                _ -> card
              }
            }),
          )
        }),
      )
    Add ->
      update(
        Model(..model, next: model.next + 1),
        Board(task_board.Add(
          "todo",
          task_board.Card(
            "task-" <> int.to_string(model.next),
            "New task " <> int.to_string(model.next),
            "Describe this task in its editor.",
            False,
          ),
        )),
      )
    Board(action) ->
      case common.flag(model.props, "readonly", False) {
        True -> model
        False ->
          case task_board.update(model.columns, action) {
            Ok(columns) -> Model(..model, columns: columns, error: "")
            Error(error) -> Model(..model, error: error)
          }
      }
  }
}

pub fn task_board_example(model: Model) -> Element(Msg) {
  common.stack([
    h.p([], [
      h.text(
        "Edit a card, drag it between columns, or use its native move controls.",
      ),
    ]),
    button.view(
      [
        e.on_click(Add),
        a.disabled(
          common.flag(model.props, "readonly", False)
          || common.flag(model.props, "empty", False),
        ),
      ],
      [h.text("Add task")],
    ),
    task_board.view(
      common.property(model.props, "label", "Project work"),
      common.items(
        model.props,
        list.map(model.columns, fn(column) {
          task_board.Column(
            ..column,
            cards: list.map(column.cards, fn(card) {
              task_board.Card(
                ..card,
                disabled: common.flag(model.props, "readonly", False),
              )
            }),
          )
        }),
      ),
      Board,
      [],
    ),
    h.p([a.role("status")], [h.text(model.error)]),
  ])
}
