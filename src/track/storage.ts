import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { TrackGraph } from "./graph";
import { deserializeTrack, serializeTrack } from "./serialization";

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
  save(name: string, graph: TrackGraph): Promise<void>;
  load(name: string): Promise<TrackGraph | null>;
  remove(name: string): Promise<void>;
  list(): Promise<SaveSlotInfo[]>;
  scheduleAutosave(graph: TrackGraph): void;
  flushAutosave(graph: TrackGraph): Promise<void>;
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

  async function save(name: string, graph: TrackGraph): Promise<void> {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("Save slot name is required");
    const db = await getDatabase();
    await db.put("slots", {
      name: trimmedName,
      payload: serializeTrack(graph),
      updatedAt: Date.now(),
    });
  }

  async function load(name: string): Promise<TrackGraph | null> {
    const db = await getDatabase();
    const slot = await db.get("slots", name);
    return slot ? deserializeTrack(slot.payload) : null;
  }

  async function remove(name: string): Promise<void> {
    const db = await getDatabase();
    await db.delete("slots", name);
  }

  async function list(): Promise<SaveSlotInfo[]> {
    const db = await getDatabase();
    const slots = await db.getAll("slots");
    return slots
      .filter((slot) => slot.name !== AUTOSAVE_SLOT)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(({ name, updatedAt }) => ({ name, updatedAt }));
  }

  function scheduleAutosave(graph: TrackGraph): void {
    if (autosaveTimer !== null) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      autosaveTimer = null;
      void save(AUTOSAVE_SLOT, graph).catch(reportError);
    }, debounceMs);
  }

  async function flushAutosave(graph: TrackGraph): Promise<void> {
    if (autosaveTimer !== null) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }
    await save(AUTOSAVE_SLOT, graph);
  }

  function dispose(): void {
    if (autosaveTimer !== null) clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }

  return { save, load, remove, list, scheduleAutosave, flushAutosave, dispose };
}
