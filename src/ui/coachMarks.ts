import type { CoachMarkProgress, CoachMarkStep } from "./coachMarkState";
import { createCoachMarkProgress } from "./coachMarkState";

interface CoachMarkCopy {
  title: string;
  message: string;
}

const COACH_MARK_COPY: Record<CoachMarkStep, CoachMarkCopy> = {
  "choose-piece": {
    title: "Ready to build?",
    message: "Pick a piece below to add to your run.",
  },
  "place-piece": {
    title: "Now place it",
    message: "Drag the ghost onto the table, then tap to place it.",
  },
  "drop-marble": {
    title: "Watch it roll!",
    message: "Tap Drop marble to send a marble through your run.",
  },
};

export interface CoachMarks {
  refresh(): void;
  complete(step: CoachMarkStep): void;
  dismiss(): void;
}

/** Small, optional first-run hints that never take over the play surface. */
export function createCoachMarks(
  root: HTMLElement,
  progress: CoachMarkProgress = createCoachMarkProgress(),
): CoachMarks {
  const container = document.createElement("aside");
  container.id = "coach-marks";
  container.setAttribute("aria-label", "Build tips");
  container.setAttribute("aria-live", "polite");

  const card = document.createElement("div");
  card.className = "coach-mark";

  const copy = document.createElement("div");
  copy.className = "coach-mark-copy";

  const title = document.createElement("strong");
  title.className = "coach-mark-title";
  copy.appendChild(title);

  const message = document.createElement("span");
  message.className = "coach-mark-message";
  copy.appendChild(message);

  const dismissButton = document.createElement("button");
  dismissButton.className = "coach-mark-dismiss";
  dismissButton.type = "button";
  dismissButton.textContent = "×";
  dismissButton.setAttribute("aria-label", "Hide build tips");
  dismissButton.addEventListener("click", () => {
    progress.dismiss();
    render();
  });

  card.append(copy, dismissButton);
  container.appendChild(card);
  root.appendChild(container);

  function render(): void {
    const step = progress.getActiveStep();
    container.hidden = step === null;
    if (!step) return;

    const stepCopy = COACH_MARK_COPY[step];
    container.dataset.step = step;
    title.textContent = stepCopy.title;
    message.textContent = stepCopy.message;
  }

  render();

  return {
    refresh: render,
    complete: (step) => {
      progress.complete(step);
      render();
    },
    dismiss: () => {
      progress.dismiss();
      render();
    },
  };
}
