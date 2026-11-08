/// <reference types="vite/client" />

import type { StagePayload } from "../electron/preload";

declare global {
  interface Window {
    churchScreen?: {
      openStage: () => Promise<boolean>;
      closeStage: () => Promise<boolean>;
      isStageOpen: () => Promise<boolean>;
      pushStage: (payload: StagePayload) => void;
      onStageUpdate: (handler: (payload: StagePayload) => void) => () => void;
      onStageClosed: (handler: () => void) => () => void;
    };
  }
}

export {};
