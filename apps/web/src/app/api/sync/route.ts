import { NextResponse } from "next/server";
import { listSongs } from "@/lib/songStore";

export const runtime = "nodejs";

/** Lightweight sync endpoint for desktop clients. */
export async function GET() {
  const songs = await listSongs();
  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    count: songs.length,
    songs,
  });
}
