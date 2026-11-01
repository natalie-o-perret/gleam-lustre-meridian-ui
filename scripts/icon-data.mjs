import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, sep } from "node:path";

export async function loadIcons(directory = "priv/icons") {
  const rows = [];
  for (const file of (await readdir(directory, { recursive: true })).sort()) {
    if (!file.endsWith(".json")) continue;
    const category = file.split(sep)[0];
    assert.match(category, /^[a-z][a-z-]+$/);
    const entries = JSON.parse(await readFile(join(directory, file), "utf8"));
    assert.ok(Array.isArray(entries) && entries.length, file);
    for (const row of entries) {
      assert.ok(Array.isArray(row) && row.length === 4, file);
      const [order, id, name, path] = row;
      assert.ok(Number.isInteger(order) && order >= 0, file);
      assert.match(id, /^[A-Z][A-Za-z0-9]*$/);
      assert.ok(typeof name === "string" && name.trim(), file);
      assert.match(path, /^[Mm][MmLlHhVvCcSsQqTtAaZz0-9eE.,+\s-]+$/);
      rows.push({ order, id, name, path, category });
    }
  }
  rows.sort((a, b) => a.order - b.order);
  assert.ok(rows.length);
  for (const field of ["id", "name"])
    assert.equal(
      new Set(rows.map((row) => row[field])).size,
      rows.length,
      `Duplicate icon ${field}`,
    );
  assert.ok(
    rows.every((row, index) => row.order === index),
    "Icon order must be unique and contiguous",
  );
  return rows;
}
