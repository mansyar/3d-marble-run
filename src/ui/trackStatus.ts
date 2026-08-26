import type { DropPointHealthStatus } from "../track/health";

const TRACK_STATUS_MESSAGES: Record<DropPointHealthStatus, string> = {
  "missing-drop-point": "Pick Drop point below to drop marbles.",
  "no-landing": "Move Drop point over a track piece.",
  "no-connected-goal": "Add a Goal cup to finish the run.",
  ready: "Ready! Drop a marble.",
};

export function getTrackStatusMessage(status: DropPointHealthStatus): string {
  return TRACK_STATUS_MESSAGES[status];
}
