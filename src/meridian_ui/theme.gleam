pub fn next(preference: String) -> String {
  case preference {
    "light" -> "dark"
    "dark" -> "system"
    _ -> "light"
  }
}

pub fn is_dark(preference: String, system_dark: Bool) -> Bool {
  preference == "dark" || preference == "system" && system_dark
}

/// Only light, dark and system are accepted from storage.
@external(javascript, "./theme_ffi.mjs", "readTheme")
pub fn read(key: String) -> String

@external(javascript, "./theme_ffi.mjs", "saveTheme")
pub fn save(key: String, preference: String) -> Nil

@external(javascript, "./theme_ffi.mjs", "systemDark")
pub fn system_dark() -> Bool
