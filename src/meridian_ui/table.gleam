import gleam/int
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
import meridian_ui/icon
import meridian_ui/message
import meridian_ui/paginator
import meridian_ui/selection
import meridian_ui/tooltip

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
  Size(Int)
}

/// Compare requests before fetching. Row selection does not change the request.
pub type Request {
  Request(query: String, sort: Option(Sort), offset: Int, limit: Int)
}

pub fn request(model: Model) -> Request {
  let size = int.max(model.size, 1)
  Request(model.query, model.sort, int.max(model.page, 0) * size, size)
}

pub type Column(row, msg) {
  Column(
    id: String,
    label: String,
    compare: Option(fn(row, row) -> Order),
    cell: fn(row) -> Element(msg),
  )
  /// Server sort keys need no client-side comparison function.
  ServerColumn(
    id: String,
    label: String,
    sortable: Bool,
    cell: fn(row) -> Element(msg),
  )
}

pub fn update(model: Model, action: Action) -> Model {
  case action {
    Search(query) -> Model(..model, query: query, page: 0)
    SortBy(column) ->
      Model(..model, page: 0, sort: case model.sort {
        Some(Sort(previous, Ascending)) if previous == column ->
          Some(Sort(column, Descending))
        Some(Sort(previous, Descending)) if previous == column -> None
        _ -> Some(Sort(column, Ascending))
      })
    Select(id) ->
      Model(
        ..model,
        selected: selection.toggle(model.selected, id, selection.Multiple),
      )
    Page(page) -> Model(..model, page: int.max(page, 0))
    Size(size) -> Model(..model, size: int.max(size, 1), page: 0)
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
    search_field(label, model.query, on_action),
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

fn search_field(
  label: String,
  query: String,
  on_action: fn(Action) -> msg,
) -> Element(msg) {
  field.floating_label(
    "Search " <> label,
    [],
    field.input([
      a.type_("search"),
      a.placeholder(" "),
      a.value(query),
      event.on_input(fn(query) { on_action(Search(query)) }),
    ]),
  )
}

/// Render server-owned rows unchanged, with the server's matching total.
/// Handle actions with `update`, then fetch when `request` changes. Debouncing,
/// cancellation, stale-response guards and retries belong to the caller.
pub fn remote(
  label: String,
  model: Model,
  total: Int,
  loading: Bool,
  error: Option(String),
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
  items: List(row),
  key: fn(row) -> String,
  columns: List(Column(row, msg)),
) -> Element(msg) {
  h.section([a.class("meridian-data-table"), a.aria_label(label), ..attrs], [
    search_field(label, model.query, on_action),
    case loading {
      True -> h.p([a.role("status")], [h.text("Loading " <> label <> "...")])
      False -> element.none()
    },
    case error {
      Some(error) ->
        message.view(message.Danger, [a.role("alert")], [h.text(error)])
      None -> element.none()
    },
    page_with(
      label,
      model,
      int.max(total, 0),
      on_action,
      [a.aria_busy(loading)],
      items,
      key,
      columns,
      !loading && error == None,
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
  page_with(label, model, total, on_action, attrs, items, key, columns, True)
}

fn page_with(
  label: String,
  model: Model,
  total: Int,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
  items: List(row),
  key: fn(row) -> String,
  columns: List(Column(row, msg)),
  show_empty: Bool,
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
                    case column {
                      Column(_, _, None, _) | ServerColumn(_, _, False, _) ->
                        h.text(column.label)
                      _ ->
                        button.text(
                          [
                            a.class("meridian-table-sort"),
                            tooltip.hint(case sorted {
                              Some(Descending) ->
                                "Restore original order for " <> column.label
                              Some(Ascending) ->
                                "Sort " <> column.label <> " descending"
                              None -> "Sort " <> column.label <> " ascending"
                            }),
                            event.on_click(on_action(SortBy(column.id))),
                          ],
                          [
                            h.text(column.label),
                            icon.view(
                              case sorted {
                                Some(Ascending) -> icon.SortAscending
                                Some(Descending) -> icon.SortDescending
                                None -> icon.Sort
                              },
                              [a.class("meridian-sort-direction")],
                            ),
                          ],
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
                      checkbox.view(
                        "Select " <> id,
                        case list.contains(model.selected, id) {
                          True -> "Deselect " <> id
                          False -> "Select " <> id
                        },
                        [
                          a.checked(list.contains(model.selected, id)),
                          event.on_check(fn(_) { on_action(Select(id)) }),
                        ],
                      ),
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
    case items, show_empty {
      [], True -> h.p([a.role("status")], [h.text("No results")])
      _, _ -> element.none()
    },
    paginator.with_sizes(
      label <> " pages",
      total,
      model.size,
      model.page,
      fn(value) { on_action(Page(value)) },
      fn(value) { on_action(Size(value)) },
      [10, 25, 50],
      [],
    ),
  ])
}

/// A native reference table without search, selection, sorting or pagination.
/// Column render callbacks and unique row keys work as in `view`.
pub fn read_only(
  label: String,
  attrs: List(Attribute(msg)),
  items: List(row),
  key: fn(row) -> String,
  columns: List(Column(row, msg)),
) -> Element(msg) {
  h.div(
    [
      a.class("meridian-table-scroll"),
      a.tabindex(0),
      a.role("region"),
      a.aria_label(label),
      ..attrs
    ],
    [
      h.table([], [
        h.caption([], [h.text(label)]),
        h.thead([], [
          h.tr(
            [],
            list.map(columns, fn(column) {
              h.th([a.scope("col")], [h.text(column.label)])
            }),
          ),
        ]),
        keyed.element(
          "tbody",
          [],
          list.map(items, fn(row) {
            #(
              key(row),
              h.tr(
                [],
                list.map(columns, fn(column) { h.td([], [column.cell(row)]) }),
              ),
            )
          }),
        ),
      ]),
    ],
  )
}
