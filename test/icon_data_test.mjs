import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { loadIcons } from "../scripts/icon-data.mjs";

test("icon data preserves the original catalogue and adds 72 infrastructure glyphs", async () => {
  const icons = await loadIcons();
  assert.equal(icons.length, 200);
  const original = createHash("sha256")
    .update(JSON.stringify(icons.slice(0, 128)))
    .digest("hex");
  assert.equal(
    original,
    "99893a997dd8f673f18fba3867b014d6ce2d4057eea78baefd38a96d6ba0112d",
  );
  for (const category of [
    "cloud",
    "compute",
    "storage",
    "networking",
    "containers",
    "operations",
    "security",
    "development",
  ])
    assert.equal(
      icons.slice(128).filter((icon) => icon.category === category).length,
      9,
    );
  assert.equal(
    icons.find((icon) => icon.id === "S3").name,
    "S3 object storage",
  );
});
