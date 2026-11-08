import type { Locale } from "../types.js";

const es = {
  appName: "Church Screen",
  tagline: "Letras y Biblia para proyección",
  library: "Biblioteca",
  bible: "Biblia",
  songs: "Canciones",
  service: "Servicio",
  searchPlaceholderBible: "Buscar cita o palabra (ej. Juan 3:16, amor)",
  searchPlaceholderSongs: "Buscar canción, artista o letra",
  present: "Presentar",
  stopPresent: "Detener",
  next: "Siguiente",
  previous: "Anterior",
  clear: "Limpiar",
  addToService: "Agregar al servicio",
  remove: "Quitar",
  uploadSong: "Subir canción",
  editSong: "Editar canción",
  title: "Título",
  artist: "Artista",
  key: "Tonalidad",
  lyrics: "Letra",
  lyricsHelp:
    "Use líneas en blanco para separar diapositivas. Encabezados como [Coro] o [Verso 1] etiquetan secciones.",
  save: "Guardar",
  cancel: "Cancelar",
  syncFromWeb: "Sincronizar desde web",
  stageDisplay: "Pantalla de proyección",
  operator: "Operador",
  language: "Idioma",
  noResults: "Sin resultados",
  emptyService: "El servicio está vacío. Agregue canciones o pasajes.",
  slideOf: "Diapositiva {current} de {total}",
  rvr1960: "Reina-Valera 1960",
  sharedLibrary: "Biblioteca compartida",
  desktopHint: "Use Espacio / → para avanzar, ← para retroceder, Esc para salir.",
  webManageHint: "Suba y edite canciones aquí. El escritorio puede sincronizarlas.",
} as const;

const en: Record<keyof typeof es, string> = {
  appName: "Church Screen",
  tagline: "Lyrics & Bible for projection",
  library: "Library",
  bible: "Bible",
  songs: "Songs",
  service: "Service",
  searchPlaceholderBible: "Search citation or keyword (e.g. John 3:16, love)",
  searchPlaceholderSongs: "Search song, artist, or lyrics",
  present: "Present",
  stopPresent: "Stop",
  next: "Next",
  previous: "Previous",
  clear: "Clear",
  addToService: "Add to service",
  remove: "Remove",
  uploadSong: "Upload song",
  editSong: "Edit song",
  title: "Title",
  artist: "Artist",
  key: "Key",
  lyrics: "Lyrics",
  lyricsHelp:
    "Use blank lines to split slides. Headers like [Chorus] or [Verse 1] label sections.",
  save: "Save",
  cancel: "Cancel",
  syncFromWeb: "Sync from web",
  stageDisplay: "Stage display",
  operator: "Operator",
  language: "Language",
  noResults: "No results",
  emptyService: "Service is empty. Add songs or scripture.",
  slideOf: "Slide {current} of {total}",
  rvr1960: "Reina-Valera 1960",
  sharedLibrary: "Shared library",
  desktopHint: "Space / → next, ← previous, Esc to exit.",
  webManageHint: "Upload and edit songs here. Desktop can sync them.",
};

const catalogs = { es, en } as const;

export type MessageKey = keyof typeof es;

export function t(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  const template = catalogs[locale][key] ?? catalogs.es[key] ?? key;
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    template
  );
}

export function getCatalog(locale: Locale) {
  return catalogs[locale];
}
