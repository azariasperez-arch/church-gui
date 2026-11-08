"use client";

import { useMemo, useState } from "react";
import {
  lyricsTextFromSong,
  searchSongs,
  t,
  type Locale,
  type Song,
} from "@church-screen/core";

export function LibraryClient({ initialSongs }: { initialSongs: Song[] }) {
  const [locale, setLocale] = useState<Locale>("es");
  const [songs, setSongs] = useState(initialSongs);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSongs[0]?.id ?? null
  );
  const [title, setTitle] = useState(initialSongs[0]?.title ?? "");
  const [artist, setArtist] = useState(initialSongs[0]?.artist ?? "");
  const [key, setKey] = useState(initialSongs[0]?.key ?? "");
  const [lyricsText, setLyricsText] = useState(
    initialSongs[0] ? lyricsTextFromSong(initialSongs[0]) : ""
  );
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => searchSongs(songs, query, 200), [songs, query]);

  function loadSong(song: Song | null) {
    setSelectedId(song?.id ?? null);
    setTitle(song?.title ?? "");
    setArtist(song?.artist ?? "");
    setKey(song?.key ?? "");
    setLyricsText(song ? lyricsTextFromSong(song) : "");
  }

  async function saveSong() {
    setStatus("...");
    const res = await fetch("/api/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedId ?? undefined,
        title,
        artist,
        key,
        lyricsText,
        language: locale,
      }),
    });
    if (!res.ok) {
      setStatus(locale === "es" ? "Error al guardar" : "Save failed");
      return;
    }
    const data = (await res.json()) as { song: Song };
    const next = [...songs.filter((s) => s.id !== data.song.id), data.song].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setSongs(next);
    loadSong(data.song);
    setStatus(locale === "es" ? "Guardado" : "Saved");
  }

  async function removeSong() {
    if (!selectedId) return;
    const res = await fetch(`/api/songs?id=${encodeURIComponent(selectedId)}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    const next = songs.filter((s) => s.id !== selectedId);
    setSongs(next);
    loadSong(next[0] ?? null);
  }

  function newSong() {
    loadSong(null);
    setStatus("");
  }

  return (
    <div className="page">
      <header className="hero">
        <span className="badge">{t(locale, "sharedLibrary")}</span>
        <h1>{t(locale, "appName")}</h1>
        <p>{t(locale, "webManageHint")}</p>
      </header>

      <div className="toolbar">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(locale, "searchPlaceholderSongs")}
        />
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          aria-label={t(locale, "language")}
        >
          <option value="es">ES</option>
          <option value="en">EN</option>
        </select>
        <button type="button" onClick={newSong}>
          {t(locale, "uploadSong")}
        </button>
      </div>

      <div className="layout">
        <section className="panel">
          <h2>
            {t(locale, "songs")} ({filtered.length})
          </h2>
          <div className="song-list">
            {filtered.map((song) => (
              <button
                key={song.id}
                type="button"
                className={`song-row ${selectedId === song.id ? "active" : ""}`}
                onClick={() => loadSong(song)}
              >
                <strong>{song.title}</strong>
                <div className="meta">
                  {[song.artist, song.key, new Date(song.updatedAt).toLocaleDateString()]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </button>
            ))}
            {!filtered.length ? <p className="hint">{t(locale, "noResults")}</p> : null}
          </div>
        </section>

        <section className="panel">
          <h2>{selectedId ? t(locale, "editSong") : t(locale, "uploadSong")}</h2>
          <div className="form">
            <label>
              {t(locale, "title")}
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label>
              {t(locale, "artist")}
              <input value={artist} onChange={(e) => setArtist(e.target.value)} />
            </label>
            <label>
              {t(locale, "key")}
              <input value={key} onChange={(e) => setKey(e.target.value)} />
            </label>
            <label>
              {t(locale, "lyrics")}
              <textarea
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                placeholder={"[Verso 1]\n...\n\n[Coro]\n..."}
              />
            </label>
            <p className="hint">{t(locale, "lyricsHelp")}</p>
            <div className="actions">
              <button type="button" onClick={() => void saveSong()} disabled={!title.trim()}>
                {t(locale, "save")}
              </button>
              {selectedId ? (
                <button type="button" className="danger" onClick={() => void removeSong()}>
                  {t(locale, "remove")}
                </button>
              ) : null}
              {status ? <span className="hint">{status}</span> : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
