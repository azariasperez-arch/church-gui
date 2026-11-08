import { listSongs } from "@/lib/songStore";
import { LibraryClient } from "@/components/LibraryClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const songs = await listSongs();
  return <LibraryClient initialSongs={songs} />;
}
