export const ROOT_FOLDER_ID = "1lWQaU97gsRrXtkemYpr_vv3KSGhOOyCU";
export const ROOT_TITLE = "MEDIA FROM SOLO ACTIVITIES COMPANIES";

export function topLevelFolders(raw) {
  return raw.nodes.filter((node) => node.type === "folder" && node.path.length === 1);
}

export function summarizeRaw(raw) {
  return {
    nodes: raw.nodes.length,
    folders: raw.nodes.filter((node) => node.type === "folder").length,
    files: raw.nodes.filter((node) => node.type === "file").length,
    topFolders: topLevelFolders(raw).length,
  };
}
