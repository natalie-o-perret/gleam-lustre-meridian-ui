import assert from "node:assert/strict";
import { test } from "node:test";
import {
  argumentNames,
  moduleAPI,
  typeName,
} from "../scripts/catalogue-api.mjs";

test("API argument names preserve labels and nested callback/tuple types", () => {
  assert.deepEqual(
    argumentNames(
      "pub fn view(label: String, on_change: fn(#(Int, Int), List(String)) -> msg, attrs: List(Attribute(msg)),) -> Element(msg) {",
      "view",
    ),
    ["label", "on_change", "attrs"],
  );
  assert.deepEqual(argumentNames("pub fn all() { [] }", "all"), []);
  assert.throws(() => argumentNames("", "missing"), /Missing public function/);
});

test("API types come from the compiler and content/events remain distinct", () => {
  const string = {
    kind: "named",
    module: "gleam",
    name: "String",
    parameters: [],
  };
  const element = {
    kind: "named",
    module: "lustre/vdom/vnode",
    name: "Element",
    parameters: [{ kind: "variable", id: 0 }],
  };
  const callback = { kind: "fn", parameters: [string], return: element };
  assert.equal(typeName(callback), "fn(String) -> Element(a0)");
  assert.equal(
    typeName({ kind: "tuple", elements: [string, string] }),
    "#(String, String)",
  );
  const api = moduleAPI(
    "pub fn view(on_change: fn(String) -> msg, render: fn(String) -> Element(msg)) {",
    {
      functions: {
        view: {
          parameters: [{ type: callback }, { type: callback }],
          return: element,
        },
      },
      types: {},
    },
  );
  assert.deepEqual(
    api.functions[0].arguments.map((arg) => arg.kind),
    ["event", "content"],
  );
});
