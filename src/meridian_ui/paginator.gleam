import gleam/dynamic/decode
import gleam/int
import gleam/list
import gleam/result
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/field
import meridian_ui/icon
import meridian_ui/tooltip

pub fn pages(total: Int, size: Int) -> Int {
  int.max(1, { int.max(total, 0) + int.max(size, 1) - 1 } / int.max(size, 1))
}

pub fn clamp(page: Int, total: Int, size: Int) -> Int {
  int.clamp(page, 0, pages(total, size) - 1)
}

pub fn slice(items: List(item), page: Int, size: Int) -> List(item) {
  let size = int.max(size, 1)
  items
  |> list.drop(clamp(page, list.length(items), size) * size)
  |> list.take(size)
}

/// Pages are zero-based. A shrinking result set always renders a reachable page.
pub fn view(
  label: String,
  total: Int,
  size: Int,
  page: Int,
  on_change: fn(Int) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let page = clamp(page, total, size)
  let count = pages(total, size)
  let first = int.max(0, page - 2)
  let last = int.min(count - 1, page + 2)
  h.nav([a.class("meridian-paginator"), a.aria_label(label), ..attrs], [
    navigation("First page", page == 0, on_change(0), False, True),
    navigation("Previous page", page == 0, on_change(page - 1), False, False),
    ..list.append(
      list.index_map(list.repeat(Nil, last - first + 1), fn(_, offset) {
        let index = first + offset
        button.view(
          [
            a.aria_label("Page " <> int.to_string(index + 1)),
            a.aria_current(case index == page {
              True -> "page"
              False -> "false"
            }),
            event.on_click(on_change(index)),
          ],
          [h.text(int.to_string(index + 1))],
        )
      }),
      [
        h.span([a.role("status"), a.aria_atomic(True)], [
          h.text(
            "Page " <> int.to_string(page + 1) <> " of " <> int.to_string(count),
          ),
        ]),
        h.div([a.class("meridian-page-selector")], [
          field.floating_label(
            "Go to page",
            [],
            field.input([
              a.type_("text"),
              a.inputmode("numeric"),
              a.pattern("[1-9][0-9]*"),
              a.autocomplete("off"),
              a.data("meridian-pages", int.to_string(count)),
              a.data("meridian-page", int.to_string(page + 1)),
              // Keep native draft edits until the committed page changes.
              a.default_value(int.to_string(page + 1)),
              event.on("change", entered_page(count, on_change)),
              event.advanced("keydown", {
                use key <- decode.field("key", decode.string)
                use composing <- decode.field("isComposing", decode.bool)
                case key, composing {
                  "Enter", False ->
                    entered_page(count, on_change)
                    |> decode.one_of([decode.success(on_change(page))])
                    |> decode.map(fn(message) {
                      event.handler(message, True, False)
                    })
                  _, _ ->
                    decode.failure(
                      event.handler(on_change(page), False, False),
                      "Enter",
                    )
                }
              }),
            ]),
          ),
          h.datalist([], []),
        ]),
        navigation(
          "Next page",
          page == count - 1,
          on_change(page + 1),
          True,
          False,
        ),
        navigation(
          "Last page",
          page == count - 1,
          on_change(count - 1),
          True,
          True,
        ),
      ],
    )
  ])
}

fn entered_page(count: Int, on_change: fn(Int) -> msg) -> decode.Decoder(msg) {
  use value <- decode.field("target", decode.at(["value"], decode.string))
  case int.parse(value) {
    Ok(value) if value >= 1 && value <= count ->
      decode.success(on_change(value - 1))
    _ -> decode.failure(on_change(0), "a page within the available range")
  }
}

/// The caller resets or clamps page state when a page size is selected.
pub fn with_sizes(
  label: String,
  total: Int,
  size: Int,
  page: Int,
  on_page: fn(Int) -> msg,
  on_size: fn(Int) -> msg,
  sizes: List(Int),
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let size = int.max(size, 1)
  let sizes =
    [size, ..sizes]
    |> list.filter(fn(size) { size > 0 })
    |> list.unique
    |> list.sort(int.compare)
  h.div([a.class("meridian-pagination")], [
    view(label, total, size, page, on_page, attrs),
    field.floating_label(
      "Rows per page",
      [a.class("meridian-page-size")],
      field.select(
        [
          a.class("input"),
          event.on_change(fn(value) {
            on_size(int.parse(value) |> result.unwrap(size))
          }),
        ],
        list.map(sizes, fn(option) {
          field.option(
            [a.value(int.to_string(option)), a.selected(option == size)],
            [h.text(int.to_string(option))],
          )
        }),
      ),
    ),
  ])
}

fn navigation(
  label: String,
  disabled: Bool,
  message: msg,
  forward: Bool,
  double: Bool,
) -> Element(msg) {
  let glyph = case forward, double {
    False, False -> icon.ChevronLeft
    True, False -> icon.ChevronRight
    False, True -> icon.First
    True, True -> icon.Last
  }
  button.view(
    [
      a.class("meridian-page-direction"),
      a.aria_label(label),
      tooltip.hint(label),
      a.disabled(disabled),
      event.on_click(message),
    ],
    [
      icon.view(glyph, []),
    ],
  )
}
