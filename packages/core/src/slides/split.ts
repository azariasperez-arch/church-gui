import type {
  BibleCitation,
  BibleData,
  PresentationItem,
  Slide,
  Song,
  SongSection,
} from "../types.js";
import { formatCitation, getVerses } from "../bible/citation.js";

export interface SlideSplitOptions {
  maxChars?: number;
  maxLines?: number;
  maxVersesPerSlide?: number;
}

const DEFAULTS: Required<SlideSplitOptions> = {
  maxChars: 280,
  maxLines: 6,
  maxVersesPerSlide: 3,
};

function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function packLines(lines: string[], opts: Required<SlideSplitOptions>): string[][] {
  const slides: string[][] = [];
  let current: string[] = [];
  let chars = 0;

  const flush = () => {
    if (current.length) {
      slides.push(current);
      current = [];
      chars = 0;
    }
  };

  for (const line of lines) {
    const trimmed = line.trimEnd();
    const nextChars = chars + trimmed.length + 1;
    if (
      current.length > 0 &&
      (current.length >= opts.maxLines || nextChars > opts.maxChars)
    ) {
      flush();
    }
    if (trimmed.length > opts.maxChars) {
      flush();
      const words = trimmed.split(/\s+/);
      let chunk = "";
      for (const word of words) {
        const candidate = chunk ? `${chunk} ${word}` : word;
        if (candidate.length > opts.maxChars && chunk) {
          slides.push([chunk]);
          chunk = word;
        } else {
          chunk = candidate;
        }
      }
      if (chunk) current.push(chunk);
      chars = current.reduce((n, l) => n + l.length, 0);
      continue;
    }
    current.push(trimmed);
    chars += trimmed.length + 1;
  }
  flush();
  return slides.length ? slides : [[""]];
}

export function bibleToPresentation(
  bible: BibleData,
  citation: BibleCitation,
  options: SlideSplitOptions = {}
): PresentationItem {
  const opts = { ...DEFAULTS, ...options };
  const verses = getVerses(bible, citation);
  const title = formatCitation(citation);
  const slides: Slide[] = [];

  let bucket: string[] = [];
  let verseCount = 0;
  let chars = 0;
  let rangeStart = citation.verseStart;
  let rangeEnd = citation.verseStart;

  const flush = () => {
    if (!bucket.length) return;
    const range =
      rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`;
    slides.push({
      id: id("bslide"),
      kind: "bible",
      title: `${citation.bookName} ${citation.chapter}:${range}`,
      subtitle: "RVR1960",
      lines: bucket,
      meta: {
        bookId: citation.bookId,
        chapter: citation.chapter,
        verseStart: rangeStart,
        verseEnd: rangeEnd,
      },
    });
    bucket = [];
    verseCount = 0;
    chars = 0;
  };

  for (const verse of verses) {
    const line = `${verse.n}  ${verse.t}`;
    const wouldExceed =
      bucket.length > 0 &&
      (verseCount >= opts.maxVersesPerSlide ||
        chars + line.length > opts.maxChars ||
        bucket.length >= opts.maxLines);

    if (wouldExceed) flush();
    if (!bucket.length) rangeStart = verse.n;
    rangeEnd = verse.n;
    bucket.push(line);
    verseCount += 1;
    chars += line.length;
  }
  flush();

  return {
    id: id("bible"),
    kind: "bible",
    title,
    subtitle: "Reina-Valera 1960",
    slides,
  };
}

function sectionLabel(section: SongSection): string {
  return section.label || section.type;
}

export function songToPresentation(
  song: Song,
  options: SlideSplitOptions = {}
): PresentationItem {
  const opts = { ...DEFAULTS, ...options };
  const slides: Slide[] = [];

  for (const section of song.sections) {
    const packed = packLines(
      section.lines.filter((l) => l.trim().length > 0),
      opts
    );
    packed.forEach((lines, idx) => {
      slides.push({
        id: id("sslide"),
        kind: "song",
        title: song.title,
        subtitle:
          packed.length > 1
            ? `${sectionLabel(section)} (${idx + 1}/${packed.length})`
            : sectionLabel(section),
        lines,
        meta: {
          sectionId: section.id,
          sectionType: section.type,
          artist: song.artist,
          key: song.key,
        },
      });
    });
  }

  if (!slides.length) {
    slides.push({
      id: id("sslide"),
      kind: "song",
      title: song.title,
      subtitle: song.artist,
      lines: [""],
    });
  }

  return {
    id: id("song"),
    kind: "song",
    title: song.title,
    subtitle: song.artist,
    slides,
  };
}
