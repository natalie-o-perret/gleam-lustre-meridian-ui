import assert from "node:assert/strict";
import { test } from "node:test";
import {
  tokens,
  lineNumbers,
  lines,
  foldRanges,
} from "../build/dev/javascript/meridian_ui/meridian_ui/code_block_ffi.mjs";

test("line numbers include empty lines and preserve all native newline conventions", () => {
  assert.equal(lineNumbers(""), "1");
  assert.equal(lineNumbers("one\ntwo\n"), "1\n2\n3");
  assert.equal(lineNumbers("one\r\n\r\ntwo\rthree"), "1\n2\n3\n4");
});

test("folding finds function/type bodies without counting braces in strings or comments", () => {
  const source =
    'pub type Model {\n  Model(text: String)\n}\n\npub fn main(\n  value: String,\n) {\n  let text = "} // {"\n  // }\n  case value {\n    _ -> text\n  }\n}\n';
  assert.deepEqual(foldRanges(source), [
    [0, 2, "type Model"],
    [6, 12, "fn main"],
  ]);
  const rows = [...lines(source)];
  assert.equal(
    rows
      .map(([tokens]) => [...tokens].map(([, text]) => text).join(""))
      .join(""),
    source,
  );
  assert.deepEqual(
    rows.filter(([, , name]) => name).map(([, end, name]) => [end, name]),
    [
      [2, "type Model"],
      [12, "fn main"],
    ],
  );
  assert.deepEqual(
    foldRanges("pub type Alias = String\n\npub fn one() { Nil }"),
    [],
  );
  assert.deepEqual(foldRanges("pub fn unfinished() {\n  Nil\n"), []);
  const crlf = "pub fn main() {\r\n  Nil\r\n}\r\n";
  assert.equal(
    [...lines(crlf)]
      .map(([tokens]) => [...tokens].map(([, text]) => text).join(""))
      .join(""),
    crlf,
  );
});

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

test("JSON, TOML and HTML colouring preserves exact source without Gleam folding", () => {
  for (const [language, source, expected] of [
    [
      "json",
      '{\r\n  "key": "<script>é</script>", "value": -1.25e+2, "enabled": true\r\n}',
      [
        ["type", '"key"'],
        ["number", "-1.25e+2"],
        ["keyword", "true"],
      ],
    ],
    [
      "toml",
      '[dependencies]\nname = "Meridian # 1"\n# A comment\ncount = 3\n',
      [
        ["type", "[dependencies]"],
        ["string", '"Meridian # 1"'],
        ["comment", "# A comment"],
      ],
    ],
    [
      "html",
      '<!-- note -->\n<link rel="stylesheet" href="./theme.css" />',
      [
        ["comment", "<!-- note -->"],
        ["keyword", "<link"],
        ["annotation", "href"],
      ],
    ],
  ]) {
    const actual = [...tokens(source, language)];
    assert.equal(actual.map(([, text]) => text).join(""), source);
    for (const token of expected)
      assert.ok(
        actual.some((value) => value[0] === token[0] && value[1] === token[1]),
      );
    const rendered = [...lines(source, language)];
    assert.equal(
      rendered
        .map(([row]) => [...row].map(([, text]) => text).join(""))
        .join(""),
      source,
    );
    assert.ok(rendered.every(([, , fold]) => fold === ""));
  }
});
