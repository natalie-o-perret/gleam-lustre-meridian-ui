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

pub type Kind {
  Line
  Area
  Bar
  Scatter
  Pie
  Doughnut
  Radar
  Gauge
  Heatmap
  Treemap
  Sunburst
  Funnel
  BoxPlot
  Candlestick
}

pub type Data {
  Values(List(Float))
  Points(List(#(Float, Float)))
  Cells(List(#(Int, Int, Float)))
  Ranges(List(#(Float, Float, Float, Float)))
  Boxes(List(#(Float, Float, Float, Float, Float)))
  Nodes(List(Node))
}

pub type Node {
  Node(name: String, value: Float, children: List(Node))
}

pub type Series {
  Series(name: String, kind: Kind, data: Data)
}

pub type Config {
  Config(title: String, categories: List(String), series: List(Series))
}

pub type Selection {
  Selection(series: String, index: Int, name: String)
}

pub fn validate(config: Config) -> Result(Nil, String) {
  case
    list.all(config.series, fn(series) {
      case series.data {
        Values(_) ->
          list.contains(
            [Line, Area, Bar, Pie, Doughnut, Radar, Gauge, Funnel],
            series.kind,
          )
        Points(_) -> list.contains([Line, Area, Bar, Scatter], series.kind)
        Cells(_) -> series.kind == Heatmap
        Nodes(_) -> list.contains([Treemap, Sunburst], series.kind)
        Boxes(_) -> series.kind == BoxPlot
        Ranges(_) -> series.kind == Candlestick
      }
    })
  {
    True -> Ok(Nil)
    False -> Error("Chart data does not match its series kind")
  }
}

/// Charts are SVG, responsive and opt into their engine with `mount`. The same
/// data remains readable in the adjacent table without JavaScript or colour.
pub fn view(
  id: String,
  config: Config,
  on_select: fn(Selection) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  case validate(config) {
    Ok(_) -> render(id, config, on_select, attrs)
    Error(error) -> h.p([a.role("alert")], [h.text(error)])
  }
}

fn render(
  id: String,
  config: Config,
  on_select: fn(Selection) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.figure([a.class("meridian-chart"), ..attrs], [
    h.figcaption([], [h.text(config.title)]),
    h.p([], [h.text("Categories: " <> string.join(config.categories, ", "))]),
    h.div(
      [
        a.id(id),
        a.class("meridian-chart-canvas"),
        a.role("img"),
        a.aria_label(config.title),
        a.data("chart", encode(config)),
        event.on(
          "meridian-chart-select",
          decode.at(["detail"], {
            use series <- decode.field("series", decode.string)
            use index <- decode.field("index", decode.int)
            use name <- decode.field("name", decode.string)
            decode.success(on_select(Selection(series, index, name)))
          }),
        )
          |> event.stop_propagation,
      ],
      [],
    ),
    h.details([], [
      h.summary([], [h.text("Chart data")]),
      h.div(
        [
          a.class("meridian-table-scroll"),
          a.tabindex(0),
          a.role("region"),
          a.aria_label(config.title <> " data"),
        ],
        [
          h.table([], [
            h.caption([], [h.text(config.title)]),
            h.thead([], [
              h.tr([], [
                h.th([a.scope("col")], [h.text("Series")]),
                h.th([a.scope("col")], [h.text("Values")]),
                h.th([a.scope("col")], [h.text("Select data")]),
              ]),
            ]),
            h.tbody(
              [],
              list.map(config.series, fn(series) {
                h.tr([], [
                  h.th([a.scope("row")], [h.text(series.name)]),
                  h.td([], [h.text(describe(series.data))]),
                  h.td(
                    [],
                    list.index_map(
                      names(series.data, config.categories),
                      fn(name, index) {
                        let index = case series.data {
                          Nodes(_) -> index + 1
                          _ -> index
                        }
                        button.text(
                          [
                            event.on_click(
                              on_select(Selection(series.name, index, name)),
                            ),
                          ],
                          [h.text("Select " <> series.name <> " " <> name)],
                        )
                      },
                    ),
                  ),
                ])
              }),
            ),
          ]),
        ],
      ),
    ]),
  ])
}

fn names(data: Data, categories: List(String)) -> List(String) {
  let labels = case data {
    Values(values) -> list.map(values, fn(_) { "" })
    Points(values) -> list.map(values, fn(_) { "" })
    Cells(values) -> list.map(values, fn(_) { "" })
    Ranges(values) -> list.map(values, fn(_) { "" })
    Boxes(values) -> list.map(values, fn(_) { "" })
    Nodes(nodes) -> node_names(nodes)
  }
  list.index_map(labels, fn(label, index) {
    case label {
      "" ->
        categories
        |> list.drop(index)
        |> list.first
        |> result.unwrap(int.to_string(index + 1))
      _ -> label
    }
  })
}

fn node_names(nodes: List(Node)) -> List(String) {
  list.flat_map(nodes, fn(node) { [node.name, ..node_names(node.children)] })
}

@external(javascript, "./charts_ffi.mjs", "encode")
fn encode(config: Config) -> String

@external(javascript, "./charts_ffi.mjs", "describe")
fn describe(data: Data) -> String

@external(javascript, "./charts_ffi.mjs", "mount")
pub fn mount(id: String) -> fn() -> Nil
