import type { TrackDocument } from "./serialization";
import { createStarterDocument } from "./starter";
import { AUTOSAVE_SLOT, type TrackStorage } from "./storage";

type InitialTrackStorage = Pick<TrackStorage, "flushAutosave" | "load">;

/** Load the last autosave, or persist a starter contraption on first launch. */
export async function loadInitialTrack(storage: InitialTrackStorage): Promise<TrackDocument> {
  const autosave = await storage.load(AUTOSAVE_SLOT);
  if (autosave) return autosave;

  const starter = createStarterDocument();
  await storage.flushAutosave(starter);
  return starter;
}
