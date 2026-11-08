import { NextResponse } from "next/server";
import { listSongs } from "@/lib/songStore";

export const runtime = "nodejs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

/** Lightweight sync endpoint for desktop clients. */
export async function GET() {
  const songs = await listSongs();
  return NextResponse.json(
    {
      syncedAt: new Date().toISOString(),
      count: songs.length,
      songs,
    },
    { headers: cors }
  );
}
