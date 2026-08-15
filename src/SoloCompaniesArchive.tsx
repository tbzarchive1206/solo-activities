import { useEffect, useMemo, useState } from "react";

type RawNode = { id: string; name: string; mimeType: string; type: "file" | "folder"; size?: string | null; path: string[] };
export type RawArchive = { generatedAt: string; sourceFolderId: string; nodes: RawNode[] };
type MediaKind = "video" | "image" | "audio" | "other";
type Media = RawNode & { kind: MediaKind };
type Entry = { id: string; title: string; date: string; sourceType: "file" | "folder"; media: Media[] };
type MemberCollection = { id: string; name: string; entries: Entry[]; media: Media[] };

const memberOrder = ["SANGYEON", "JACOB", "YOUNGHOON", "HYUNJAE", "JUYEON", "KEVIN", "Q", "SUNWOO", "ERIC", "HAKNYEON", "NEW"];
const normalize = (value = "") => value.normalize("NFKD").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const cleanTitle = (value: string) => value.replace(/^\s*\d{6}\s*/u, "").replace(/\.(mp4|webm|mkv|mov|jpg|jpeg|png|webp)$/iu, "").trim();
const dateCode = (value: string) => value.match(/^\s*([12]\d{5})(?=\D|$)/u)?.[1] || "";
const formatDate = (value: string) => value ? `20${value.slice(0, 2)}.${value.slice(2, 4)}.${value.slice(4, 6)}` : "DATE UNKNOWN";
const displayMember = (value: string) => value === "HAKNYEON" ? "HAKNYEON (2017–2025)" : value === "NEW" ? "NEW (2017–2026)" : value;
const folderUrl = (id: string) => `https://drive.google.com/drive/folders/${encodeURIComponent(id)}`;
const fileUrl = (id: string) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;
const downloadUrl = (id: string) => `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
const thumbnailUrl = (id: string) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`;
const kindOf = (mime = ""): MediaKind => mime.startsWith("video/") ? "video" : mime.startsWith("image/") ? "image" : mime.startsWith("audio/") ? "audio" : "other";

function buildCollections(data: RawArchive): MemberCollection[] {
  return data.nodes.filter((node) => node.type === "folder" && node.path.length === 1).map((folder) => {
    const directSources = data.nodes.filter((node) => node.path.length === 2 && node.path[1] === folder.name);
    const entries = directSources.map((source) => {
      const rawMedia = source.type === "file" ? [source] : data.nodes.filter((node) => node.type === "file" && node.path[1] === folder.name && node.path[2] === source.name);
      return { id: source.id, title: cleanTitle(source.name), date: dateCode(source.name), sourceType: source.type, media: rawMedia.map((node) => ({ ...node, kind: kindOf(node.mimeType) })) } as Entry;
    }).sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title));
    return { id: folder.id, name: folder.name.trim().toUpperCase(), entries, media: entries.flatMap((entry) => entry.media) };
  }).sort((a, b) => {
    const ai = memberOrder.indexOf(a.name), bi = memberOrder.indexOf(b.name);
    return (ai === -1 ? memberOrder.length : ai) - (bi === -1 ? memberOrder.length : bi) || a.name.localeCompare(b.name);
  });
}

function representative(media: Media[]) { return media.find((item) => item.kind === "image") || media.find((item) => item.kind === "video") || null; }
function DriveThumbnail({ id, label }: { id?: string; label: string }) { const [failed, setFailed] = useState(!id); if (failed || !id) return <span className="generated-thumbnail" role="img" aria-label={`Generated preview: ${label}`}><span>{label}</span></span>; return <img src={thumbnailUrl(id)} alt="" loading="lazy" onError={() => setFailed(true)} />; }

function MediaTile({ media }: { media: Media }) {
  const visual = media.kind === "image" || media.kind === "video";
  return <figure className={`media-tile ${media.kind}-tile`}><a className="media-visual" href={fileUrl(media.id)} target="_blank" rel="noreferrer">{visual ? <DriveThumbnail id={media.id} label={media.name} /> : <DriveThumbnail label={media.name} />}{media.kind === "video" && <span className="play-mark">VIDEO / GOOGLE DRIVE ↗</span>}</a><div className="image-actions"><span className="file-name" title={media.name}>{media.name}</span><span className="file-action-links"><a href={fileUrl(media.id)} target="_blank" rel="noreferrer">VIEW ↗</a><a href={downloadUrl(media.id)} target="_blank" rel="noreferrer">DOWNLOAD ↓</a></span></div></figure>;
}

function CollectionCard({ collection, open }: { collection: MemberCollection; open: () => void }) {
  const cover = representative(collection.media);
  return <article className="card collection-card"><button className="thumb" onClick={open} aria-label={`Open ${collection.name}`}><DriveThumbnail id={cover?.id} label={collection.name} /><span className="number">MEMBER COLLECTION</span><span className="photo-count">{collection.media.length} FILES</span></button><div className="card-info"><span className="eyebrow">SOLO ACTIVITIES COMPANY MEDIA</span><h2>{displayMember(collection.name)}</h2><div className="meta"><span>POSTS</span><strong>{collection.entries.length}</strong><span>MEDIA</span><strong>{collection.media.length} FILES</strong></div><div className="card-actions"><button onClick={open}>OPEN COLLECTION →</button></div></div></article>;
}

function EntryCard({ entry, open }: { entry: Entry; open: () => void }) {
  const cover = representative(entry.media);
  return <article className="card brand-card"><button className="thumb" onClick={open} aria-label={`Open ${entry.title}`}><DriveThumbnail id={cover?.id} label={entry.title} /><span className="number">{formatDate(entry.date)}</span><span className="photo-count">{entry.media.length} FILES</span></button><div className="card-info"><span className="eyebrow">COMPANY CONTENT</span><h2>{entry.title}</h2><div className="meta"><span>DATE</span><strong>{formatDate(entry.date)}</strong><span>MEDIA</span><strong>{entry.media.length} FILES</strong></div><div className="card-actions"><button onClick={open}>OPEN CONTENT →</button></div></div></article>;
}

function parseRoute() { const [kind, memberId, entryId] = location.hash.replace(/^#\/?/u, "").split("/"); return { kind, memberId: memberId || "", entryId: entryId || "" }; }

export function SoloCompaniesArchive({ data }: { data: RawArchive }) {
  const collections = useMemo(() => buildCollections(data), [data]);
  const [route, setRoute] = useState(parseRoute);
  const [query, setQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [mediaFilter, setMediaFilter] = useState("all");
  useEffect(() => { const change = () => { setRoute(parseRoute()); window.scrollTo({ top: 0, behavior: "smooth" }); }; window.addEventListener("hashchange", change); return () => window.removeEventListener("hashchange", change); }, []);
  const selectedMember = collections.find((item) => item.id === route.memberId);
  const selectedEntry = selectedMember?.entries.find((item) => item.id === route.entryId);
  const tokens = normalize(query).split(" ").filter(Boolean);
  const filtered = collections.filter((collection) => {
    if (memberFilter !== "all" && collection.name !== memberFilter) return false;
    const haystack = normalize([collection.name, ...collection.entries.flatMap((entry) => [entry.date, entry.title, ...entry.media.map((item) => item.name)])].join(" "));
    return tokens.every((token) => haystack.includes(token));
  });
  const totalEntries = collections.reduce((sum, item) => sum + item.entries.length, 0);
  const totalMedia = collections.reduce((sum, item) => sum + item.media.length, 0);
  const goHome = () => { location.hash = "home"; setRoute(parseRoute()); };
  const openMember = (collection: MemberCollection) => { location.hash = `member/${collection.id}`; };
  const openEntry = (entry: Entry) => { if (selectedMember) location.hash = `entry/${selectedMember.id}/${entry.id}`; setMediaFilter("all"); };

  if (selectedEntry && selectedMember) {
    const media = selectedEntry.media.filter((item) => mediaFilter === "all" || item.kind === mediaFilter);
    return <main id="top"><Header members={collections.length} entries={totalEntries} media={totalMedia} updated={data.generatedAt} /><section className="event-page"><header className="member-gallery-head"><button onClick={() => openMember(selectedMember)}>← ALL CONTENT</button><div><span>{displayMember(selectedMember.name)} / COMPANY CONTENT</span><h2>{selectedEntry.title}</h2></div><a href={selectedEntry.sourceType === "folder" ? folderUrl(selectedEntry.id) : fileUrl(selectedEntry.id)} target="_blank" rel="noreferrer">OPEN SOURCE ↗</a></header><div className="member-filters"><label>MEDIA TYPE<select value={mediaFilter} onChange={(event) => setMediaFilter(event.target.value)}><option value="all">ALL MEDIA</option><option value="video">VIDEO</option><option value="image">PHOTOS</option><option value="audio">AUDIO</option><option value="other">OTHER FILES</option></select></label><div className="blank-filter" /><p>{media.length} RESULTS</p></div><div className="member-period"><p>MEDIA GALLERY</p><span>GOOGLE DRIVE SOURCE</span></div>{media.length ? <div className="media-grid">{media.map((item) => <MediaTile key={item.id} media={item} />)}</div> : <div className="empty"><strong>NO MEDIA</strong>THIS CONTENT FOLDER IS CURRENTLY EMPTY.</div>}</section><Footer sourceId={data.sourceFolderId} /></main>;
  }

  if (selectedMember) return <main id="top"><Header members={collections.length} entries={totalEntries} media={totalMedia} updated={data.generatedAt} /><section className="archive-section member-content"><div className="collection-heading"><button onClick={goHome}>← ALL MEMBERS</button><div><span>SOLO ACTIVITIES COMPANY MEDIA</span><h2>{displayMember(selectedMember.name)}</h2></div><a href={folderUrl(selectedMember.id)} target="_blank" rel="noreferrer">OPEN MEMBER FOLDER ↗</a></div><div className="results-head"><p>{selectedMember.entries.length} CONTENT POSTS · {selectedMember.media.length} FILES</p></div>{selectedMember.entries.length ? <div className="cards brand-cards">{selectedMember.entries.map((entry) => <EntryCard key={entry.id} entry={entry} open={() => openEntry(entry)} />)}</div> : <div className="empty"><strong>NO CONTENT YET</strong>THIS MEMBER FOLDER IS READY FOR FUTURE UPLOADS.</div>}</section><Footer sourceId={data.sourceFolderId} /></main>;

  return <main id="top"><Header members={collections.length} entries={totalEntries} media={totalMedia} updated={data.generatedAt} /><section className="controls"><div className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SEARCH MEMBER, TITLE, YYMMDD OR FILE NAME…" aria-label="Search archive" />{query && <button className="clear" onClick={() => setQuery("")}>CLEAR</button>}</div><div className="filter-row solo-filter-row"><label>MEMBER<select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}><option value="all">ALL MEMBERS</option>{collections.map((item) => <option key={item.id} value={item.name}>{displayMember(item.name)}</option>)}</select></label><label>SORT<select disabled><option>MEMBER ORDER</option></select></label></div></section><section className="archive-section"><div className="results-head"><p>{filtered.length} MEMBER COLLECTIONS</p><a href={folderUrl(data.sourceFolderId)} target="_blank" rel="noreferrer">OPEN SOURCE FOLDER ↗</a></div>{filtered.length ? <div className="cards collection-cards">{filtered.map((collection) => <CollectionCard key={collection.id} collection={collection} open={() => openMember(collection)} />)}</div> : <div className="empty"><strong>NO RESULTS</strong>TRY A MEMBER, TITLE, YYMMDD OR FILE NAME.</div>}</section><Footer sourceId={data.sourceFolderId} /></main>;
}

function Header({ members, entries, media, updated }: { members: number; entries: number; media: number; updated: string }) { return <header className="masthead solo-header"><div className="utility"><a className="brand" href="https://tbzarchive1206.github.io/tbzarchive/">THE BOYZ / FAN ARCHIVE</a><nav><span>MEDIA FROM SOLO ACTIVITIES COMPANIES</span><span>/</span><a href="https://x.com/tbzarchive1206_" target="_blank" rel="noreferrer">TWITTER ↗</a></nav></div><a href="#home"><h1><span className="solid">SOLO MEDIA</span><span className="outline">COMPANIES</span></h1></a><div className="stats"><p><strong>{members}</strong> MEMBERS</p><i /><p><strong>{entries}</strong> CONTENT POSTS</p><i /><p><strong>{media.toLocaleString("en-US")}</strong> MEDIA FILES</p><i /><p>UPDATED <strong>{new Date(updated).toLocaleDateString("en-GB")}</strong></p></div></header>; }
function Footer({ sourceId }: { sourceId: string }) { return <footer><span>© THE BOYZ FAN ARCHIVE</span><a href={folderUrl(sourceId)} target="_blank" rel="noreferrer">SOURCE FOLDER ↗</a><a href="#top">BACK TO TOP ↑</a></footer>; }
