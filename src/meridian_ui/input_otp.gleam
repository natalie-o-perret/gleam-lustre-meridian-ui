import gleam/int
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import meridian_ui/field

pub type Alphabet {
  Digits
  Alphanumeric
}

/// One native input preserves paste, leading zeroes, autofill and keyboard editing.
pub fn view(
  length: Int,
  alphabet: Alphabet,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let length = int.max(length, 1)
  field.input([
    a.class("meridian-otp"),
    a.type_("text"),
    a.autocomplete("one-time-code"),
    a.autocapitalize("none"),
    a.spellcheck(False),
    a.minlength(length),
    a.maxlength(length),
    a.inputmode(case alphabet {
      Digits -> "numeric"
      Alphanumeric -> "text"
    }),
    a.pattern(
      case alphabet {
        Digits -> "[0-9]"
        Alphanumeric -> "[A-Za-z0-9]"
      }
      <> "{"
      <> int.to_string(length)
      <> "}",
    ),
    a.style("--otp-length", int.to_string(length)),
    ..attrs
  ])
}
