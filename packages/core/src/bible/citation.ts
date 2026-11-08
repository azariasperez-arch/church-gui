import type { BibleBook, BibleCitation, BibleData } from "../types.js";
import { normalizeText } from "./normalize.js";

const CITE_RE =
  /^(\d?\s*[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ.]+)\s+(\d{1,3})(?:\s*[:.,]\s*(\d{1,3}))?(?:\s*[-–—]\s*(\d{1,3}))?\s*$/u;

export function findBook(bible: BibleData, query: string): BibleBook | undefined {
  const q = normalizeText(query).replace(/\./g, "");
  if (!q) return undefined;

  const scored = bible.books
    .map((book) => {
      const names = [book.name, book.nameEn, book.id, ...book.aliases].map((n) =>
        normalizeText(n).replace(/\./g, "")
      );
      let score = 0;
      for (const name of names) {
        if (name === q) score = Math.max(score, 100 + name.length);
        else if (name.startsWith(q) && q.length >= 2) score = Math.max(score, 80 + q.length);
        else if (q.startsWith(name) && name.length >= 2) score = Math.max(score, 60 + name.length);
      }
      return { book, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.book;
}

export function parseCitation(bible: BibleData, input: string): BibleCitation | null {
  const raw = input.trim();
  const m = raw.match(CITE_RE);
  if (!m) return null;

  const book = findBook(bible, m[1]);
  if (!book) return null;

  const chapter = Number(m[2]);
  if (!Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters.length) {
    return null;
  }

  const chapterVerses = book.chapters[chapter - 1];
  const verseStart = m[3] ? Number(m[3]) : 1;
  const verseEnd = m[4] ? Number(m[4]) : m[3] ? verseStart : chapterVerses.length;

  if (
    !Number.isFinite(verseStart) ||
    !Number.isFinite(verseEnd) ||
    verseStart < 1 ||
    verseEnd < verseStart ||
    verseEnd > chapterVerses.length
  ) {
    return null;
  }

  return {
    bookId: book.id,
    bookName: book.name,
    chapter,
    verseStart,
    verseEnd,
  };
}

export function formatCitation(c: BibleCitation, locale: "es" | "en" = "es"): string {
  void locale;
  const range =
    c.verseStart === c.verseEnd ? `${c.verseStart}` : `${c.verseStart}-${c.verseEnd}`;
  return `${c.bookName} ${c.chapter}:${range}`;
}

export function getVerses(bible: BibleData, citation: BibleCitation) {
  const book = bible.books.find((b) => b.id === citation.bookId);
  if (!book) return [];
  const chapter = book.chapters[citation.chapter - 1];
  if (!chapter) return [];
  return chapter.slice(citation.verseStart - 1, citation.verseEnd);
}
