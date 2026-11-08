declare module "@church-screen/core/bible/rvr1960.json" {
  import type { BibleData } from "./types";
  const data: BibleData;
  export default data;
}

declare module "*.json" {
  const value: unknown;
  export default value;
}
