import assert from "node:assert/strict";
import test from "node:test";
import { listFolder, readArchive } from "../scripts/sync-drive.mjs";
import { ROOT_FOLDER_ID } from "../scripts/archive-tools.mjs";
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

test("Drive pagination retries rate limits and deduplicates uploads", async () => {
  let calls = 0;
  const waits = [];
  const files = await listFolder("folder", { apiKey: "test", sleep: async (ms) => waits.push(ms), fetchImpl: async (url) => {
    calls++;
    if (calls === 1) return json({ error: { errors: [{ reason: "userRateLimitExceeded" }] } }, 403);
    if (calls === 2) return json({ files: [{ id: "a" }], nextPageToken: "next" });
    assert.equal(new URL(url).searchParams.get("pageToken"), "next");
    return json({ files: [{ id: "a" }, { id: "b" }] });
  } });
  assert.deepEqual(files.map((f) => f.id), ["a", "b"]);
  assert.equal(waits.length, 1);
});

test("permission failures and incomplete listings fail without replacing the index", async () => {
  for (const response of [json({ error: { errors: [{ reason: "forbidden" }] } }, 403), json({ files: [], incompleteSearch: true })]) {
    await assert.rejects(listFolder("folder", { apiKey: "test", fetchImpl: async () => response, sleep: async () => assert.fail("must not retry") }));
  }
});

test("transient HTTP and network failures recover, retries are bounded", async () => {
  for (const status of [429, 500, 503, "network"]) {
    let calls = 0;
    const options = { apiKey: "test", sleep: async () => {}, fetchImpl: async () => {
      calls++;
      if (calls === 1) { if (status === "network") throw new TypeError("network"); return json({}, status); }
      return json({ files: [] });
    } };
    assert.deepEqual(await listFolder("folder", options), []);
    assert.equal(calls, 2);
  }
  let calls = 0;
  await assert.rejects(listFolder("folder", { apiKey: "test", sleep: async () => {}, fetchImpl: async () => { calls++; return json({}, 503); } }));
  assert.equal(calls, 6);
});

test("new member folders and nested uploads are included recursively", async () => {
  const archive = await readArchive({ apiKey: "test", fetchImpl: async (url) => {
    const query = new URL(url).searchParams.get("q");
    return json({ files: query.includes(ROOT_FOLDER_ID) ? [{ id: "member", name: "JACOB", mimeType: "application/vnd.google-apps.folder" }] : [{ id: "photo", name: "261013.jpg", mimeType: "image/jpeg" }] });
  } });
  assert.equal(archive.nodes.length, 2);
  assert.equal(archive.nodes.find((n) => n.id === "photo").path[1], "JACOB");
});
