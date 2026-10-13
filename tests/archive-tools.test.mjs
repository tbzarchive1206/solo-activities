import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { ROOT_FOLDER_ID, ROOT_TITLE, summarizeRaw, topLevelFolders } from "../scripts/archive-tools.mjs";

const raw = JSON.parse(await fs.readFile(new URL("../app/data/archive.generated.json", import.meta.url), "utf8"));

test("snapshot contains an internally consistent Drive tree", () => {
  assert.equal(raw.sourceFolderId, ROOT_FOLDER_ID);
  assert.ok(Number.isFinite(Date.parse(raw.generatedAt)));
  const summary = summarizeRaw(raw);
  assert.equal(summary.nodes, summary.folders + summary.files);
  assert.equal(new Set(raw.nodes.map((node) => node.id)).size, summary.nodes);
  assert.ok(raw.nodes.every((node) => Array.isArray(node.path) && node.path[0] === ROOT_TITLE));
  assert.ok(raw.nodes.every((node) => typeof node.name === "string" && typeof node.mimeType === "string" && ["folder", "file"].includes(node.type)));
});

test("member folders support new members and populated or empty collections", () => {
  const member = { id: "new-member", name: "JACOB", type: "folder", path: [ROOT_TITLE] };
  const file = { id: "new-file", name: "261013 photo.jpg", type: "file", path: [ROOT_TITLE, "JACOB"] };
  assert.deepEqual(topLevelFolders({ nodes: [member] }), [member]);
  assert.deepEqual(topLevelFolders({ nodes: [member, file] }), [member]);
  assert.equal(summarizeRaw({ nodes: [member, file] }).files, 1);
});
