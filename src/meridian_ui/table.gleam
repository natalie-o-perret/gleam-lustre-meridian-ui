import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/order.{type Order, Gt, Lt}
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/element/keyed
import lustre/event
import meridian_ui/button
import meridian_ui/checkbox
import meridian_ui/field
import meridian_ui/filter_service
import meridian_ui/paginator
import meridian_ui/selection

pub type Direction {
  Ascending
  Descending
}

pub type Sort {
  Sort(column: String, direction: Direction)
}

pub type Model {
  Model(
    query: String,
    sort: Option(Sort),
    selected: List(String),
    page: Int,
    size: Int,
  )
}

pub type Action {
  Search(String)
  SortBy(String)
  Select(String)
  Page(Int)
}

pub type Column(row, msg) {
  Column(
    id: String,
    label: String,
    compare: Option(fn(row, row) -> Order),
    cell: fn(row) -> Element(msg),
  )
}

pub fn update(model: Model, action: Action) -> Model {
  case action {
    Search(query) -> Model(..model, query: query, page: 0)
    SortBy(column) ->
      Model(
        ..model,
        page: 0,
        sort: Some(
          Sort(column, case model.sort {
            Some(Sort(previous, Ascending)) if previous == column -> Descending
            _ -> Ascending
          }),
        ),
      )
    Select(id) ->
      Model(
        ..model,
        selected: selection.toggle(model.selected, id, selection.Multiple),
      )
    Page(page) -> Model(..model, page: page)
  }
}

pub fn rows(
  items: List(row),
  model: Model,
  search: fn(row) -> String,
  columns: List(Column(row, msg)),
) -> List(row) {
  let items =
    list.filter(items, fn(row) {
      filter_service.text(search(row), model.query, filter_service.Contains)
    })
  case model.sort {
    None -> items
    Some(sort) ->
      case list.find(columns, fn(column) { column.id == sort.column }) {
        Ok(Column(_, _, Some(compare), _)) ->
          list.sort(items, fn(left, right) {
            let order = compare(left, right)
            case sort.direction, order {
              Descending, Lt -> Gt
              Descending, Gt -> Lt
              _, _ -> order
            }
          })
        _ -> items
      }
  }
}

/// Unique row keys retain native editors and focus when rows move. Cells may render
/// application-owned editors. For remote data use `page` after server-side queries.
pub fn view(
  label: String,
  model: Model,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
  items: List(row),
  key: fn(row) -> String,
  search: fn(row) -> String,
  columns: List(Column(row, msg)),
) -> Element(msg) {
  let filtered = rows(items, model, search, columns)
  h.section([a.class("meridian-data-table"), a.aria_label(label), ..attrs], [
    h.label([], [
      h.span([], [h.text("Search " <> label)]),
      field.input([
        a.type_("search"),
        a.value(model.query),
        event.on_input(fn(query) { on_action(Search(query)) }),
      ]),
    ]),
    page(
      label,
      model,
      list.length(filtered),
      on_action,
      [],
      paginator.slice(filtered, model.page, model.size),
      key,
      columns,
    ),
  ])
}

/// Render an already-filtered remote page. `total` is the server's matching count.
pub fn page(
  label: String,
  model: Model,
  total: Int,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
  items: List(row),
  key: fn(row) -> String,
  columns: List(Column(row, msg)),
) -> Element(msg) {
  h.div(attrs, [
    h.div(
      [
        a.class("meridian-table-scroll"),
        a.tabindex(0),
        a.role("region"),
        a.aria_label(label <> " data"),
      ],
      [
        h.table([], [
          h.caption([], [h.text(label)]),
          h.thead([], [
            h.tr([], [
              h.th([a.scope("col")], [h.text("Select")]),
              ..list.map(columns, fn(column) {
                let sorted = case model.sort {
                  Some(Sort(id, direction)) if id == column.id -> Some(direction)
                  _ -> None
                }
                h.th(
                  [
                    a.scope("col"),
                    case sorted {
                      None -> a.none()
                      Some(Ascending) -> a.attribute("aria-sort", "ascending")
                      Some(Descending) -> a.attribute("aria-sort", "descending")
                    },
                  ],
                  [
                    case column.compare {
                      None -> h.text(column.label)
                      Some(_) ->
                        button.text(
                          [event.on_click(on_action(SortBy(column.id)))],
                          [h.text(column.label)],
                        )
                    },
                  ],
                )
              })
            ]),
          ]),
          keyed.element(
            "tbody",
            [],
            list.map(items, fn(row) {
              let id = key(row)
              #(
                id,
                h.tr(
                  [
                    a.data("selected", case list.contains(model.selected, id) {
                      True -> "true"
                      False -> "false"
                    }),
                  ],
                  [
                    h.td([], [
                      checkbox.view("Select " <> id, "", [
                        a.checked(list.contains(model.selected, id)),
                        event.on_check(fn(_) { on_action(Select(id)) }),
                      ]),
                    ]),
                    ..list.map(columns, fn(column) {
                      h.td([], [column.cell(row)])
                    })
                  ],
                ),
              )
            }),
          ),
        ]),
      ],
    ),
    case items {
      [] -> h.p([a.role("status")], [h.text("No results")])
      _ -> element.none()
    },
    paginator.view(
      label <> " pages",
      total,
      model.size,
      model.page,
      fn(value) { on_action(Page(value)) },
      [],
    ),
  ])
}
