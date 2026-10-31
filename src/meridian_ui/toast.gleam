import gleam/dynamic/decode
import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/element/keyed
import lustre/event
import meridian_ui/message

pub type Notice {
  Notice(id: String, tone: message.Tone, text: String, timeout: Int)
}

pub type Position {
  Inline
  TopLeft
  TopCentre
  TopRight
  Centre
  BottomLeft
  BottomCentre
  BottomRight
}

pub fn remove(notices: List(Notice), id: String) -> List(Notice) {
  list.filter(notices, fn(notice) { notice.id != id })
}

/// Timeout is milliseconds. Zero stays until dismissed. Hover and focus pause it.
pub fn view(
  label: String,
  notices: List(Notice),
  on_dismiss: fn(String) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  view_with(label, Inline, True, notices, on_dismiss, attrs)
}

/// Positioned stacks stay inside their viewport. The caller owns the notice queue.
pub fn view_with(
  label: String,
  position: Position,
  closable: Bool,
  notices: List(Notice),
  on_dismiss: fn(String) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  keyed.div(
    [
      a.class("meridian-toasts"),
      a.role("region"),
      a.aria_label(label),
      a.data("toast-position", case position {
        Inline -> "inline"
        TopLeft -> "top-left"
        TopCentre -> "top-centre"
        TopRight -> "top-right"
        Centre -> "centre"
        BottomLeft -> "bottom-left"
        BottomCentre -> "bottom-centre"
        BottomRight -> "bottom-right"
      }),
      ..attrs
    ],
    list.map(notices, fn(notice) {
      #(
        notice.id,
        h.div(
          [
            a.data("meridian-toast", notice.id),
            a.data("timeout", int.to_string(int.max(notice.timeout, 0))),
            event.on("meridian-timeout", decode.success(on_dismiss(notice.id)))
              |> event.stop_propagation,
          ],
          [
            case closable {
              True ->
                message.dismissible(notice.tone, on_dismiss(notice.id), [], [
                  h.text(notice.text),
                ])
              False -> message.view(notice.tone, [], [h.text(notice.text)])
            },
          ],
        ),
      )
    }),
  )
}
