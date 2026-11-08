import { songFromUpsert, type Song } from "@church-screen/core";

export function defaultSeedSongs(): Song[] {
  return [
    songFromUpsert({
      title: "Santo, Santo, Santo",
      artist: "Himno",
      language: "es",
      lyricsText: `[Verso 1]
Santo, Santo, Santo
Señor omnipotente
Temprano en la mañana
Mi canción subirá

[Coro]
Santo, Santo, Santo
Misericordioso y poderoso
Dios en tres personas
Bendita Trinidad
`,
    }),
    songFromUpsert({
      title: "How Great Thou Art",
      artist: "Traditional",
      language: "en",
      lyricsText: `[Verse 1]
O Lord my God, when I in awesome wonder
Consider all the works Thy hands have made

[Chorus]
Then sings my soul, my Savior God, to Thee
How great Thou art, how great Thou art
`,
    }),
  ];
}
