import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/field
import meridian_ui/filter_service

pub type Option {
  Option(value: String, label: String, disabled: Bool)
}

/// Search enhances rather than replaces the native picker. A filtered-out current
/// value stays selected and successful in forms until the caller changes it.
pub fn view(
  label: String,
  query: String,
  value: String,
  on_query: fn(String) -> msg,
  on_change: fn(String) -> msg,
  attrs: List(Attribute(msg)),
  options: List(Option),
) -> Element(msg) {
  let filtered =
    list.filter(options, fn(option) {
      filter_service.text(option.label, query, filter_service.Contains)
    })
  let retained =
    list.filter(options, fn(option) {
      option.value == value
      && !list.any(filtered, fn(visible) { visible.value == value })
    })
  h.div([a.class("meridian-search-select")], [
    h.label([], [
      h.span([], [h.text("Search " <> label)]),
      field.input([a.type_("search"), a.value(query), event.on_input(on_query)]),
    ]),
    h.label([], [
      h.span([], [h.text(label)]),
      field.keyed_select(
        [a.aria_label(label), event.on_input(on_change), ..attrs],
        [
          #(
            "\u{0}placeholder",
            h.option([a.value(""), a.selected(value == "")], "Choose an option"),
          ),
          ..list.append(
            list.map(retained, fn(option) {
              #(
                option.value,
                h.option(
                  [
                    a.value(option.value),
                    a.selected(True),
                    a.hidden(True),
                    a.disabled(option.disabled),
                  ],
                  option.label,
                ),
              )
            }),
            list.map(filtered, fn(option) {
              #(
                option.value,
                h.option(
                  [
                    a.value(option.value),
                    a.selected(option.value == value),
                    a.disabled(option.disabled),
                  ],
                  option.label,
                ),
              )
            }),
          )
        ],
      ),
    ]),
    case filtered {
      [] -> h.p([a.role("status")], [h.text("No matching options")])
      _ -> element.none()
    },
  ])
}
