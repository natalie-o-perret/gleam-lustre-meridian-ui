import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import meridian_ui/dialog

pub type Side {
  Start
  End
  Top
  Bottom
}

pub fn view(
  id: String,
  title: String,
  side: Side,
  open: Bool,
  on_close: msg,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  dialog.view(
    id,
    title,
    open,
    on_close,
    [
      a.class("meridian-drawer"),
      a.data("side", case side {
        Start -> "start"
        End -> "end"
        Top -> "top"
        Bottom -> "bottom"
      }),
      ..attrs
    ],
    children,
  )
}
