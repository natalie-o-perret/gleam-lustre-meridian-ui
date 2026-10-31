import gleam/list
import lustre
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/button
import meridian_ui/charts
import meridian_ui/field
import meridian_ui/scheduler
import meridian_ui/task_board
import meridian_ui/text_editor
import meridian_ui/toggle_switch

pub type Model {
  Model(
    chart: String,
    document: text_editor.Document,
    readonly: Bool,
    columns: List(task_board.Column),
    events: List(scheduler.Event),
    selected: String,
    error: String,
    dark: Bool,
  )
}

pub type Msg {
  Chart(charts.Selection)
  ChangeChart
  Kind(String)
  Document(text_editor.Document)
  Readonly(Bool)
  Board(task_board.Action)
  Calendar(scheduler.Action)
  Start(String)
  End(String)
  ToggleTheme
}

pub fn main() {
  let app =
    lustre.simple(
      fn(_) {
        Model(
          "bar",
          text_editor.text("Hello"),
          False,
          [
            task_board.Column("todo", "Todo", [
              task_board.Card(
                "one",
                "First task",
                "Retain this description",
                False,
              ),
              task_board.Card("two", "Second task", "Another task", False),
            ]),
            task_board.Column("done", "Done", []),
          ],
          [
            scheduler.Event(
              "review",
              "Review",
              "2026-10-12T10:00:00",
              "2026-10-12T11:00:00",
              False,
              True,
              scheduler.Never,
            ),
            scheduler.Event(
              "weekly",
              "Weekly planning",
              "2026-10-05T09:00:00",
              "2026-10-05T10:00:00",
              False,
              False,
              scheduler.Weekly(1, [0]),
            ),
          ],
          "",
          "",
          False,
        )
      },
      update,
      view,
    )
  let assert Ok(_) = lustre.start(app, "#pro-fixture", Nil)
  Nil
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Chart(value) -> Model(..model, selected: value.series <> ": " <> value.name)
    ChangeChart -> Model(..model, chart: "line")
    Kind(value) -> Model(..model, chart: value)
    Document(value) -> Model(..model, document: value)
    Readonly(value) -> Model(..model, readonly: value)
    Board(action) ->
      case task_board.update(model.columns, action) {
        Ok(columns) -> Model(..model, columns: columns, error: "")
        Error(error) -> Model(..model, error: error)
      }
    Calendar(scheduler.Select(id)) -> Model(..model, selected: id)
    Calendar(scheduler.Pick(date)) -> Model(..model, selected: date)
    Calendar(scheduler.ChangeEvent(change)) ->
      Model(..model, events: scheduler.change(model.events, change))
    Start(value) ->
      Model(
        ..model,
        events: list.map(model.events, fn(item) {
          case item.id == "review" {
            True -> scheduler.Event(..item, start: value)
            False -> item
          }
        }),
      )
    End(value) ->
      Model(
        ..model,
        events: list.map(model.events, fn(item) {
          case item.id == "review" {
            True -> scheduler.Event(..item, end: value)
            False -> item
          }
        }),
      )
    ToggleTheme -> Model(..model, dark: !model.dark)
  }
}

fn chart_config(kind: String) -> charts.Config {
  let values = charts.Values([3.0, 2.0, 5.0])
  let nodes =
    charts.Nodes([
      charts.Node("Team", 8.0, [
        charts.Node("One", 3.0, []),
        charts.Node("Two", 5.0, []),
      ]),
    ])
  let #(kind, data) = case kind {
    "line" -> #(charts.Line, values)
    "area" -> #(charts.Area, values)
    "scatter" -> #(charts.Scatter, charts.Points([#(1.0, 2.0), #(3.0, 4.0)]))
    "pie" -> #(charts.Pie, values)
    "doughnut" -> #(charts.Doughnut, values)
    "radar" -> #(charts.Radar, values)
    "gauge" -> #(charts.Gauge, charts.Values([40.0]))
    "heatmap" -> #(
      charts.Heatmap,
      charts.Cells([#(0, 0, 1.0), #(1, 1, 3.0), #(2, 2, 5.0)]),
    )
    "treemap" -> #(charts.Treemap, nodes)
    "sunburst" -> #(charts.Sunburst, nodes)
    "funnel" -> #(charts.Funnel, values)
    "boxplot" -> #(charts.BoxPlot, charts.Boxes([#(1.0, 2.0, 3.0, 4.0, 5.0)]))
    "candlestick" -> #(
      charts.Candlestick,
      charts.Ranges([#(2.0, 3.0, 1.0, 4.0)]),
    )
    _ -> #(charts.Bar, charts.Values([1.0, 4.0, 2.0]))
  }
  charts.Config(
    "Requests",
    case kind {
      charts.Scatter -> []
      _ -> ["Mon", "Tue", "Wed"]
    },
    [charts.Series("Count", kind, data)],
  )
}

fn view(model: Model) -> Element(Msg) {
  h.main(
    [
      a.id("pro-demo"),
      a.class("meridian-ui fixture"),
      a.data("theme", case model.dark {
        True -> "dark"
        False -> "light"
      }),
    ],
    [
      h.h1([], [h.text("Advanced widgets")]),
      button.view([e.on_click(ToggleTheme)], [h.text("Toggle theme")]),
      h.section([], [
        h.h2([], [h.text("Charts")]),
        button.view([e.on_click(ChangeChart)], [h.text("Change chart")]),
        h.label([], [
          h.span([], [h.text("Chart kind")]),
          field.select(
            [a.aria_label("Chart kind"), e.on_input(Kind)],
            list.map(
              [
                "bar",
                "line",
                "area",
                "scatter",
                "pie",
                "doughnut",
                "radar",
                "gauge",
                "heatmap",
                "treemap",
                "sunburst",
                "funnel",
                "boxplot",
                "candlestick",
              ],
              fn(kind) {
                h.option([a.value(kind), a.selected(model.chart == kind)], kind)
              },
            ),
          ),
        ]),
        charts.view("requests-chart", chart_config(model.chart), Chart, []),
      ]),
      h.section([], [
        h.h2([], [h.text("Calendar")]),
        scheduler.view(
          "calendar",
          "Project calendar",
          scheduler.Config(
            scheduler.Month,
            "2026-10-12",
            "Europe/Dublin",
            model.events,
          ),
          Calendar,
          [],
        ),
        h.label([], [
          h.span([], [h.text("Review start")]),
          field.input([
            a.type_("datetime-local"),
            a.default_value("2026-10-12T10:00"),
            e.on_input(Start),
          ]),
        ]),
        h.label([], [
          h.span([], [h.text("Review end")]),
          field.input([
            a.type_("datetime-local"),
            a.default_value("2026-10-12T11:00"),
            e.on_input(End),
          ]),
        ]),
      ]),
      h.section([], [
        h.h2([], [h.text("Task board")]),
        task_board.view("Work", model.columns, Board, []),
        h.p([a.role("status")], [h.text(model.error)]),
      ]),
      h.section([], [
        h.h2([], [h.text("Text editor")]),
        toggle_switch.view("Read-only editor", [
          a.checked(model.readonly),
          e.on_check(Readonly),
        ]),
        text_editor.view(
          "notes",
          "Notes",
          model.document,
          model.readonly,
          Document,
          [],
        ),
        h.pre([a.id("document-json")], [
          h.text(text_editor.to_json(model.document)),
        ]),
        h.pre([a.id("document-html")], [
          h.text(text_editor.to_html(model.document)),
        ]),
      ]),
      h.p([a.id("selected-event")], [h.text("Selected: " <> model.selected)]),
    ],
  )
}
