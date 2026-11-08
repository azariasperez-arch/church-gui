import type { Song, SongSection, SongSectionType, SongUpsertInput } from "../types.js";

const SECTION_HEADERS: Record<string, SongSectionType> = {
  verse: "verse",
  verso: "verse",
  v: "verse",
  chorus: "chorus",
  coro: "chorus",
  estribillo: "chorus",
  bridge: "bridge",
  puente: "bridge",
  prechorus: "prechorus",
  "pre-chorus": "prechorus",
  precoro: "prechorus",
  intro: "intro",
  outro: "outro",
  tag: "tag",
  final: "outro",
};

const HEADER_RE = /^\[(.+)\]$/;
const LABEL_RE =
  /^(verse|verso|chorus|coro|estribillo|bridge|puente|pre-?chorus|precoro|intro|outro|tag|final)\s*(\d+)?$/i;

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseHeader(raw: string): { type: SongSectionType; label: string } {
  const inner = raw.trim();
  const m = inner.match(LABEL_RE);
  if (!m) return { type: "other", label: inner };
  const key = m[1].toLowerCase();
  const type = SECTION_HEADERS[key] ?? SECTION_HEADERS[key.replace("-", "")] ?? "other";
  const num = m[2] ? ` ${m[2]}` : "";
  const pretty =
    type === "verse"
      ? `Verso${num}`
      : type === "chorus"
        ? "Coro"
        : type === "bridge"
          ? "Puente"
          : type === "prechorus"
            ? "Pre-coro"
            : inner;
  return { type, label: pretty };
}

export function parseLyricsText(lyricsText: string): SongSection[] {
  const lines = lyricsText.replace(/\r\n/g, "\n").split("\n");
  const sections: SongSection[] = [];
  let current: SongSection | null = null;
  let buffer: string[] = [];
  let autoVerse = 1;

  const pushBufferAsSection = (forced?: { type: SongSectionType; label: string }) => {
    const content = buffer.map((l) => l.trimEnd());
    while (content.length && content[0].trim() === "") content.shift();
    while (content.length && content[content.length - 1].trim() === "") content.pop();
    buffer = [];
    if (!content.length && !forced) return;

    const chunks: string[][] = [[]];
    for (const line of content) {
      if (line.trim() === "") chunks.push([]);
      else chunks[chunks.length - 1].push(line);
    }
    const nonEmpty = chunks.filter((c) => c.length);
    let header = forced;

    for (const chunk of nonEmpty) {
      if (header) {
        sections.push({
          id: uid("sec"),
          type: header.type,
          label: header.label,
          lines: chunk,
        });
        header = { type: header.type, label: header.label };
      } else if (current) {
        sections.push({
          id: uid("sec"),
          type: current.type,
          label: current.label,
          lines: chunk,
        });
      } else {
        sections.push({
          id: uid("sec"),
          type: "verse",
          label: `Verso ${autoVerse++}`,
          lines: chunk,
        });
      }
    }
  };

  for (const line of lines) {
    const headerMatch = line.trim().match(HEADER_RE);
    if (headerMatch) {
      pushBufferAsSection(current ? { type: current.type, label: current.label } : undefined);
      const parsed = parseHeader(headerMatch[1]);
      current = {
        id: uid("sec"),
        type: parsed.type,
        label: parsed.label,
        lines: [],
      };
      continue;
    }
    buffer.push(line);
  }

  if (current) {
    const tmp = current;
    current = null;
    pushBufferAsSection({ type: tmp.type, label: tmp.label });
  } else {
    pushBufferAsSection();
  }

  return sections.length
    ? sections
    : [
        {
          id: uid("sec"),
          type: "verse",
          label: "Verso 1",
          lines: lyricsText.split("\n").filter((l) => l.trim()),
        },
      ];
}

export function songFromUpsert(input: SongUpsertInput, existing?: Song): Song {
  const now = new Date().toISOString();
  return {
    id: input.id || existing?.id || uid("song"),
    title: input.title.trim(),
    artist: input.artist?.trim() || undefined,
    key: input.key?.trim() || undefined,
    ccli: input.ccli?.trim() || undefined,
    language: input.language || existing?.language || "es",
    sections: parseLyricsText(input.lyricsText),
    tags: input.tags || existing?.tags || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    source: existing?.source || "local",
  };
}

export function lyricsTextFromSong(song: Song): string {
  return song.sections
    .map((s) => `[${s.label}]\n${s.lines.join("\n")}`)
    .join("\n\n");
}
