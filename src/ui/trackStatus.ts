import type { TrackHealthStatus } from "../track/health";

const TRACK_STATUS_MESSAGES: Record<TrackHealthStatus, string> = {
  "missing-start": "Add a Start gate to drop marbles.",
  "no-connected-goal": "Connect a Goal cup to the Start gate for a finish.",
  ready: "Run ready! Drop a marble.",
};

export function getTrackStatusMessage(status: TrackHealthStatus): string {
  return TRACK_STATUS_MESSAGES[status];
}
