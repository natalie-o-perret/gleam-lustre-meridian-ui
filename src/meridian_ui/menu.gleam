import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/internal/link
import meridian_ui/orientation.{type Orientation, Horizontal, Vertical}
import meridian_ui/popover
import meridian_ui/selection
import meridian_ui/url.{type Url}

pub type Item(msg) {
  Command(id: String, label: String, disabled: Bool, message: msg)
  Link(id: String, label: String, destination: Url)
  Submenu(id: String, label: String, disabled: Bool, items: List(Item(msg)))
  Separator
}

pub type Action(msg) {
  Toggle(String)
  Invoke(msg)
  Close
}

pub fn update(open: List(String), action: Action(msg)) -> List(String) {
  case action {
    Toggle(id) -> selection.toggle(open, id, selection.Multiple)
    Invoke(_) | Close -> []
  }
}

pub fn view(
  id: String,
  label: String,
  open: List(String),
  on_action: fn(Action(msg)) -> msg,
  attrs: List(Attribute(msg)),
  items: List(Item(msg)),
) -> Element(msg) {
  build(id, label, Vertical, open, on_action, attrs, items)
}

/// IDs must be unique across this menu, including all nested items.
pub fn build(
  id: String,
  label: String,
  direction: Orientation,
  open: List(String),
  on_action: fn(Action(msg)) -> msg,
  attrs: List(Attribute(msg)),
  items: List(Item(msg)),
) -> Element(msg) {
  h.ul(
    [
      a.id(id),
      a.class("meridian-menu"),
      a.role(case direction {
        Horizontal -> "menubar"
        Vertical -> "menu"
      }),
      a.aria_label(label),
      a.aria_orientation(case direction {
        Horizontal -> "horizontal"
        Vertical -> "vertical"
      }),
      a.data("meridian-menu", "true"),
      ..attrs
    ],
    entries(id, open, on_action, items),
  )
}

fn entries(
  id: String,
  open: List(String),
  on_action: fn(Action(msg)) -> msg,
  items: List(Item(msg)),
) -> List(Element(msg)) {
  list.map(items, fn(item) {
    case item {
      Separator -> h.li([a.role("separator")], [])
      Command(key, label, disabled, message) ->
        h.li([a.role("none")], [
          button.text(
            [
              a.id(id <> "-" <> key),
              a.role("menuitem"),
              a.disabled(disabled),
              a.tabindex(-1),
              event.on_click(on_action(Invoke(message))),
            ],
            [h.text(label)],
          ),
        ])
      Link(key, label, destination) ->
        h.li([a.role("none")], [
          link.view(
            destination,
            [a.id(id <> "-" <> key), a.role("menuitem"), a.tabindex(-1)],
            [h.text(label)],
          ),
        ])
      Submenu(key, label, disabled, children) -> {
        let expanded = list.contains(open, key)
        h.li([a.role("none")], [
          button.text(
            [
              a.id(id <> "-" <> key),
              a.role("menuitem"),
              a.tabindex(-1),
              a.attribute("aria-haspopup", "menu"),
              a.aria_label(label),
              a.aria_expanded(expanded),
              a.aria_controls(id <> "-sub-" <> key),
              a.data("menu-toggle", "true"),
              a.disabled(disabled),
              event.on_click(on_action(Toggle(key))),
            ],
            [h.text(label)],
          ),
          h.ul(
            [
              a.id(id <> "-sub-" <> key),
              a.class("meridian-menu"),
              a.role("menu"),
              a.aria_labelledby(id <> "-" <> key),
              a.hidden(!expanded),
              a.data("meridian-menu", "true"),
              a.data("menu-parent", id <> "-" <> key),
            ],
            entries(id, open, on_action, children),
          ),
        ])
      }
    }
  })
}

pub fn popup(
  id: String,
  label: String,
  visible: Bool,
  on_close: msg,
  open: List(String),
  on_action: fn(Action(msg)) -> msg,
  attrs: List(Attribute(msg)),
  items: List(Item(msg)),
) -> Element(msg) {
  popover.view(
    id,
    label,
    visible,
    on_close,
    [a.class("meridian-menu-popup"), ..attrs],
    [view(id <> "-menu", label, open, on_action, [], items)],
  )
}
