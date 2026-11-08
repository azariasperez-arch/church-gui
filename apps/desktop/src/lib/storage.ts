import type { Song } from "@church-screen/core";

const SONGS_KEY = "church-screen.songs.v1";
const WEB_URL_KEY = "church-screen.webUrl";

export function loadLocalSongs(): Song[] {
  try {
    const raw = localStorage.getItem(SONGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Song[];
  } catch {
    return [];
  }
}

export function saveLocalSongs(songs: Song[]) {
  localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
}

export function getWebBaseUrl(): string {
  return (
    localStorage.getItem(WEB_URL_KEY) ||
    import.meta.env.VITE_WEB_URL ||
    "http://localhost:3177"
  );
}

export function setWebBaseUrl(url: string) {
  localStorage.setItem(WEB_URL_KEY, url.replace(/\/$/, ""));
}

export async function syncSongsFromWeb(baseUrl = getWebBaseUrl()): Promise<Song[]> {
  const res = await fetch(`${baseUrl}/api/songs`);
  if (!res.ok) throw new Error(`Sync failed (${res.status})`);
  const data = (await res.json()) as { songs: Song[] };
  const remote = data.songs.map((s) => ({ ...s, source: "web" as const }));
  const local = loadLocalSongs();
  const byId = new Map<string, Song>();
  for (const s of local) byId.set(s.id, s);
  for (const s of remote) {
    const prev = byId.get(s.id);
    if (!prev || new Date(s.updatedAt) >= new Date(prev.updatedAt)) {
      byId.set(s.id, s);
    }
  }
  const merged = [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));
  saveLocalSongs(merged);
  return merged;
}
