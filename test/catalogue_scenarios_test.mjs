import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogueScenarios } from "./site/viewport.mjs";

test("catalogue CI widths partition the full run and own shared checks once", () => {
  const all = catalogueScenarios();
  assert.deepEqual(
    all.map((scenario) => scenario.width),
    [1440, 320],
  );
  assert.deepEqual(catalogueScenarios(""), all);
  const jobs = [catalogueScenarios("1440"), catalogueScenarios("320")];
  assert.deepEqual(jobs.flat(), all);
  assert.equal(
    jobs.filter((scenarios) =>
      scenarios.some((scenario) => scenario.width === 320),
    ).length,
    1,
  );
});

test("unknown catalogue widths fail rather than silently skipping coverage", () => {
  for (const width of ["0", "390", "1440,320"])
    assert.throws(() => catalogueScenarios(width), /Unknown catalogue width/);
});
