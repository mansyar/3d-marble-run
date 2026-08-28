import { getQualityMode, type QualityMode, setQualityMode } from "../core/quality";
import type { SceneHandle } from "../render/scene";

export interface QualityToggleDeps {
  sceneHandle: SceneHandle;
}

/**
 * Compact, persisted Auto/High quality toggle for the top HUD. Visual glue:
 * the mode lives in `core/quality` and the renderer caps in `SceneHandle`.
 */
export function createQualityToggle(root: HTMLElement, deps: QualityToggleDeps): void {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "quality-toggle";

  function render(): void {
    const isHigh = getQualityMode() === "high";
    const label = isHigh ? "Quality: High" : "Quality: Auto";
    button.textContent = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(isHigh));
  }

  button.addEventListener("click", () => {
    const next: QualityMode = getQualityMode() === "high" ? "auto" : "high";
    setQualityMode(next);
    deps.sceneHandle.applyQuality(next);
    render();
  });

  render();
  root.appendChild(button);
}
