import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { TrackDocument } from "./serialization";
import { deserializeTrackDocument, serializeTrack } from "./serialization";

export const AUTOSAVE_SLOT = "__autosave__";

interface StoredSlot {
  name: string;
  payload: string;
  updatedAt: number;
}

interface MarblescapeDatabase extends DBSchema {
  slots: {
    key: string;
    value: StoredSlot;
  };
}

export interface SaveSlotInfo {
  name: string;
  updatedAt: number;
}

export interface TrackStorageOptions {
  databaseName?: string;
  debounceMs?: number;
  onError?: (error: unknown) => void;
}

export interface TrackStorage {
  save(name: string, document: TrackDocument): Promise<void>;
  load(name: string): Promise<TrackDocument | null>;
  remove(name: string): Promise<void>;
  list(): Promise<SaveSlotInfo[]>;
  scheduleAutosave(document: TrackDocument): void;
  flushAutosave(document: TrackDocument): Promise<void>;
  dispose(): void;
}

export function createTrackStorage(options: TrackStorageOptions = {}): TrackStorage {
  const databaseName = options.databaseName ?? "marblescape";
  const debounceMs = options.debounceMs ?? 450;
  let database: Promise<IDBPDatabase<MarblescapeDatabase>> | null = null;
  let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

  function getDatabase(): Promise<IDBPDatabase<MarblescapeDatabase>> {
    database ??= openDB<MarblescapeDatabase>(databaseName, 1, {
      upgrade(db) {
        db.createObjectStore("slots", { keyPath: "name" });
      },
    });
    return database;
  }

  function reportError(error: unknown): void {
    options.onError?.(error);
  }

  function normalizeName(name: string, allowAutosave: boolean): string {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("Save slot name is required");
    if (!allowAutosave && trimmedName === AUTOSAVE_SLOT) {
      throw new Error("The autosave slot is reserved");
    }
    return trimmedName;
  }

  async function write(name: string, document: TrackDocument): Promise<void> {
    const db = await getDatabase();
    await db.put("slots", {
      name,
      payload: serializeTrack(document.graph, document.dropPoint),
      updatedAt: Date.now(),
    });
  }

  async function save(name: string, document: TrackDocument): Promise<void> {
    await write(normalizeName(name, false), document);
  }

  async function load(name: string): Promise<TrackDocument | null> {
    const db = await getDatabase();
    const slot = await db.get("slots", normalizeName(name, true));
    return slot ? deserializeTrackDocument(slot.payload) : null;
  }

  async function remove(name: string): Promise<void> {
    const db = await getDatabase();
    await db.delete("slots", normalizeName(name, false));
  }

  async function list(): Promise<SaveSlotInfo[]> {
    const db = await getDatabase();
    const slots = await db.getAll("slots");
    return slots
      .filter((slot) => slot.name !== AUTOSAVE_SLOT)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(({ name, updatedAt }) => ({ name, updatedAt }));
  }

  function scheduleAutosave(document: TrackDocument): void {
    if (autosaveTimer !== null) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      autosaveTimer = null;
      void write(AUTOSAVE_SLOT, document).catch(reportError);
    }, debounceMs);
  }

  async function flushAutosave(document: TrackDocument): Promise<void> {
    if (autosaveTimer !== null) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }
    await write(AUTOSAVE_SLOT, document);
  }

  function dispose(): void {
    if (autosaveTimer !== null) clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }

  return { save, load, remove, list, scheduleAutosave, flushAutosave, dispose };
}
