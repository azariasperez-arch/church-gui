import { NextResponse } from "next/server";
import { deleteSong, listSongs, upsertSong } from "@/lib/songStore";
import type { SongUpsertInput } from "@church-screen/core";

export const runtime = "nodejs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET() {
  const songs = await listSongs();
  return NextResponse.json({ songs }, { headers: cors });
}

export async function POST(request: Request) {
  const body = (await request.json()) as SongUpsertInput;
  if (!body?.title?.trim() || !body?.lyricsText?.trim()) {
    return NextResponse.json(
      { error: "title and lyricsText are required" },
      { status: 400 }
    );
  }
  const song = await upsertSong(body);
  return NextResponse.json({ song }, { status: 201, headers: cors });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400, headers: cors });
  }
  const ok = await deleteSong(id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404, headers: cors });
}
