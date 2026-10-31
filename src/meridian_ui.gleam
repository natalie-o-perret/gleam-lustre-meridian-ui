//// Small, styled Lustre components. Load `priv/meridian-ui.css` once per page.

/// Attach keyboard/pointer interactions, tooltips and shell/theme behaviour.
/// Call after rendering. IDs must be unique within the document.
/// Mounting again replaces the old listeners. Removing the root also cleans up.
/// The returned function disposes the listeners immediately when needed.
@external(javascript, "./meridian_ui/browser_ffi.mjs", "mount")
pub fn mount(
  id: String,
  on_system_theme: fn(Bool) -> Nil,
  on_desktop: fn() -> Nil,
) -> fn() -> Nil
