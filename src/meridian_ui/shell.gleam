import gleam/dynamic/decode
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/button
import meridian_ui/tooltip

/// Application content stays in the caller, including branding and nav links.
pub type Content(msg) {
  Content(
    topbar: List(Element(msg)),
    sidebar: List(Element(msg)),
    main: List(Element(msg)),
    footer: List(Element(msg)),
  )
}

pub fn view(
  id: String,
  dark: Bool,
  menu_open: Bool,
  on_dismiss: msg,
  attrs: List(Attribute(msg)),
  content: Content(msg),
) -> Element(msg) {
  let inert = case menu_open {
    True -> [a.attribute("inert", "")]
    False -> []
  }
  h.div(
    [
      a.id(id),
      a.class("meridian-ui ui-shell"),
      a.classes([#("menu-open", menu_open)]),
      a.data("theme", case dark {
        True -> "dark"
        False -> "light"
      }),
      e.on(
        "keydown",
        decode.at(["key"], decode.string)
          |> decode.then(fn(key) {
            case key {
              "Escape" -> decode.success(on_dismiss)
              _ -> decode.failure(on_dismiss, "Escape")
            }
          }),
      ),
      ..attrs
    ],
    [
      h.a([a.href("#" <> id <> "-main"), a.class("skip-link"), ..inert], [
        h.text("Skip to content"),
      ]),
      h.header([a.class("topbar"), ..inert], content.topbar),
      h.div(
        [
          a.class("drawer-backdrop"),
          a.aria_hidden(True),
          e.on_click(on_dismiss),
        ],
        [],
      ),
      h.aside(
        [
          a.id(id <> "-navigation"),
          a.class("sidebar"),
          ..case menu_open {
            True -> [
              a.role("dialog"),
              a.aria_label("Navigation"),
              a.attribute("aria-modal", "true"),
            ]
            False -> []
          }
        ],
        [h.div([a.class("sidebar-content")], content.sidebar)],
      ),
      h.main([a.id(id <> "-main"), a.tabindex(-1), ..inert], content.main),
      h.footer([a.class("site-footer"), ..inert], content.footer),
    ],
  )
}

pub fn menu_button(
  id: String,
  open: Bool,
  on_toggle: msg,
  menu_icon: Element(msg),
  close_icon: Element(msg),
) -> Element(msg) {
  button.icon(
    [
      a.class("menu-button"),
      a.aria_label("Toggle navigation"),
      tooltip.hint(case open {
        True -> "Close navigation"
        False -> "Open navigation"
      }),
      a.aria_expanded(open),
      a.aria_controls(id <> "-navigation"),
      e.on_click(on_toggle),
    ],
    [
      h.span([a.class("menu-glyph")], [menu_icon]),
      h.span([a.class("close-glyph")], [close_icon]),
    ],
  )
}

pub fn close_button(on_close: msg, icon: Element(msg)) -> Element(msg) {
  button.icon(
    [
      a.class("drawer-close"),
      a.aria_label("Close navigation"),
      tooltip.hint("Close navigation"),
      e.on_click(on_close),
    ],
    [icon],
  )
}

@external(javascript, "./browser_ffi.mjs", "focusMenu")
pub fn focus_menu(id: String) -> Nil

@external(javascript, "./browser_ffi.mjs", "focusNavigation")
pub fn focus_navigation(id: String) -> Nil
