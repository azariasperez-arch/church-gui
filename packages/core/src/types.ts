export type Locale = "es" | "en";

export interface BibleVerse {
  n: number;
  t: string;
}

export interface BibleBook {
  id: string;
  order: number;
  name: string;
  nameEn: string;
  aliases: string[];
  chapters: BibleVerse[][];
}

export interface BibleData {
  version: string;
  title: string;
  language: string;
  attribution: string;
  books: BibleBook[];
  stats: {
    books: number;
    chapters: number;
    verses: number;
  };
}

export interface BibleCitation {
  bookId: string;
  bookName: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

export interface BibleSearchHit {
  kind: "citation" | "keyword";
  citation: BibleCitation;
  preview: string;
  score: number;
}

export type SongSectionType =
  | "verse"
  | "chorus"
  | "bridge"
  | "prechorus"
  | "intro"
  | "outro"
  | "tag"
  | "other";

export interface SongSection {
  id: string;
  type: SongSectionType;
  label: string;
  lines: string[];
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  ccli?: string;
  language: Locale | "es" | "en" | string;
  sections: SongSection[];
  tags?: string[];
  updatedAt: string;
  createdAt: string;
  source?: "local" | "web";
}

export type ContentKind = "bible" | "song";

export interface Slide {
  id: string;
  kind: ContentKind;
  title: string;
  subtitle?: string;
  lines: string[];
  meta?: Record<string, string | number | boolean | undefined>;
}

export interface PresentationItem {
  id: string;
  kind: ContentKind;
  title: string;
  subtitle?: string;
  slides: Slide[];
}

export interface ServicePlaylistItem {
  id: string;
  label: string;
  item: PresentationItem;
}

export interface SongUpsertInput {
  id?: string;
  title: string;
  artist?: string;
  key?: string;
  ccli?: string;
  language?: string;
  lyricsText: string;
  tags?: string[];
}
