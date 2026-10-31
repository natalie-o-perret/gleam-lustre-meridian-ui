import { toList } from "../gleam.mjs";

const keywords = new Set([
  "as",
  "assert",
  "case",
  "const",
  "echo",
  "fn",
  "if",
  "import",
  "let",
  "opaque",
  "panic",
  "pub",
  "todo",
  "type",
  "use",
]);
// shortcut: lexical Gleam colouring, use a grammar if semantic highlighting is needed.
const pattern =
  /\/\/[^\r\n]*|"(?:\\[\s\S]|[^"\\])*"?|@[\p{L}_][\p{L}\p{N}_]*|0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d[\d_]*)?|[\p{L}_][\p{L}\p{M}\p{N}_]*/gu;

export function lineNumbers(source) {
  return source
    .split(/\r\n|\r|\n/)
    .map((_, index) => index + 1)
    .join("\n");
}

export function tokens(source) {
  const result = [];
  let offset = 0;
  for (const match of source.matchAll(pattern)) {
    if (match.index > offset)
      result.push(["", source.slice(offset, match.index)]);
    const value = match[0];
    const end = match.index + value.length;
    let kind = "";
    if (value.startsWith("//")) kind = "comment";
    else if (value.startsWith('"')) kind = "string";
    else if (value.startsWith("@")) kind = "annotation";
    else if (/^\d/.test(value)) kind = "number";
    else if (keywords.has(value)) kind = "keyword";
    else if (/^\p{Lu}/u.test(value)) kind = "type";
    else if (/^\s*\(/.test(source.slice(end))) kind = "function";
    result.push([kind, value]);
    offset = end;
  }
  if (offset < source.length) result.push(["", source.slice(offset)]);
  return toList(result);
}
