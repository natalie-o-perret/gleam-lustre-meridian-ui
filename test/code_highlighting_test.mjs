import assert from "node:assert/strict";
import { test } from "node:test";
import { tokens } from "../build/dev/javascript/meridian_ui/meridian_ui/code_block_ffi.mjs";

test("Gleam highlighting preserves every character, including escapes, Unicode and unfinished strings", () => {
  for (const source of [
    "",
    "pub fn main() { Nil }\n",
    'let text = "quote: \\" // still a string"',
    '// comment\r\nlet café = "Éire 中文 👋"\n',
    "let bits = <<0xff, 0b10, 0o7, 1_000, 1.5e-2>>",
    'let unfinished = "hello\nworld',
    '\t@external(javascript, "./ffi.mjs", "main")\n',
  ]) {
    assert.equal([...tokens(source)].map(([, text]) => text).join(""), source);
  }
});

test("strings and comments take precedence over keywords and numeric tokens", () => {
  assert.deepEqual(
    [...tokens('"pub 42" // fn 12')],
    [
      ["string", '"pub 42"'],
      ["", " "],
      ["comment", "// fn 12"],
    ],
  );
  const highlighted = [...tokens("pub fn main() { Ok(42) }")];
  for (const expected of [
    ["keyword", "pub"],
    ["keyword", "fn"],
    ["function", "main"],
    ["type", "Ok"],
    ["number", "42"],
  ])
    assert.ok(
      highlighted.some(
        (token) => token[0] === expected[0] && token[1] === expected[1],
      ),
    );
});
