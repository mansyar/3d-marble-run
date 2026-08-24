export interface SimulationControlCallbacks {
  onDrop: () => void;
  onToggleStream: () => boolean;
  onReset: () => void;
}

export interface SimulationControls {
  setStreamEnabled(enabled: boolean): void;
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

  panel.append(dropButton, streamButton, resetButton);
  root.appendChild(panel);

  function setStreamLabel(enabled: boolean): void {
    streamButton.textContent = enabled ? "Stream: On" : "Stream: Off";
    streamButton.setAttribute("aria-pressed", String(enabled));
  }

  return { setStreamEnabled: setStreamLabel };
}
