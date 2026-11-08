import { useEffect, useMemo, useState } from "react";
import bibleJson from "@church-screen/core/bible/rvr1960.json";
import {
  bibleToPresentation,
  getVerses,
  searchBible,
  searchSongs,
  setBible,
  songToPresentation,
  t,
  type BibleData,
  type BibleSearchHit,
  type Locale,
  type PresentationItem,
  type ServicePlaylistItem,
  type Song,
} from "@church-screen/core";
import { StageView } from "./components/StageView";
import { SongEditorModal } from "./components/SongEditorModal";
import {
  getWebBaseUrl,
  loadLocalSongs,
  saveLocalSongs,
  setWebBaseUrl,
  syncSongsFromWeb,
} from "./lib/storage";
import { defaultSeedSongs } from "./lib/seedSongs";

setBible(bibleJson as BibleData);

type LibraryTab = "bible" | "songs";

function isStageRoute() {
  return window.location.hash.replace(/^#/, "") === "/stage";
}

export default function App() {
  const [locale, setLocale] = useState<Locale>("es");
  const [tab, setTab] = useState<LibraryTab>("bible");
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [selectedHit, setSelectedHit] = useState<BibleSearchHit | null>(null);
  const [service, setService] = useState<ServicePlaylistItem[]>([]);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [isStage, setIsStage] = useState(isStageRoute());

  useEffect(() => {
    const onHash = () => setIsStage(isStageRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const existing = loadLocalSongs();
    if (existing.length) setSongs(existing);
    else {
      const seed = defaultSeedSongs();
      saveLocalSongs(seed);
      setSongs(seed);
    }
  }, []);

  const bibleHits = useMemo(() => {
    if (tab !== "bible") return [];
    return searchBible(bibleJson as BibleData, query, { limit: 50 });
  }, [tab, query]);

  const songHits = useMemo(() => {
    if (tab !== "songs") return [];
    return searchSongs(songs, query, 50);
  }, [tab, query, songs]);

  const activeItem: PresentationItem | null = useMemo(() => {
    const fromService = service.find((s) => s.id === activeServiceId)?.item;
    if (fromService) return fromService;
    if (tab === "bible" && selectedHit) {
      return bibleToPresentation(bibleJson as BibleData, selectedHit.citation);
    }
    if (tab === "songs" && selectedSongId) {
      const song = songs.find((s) => s.id === selectedSongId);
      if (song) return songToPresentation(song);
    }
    return null;
  }, [service, activeServiceId, tab, selectedHit, selectedSongId, songs]);

  const currentSlide = activeItem?.slides[slideIndex] ?? null;

  useEffect(() => {
    setSlideIndex(0);
  }, [activeItem?.id]);

  useEffect(() => {
    const api = window.churchScreen;
    if (!api || isStage) return;
    api.pushStage({
      presenting: presenting && Boolean(currentSlide),
      title: currentSlide?.title ?? "",
      subtitle: currentSlide?.subtitle,
      lines: currentSlide?.lines ?? [],
      index: slideIndex,
      total: activeItem?.slides.length ?? 0,
    });
  }, [presenting, currentSlide, slideIndex, activeItem, isStage]);

  useEffect(() => {
    if (isStage) return;
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
        void stopPresent();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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

  async function startPresent() {
    if (!activeItem) return;
    setPresenting(true);
    await window.churchScreen?.openStage();
  }

  async function stopPresent() {
    setPresenting(false);
    await window.churchScreen?.closeStage();
  }

  function addPresentationToService(item: PresentationItem, label: string) {
    const entry: ServicePlaylistItem = {
      id: `svc_${Math.random().toString(36).slice(2, 9)}`,
      label,
      item,
    };
    setService((prev) => [...prev, entry]);
    setActiveServiceId(entry.id);
  }

  function addSelectedToService() {
    if (!activeItem) return;
    addPresentationToService(activeItem, activeItem.title);
  }

  async function handleSync() {
    try {
      setSyncMsg("...");
      const merged = await syncSongsFromWeb(getWebBaseUrl());
      setSongs(merged);
      setSyncMsg(locale === "es" ? "Sincronizado" : "Synced");
    } catch (err) {
      setSyncMsg(
        locale === "es"
          ? `Error de sync — ¿web en ${getWebBaseUrl()}?`
          : `Sync error — is web at ${getWebBaseUrl()}?`
      );
      console.error(err);
    }
  }

  if (isStage) return <StageView locale={locale} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>{t(locale, "appName")}</strong>
          <span>{t(locale, "tagline")}</span>
        </div>
        <div className="top-actions">
          <select
            className="search-input"
            style={{ width: "auto" }}
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            aria-label={t(locale, "language")}
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
          <button type="button" onClick={() => void handleSync()}>
            {t(locale, "syncFromWeb")}
          </button>
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

      <div className="workspace">
        <aside className="panel">
          <div className="panel-header">
            <div className="tabs">
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
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === "bible"
                  ? t(locale, "searchPlaceholderBible")
                  : t(locale, "searchPlaceholderSongs")
              }
            />
            {tab === "songs" ? (
              <button type="button" onClick={() => setEditorOpen(true)}>
                {t(locale, "uploadSong")}
              </button>
            ) : null}
            {syncMsg ? <span className="muted">{syncMsg}</span> : null}
          </div>

          <div className="list">
            {tab === "bible" &&
              (bibleHits.length ? (
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
                      className={`list-item ${active ? "active" : ""}`}
                      onClick={() => {
                        setSelectedHit(hit);
                        setActiveServiceId(null);
                      }}
                    >
                      <div>{label}</div>
                      <div className="meta">
                        {hit.kind === "citation"
                          ? "RVR1960"
                          : getVerses(bibleJson as BibleData, hit.citation)[0]?.t.slice(0, 90)}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="muted" style={{ padding: "0.75rem" }}>
                  {query ? t(locale, "noResults") : t(locale, "searchPlaceholderBible")}
                </div>
              ))}

            {tab === "songs" &&
              (songHits.length ? (
                songHits.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    className={`list-item ${selectedSongId === song.id ? "active" : ""}`}
                    onClick={() => {
                      setSelectedSongId(song.id);
                      setActiveServiceId(null);
                    }}
                  >
                    <div>{song.title}</div>
                    <div className="meta">
                      {[song.artist, song.key, song.source].filter(Boolean).join(" · ")}
                    </div>
                  </button>
                ))
              ) : (
                <div className="muted" style={{ padding: "0.75rem" }}>
                  {t(locale, "noResults")}
                </div>
              ))}
          </div>
        </aside>

        <main className="preview">
          <div className="preview-controls">
            <div>
              <strong>{activeItem?.title ?? "—"}</strong>
              <div className="muted">
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

          <div className="preview-stage" key={`${activeItem?.id}-${slideIndex}`}>
            {currentSlide ? (
              <>
                <h2>{currentSlide.title}</h2>
                {currentSlide.subtitle ? (
                  <div className="subtitle">{currentSlide.subtitle}</div>
                ) : null}
                <div className="lines">
                  {currentSlide.lines.map((line, i) => (
                    <p key={i} style={{ animationDelay: `${i * 35}ms` }}>
                      {line}
                    </p>
                  ))}
                </div>
              </>
            ) : (
              <div className="muted">{t(locale, "emptyService")}</div>
            )}
          </div>

          <div className="slide-rail">
            {activeItem?.slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                className={`slide-thumb ${idx === slideIndex ? "active" : ""}`}
                onClick={() => setSlideIndex(idx)}
              >
                {slide.lines.join("\n") || slide.title}
              </button>
            ))}
          </div>
        </main>

        <aside className="panel">
          <div className="panel-header">
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
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              Web: {getWebBaseUrl()}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = window.prompt(
                  locale === "es" ? "URL del servidor web" : "Web server URL",
                  getWebBaseUrl()
                );
                if (next) setWebBaseUrl(next);
              }}
            >
              URL
            </button>
          </div>
          <div className="service-list">
            {service.length === 0 ? (
              <div className="muted">{t(locale, "emptyService")}</div>
            ) : (
              service.map((entry) => (
                <div
                  key={entry.id}
                  className={`service-item ${activeServiceId === entry.id ? "active" : ""}`}
                >
                  <div className="row">
                    <button
                      type="button"
                      style={{ background: "transparent", padding: 0, textAlign: "left" }}
                      onClick={() => {
                        setActiveServiceId(entry.id);
                        setSlideIndex(0);
                      }}
                    >
                      <strong>{entry.label}</strong>
                      <div className="meta">
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

      {editorOpen ? (
        <SongEditorModal
          locale={locale}
          onClose={() => setEditorOpen(false)}
          onSave={(song) => {
            const next = [...songs.filter((s) => s.id !== song.id), song].sort((a, b) =>
              a.title.localeCompare(b.title)
            );
            setSongs(next);
            saveLocalSongs(next);
            setSelectedSongId(song.id);
            setTab("songs");
            setEditorOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
