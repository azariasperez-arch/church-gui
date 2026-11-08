import type { BibleData, BibleSearchHit } from "../types.js";
import { formatCitation, getVerses, parseCitation } from "./citation.js";
import { normalizeText, tokenize } from "./normalize.js";

export interface SearchOptions {
  limit?: number;
}

export function searchBible(
  bible: BibleData,
  query: string,
  options: SearchOptions = {}
): BibleSearchHit[] {
  const limit = options.limit ?? 40;
  const q = query.trim();
  if (!q) return [];

  const citation = parseCitation(bible, q);
  if (citation) {
    const verses = getVerses(bible, citation);
    const preview = verses
      .map((v) => `${v.n} ${v.t}`)
      .join(" ")
      .slice(0, 220);
    return [{ kind: "citation", citation, preview, score: 1000 }];
  }

  const tokens = tokenize(q);
  if (!tokens.length) return [];

  const hits: BibleSearchHit[] = [];

  for (const book of bible.books) {
    for (let ci = 0; ci < book.chapters.length; ci++) {
      const chapter = book.chapters[ci];
      for (const verse of chapter) {
        const hay = normalizeText(verse.t);
        let score = 0;
        let matched = 0;
        for (const token of tokens) {
          if (hay.includes(token)) {
            matched += 1;
            score += token.length >= 4 ? 4 : 2;
            if (hay.startsWith(token) || hay.includes(` ${token}`)) score += 1;
          }
        }
        if (matched === 0) continue;
        if (matched === tokens.length) score += 10;
        else score += matched;

        const phrase = normalizeText(q);
        if (phrase.length >= 6 && hay.includes(phrase)) score += 20;

        hits.push({
          kind: "keyword",
          citation: {
            bookId: book.id,
            bookName: book.name,
            chapter: ci + 1,
            verseStart: verse.n,
            verseEnd: verse.n,
          },
          preview: `${verse.n} ${verse.t}`,
          score,
        });
      }
    }
  }

  hits.sort(
    (a, b) =>
      b.score - a.score || a.citation.bookName.localeCompare(b.citation.bookName)
  );
  return hits.slice(0, limit).map((h) => ({
    ...h,
    preview: `${formatCitation(h.citation)} — ${h.preview}`,
  }));
}
