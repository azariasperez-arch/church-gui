import { promises as fs } from "node:fs";
import path from "node:path";
import {
  songFromUpsert,
  type Song,
  type SongUpsertInput,
} from "@church-screen/core";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "songs.json");

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    const seed: Song[] = [
      songFromUpsert({
        title: "Grande es Tu Fidelidad",
        artist: "Himno",
        language: "es",
        lyricsText: `[Verso 1]
Oh Dios, mi Padre
No hay sombra de duda
Tu compasión no cambia jamás

[Coro]
Grande es Tu fidelidad
Grande es Tu fidelidad
Día tras día te alabo, Señor
`,
      }),
    ].map((s) => ({ ...s, source: "web" as const }));
    await fs.writeFile(storePath, JSON.stringify({ songs: seed }, null, 2));
  }
}

export async function listSongs(): Promise<Song[]> {
  await ensureStore();
  const raw = await fs.readFile(storePath, "utf8");
  const data = JSON.parse(raw) as { songs: Song[] };
  return data.songs.sort((a, b) => a.title.localeCompare(b.title));
}

async function writeSongs(songs: Song[]) {
  await ensureStore();
  await fs.writeFile(storePath, JSON.stringify({ songs }, null, 2));
}

export async function upsertSong(input: SongUpsertInput): Promise<Song> {
  const songs = await listSongs();
  const existing = input.id ? songs.find((s) => s.id === input.id) : undefined;
  const song = {
    ...songFromUpsert(input, existing),
    source: "web" as const,
  };
  const next = [...songs.filter((s) => s.id !== song.id), song];
  await writeSongs(next);
  return song;
}

export async function deleteSong(id: string): Promise<boolean> {
  const songs = await listSongs();
  const next = songs.filter((s) => s.id !== id);
  if (next.length === songs.length) return false;
  await writeSongs(next);
  return true;
}
