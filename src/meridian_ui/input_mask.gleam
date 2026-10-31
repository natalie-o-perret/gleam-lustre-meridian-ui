import gleam/dynamic/decode
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/event
import meridian_ui/field

pub type Value {
  Value(masked: String, raw: String, complete: Bool)
}

/// Pattern tokens: `0` is a digit, `a` a letter and `*` either. Mount once after
/// rendering. The returned cleanup function also runs when the input is removed.
pub fn view(
  id: String,
  pattern: String,
  value: String,
  on_change: fn(Value) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  field.input([
    a.id(id),
    a.type_("text"),
    a.value(value),
    a.data("mask-pattern", pattern),
    a.data("mask-value", value),
    event.on(
      "meridian-mask",
      decode.at(["detail"], {
        use masked <- decode.field("masked", decode.string)
        use raw <- decode.field("raw", decode.string)
        use complete <- decode.field("complete", decode.bool)
        decode.success(on_change(Value(masked, raw, complete)))
      }),
    )
      |> event.stop_propagation,
    ..attrs
  ])
}

@external(javascript, "./mask_ffi.mjs", "mount")
pub fn mount(id: String) -> fn() -> Nil
