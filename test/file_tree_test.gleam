import gleam/string
import gleeunit/should
import lustre/element
import meridian_ui/file_tree
import meridian_ui/selection
import meridian_ui/tree

pub fn file_trees_keep_empty_folders_disabled_files_and_accessible_names_test() {
  let html =
    file_tree.view(
      "Files",
      selection.Single,
      tree.Model(["src"], []),
      fn(_) { Nil },
      [],
      [
        file_tree.Folder("src", "src", False, [
          file_tree.File("app", "app.gleam", False),
        ]),
        file_tree.Folder("empty", "Empty folder", False, []),
        file_tree.File("locked", "Read only", True),
      ],
    )
    |> element.to_string
  html |> string.contains("meridian-file-tree") |> should.be_true
  html |> string.contains(">Empty folder</span>") |> should.be_true
  html |> string.contains("aria-disabled=\"true\"") |> should.be_true
  html |> string.contains("aria-expanded=\"true\"") |> should.be_true
  html |> string.contains("app.gleam") |> should.be_true
}

pub fn file_trees_reject_duplicate_ids_across_files_and_folders_test() {
  file_tree.view(
    "Files",
    selection.Single,
    tree.Model([], []),
    fn(_) { Nil },
    [],
    [
      file_tree.Folder("same", "Folder", False, [
        file_tree.File("same", "File", False),
      ]),
    ],
  )
  |> element.to_string
  |> string.contains("Invalid tree options.")
  |> should.be_true
}
