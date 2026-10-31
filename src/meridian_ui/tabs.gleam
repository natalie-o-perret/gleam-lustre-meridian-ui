import gleam/list
import gleam/result
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/orientation.{type Orientation}

pub type Activation {
  Automatic
  Manual
}

pub type Tab(msg) {
  Tab(
    id: String,
    label: String,
    disabled: Bool,
    on_select: msg,
    attrs: List(Attribute(msg)),
    children: List(Element(msg)),
  )
}

pub fn view(
  id: String,
  label: String,
  active: String,
  direction: Orientation,
  activation: Activation,
  attrs: List(Attribute(msg)),
  tabs: List(Tab(msg)),
) -> Element(msg) {
  let enabled = list.filter(tabs, fn(tab) { !tab.disabled })
  let selected =
    list.find(enabled, fn(tab) { tab.id == active })
    |> result.or(list.first(enabled))
    |> result.map(fn(tab) { tab.id })
    |> result.unwrap("")
  h.div(
    [
      a.id(id),
      a.class("meridian-tabs"),
      a.data("orientation", orientation.name(direction)),
      ..attrs
    ],
    [
      h.div(
        [
          a.class("meridian-tab-list"),
          a.role("tablist"),
          a.aria_label(label),
          a.aria_orientation(orientation.name(direction)),
          a.data("meridian-keys", "tabs"),
          a.data("activation", case activation {
            Automatic -> "automatic"
            Manual -> "manual"
          }),
        ],
        list.map(tabs, fn(tab) {
          button.view(
            [
              a.id(id <> "-tab-" <> tab.id),
              a.class("meridian-tab"),
              a.role("tab"),
              a.aria_controls(id <> "-panel-" <> tab.id),
              a.aria_selected(tab.id == selected),
              a.tabindex(case tab.id == selected {
                True -> 0
                False -> -1
              }),
              a.disabled(tab.disabled),
              a.data("meridian-item", "true"),
              event.on_click(tab.on_select),
              ..tab.attrs
            ],
            [h.text(tab.label)],
          )
        }),
      ),
      h.div(
        [a.class("meridian-tab-panels")],
        list.map(tabs, fn(tab) {
          h.div(
            [
              a.id(id <> "-panel-" <> tab.id),
              a.class("meridian-tab-panel"),
              a.role("tabpanel"),
              a.aria_labelledby(id <> "-tab-" <> tab.id),
              a.tabindex(0),
              a.hidden(tab.id != selected),
            ],
            tab.children,
          )
        }),
      ),
    ],
  )
}
