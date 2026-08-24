import { PIECE_COLORS } from "../pieces/materials";
import { PIECE_TYPE_IDS, type PieceTypeId } from "../pieces/registry";

/**
 * Bottom tray HUD — one big tappable swatch per piece type.
 * Pure DOM; emits selection events upward.
 */

export function createTray(
  root: HTMLElement,
  onSelect: (typeId: PieceTypeId | null) => void,
): { setActive: (typeId: PieceTypeId | null) => void } {
  const tray = document.createElement("div");
  tray.id = "hud-tray";

  const buttons = new Map<PieceTypeId, HTMLButtonElement>();

  for (const typeId of Object.keys(PIECE_TYPE_IDS) as PieceTypeId[]) {
    const btn = document.createElement("button");
    btn.className = "tray-btn";
    btn.type = "button";
    btn.dataset.typeId = typeId;
    btn.setAttribute("aria-label", `Place ${typeId}`);
    const swatch = document.createElement("span");
    swatch.className = "tray-swatch";
    swatch.style.background = `#${PIECE_COLORS[typeId].toString(16).padStart(6, "0")}`;
    btn.appendChild(swatch);
    const label = document.createElement("span");
    label.className = "tray-label";
    label.textContent = typeId;
    btn.appendChild(label);
    btn.addEventListener("click", () => {
      const alreadyActive = btn.classList.contains("active");
      setActive(alreadyActive ? null : typeId);
      onSelect(alreadyActive ? null : typeId);
    });
    buttons.set(typeId, btn);
    tray.appendChild(btn);
  }

  function setActive(typeId: PieceTypeId | null): void {
    for (const [id, btn] of buttons) {
      btn.classList.toggle("active", id === typeId);
    }
    tray.classList.toggle("placing", typeId !== null);
  }

  root.appendChild(tray);
  return { setActive };
}
