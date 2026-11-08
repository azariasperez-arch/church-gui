"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  songToPresentation,
  searchSongs,
  t,
  type BibleSearchHit,
  type Locale,
  type PresentationItem,
  type ServicePlaylistItem,
  type Song,
} from "@church-screen/core";
import "../app/presenter.css";

type LibraryTab = "bible" | "songs";

export function PresenterClient({ initialSongs }: { initialSongs: Song[] }) {
  const [locale, setLocale] = useState<Locale>("es");
  const [tab, setTab] = useState<LibraryTab>("bible");
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [selectedHit, setSelectedHit] = useState<BibleSearchHit | null>(null);
  const [bibleHits, setBibleHits] = useState<BibleSearchHit[]>([]);
  const [bibleLoading, setBibleLoading] = useState(false);
  const [service, setService] = useState<ServicePlaylistItem[]>([]);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<PresentationItem | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [presenting, setPresenting] = useState(false);

  useEffect(() => {
    void fetch("/api/songs")
      .then((r) => r.json())
      .then((data: { songs: Song[] }) => {
        if (data.songs?.length) setSongs(data.songs);
      })
      .catch(() => undefined);
  }, []);

  // Debounced Bible search via API (keeps client bundle small)
  useEffect(() => {
    if (tab !== "bible") return;
    const q = query.trim();
    if (!q) {
      setBibleHits([]);
      return;
    }
    const handle = window.setTimeout(() => {
      setBibleLoading(true);
      void fetch(`/api/bible/search?q=${encodeURIComponent(q)}&limit=50`)
        .then((r) => r.json())
        .then((data: { hits: BibleSearchHit[] }) => setBibleHits(data.hits || []))
        .catch(() => setBibleHits([]))
        .finally(() => setBibleLoading(false));
    }, 220);
    return () => window.clearTimeout(handle);
  }, [tab, query]);

  const songHits = useMemo(() => {
    if (tab !== "songs") return [];
    return searchSongs(songs, query, 50);
  }, [tab, query, songs]);

  // Resolve active presentation
  useEffect(() => {
    const fromService = service.find((s) => s.id === activeServiceId)?.item;
    if (fromService) {
      setActiveItem(fromService);
      return;
    }
    if (tab === "songs" && selectedSongId) {
      const song = songs.find((s) => s.id === selectedSongId);
      setActiveItem(song ? songToPresentation(song) : null);
      return;
    }
    if (tab === "bible" && selectedHit) {
      void fetch("/api/bible/passage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citation: selectedHit.citation }),
      })
        .then((r) => r.json())
        .then((data: { presentation?: PresentationItem }) => {
          setActiveItem(data.presentation ?? null);
        })
        .catch(() => setActiveItem(null));
      return;
    }
    setActiveItem(null);
  }, [service, activeServiceId, tab, selectedHit, selectedSongId, songs]);

  const currentSlide = activeItem?.slides[slideIndex] ?? null;

  useEffect(() => {
    setSlideIndex(0);
  }, [activeItem?.id]);

  function goNext() {
    if (!activeItem) return;
    if (slideIndex < activeItem.slides.length - 1) {
      setSlideIndex((i) => i + 1);
      return;
    }
    const idx = service.findIndex((s) => s.id === activeServiceId);
    if (idx >= 0 && idx < service.length - 1) {
      setActiveServiceId(service[idx + 1].id);
      setSlideIndex(0);
    }
  }

  function goPrev() {
    if (!activeItem) return;
    if (slideIndex > 0) {
      setSlideIndex((i) => i - 1);
      return;
    }
    const idx = service.findIndex((s) => s.id === activeServiceId);
    if (idx > 0) {
      const prev = service[idx - 1];
      setActiveServiceId(prev.id);
      setSlideIndex(Math.max(0, prev.item.slides.length - 1));
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space" || e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape" && presenting) {
        setPresenting(false);
        if (document.fullscreenElement) void document.exitFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function startPresent() {
    if (!activeItem) return;
    setPresenting(true);
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // overlay still works without fullscreen permission
    }
  }

  async function stopPresent() {
    setPresenting(false);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
  }

  function addSelectedToService() {
    if (!activeItem) return;
    const entry: ServicePlaylistItem = {
      id: `svc_${Math.random().toString(36).slice(2, 9)}`,
      label: activeItem.title,
      item: activeItem,
    };
    setService((prev) => [...prev, entry]);
    setActiveServiceId(entry.id);
  }

  return (
    <div className="presenter-shell">
      <header className="p-topbar">
        <div className="p-brand">
          <strong>{t(locale, "appName")}</strong>
          <span>{t(locale, "tagline")} — Web</span>
        </div>
        <div className="p-actions">
          <Link className="p-link" href="/library">
            {t(locale, "sharedLibrary")}
          </Link>
          <select
            className="p-search"
            style={{ width: "auto" }}
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            aria-label={t(locale, "language")}
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
          {presenting ? (
            <button type="button" className="danger" onClick={() => void stopPresent()}>
              {t(locale, "stopPresent")}
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={!activeItem}
              onClick={() => void startPresent()}
            >
              {t(locale, "present")}
            </button>
          )}
        </div>
      </header>

      <div className="p-workspace">
        <aside className="p-panel">
          <div className="p-panel-header">
            <div className="p-tabs">
              <button
                type="button"
                className={tab === "bible" ? "active" : ""}
                onClick={() => {
                  setTab("bible");
                  setQuery("");
                }}
              >
                {t(locale, "bible")}
              </button>
              <button
                type="button"
                className={tab === "songs" ? "active" : ""}
                onClick={() => {
                  setTab("songs");
                  setQuery("");
                }}
              >
                {t(locale, "songs")}
              </button>
            </div>
            <input
              className="p-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === "bible"
                  ? t(locale, "searchPlaceholderBible")
                  : t(locale, "searchPlaceholderSongs")
              }
            />
          </div>
          <div className="p-list">
            {tab === "bible" &&
              (bibleLoading ? (
                <div className="p-muted" style={{ padding: "0.75rem" }}>
                  …
                </div>
              ) : bibleHits.length ? (
                bibleHits.map((hit, idx) => {
                  const label = `${hit.citation.bookName} ${hit.citation.chapter}:${hit.citation.verseStart}${
                    hit.citation.verseEnd !== hit.citation.verseStart
                      ? `-${hit.citation.verseEnd}`
                      : ""
                  }`;
                  const active =
                    selectedHit?.citation.bookId === hit.citation.bookId &&
                    selectedHit.citation.chapter === hit.citation.chapter &&
                    selectedHit.citation.verseStart === hit.citation.verseStart;
                  return (
                    <button
                      key={`${label}-${idx}`}
                      type="button"
                      className={`p-item ${active ? "active" : ""}`}
                      onClick={() => {
                        setSelectedHit(hit);
                        setActiveServiceId(null);
                      }}
                    >
                      <div>{label}</div>
                      <div className="p-meta">
                        {hit.kind === "citation" ? "RVR1960" : hit.preview.slice(0, 100)}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-muted" style={{ padding: "0.75rem" }}>
                  {query ? t(locale, "noResults") : t(locale, "searchPlaceholderBible")}
                </div>
              ))}

            {tab === "songs" &&
              (songHits.length ? (
                songHits.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    className={`p-item ${selectedSongId === song.id ? "active" : ""}`}
                    onClick={() => {
                      setSelectedSongId(song.id);
                      setActiveServiceId(null);
                    }}
                  >
                    <div>{song.title}</div>
                    <div className="p-meta">
                      {[song.artist, song.key].filter(Boolean).join(" · ")}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-muted" style={{ padding: "0.75rem" }}>
                  {t(locale, "noResults")}
                </div>
              ))}
          </div>
        </aside>

        <main className="p-preview">
          <div className="p-controls">
            <div>
              <strong>{activeItem?.title ?? "—"}</strong>
              <div className="p-muted">
                {activeItem
                  ? t(locale, "slideOf", {
                      current: slideIndex + 1,
                      total: activeItem.slides.length,
                    })
                  : t(locale, "desktopHint")}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.45rem" }}>
              <button type="button" onClick={addSelectedToService} disabled={!activeItem}>
                {t(locale, "addToService")}
              </button>
              <button type="button" onClick={goPrev} disabled={!activeItem}>
                {t(locale, "previous")}
              </button>
              <button type="button" onClick={goNext} disabled={!activeItem}>
                {t(locale, "next")}
              </button>
            </div>
          </div>

          <div className="p-stage" key={`${activeItem?.id}-${slideIndex}`}>
            {currentSlide ? (
              <>
                <h2>{currentSlide.title}</h2>
                {currentSlide.subtitle ? (
                  <div className="subtitle">{currentSlide.subtitle}</div>
                ) : null}
                <div className="lines">
                  {currentSlide.lines.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-muted">{t(locale, "emptyService")}</div>
            )}
          </div>

          <div className="p-rail">
            {activeItem?.slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                className={`p-thumb ${idx === slideIndex ? "active" : ""}`}
                onClick={() => setSlideIndex(idx)}
              >
                {slide.lines.join("\n") || slide.title}
              </button>
            ))}
          </div>
        </main>

        <aside className="p-panel">
          <div className="p-panel-header">
            <strong>{t(locale, "service")}</strong>
            <button
              type="button"
              onClick={() => {
                setService([]);
                setActiveServiceId(null);
              }}
              disabled={!service.length}
            >
              {t(locale, "clear")}
            </button>
          </div>
          <div className="p-service">
            {service.length === 0 ? (
              <div className="p-muted">{t(locale, "emptyService")}</div>
            ) : (
              service.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-service-item ${activeServiceId === entry.id ? "active" : ""}`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                    <button
                      type="button"
                      style={{ background: "transparent", padding: 0, textAlign: "left" }}
                      onClick={() => {
                        setActiveServiceId(entry.id);
                        setSlideIndex(0);
                      }}
                    >
                      <strong>{entry.label}</strong>
                      <div className="p-meta">
                        {entry.item.kind} · {entry.item.slides.length} slides
                      </div>
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        setService((prev) => prev.filter((p) => p.id !== entry.id))
                      }
                    >
                      {t(locale, "remove")}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {presenting && currentSlide ? (
        <div className="present-root" onClick={() => goNext()}>
          <div className="frame">
            <h1>{currentSlide.title}</h1>
            {currentSlide.subtitle ? (
              <div className="subtitle">{currentSlide.subtitle}</div>
            ) : null}
            <div className="lines">
              {currentSlide.lines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
