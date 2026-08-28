export type QualityMode = "auto" | "high";

const STORAGE_KEY = "marblescape:quality";

function defaultStorage(): Pick<Storage, "getItem" | "setItem"> | null {
  return (globalThis as { localStorage?: Storage }).localStorage ?? null;
}

export function getQualityMode(storage?: Pick<Storage, "getItem">): QualityMode {
  const store = storage ?? defaultStorage();
  if (!store) return "auto";
  const raw = store.getItem(STORAGE_KEY);
  return raw === "high" ? "high" : "auto";
}

export function setQualityMode(mode: QualityMode, storage?: Pick<Storage, "setItem">): void {
  const store = storage ?? defaultStorage();
  store?.setItem(STORAGE_KEY, mode);
}

export interface QualityInput {
  compact: boolean;
  deviceMemory?: number;
  battery?: { level: number; charging: boolean } | null;
}

export interface QualityCaps {
  dprCap: number;
  shadowSize: number;
}

const CAPPED: QualityCaps = { dprCap: 1.5, shadowSize: 1024 };
const DESKTOP: QualityCaps = { dprCap: 2, shadowSize: 2048 };

export function resolveQuality(input: QualityInput, mode: QualityMode): QualityCaps {
  if (mode === "high") return DESKTOP;
  const { compact, deviceMemory, battery } = input;
  if (
    compact ||
    (deviceMemory != null && deviceMemory <= 4) ||
    (battery && !battery.charging && battery.level < 0.2)
  ) {
    return CAPPED;
  }
  return DESKTOP;
}
