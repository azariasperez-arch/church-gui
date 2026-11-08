import Link from "next/link";
import { listSongs } from "@/lib/songStore";
import { LibraryClient } from "@/components/LibraryClient";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const songs = await listSongs();
  return (
    <>
      <div style={{ padding: "1rem 1rem 0", maxWidth: 1100, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#0f6b5c", fontWeight: 600 }}>
          ← Presenter
        </Link>
      </div>
      <LibraryClient initialSongs={songs} />
    </>
  );
}
