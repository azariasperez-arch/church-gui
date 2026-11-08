import type { Song } from "../types.js";
import { normalizeText, tokenize } from "../bible/normalize.js";

export function searchSongs(songs: Song[], query: string, limit = 40): Song[] {
  const q = query.trim();
  if (!q) return songs.slice(0, limit);

  const tokens = tokenize(q);
  const phrase = normalizeText(q);

  return songs
    .map((song) => {
      const hay = normalizeText(
        [
          song.title,
          song.artist ?? "",
          song.key ?? "",
          song.ccli ?? "",
          ...(song.tags ?? []),
          ...song.sections.flatMap((s) => [s.label, ...s.lines]),
        ].join(" ")
      );
      let score = 0;
      if (normalizeText(song.title).includes(phrase)) score += 50;
      if (phrase && hay.includes(phrase)) score += 20;
      for (const token of tokens) {
        if (hay.includes(token)) score += token.length >= 4 ? 4 : 2;
      }
      return { song, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.song.title.localeCompare(b.song.title))
    .slice(0, limit)
    .map((x) => x.song);
}
