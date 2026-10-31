import lustre/attribute.{type Attribute} as a

pub type Filter {
  Digits
  Integer
  Decimal
  Letters
  Alphanumeric
}

/// Native constraint validation preserves IME, paste, undo and assistive input.
/// Invalid text is not destroyed. Check validity before accepting the form.
pub fn pattern(filter: Filter) -> Attribute(msg) {
  a.pattern(case filter {
    Digits -> "[0-9]*"
    Integer -> "-?[0-9]+"
    Decimal -> "-?[0-9]+([.][0-9]+)?"
    Letters -> "[\\p{L}\\p{M} ]*"
    Alphanumeric -> "[\\p{L}\\p{M}\\p{N} ]*"
  })
}
