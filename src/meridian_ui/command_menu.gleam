import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/dialog
import meridian_ui/field
import meridian_ui/filter_service

pub type Command(msg) {
  Command(
    id: String,
    label: String,
    keywords: String,
    disabled: Bool,
    message: msg,
  )
}

pub fn filter(
  commands: List(Command(msg)),
  query: String,
) -> List(Command(msg)) {
  list.filter(commands, fn(command) {
    filter_service.text(
      command.label <> " " <> command.keywords,
      query,
      filter_service.Contains,
    )
  })
}

pub fn view(
  id: String,
  label: String,
  open: Bool,
  query: String,
  on_query: fn(String) -> msg,
  on_close: msg,
  attrs: List(Attribute(msg)),
  commands: List(Command(msg)),
) -> Element(msg) {
  let commands = filter(commands, query)
  dialog.view(
    id,
    label,
    open,
    on_close,
    [
      a.class("meridian-command-menu"),
      a.data("meridian-command", "true"),
      ..attrs
    ],
    [
      h.label([], [
        h.span([], [h.text("Search commands")]),
        field.input([
          a.type_("search"),
          a.autofocus(True),
          a.value(query),
          a.data("command-search", "true"),
          event.on_input(on_query),
        ]),
      ]),
      h.p([a.role("status")], [
        h.text(case commands {
          [] -> "No matching commands"
          _ -> "Available commands"
        }),
      ]),
      h.div(
        [
          a.data("meridian-keys", "accordion"),
          a.data("orientation", "vertical"),
        ],
        list.map(commands, fn(command) {
          button.text(
            [
              a.data("meridian-item", "true"),
              a.data("command-item", "true"),
              a.disabled(command.disabled),
              event.on_click(command.message),
            ],
            [h.text(command.label)],
          )
        }),
      ),
    ],
  )
}
