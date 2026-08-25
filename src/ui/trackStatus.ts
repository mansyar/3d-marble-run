import type { DropPointHealthStatus } from "../track/health";

const TRACK_STATUS_MESSAGES: Record<DropPointHealthStatus, string> = {
  "missing-drop-point": "Place a Drop point to drop marbles.",
  "no-landing": "Move the Drop point above a track piece.",
  "no-connected-goal": "Connect a Goal cup to the Drop point for a finish.",
  ready: "Run ready! Drop a marble.",
};

export function getTrackStatusMessage(status: DropPointHealthStatus): string {
  return TRACK_STATUS_MESSAGES[status];
}
