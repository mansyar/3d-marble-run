export type BootPhase = "loading" | "ready" | "failed";

export interface BootController {
  phase(): BootPhase;
  /** Kicks off the boot sequence once; calls while in flight or after the run
   * finished are no-ops — retry is the only re-entry. */
  begin(): void;
  /** Re-runs the boot sequence after a failure; ignored in any other phase. */
  retry(): void;
  /** Subscribes to phase transitions; returns an unsubscribe function. */
  onPhase(listener: (phase: BootPhase) => void): () => void;
}

/**
 * Drives the app boot flow: the entry point shows a branded loading screen
 * while the physics chunk (Rapier + WASM) loads in the background. Any start
 * failure lands in the "failed" phase so the UI can offer a retry instead of
 * a dead end. Phase transitions are the only notifications — unchanged phases
 * never notify, and listeners registered after a transition only hear future
 * ones.
 */
export function createBootController(start: () => Promise<void>): BootController {
  let phase: BootPhase = "loading";
  let busy = false;
  const listeners = new Set<(phase: BootPhase) => void>();

  function setPhase(next: BootPhase): void {
    if (phase === next) return;
    phase = next;
    for (const listener of listeners) listener(next);
  }

  async function run(): Promise<void> {
    busy = true;
    try {
      await start();
      setPhase("ready");
    } catch {
      setPhase("failed");
    } finally {
      busy = false;
    }
  }

  return {
    phase: () => phase,
    begin: () => {
      if (busy || phase !== "loading") return;
      void run();
    },
    retry: () => {
      if (busy || phase !== "failed") return;
      setPhase("loading");
      void run();
    },
    onPhase: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
