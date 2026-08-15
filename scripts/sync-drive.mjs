import fs from "node:fs/promises";
import { ROOT_FOLDER_ID, ROOT_TITLE, summarizeRaw } from "./archive-tools.mjs";

const apiKey = process.env.GOOGLE_DRIVE_API_KEY?.trim();
if (!apiKey) throw new Error("Missing GOOGLE_DRIVE_API_KEY.");
const output = new URL("../app/data/archive.generated.json", import.meta.url);

async function listFolder(folderId) {
  const files = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime)",
      pageSize: "1000", orderBy: "name", supportsAllDrives: "true", includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { "X-Goog-Api-Key": apiKey, "User-Agent": "Solo-Activities-Companies-GitHub-Pages" } });
    if (!response.ok) throw new Error(`Drive API ${response.status}: ${await response.text()}`);
    const data = await response.json();
    files.push(...(data.files || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return files;
}

let frontier = [{ id: ROOT_FOLDER_ID, title: ROOT_TITLE, path: [] }];
const nodes = [];
while (frontier.length) {
  const next = [];
  for (let index = 0; index < frontier.length; index += 8) {
    const batch = frontier.slice(index, index + 8);
    const results = await Promise.all(batch.map(async (folder) => ({ folder, files: await listFolder(folder.id) })));
    for (const { folder, files } of results) for (const file of files) {
      const isFolder = file.mimeType === "application/vnd.google-apps.folder";
      const node = { id: file.id, name: file.name, mimeType: file.mimeType, type: isFolder ? "folder" : "file", size: file.size || null, createdTime: file.createdTime || null, modifiedTime: file.modifiedTime || null, path: [...folder.path, folder.title] };
      nodes.push(node);
      if (isFolder) next.push({ id: file.id, title: file.name, path: node.path });
    }
  }
  frontier = next;
}

const archive = { generatedAt: new Date().toISOString(), sourceFolderId: ROOT_FOLDER_ID, nodes };
await fs.mkdir(new URL("../app/data/", import.meta.url), { recursive: true });
await fs.writeFile(output, `${JSON.stringify(archive)}\n`, "utf8");
console.log(JSON.stringify(summarizeRaw(archive)));
