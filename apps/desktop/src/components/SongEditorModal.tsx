import { useState } from "react";
import {
  lyricsTextFromSong,
  songFromUpsert,
  t,
  type Locale,
  type Song,
} from "@church-screen/core";

export function SongEditorModal({
  locale,
  initial,
  onClose,
  onSave,
}: {
  locale: Locale;
  initial?: Song | null;
  onClose: () => void;
  onSave: (song: Song) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [artist, setArtist] = useState(initial?.artist ?? "");
  const [key, setKey] = useState(initial?.key ?? "");
  const [lyricsText, setLyricsText] = useState(
    initial ? lyricsTextFromSong(initial) : ""
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{initial ? t(locale, "editSong") : t(locale, "uploadSong")}</h3>
        <div className="form-grid">
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
        </div>
        <label className="full">
          {t(locale, "lyrics")}
          <textarea
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
            placeholder={"[Verso 1]\n...\n\n[Coro]\n..."}
          />
          <span>{t(locale, "lyricsHelp")}</span>
        </label>
        <div className="actions">
          <button type="button" onClick={onClose}>
            {t(locale, "cancel")}
          </button>
          <button
            type="button"
            className="primary"
            disabled={!title.trim() || !lyricsText.trim()}
            onClick={() =>
              onSave(
                songFromUpsert(
                  {
                    id: initial?.id,
                    title,
                    artist,
                    key,
                    lyricsText,
                    language: locale,
                  },
                  initial ?? undefined
                )
              )
            }
          >
            {t(locale, "save")}
          </button>
        </div>
      </div>
    </div>
  );
}
