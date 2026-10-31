import gleam/dynamic.{type Dynamic}
import gleam/dynamic/decode
import gleam/int
import gleam/string
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/field
import meridian_ui/url.{type Url}

pub opaque type File {
  File(Dynamic)
}

pub type Selection {
  Selection(files: List(File), errors: List(String))
}

pub fn name(file: File) -> String {
  let File(value) = file
  file_name(value)
}

pub fn size(file: File) -> Int {
  let File(value) = file
  file_size(value)
}

/// The browser File for an application-owned transport or preview FFI.
pub fn native(file: File) -> Dynamic {
  let File(value) = file
  value
}

/// `maximum` is bytes per file. Zero permits any size. Validate again on the server.
pub fn view(
  label: String,
  accept: String,
  maximum: Int,
  multiple: Bool,
  on_select: fn(Selection) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.label([a.class("meridian-file-upload"), a.data("meridian-upload", "true")], [
    h.span([], [h.text(label)]),
    field.input([
      a.type_("file"),
      a.aria_label(label),
      a.accept(string.split(accept, ",")),
      a.multiple(multiple),
      a.data("maximum", int.to_string(maximum)),
      event.on(
        "meridian-files",
        decode.at(["detail"], {
          use files <- decode.field(
            "files",
            decode.list(decode.map(decode.dynamic, File)),
          )
          use errors <- decode.field("errors", decode.list(decode.string))
          decode.success(on_select(Selection(files, errors)))
        }),
      )
        |> event.stop_propagation,
      ..attrs
    ]),
    h.span([], [h.text("Choose files or drop them here")]),
  ])
}

/// Multipart upload with progress and an explicit cancel function. Status zero
/// reports network failure or cancellation. The application owns notices and retries.
pub fn upload(
  destination: Url,
  files: List(File),
  on_progress: fn(Int, Int) -> Nil,
  on_finish: fn(Int, String) -> Nil,
) -> fn() -> Nil {
  send(url.to_string(destination), files, on_progress, on_finish)
}

@external(javascript, "./upload_ffi.mjs", "name")
fn file_name(file: Dynamic) -> String

@external(javascript, "./upload_ffi.mjs", "size")
fn file_size(file: Dynamic) -> Int

@external(javascript, "./upload_ffi.mjs", "upload")
fn send(
  destination: String,
  files: List(File),
  on_progress: fn(Int, Int) -> Nil,
  on_finish: fn(Int, String) -> Nil,
) -> fn() -> Nil
