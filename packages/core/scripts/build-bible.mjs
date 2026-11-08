import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = process.env.BIBLE_SRC || "/tmp/bible-books";
const outDir = path.resolve(__dirname, "../data");
const outFile = path.join(outDir, "rvr1960.json");

const BOOKS = [
  { id: "GEN", file: "genesis", name: "Génesis", nameEn: "Genesis", aliases: ["gn", "gen", "gé", "ge", "genesis", "génesis"] },
  { id: "EXO", file: "exodo", name: "Éxodo", nameEn: "Exodus", aliases: ["ex", "exo", "éx", "exodo", "éxodo", "exodus"] },
  { id: "LEV", file: "levitico", name: "Levítico", nameEn: "Leviticus", aliases: ["lv", "lev", "levitico", "levítico", "leviticus"] },
  { id: "NUM", file: "numeros", name: "Números", nameEn: "Numbers", aliases: ["nm", "num", "números", "numeros", "numbers"] },
  { id: "DEU", file: "deuteronomio", name: "Deuteronomio", nameEn: "Deuteronomy", aliases: ["dt", "deu", "deut", "deuteronomio", "deuteronomy"] },
  { id: "JOS", file: "josue", name: "Josué", nameEn: "Joshua", aliases: ["jos", "js", "josue", "josué", "joshua"] },
  { id: "JDG", file: "jueces", name: "Jueces", nameEn: "Judges", aliases: ["jue", "jueces", "judges", "jdg"] },
  { id: "RUT", file: "rut", name: "Rut", nameEn: "Ruth", aliases: ["rt", "rut", "ruth"] },
  { id: "1SA", file: "1_samuel", name: "1 Samuel", nameEn: "1 Samuel", aliases: ["1s", "1sa", "1sam", "1 samuel", "i samuel"] },
  { id: "2SA", file: "2_samuel", name: "2 Samuel", nameEn: "2 Samuel", aliases: ["2s", "2sa", "2sam", "2 samuel", "ii samuel"] },
  { id: "1KI", file: "1_reyes", name: "1 Reyes", nameEn: "1 Kings", aliases: ["1r", "1re", "1reyes", "1 reyes", "1 kings", "i reyes"] },
  { id: "2KI", file: "2_reyes", name: "2 Reyes", nameEn: "2 Kings", aliases: ["2r", "2re", "2reyes", "2 reyes", "2 kings", "ii reyes"] },
  { id: "1CH", file: "1_cronicas", name: "1 Crónicas", nameEn: "1 Chronicles", aliases: ["1cr", "1cronicas", "1 crónicas", "1 cronicas", "1 chronicles"] },
  { id: "2CH", file: "2_cronicas", name: "2 Crónicas", nameEn: "2 Chronicles", aliases: ["2cr", "2cronicas", "2 crónicas", "2 cronicas", "2 chronicles"] },
  { id: "EZR", file: "esdras", name: "Esdras", nameEn: "Ezra", aliases: ["esd", "esdras", "ezra", "ezr"] },
  { id: "NEH", file: "nehemias", name: "Nehemías", nameEn: "Nehemiah", aliases: ["neh", "nehemias", "nehemías", "nehemiah"] },
  { id: "EST", file: "ester", name: "Ester", nameEn: "Esther", aliases: ["est", "ester", "esther"] },
  { id: "JOB", file: "job", name: "Job", nameEn: "Job", aliases: ["job"] },
  { id: "PSA", file: "salmos", name: "Salmos", nameEn: "Psalms", aliases: ["sal", "salmo", "salmos", "ps", "psa", "psalm", "psalms"] },
  { id: "PRO", file: "proverbios", name: "Proverbios", nameEn: "Proverbs", aliases: ["prv", "pro", "prov", "proverbios", "proverbs"] },
  { id: "ECC", file: "eclesiastes", name: "Eclesiastés", nameEn: "Ecclesiastes", aliases: ["ec", "ecc", "ecl", "eclesiastés", "eclesiastes", "ecclesiastes"] },
  { id: "SNG", file: "cantares", name: "Cantares", nameEn: "Song of Solomon", aliases: ["cnt", "cant", "cantares", "song", "sos", "sng"] },
  { id: "ISA", file: "isaias", name: "Isaías", nameEn: "Isaiah", aliases: ["is", "isa", "isaias", "isaías", "isaiah"] },
  { id: "JER", file: "jeremias", name: "Jeremías", nameEn: "Jeremiah", aliases: ["jer", "jeremias", "jeremías", "jeremiah"] },
  { id: "LAM", file: "lamentaciones", name: "Lamentaciones", nameEn: "Lamentations", aliases: ["lam", "lamentaciones", "lamentations"] },
  { id: "EZK", file: "ezequiel", name: "Ezequiel", nameEn: "Ezekiel", aliases: ["ez", "eze", "ezequiel", "ezekiel", "ezk"] },
  { id: "DAN", file: "daniel", name: "Daniel", nameEn: "Daniel", aliases: ["dn", "dan", "daniel"] },
  { id: "HOS", file: "oseas", name: "Oseas", nameEn: "Hosea", aliases: ["os", "ose", "oseas", "hosea", "hos"] },
  { id: "JOL", file: "joel", name: "Joel", nameEn: "Joel", aliases: ["jl", "joel", "jol"] },
  { id: "AMO", file: "amos", name: "Amós", nameEn: "Amos", aliases: ["am", "amos", "amós", "amo"] },
  { id: "OBA", file: "abdias", name: "Abdías", nameEn: "Obadiah", aliases: ["abd", "abdias", "abdías", "obadiah", "oba"] },
  { id: "JON", file: "jonas", name: "Jonás", nameEn: "Jonah", aliases: ["jon", "jonas", "jonás", "jonah"] },
  { id: "MIC", file: "miqueas", name: "Miqueas", nameEn: "Micah", aliases: ["mi", "mic", "miq", "miqueas", "micah"] },
  { id: "NAM", file: "nahum", name: "Nahúm", nameEn: "Nahum", aliases: ["nah", "nahum", "nahúm", "nam"] },
  { id: "HAB", file: "habacuc", name: "Habacuc", nameEn: "Habakkuk", aliases: ["hab", "habacuc", "habakkuk"] },
  { id: "ZEP", file: "sofonias", name: "Sofonías", nameEn: "Zephaniah", aliases: ["sof", "sofonias", "sofonías", "zephaniah", "zep"] },
  { id: "HAG", file: "hageo", name: "Hageo", nameEn: "Haggai", aliases: ["hag", "hageo", "haggai"] },
  { id: "ZEC", file: "zacarias", name: "Zacarías", nameEn: "Zechariah", aliases: ["zac", "zacarias", "zacarías", "zechariah", "zec"] },
  { id: "MAL", file: "malaquias", name: "Malaquías", nameEn: "Malachi", aliases: ["mal", "malaquias", "malaquías", "malachi"] },
  { id: "MAT", file: "mateo", name: "Mateo", nameEn: "Matthew", aliases: ["mt", "mat", "mateo", "matthew"] },
  { id: "MRK", file: "marcos", name: "Marcos", nameEn: "Mark", aliases: ["mc", "mr", "mar", "marcos", "mark", "mrk"] },
  { id: "LUK", file: "lucas", name: "Lucas", nameEn: "Luke", aliases: ["lc", "luc", "lucas", "luke", "luk"] },
  { id: "JHN", file: "juan", name: "Juan", nameEn: "John", aliases: ["jn", "juan", "john", "jhn"] },
  { id: "ACT", file: "hechos", name: "Hechos", nameEn: "Acts", aliases: ["hch", "hech", "hechos", "acts", "act"] },
  { id: "ROM", file: "romanos", name: "Romanos", nameEn: "Romans", aliases: ["ro", "rom", "romanos", "romans"] },
  { id: "1CO", file: "1_corintios", name: "1 Corintios", nameEn: "1 Corinthians", aliases: ["1co", "1cor", "1 corintios", "1 corinthians"] },
  { id: "2CO", file: "2_corintios", name: "2 Corintios", nameEn: "2 Corinthians", aliases: ["2co", "2cor", "2 corintios", "2 corinthians"] },
  { id: "GAL", file: "galatas", name: "Gálatas", nameEn: "Galatians", aliases: ["ga", "gal", "galatas", "gálatas", "galatians"] },
  { id: "EPH", file: "efesios", name: "Efesios", nameEn: "Ephesians", aliases: ["ef", "efe", "efesios", "ephesians", "eph"] },
  { id: "PHP", file: "filipenses", name: "Filipenses", nameEn: "Philippians", aliases: ["fil", "filipenses", "philippians", "php", "phil"] },
  { id: "COL", file: "colosenses", name: "Colosenses", nameEn: "Colossians", aliases: ["col", "colosenses", "colossians"] },
  { id: "1TH", file: "1_tesalonicenses", name: "1 Tesalonicenses", nameEn: "1 Thessalonians", aliases: ["1ts", "1tes", "1 tesalonicenses", "1 thessalonians"] },
  { id: "2TH", file: "2_tesalonicenses", name: "2 Tesalonicenses", nameEn: "2 Thessalonians", aliases: ["2ts", "2tes", "2 tesalonicenses", "2 thessalonians"] },
  { id: "1TI", file: "1_timoteo", name: "1 Timoteo", nameEn: "1 Timothy", aliases: ["1ti", "1tim", "1 timoteo", "1 timothy"] },
  { id: "2TI", file: "2_timoteo", name: "2 Timoteo", nameEn: "2 Timothy", aliases: ["2ti", "2tim", "2 timoteo", "2 timothy"] },
  { id: "TIT", file: "tito", name: "Tito", nameEn: "Titus", aliases: ["tit", "tito", "titus"] },
  { id: "PHM", file: "filemon", name: "Filemón", nameEn: "Philemon", aliases: ["flm", "filemon", "filemón", "philemon", "phm"] },
  { id: "HEB", file: "hebreos", name: "Hebreos", nameEn: "Hebrews", aliases: ["he", "heb", "hebreos", "hebrews"] },
  { id: "JAS", file: "santiago", name: "Santiago", nameEn: "James", aliases: ["snt", "st", "santiago", "james", "jas"] },
  { id: "1PE", file: "1_pedro", name: "1 Pedro", nameEn: "1 Peter", aliases: ["1p", "1pe", "1ped", "1 pedro", "1 peter"] },
  { id: "2PE", file: "2_pedro", name: "2 Pedro", nameEn: "2 Peter", aliases: ["2p", "2pe", "2ped", "2 pedro", "2 peter"] },
  { id: "1JN", file: "1_juan", name: "1 Juan", nameEn: "1 John", aliases: ["1jn", "1j", "1 juan", "1 john"] },
  { id: "2JN", file: "2_juan", name: "2 Juan", nameEn: "2 John", aliases: ["2jn", "2j", "2 juan", "2 john"] },
  { id: "3JN", file: "3_juan", name: "3 Juan", nameEn: "3 John", aliases: ["3jn", "3j", "3 juan", "3 john"] },
  { id: "JUD", file: "judas", name: "Judas", nameEn: "Jude", aliases: ["jud", "judas", "jude"] },
  { id: "REV", file: "apocalipsis", name: "Apocalipsis", nameEn: "Revelation", aliases: ["ap", "apo", "apoc", "apocalipsis", "revelation", "rev"] },
];

function loadBookModule(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  const wrapped = code.replace(/^export\s+default\s+/m, "module.exports = ");
  const module = { exports: {} };
  vm.runInNewContext(wrapped, { module, exports: module.exports }, { filename: filePath });
  return module.exports;
}

function main() {
  if (!fs.existsSync(sourceDir)) {
    console.error(`Bible source directory missing: ${sourceDir}`);
    process.exit(1);
  }

  const books = BOOKS.map((meta, index) => {
    const filePath = path.join(sourceDir, `${meta.file}.js`);
    if (!fs.existsSync(filePath)) throw new Error(`Missing book file: ${filePath}`);
    const chapters = loadBookModule(filePath);
    if (!Array.isArray(chapters) || !Array.isArray(chapters[0])) {
      throw new Error(`Unexpected shape for ${meta.file}`);
    }
    return {
      id: meta.id,
      order: index + 1,
      name: meta.name,
      nameEn: meta.nameEn,
      aliases: meta.aliases,
      chapters: chapters.map((verses) =>
        verses.map((text, verseIndex) => ({
          n: verseIndex + 1,
          t: String(text).trim(),
        }))
      ),
    };
  });

  const bible = {
    version: "RVR1960",
    title: "Reina-Valera 1960",
    language: "es",
    attribution:
      "Texto RVR1960 empaquetado desde fuentes comunitarias (josevladimir/bible-json). Verifique derechos de uso para su congregación.",
    books,
    stats: {
      books: books.length,
      chapters: books.reduce((n, b) => n + b.chapters.length, 0),
      verses: books.reduce(
        (n, b) => n + b.chapters.reduce((m, c) => m + c.length, 0),
        0
      ),
    },
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(bible));
  console.log(
    `Wrote ${outFile} — ${bible.stats.books} books, ${bible.stats.chapters} chapters, ${bible.stats.verses} verses`
  );
}

main();
