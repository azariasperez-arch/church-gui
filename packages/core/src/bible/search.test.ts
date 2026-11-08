import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseCitation } from "./citation.js";
import { searchBible } from "./search.js";
import { setBible } from "./load.js";
import { bibleToPresentation } from "../slides/split.js";
import { parseLyricsText } from "../songs/parse.js";
import type { BibleData } from "../types.js";

const dataPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../data/rvr1960.json"
);

function bible(): BibleData {
  const data = JSON.parse(readFileSync(dataPath, "utf8")) as BibleData;
  return setBible(data);
}

test("parse Juan 3:16 citation", () => {
  const c = parseCitation(bible(), "Juan 3:16");
  assert.ok(c);
  assert.equal(c!.bookId, "JHN");
  assert.equal(c!.chapter, 3);
  assert.equal(c!.verseStart, 16);
});

test("search keyword amor returns hits", () => {
  const hits = searchBible(bible(), "amor", { limit: 5 });
  assert.ok(hits.length > 0);
  assert.equal(hits[0].kind, "keyword");
});

test("bible slides split intelligently", () => {
  const c = parseCitation(bible(), "Salmos 23:1-6");
  assert.ok(c);
  const presentation = bibleToPresentation(bible(), c!);
  assert.ok(presentation.slides.length >= 2);
  assert.ok(presentation.slides[0].lines.length > 0);
});

test("lyrics parser understands [Coro]", () => {
  const sections = parseLyricsText(`[Verso 1]
Santo, santo, santo

[Coro]
Gloria a Dios
`);
  assert.ok(sections.length >= 2);
  assert.equal(
    sections.some((s) => s.type === "chorus"),
    true
  );
});
