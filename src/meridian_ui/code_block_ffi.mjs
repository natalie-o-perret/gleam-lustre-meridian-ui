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
// shortcut: lexical colouring, use a grammar if semantic highlighting is needed.
const pattern =
  /\/\/[^\r\n]*|"(?:\\[\s\S]|[^"\\])*"?|@[\p{L}_][\p{L}\p{N}_]*|0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d[\d_]*)?|[\p{L}_][\p{L}\p{M}\p{N}_]*/gu;
const patterns = {
  json: /"(?:\\[\s\S]|[^"\\])*"?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
  toml: /#[^\r\n]*|"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\[\s\S]|[^"\\])*"?|'[^'\r\n]*'?|\[[^\r\n]*\]|[\w.-]+(?=\s*=)|\b(?:true|false)\b|[+-]?\d[\d_.]*(?:[eE][+-]?\d+)?/g,
  html: /<!--[\s\S]*?(?:-->|$)|<\/?[\w:-]+|[\w:-]+(?=\s*=)|"[^"]*"?|'[^']*'?|\/?>/g,
};

export function lineNumbers(source) {
  return source
    .split(/\r\n|\r|\n/)
    .map((_, index) => index + 1)
    .join("\n");
}

export function tokens(source, language = "gleam") {
  const result = [];
  let offset = 0;
  for (const match of source.matchAll(patterns[language] ?? pattern)) {
    if (match.index > offset)
      result.push(["", source.slice(offset, match.index)]);
    const value = match[0];
    const end = match.index + value.length;
    let kind = "";
    if (
      (language === "gleam" && value.startsWith("//")) ||
      (language === "toml" && value.startsWith("#")) ||
      value.startsWith("<!--")
    )
      kind = "comment";
    else if (value.startsWith('"') || value.startsWith("'"))
      kind =
        language === "json" && /^\s*:/.test(source.slice(end))
          ? "type"
          : "string";
    else if (language === "html")
      kind =
        value.startsWith("<") || value.endsWith(">") ? "keyword" : "annotation";
    else if (
      language === "toml" &&
      (value.startsWith("[") || /^\s*=/.test(source.slice(end)))
    )
      kind = "type";
    else if (value.startsWith("@")) kind = "annotation";
    else if (/^[+-]?\d/.test(value)) kind = "number";
    else if (
      keywords.has(value) ||
      (language !== "gleam" && ["true", "false", "null"].includes(value))
    )
      kind = "keyword";
    else if (/^\p{Lu}/u.test(value)) kind = "type";
    else if (/^\s*\(/.test(source.slice(end))) kind = "function";
    result.push([kind, value]);
    offset = end;
  }
  if (offset < source.length) result.push(["", source.slice(offset)]);
  return toList(result);
}

export function foldRanges(source) {
  const masked = source.replace(
    /\/\/[^\r\n]*|"(?:\\[\s\S]|[^"\\])*"?/g,
    (text) => text.replace(/[^\r\n]/g, " "),
  );
  const declarations = [
    ...masked.matchAll(
      /^[\t ]*(?:pub\s+)?(?:opaque\s+)?(fn|type)\s+([\p{L}_][\p{L}\p{N}_]*)/gmu,
    ),
  ];
  const line = (offset) =>
    (source.slice(0, offset).match(/\r\n|\r|\n/g) ?? []).length;
  const ranges = [];
  for (const [index, match] of declarations.entries()) {
    const open = masked.indexOf("{", match.index + match[0].length);
    if (open < 0 || open >= (declarations[index + 1]?.index ?? masked.length))
      continue;
    let depth = 1;
    let close = open + 1;
    for (; close < masked.length && depth; close++) {
      if (masked[close] === "{") depth++;
      else if (masked[close] === "}") depth--;
    }
    const start = line(open);
    const end = line(close - 1);
    if (!depth && end > start + 1)
      ranges.push([start, end, `${match[1]} ${match[2]}`]);
  }
  return ranges;
}

export function lines(source, language = "gleam") {
  const rows = [[]];
  for (const [kind, value] of tokens(source, language))
    for (const part of value.split(/(\r\n|\r|\n)/)) {
      if (part) rows.at(-1).push([kind, part]);
      if (/^(?:\r\n|\r|\n)$/.test(part)) rows.push([]);
    }
  const folds = new Map(
    (language === "gleam" ? foldRanges(source) : []).map(
      ([start, end, name]) => [start, [end, name]],
    ),
  );
  return toList(
    rows.map((row, index) => [toList(row), ...(folds.get(index) ?? [0, ""])]),
  );
}
