export const COACH_MARK_STORAGE_KEY = "marblescape.coach-marks";

export const COACH_MARK_STEPS = ["choose-piece", "place-piece", "drop-marble"] as const;

export type CoachMarkStep = (typeof COACH_MARK_STEPS)[number];

export interface CoachMarkState {
  dismissed: boolean;
  completed: readonly CoachMarkStep[];
}

export interface CoachMarkStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface CoachMarkProgress {
  getState(): CoachMarkState;
  getActiveStep(): CoachMarkStep | null;
  complete(step: CoachMarkStep): CoachMarkState;
  dismiss(): CoachMarkState;
}

function createEmptyState(): CoachMarkState {
  return { dismissed: false, completed: [] };
}

function isCoachMarkStep(value: unknown): value is CoachMarkStep {
  return typeof value === "string" && (COACH_MARK_STEPS as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readState(storage: CoachMarkStorage | null): CoachMarkState {
  if (!storage) return createEmptyState();

  try {
    const raw = storage.getItem(COACH_MARK_STORAGE_KEY);
    if (!raw) return createEmptyState();

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return createEmptyState();

    const completed: CoachMarkStep[] = [];
    if (Array.isArray(parsed.completed)) {
      for (const value of parsed.completed) {
        if (isCoachMarkStep(value) && !completed.includes(value)) completed.push(value);
      }
    }

    return {
      dismissed: parsed.dismissed === true,
      completed,
    };
  } catch {
    return createEmptyState();
  }
}

function writeState(storage: CoachMarkStorage | null, state: CoachMarkState): void {
  if (!storage) return;

  try {
    storage.setItem(
      COACH_MARK_STORAGE_KEY,
      JSON.stringify({ dismissed: state.dismissed, completed: state.completed }),
    );
  } catch {
    // Coach marks are optional guidance and must not interrupt the build loop.
  }
}

export function getActiveCoachMarkStep(state: CoachMarkState): CoachMarkStep | null {
  if (state.dismissed) return null;
  return COACH_MARK_STEPS.find((step) => !state.completed.includes(step)) ?? null;
}

export function advanceCoachMark(state: CoachMarkState, step: CoachMarkStep): CoachMarkState {
  const activeStep = getActiveCoachMarkStep(state);
  if (activeStep !== step) return state;
  return { ...state, completed: [...state.completed, step] };
}

export function dismissCoachMarks(state: CoachMarkState): CoachMarkState {
  if (state.dismissed) return state;
  return { ...state, dismissed: true };
}

function getBrowserStorage(): CoachMarkStorage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createCoachMarkProgress(
  storage: CoachMarkStorage | null = getBrowserStorage(),
): CoachMarkProgress {
  let state = readState(storage);

  return {
    getState: () => state,
    getActiveStep: () => getActiveCoachMarkStep(state),
    complete: (step) => {
      const nextState = advanceCoachMark(state, step);
      if (nextState !== state) {
        state = nextState;
        writeState(storage, state);
      }
      return state;
    },
    dismiss: () => {
      const nextState = dismissCoachMarks(state);
      if (nextState !== state) {
        state = nextState;
        writeState(storage, state);
      }
      return state;
    },
  };
}
