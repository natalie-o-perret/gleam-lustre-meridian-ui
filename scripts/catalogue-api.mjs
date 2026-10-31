import assert from "node:assert/strict";

export function typeName(type) {
  if (type.kind === "variable") return `a${type.id}`;
  if (type.kind === "tuple")
    return `#(${type.elements.map(typeName).join(", ")})`;
  if (type.kind === "fn")
    return `fn(${type.parameters.map(typeName).join(", ")}) -> ${typeName(type.return)}`;
  assert.equal(type.kind, "named", "Unknown compiled type");
  const name = type.module.startsWith("meridian_ui/")
    ? `${type.module.split("/").at(-1)}.${type.name}`
    : type.name;
  return (
    name +
    (type.parameters.length
      ? `(${type.parameters.map(typeName).join(", ")})`
      : "")
  );
}

export function argumentNames(source, name) {
  const prefix = `pub fn ${name}(`;
  const start = source.indexOf(prefix);
  assert.ok(start >= 0, `Missing public function: ${name}`);
  const names = [];
  let depth = 0;
  let argument = "";
  for (const char of source.slice(start + prefix.length)) {
    if ((char === "," || char === ")") && depth === 0) {
      if (argument.trim())
        names.push(argument.split(":")[0].trim().split(/\s+/).at(-1));
      argument = "";
      if (char === ")") return names;
    } else {
      if (char === "(") depth++;
      if (char === ")") depth--;
      argument += char;
    }
  }
  throw new Error(`Unclosed public function: ${name}`);
}

export function moduleAPI(source, module) {
  return {
    functions: Object.entries(module.functions).map(([name, fn]) => {
      const names = argumentNames(source, name);
      assert.equal(
        names.length,
        fn.parameters.length,
        `${name}: argument count`,
      );
      return {
        name,
        description: fn.documentation?.trim() || "",
        returns: typeName(fn.return),
        arguments: fn.parameters.map((param, index) => ({
          name: names[index],
          type: typeName(param.type),
          kind: names[index].startsWith("on_")
            ? "event"
            : typeName(param.type).includes("Element(")
              ? "content"
              : "property",
        })),
      };
    }),
    types: Object.entries(module.types).map(([name, type]) => ({
      name,
      description: type.documentation?.trim() || "",
      constructors: type.constructors.map((constructor) => ({
        name: constructor.name,
        fields: constructor.parameters.map((param, index) => ({
          name: param.label || `argument ${index + 1}`,
          type: typeName(param.type),
        })),
      })),
    })),
  };
}
