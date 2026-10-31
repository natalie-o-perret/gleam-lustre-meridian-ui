import catalogue/common
import gleam/dict
import gleam/list
import gleam/string
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/charts
import meridian_ui/field

pub type Model {
  Model(kind: String, selected: String, props: common.Properties)
}

pub type Msg {
  Kind(String)
  Select(charts.Selection)
  Properties(common.Properties)
}

pub fn start(_component: String) {
  common.start(
    Model("bar", "Choose a data point or open the data table.", dict.new()),
    update,
    Properties,
    charts_example,
  )
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Properties(props) ->
      Model(
        ..model,
        props: dict.merge(model.props, props),
        kind: common.property(props, "kind", model.kind),
      )
    Kind(kind) -> Model(..model, kind: kind)
    Select(value) ->
      Model(..model, selected: value.series <> ": " <> value.name)
  }
}

pub fn charts_example(model: Model) -> Element(Msg) {
  common.stack([
    common.field(
      "Chart kind",
      field.select(
        [e.on_input(Kind)],
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
            h.option([a.value(kind), a.selected(model.kind == kind)], kind)
          },
        ),
      ),
    ),
    charts.view(
      "requests-chart",
      chart_config(model.kind, model.props),
      Select,
      [
        a.style(
          "--meridian-chart-height",
          common.property(model.props, "height", "384") <> "px",
        ),
      ],
    ),
    h.p([a.role("status")], [h.text(model.selected)]),
  ])
}

fn chart_config(kind: String, props: common.Properties) -> charts.Config {
  let values = charts.Values([3.0, 2.0, 5.0])
  let nodes =
    charts.Nodes([
      charts.Node("Team", 8.0, [
        charts.Node("Design", 3.0, []),
        charts.Node("Engineering", 5.0, []),
      ]),
    ])
  let #(kind, data) = case kind {
    "line" -> #(charts.Line, values)
    "area" -> #(charts.Area, values)
    "scatter" -> #(charts.Scatter, charts.Points([#(1.0, 2.0), #(3.0, 4.0)]))
    "pie" -> #(charts.Pie, values)
    "doughnut" -> #(charts.Doughnut, values)
    "radar" -> #(charts.Radar, values)
    "gauge" -> #(
      charts.Gauge,
      charts.Values([common.decimal(props, "value", 65.0)]),
    )
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
    _ -> #(charts.Bar, values)
  }
  charts.Config(
    common.property(props, "title", "Weekly requests"),
    common.property(props, "categories", "Mon,Tue,Wed")
      |> string.split(",")
      |> list.map(string.trim),
    [
      charts.Series(common.property(props, "series", "Requests"), kind, data),
    ],
  )
}
