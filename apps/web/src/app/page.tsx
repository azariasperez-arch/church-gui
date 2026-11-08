import { listSongs } from "@/lib/songStore";
import { PresenterClient } from "@/components/PresenterClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const songs = await listSongs();
  return <PresenterClient initialSongs={songs} />;
}
