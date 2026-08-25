import { describe, expect, it } from "vitest";
import {
  COACH_MARK_STORAGE_KEY,
  type CoachMarkStorage,
  createCoachMarkProgress,
} from "../src/ui/coachMarkState";

class MemoryStorage implements CoachMarkStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("coach mark state", () => {
  it("starts with choosing a piece and advances through the actions in order", () => {
    const progress = createCoachMarkProgress(new MemoryStorage());

    expect(progress.getActiveStep()).toBe("choose-piece");

    progress.complete("choose-piece");
    expect(progress.getActiveStep()).toBe("place-piece");

    progress.complete("place-piece");
    expect(progress.getActiveStep()).toBe("drop-marble");

    progress.complete("drop-marble");
    expect(progress.getActiveStep()).toBeNull();
  });

  it("does not skip ahead when an action is completed out of order", () => {
    const progress = createCoachMarkProgress(new MemoryStorage());

    progress.complete("drop-marble");

    expect(progress.getActiveStep()).toBe("choose-piece");
    expect(progress.getState().completed).toEqual([]);
  });

  it("remembers completed progress and dismissal in local storage", () => {
    const storage = new MemoryStorage();
    const firstVisit = createCoachMarkProgress(storage);

    firstVisit.complete("choose-piece");
    expect(createCoachMarkProgress(storage).getActiveStep()).toBe("place-piece");

    firstVisit.dismiss();
    expect(firstVisit.getActiveStep()).toBeNull();
    expect(createCoachMarkProgress(storage).getActiveStep()).toBeNull();
    expect(storage.getItem(COACH_MARK_STORAGE_KEY)).not.toBeNull();
  });

  it("ignores malformed or unknown saved progress", () => {
    const storage = new MemoryStorage();
    storage.setItem(COACH_MARK_STORAGE_KEY, "not-json");
    expect(createCoachMarkProgress(storage).getActiveStep()).toBe("choose-piece");

    storage.setItem(
      COACH_MARK_STORAGE_KEY,
      JSON.stringify({ completed: ["unknown-step"], dismissed: false }),
    );
    expect(createCoachMarkProgress(storage).getActiveStep()).toBe("choose-piece");
  });
});
