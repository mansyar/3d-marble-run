import type { CameraMode } from "../render/camera";
import { formatRunTime } from "../sim/timer";
import type { TrackHealthStatus } from "../track/health";
import { getTrackStatusMessage } from "./trackStatus";

export interface SimulationControlCallbacks {
  onDrop: () => void;
  onToggleStream: () => boolean;
  onToggleCamera: () => CameraMode;
  onReset: () => void;
  onAbout: () => void;
}

export interface SimulationControls {
  setStreamEnabled(enabled: boolean): void;
  setGoalCount(count: number): void;
  setTimerMs(elapsedMs: number): void;
  setTrackHealth(status: TrackHealthStatus): void;
  setCameraMode(mode: CameraMode): void;
  showGoalPop(): void;
}

/** Small, touch-sized controls for exercising the Phase 4 marble loop. */
export function createSimulationControls(
  root: HTMLElement,
  callbacks: SimulationControlCallbacks,
): SimulationControls {
  const panel = document.createElement("div");
  panel.id = "simulation-controls";

  const dropButton = document.createElement("button");
  dropButton.type = "button";
  dropButton.textContent = "Drop marble";
  dropButton.addEventListener("click", callbacks.onDrop);

  const streamButton = document.createElement("button");
  streamButton.type = "button";
  streamButton.textContent = "Stream: Off";
  streamButton.addEventListener("click", () => {
    setStreamLabel(callbacks.onToggleStream());
  });

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = "Reset";
  resetButton.addEventListener("click", callbacks.onReset);

  const cameraButton = document.createElement("button");
  cameraButton.type = "button";
  cameraButton.textContent = "Camera: Free";
  cameraButton.addEventListener("click", () => {
    setCameraLabel(callbacks.onToggleCamera());
  });

  const aboutButton = document.createElement("button");
  aboutButton.type = "button";
  aboutButton.textContent = "About";
  aboutButton.setAttribute("aria-haspopup", "dialog");
  aboutButton.setAttribute("aria-controls", "about-dialog");
  aboutButton.addEventListener("click", callbacks.onAbout);

  const goalCount = document.createElement("output");
  goalCount.id = "goal-count";
  goalCount.setAttribute("aria-live", "polite");
  goalCount.textContent = "Goals: 0";

  const timer = document.createElement("output");
  timer.id = "run-timer";
  timer.setAttribute("aria-label", "Run time");
  timer.textContent = "Time: 00:00.0";

  const trackStatus = document.createElement("output");
  trackStatus.id = "track-status";
  trackStatus.setAttribute("aria-label", "Track status");
  trackStatus.setAttribute("aria-live", "polite");

  panel.append(
    dropButton,
    streamButton,
    resetButton,
    cameraButton,
    aboutButton,
    goalCount,
    timer,
    trackStatus,
  );
  root.appendChild(panel);

  function setStreamLabel(enabled: boolean): void {
    streamButton.textContent = enabled ? "Stream: On" : "Stream: Off";
    streamButton.setAttribute("aria-pressed", String(enabled));
  }

  function setGoalCount(count: number): void {
    goalCount.textContent = `Goals: ${count}`;
  }

  function setTimerMs(elapsedMs: number): void {
    timer.textContent = `Time: ${formatRunTime(elapsedMs)}`;
  }

  function setTrackHealth(status: TrackHealthStatus): void {
    trackStatus.dataset.status = status;
    trackStatus.textContent = getTrackStatusMessage(status);
  }

  function setCameraLabel(mode: CameraMode): void {
    cameraButton.textContent = `Camera: ${mode === "free" ? "Free" : "Chase"}`;
    cameraButton.setAttribute("aria-pressed", String(mode === "chase"));
  }

  function showGoalPop(): void {
    const pop = document.createElement("div");
    pop.className = "goal-pop";
    pop.textContent = "+1 Goal!";
    root.appendChild(pop);
    window.setTimeout(() => pop.remove(), 900);
  }

  return {
    setStreamEnabled: setStreamLabel,
    setGoalCount,
    setTimerMs,
    setTrackHealth,
    setCameraMode: setCameraLabel,
    showGoalPop,
  };
}
