import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { ROOT_FOLDER_ID, ROOT_TITLE, summarizeRaw } from "./archive-tools.mjs";

export async function listFolder(folderId, { apiKey, fetchImpl = fetch, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
  const files = new Map();
  let pageToken = "";
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken,incompleteSearch,files(id,name,mimeType,size,createdTime,modifiedTime)",
      pageSize: "1000", orderBy: "name", supportsAllDrives: "true", includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    let data;
    for (let attempt = 0; attempt < 6; attempt++) {
      let response;
      try {
        response = await fetchImpl(`https://www.googleapis.com/drive/v3/files?${params}`, {
          headers: { "X-Goog-Api-Key": apiKey }, signal: AbortSignal.timeout(30000),
        });
      } catch (error) {
        if (attempt === 5) throw error;
      }
      if (response) {
        const body = await response.text();
        let parsed;
        try { parsed = JSON.parse(body); } catch { /* HTTP errors can return non-JSON bodies. */ }
        if (response.ok) {
          if (!parsed || !Array.isArray(parsed.files) || parsed.incompleteSearch) throw new Error(`Incomplete Drive listing for folder ${folderId}`);
          data = parsed;
          break;
        }
        const reasons = parsed?.error?.errors?.map((error) => error.reason) || [];
        const retryable = response.status === 429 || response.status >= 500 ||
          (response.status === 403 && reasons.some((reason) => ["rateLimitExceeded", "userRateLimitExceeded"].includes(reason)));
        if (!retryable || attempt === 5) throw new Error(`Drive API ${response.status} for folder ${folderId}: ${body}`);
      }
      await sleep(Math.min(32000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 1000));
    }
    for (const file of data.files) files.set(file.id, file);
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return [...files.values()];
}

export async function readArchive(options) {
  let frontier = [{ id: ROOT_FOLDER_ID, title: ROOT_TITLE, path: [] }];
  const nodes = [];
  const seen = new Set([ROOT_FOLDER_ID]);
  while (frontier.length) {
    const next = [];
    for (let index = 0; index < frontier.length; index += 4) {
      const batch = frontier.slice(index, index + 4);
      const results = await Promise.all(batch.map(async (folder) => ({ folder, files: await listFolder(folder.id, options) })));
      for (const { folder, files } of results) for (const file of files) {
        if (seen.has(file.id)) continue;
        seen.add(file.id);
        const isFolder = file.mimeType === "application/vnd.google-apps.folder";
        const node = { id: file.id, name: file.name, mimeType: file.mimeType, type: isFolder ? "folder" : "file", size: file.size || null, createdTime: file.createdTime || null, modifiedTime: file.modifiedTime || null, path: [...folder.path, folder.title] };
        nodes.push(node);
        if (isFolder) next.push({ id: file.id, title: file.name, path: node.path });
      }
    }
    frontier = next;
  }
  nodes.sort((a, b) => a.id.localeCompare(b.id, "en"));
  return { generatedAt: new Date().toISOString(), sourceFolderId: ROOT_FOLDER_ID, nodes };
}

async function main() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing GOOGLE_DRIVE_API_KEY.");
  const output = new URL("../app/data/archive.generated.json", import.meta.url);
  const archive = await readArchive({ apiKey });
  let previous;
  try { previous = JSON.parse(await fs.readFile(output, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const canonical = (nodes) => [...nodes].sort((a, b) => a.id.localeCompare(b.id, "en"));
  if (previous?.sourceFolderId === archive.sourceFolderId && JSON.stringify(canonical(previous.nodes)) === JSON.stringify(archive.nodes)) {
    console.log("Drive content unchanged.");
    return;
  }
  await fs.mkdir(new URL("../app/data/", import.meta.url), { recursive: true });
  const temporary = new URL("../app/data/archive.generated.json.tmp", import.meta.url);
  await fs.writeFile(temporary, `${JSON.stringify(archive)}\n`, "utf8");
  await fs.rename(temporary, output);
  console.log(JSON.stringify(summarizeRaw(archive)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
