import type { BibleData } from "../types.js";

let cached: BibleData | null = null;

export function setBible(data: BibleData): BibleData {
  cached = data;
  return data;
}

export function getBible(): BibleData {
  if (!cached) {
    throw new Error(
      "Bible data not loaded. Call setBible(data) after importing rvr1960.json."
    );
  }
  return cached;
}

export function loadBibleFromObject(data: BibleData): BibleData {
  return setBible(data);
}
