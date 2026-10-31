import gleam/string

pub opaque type Url {
  Url(String)
}

pub fn parse(value: String) -> Result(Url, String) {
  let value = string.trim(value)
  case allowed(value) {
    True -> Ok(Url(value))
    False -> Error("Use an HTTP, HTTPS, mail, telephone or relative URL.")
  }
}

pub fn to_string(url: Url) -> String {
  let Url(value) = url
  value
}

@external(javascript, "./url_ffi.mjs", "allowed")
fn allowed(value: String) -> Bool
