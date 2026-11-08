import { NextResponse } from "next/server";
import bibleJson from "@church-screen/core/bible/rvr1960.json";
import {
  bibleToPresentation,
  parseCitation,
  setBible,
  type BibleCitation,
  type BibleData,
} from "@church-screen/core";

export const runtime = "nodejs";

setBible(bibleJson as BibleData);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const citation = parseCitation(bibleJson as BibleData, q);
  if (!citation) {
    return NextResponse.json({ error: "invalid citation" }, { status: 400, headers: cors });
  }
  const presentation = bibleToPresentation(bibleJson as BibleData, citation);
  return NextResponse.json({ citation, presentation }, { headers: cors });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { citation?: BibleCitation };
  if (!body.citation) {
    return NextResponse.json({ error: "citation required" }, { status: 400, headers: cors });
  }
  const presentation = bibleToPresentation(bibleJson as BibleData, body.citation);
  return NextResponse.json({ presentation }, { headers: cors });
}
