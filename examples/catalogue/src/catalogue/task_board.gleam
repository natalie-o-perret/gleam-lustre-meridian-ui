import catalogue/common
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/task_board

pub type Model {
  Model(columns: List(task_board.Column), error: String)
}

pub type Msg {
  Board(task_board.Action)
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
    ),
    update,
    task_board_example,
  )
}

fn update(model: Model, msg: Msg) -> Model {
  let Board(action) = msg
  case task_board.update(model.columns, action) {
    Ok(columns) -> Model(columns, "")
    Error(error) -> Model(..model, error: error)
  }
}

pub fn task_board_example(model: Model) -> Element(Msg) {
  common.stack([
    h.p([], [
      h.text(
        "Edit a card, drag it between columns, or use its native move controls.",
      ),
    ]),
    task_board.view("Project work", model.columns, Board, []),
    h.p([a.role("status")], [h.text(model.error)]),
  ])
}
