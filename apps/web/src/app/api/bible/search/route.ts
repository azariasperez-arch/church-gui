import { NextResponse } from "next/server";
import bibleJson from "@church-screen/core/bible/rvr1960.json";
import {
  searchBible,
  setBible,
  type BibleData,
} from "@church-screen/core";

export const runtime = "nodejs";

setBible(bibleJson as BibleData);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit") || 40), 80);
  if (!q) {
    return NextResponse.json({ hits: [] }, { headers: cors });
  }
  const hits = searchBible(bibleJson as BibleData, q, { limit });
  return NextResponse.json({ hits }, { headers: cors });
}
