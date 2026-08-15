import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("builds the self-contained Solo Activities Companies archive", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  const assets = await readdir(new URL("../dist/assets/", import.meta.url));
  const scriptName = assets.find((name) => name.endsWith(".js"));
  assert.ok(scriptName, "compiled JavaScript asset is missing");
  const script = await readFile(new URL(`../dist/assets/${scriptName}`, import.meta.url), "utf8");
  assert.match(html, /MEDIA FROM SOLO ACTIVITIES COMPANIES — THE BOYZ ARCHIVE/);
  assert.match(html, /\.\/assets\//);
  assert.match(script, /SEARCH MEMBER, TITLE, YYMMDD OR FILE NAME/);
  assert.match(script, /MEMBER COLLECTION/);
  assert.match(script, /COMPANY CONTENT/);
  assert.match(script, /Generated preview/);
  assert.match(script, /drive\.google\.com\/thumbnail/);
  assert.doesNotMatch(html, /iframe/iu);
});
