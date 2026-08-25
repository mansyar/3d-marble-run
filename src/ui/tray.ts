import { PIECE_COLORS } from "../pieces/materials";
import { PIECE_TYPE_IDS, type PieceTypeId } from "../pieces/registry";

const PIECE_LABELS: Record<PieceTypeId, string> = {
  straight: "Straight",
  curve: "Curve",
  ramp: "Ramp",
  funnel: "Funnel",
  "goal-cup": "Goal cup",
  "start-gate": "Start gate",
};

export type TraySelection = PieceTypeId | "drop-point";
const DROP_POINT_LABEL = "Drop point";
const DROP_POINT_COLOR = 0x8338ec;

/**
 * Bottom tray HUD — one big tappable swatch per piece type.
 * Pure DOM; emits selection events upward.
 */

export function createTray(
  root: HTMLElement,
  onSelect: (selection: TraySelection | null) => void,
): { setActive: (selection: TraySelection | null) => void } {
  const tray = document.createElement("div");
  tray.id = "hud-tray";

  const buttons = new Map<TraySelection, HTMLButtonElement>();

  function addButton(selection: TraySelection, labelText: string, color: number): void {
    const btn = document.createElement("button");
    btn.className = "tray-btn";
    btn.type = "button";
    btn.dataset.typeId = selection;
    btn.setAttribute("aria-label", `Place ${labelText}`);
    const swatch = document.createElement("span");
    swatch.className = "tray-swatch";
    swatch.style.background = `#${color.toString(16).padStart(6, "0")}`;
    btn.appendChild(swatch);
    const label = document.createElement("span");
    label.className = "tray-label";
    label.textContent = labelText;
    btn.appendChild(label);
    btn.addEventListener("click", () => {
      const alreadyActive = btn.classList.contains("active");
      setActive(alreadyActive ? null : selection);
      onSelect(alreadyActive ? null : selection);
    });
    buttons.set(selection, btn);
    tray.appendChild(btn);
  }

  for (const typeId of Object.keys(PIECE_TYPE_IDS) as PieceTypeId[]) {
    if (typeId === "start-gate") continue;
    addButton(typeId, PIECE_LABELS[typeId], PIECE_COLORS[typeId]);
  }
  addButton("drop-point", DROP_POINT_LABEL, DROP_POINT_COLOR);

  function setActive(typeId: TraySelection | null): void {
    for (const [id, btn] of buttons) {
      btn.classList.toggle("active", id === typeId);
    }
    tray.classList.toggle("placing", typeId !== null);
  }

  root.appendChild(tray);
  return { setActive };
}
