import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/carousel
import meridian_ui/dialog
import meridian_ui/url.{type Url}

pub type Image {
  Image(source: Url, description: String, caption: String)
}

pub fn view(
  id: String,
  label: String,
  active: Int,
  preview: Bool,
  on_change: fn(Int) -> msg,
  on_preview: msg,
  on_close: msg,
  attrs: List(Attribute(msg)),
  images: List(Image),
) -> Element(msg) {
  let slides = list.map(images, image)
  h.div([a.class("meridian-gallery"), ..attrs], [
    carousel.view(label, active, on_change, [], slides),
    h.div(
      [
        a.class("meridian-gallery-thumbnails"),
        a.role("group"),
        a.aria_label(label <> " images"),
      ],
      list.index_map(images, fn(item, index) {
        button.view(
          [
            a.aria_label(item.description),
            a.aria_pressed(case index == active {
              True -> "true"
              False -> "false"
            }),
            event.on_click(on_change(index)),
          ],
          [h.img([a.src(url.to_string(item.source)), a.alt("")])],
        )
      }),
    ),
    button.view([a.disabled(images == []), event.on_click(on_preview)], [
      h.text("Open full-size preview"),
    ]),
    dialog.view(id, label <> " preview", preview, on_close, [], [
      carousel.view(label, active, on_change, [], slides),
    ]),
  ])
}

fn image(item: Image) -> Element(msg) {
  h.figure([], [
    h.img([
      a.src(url.to_string(item.source)),
      a.alt(item.description),
      a.loading("lazy"),
    ]),
    h.figcaption([], [h.text(item.caption)]),
  ])
}
