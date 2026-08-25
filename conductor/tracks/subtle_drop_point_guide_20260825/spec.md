# Specification: Subtle Drop Point Guide

## Overview

Replace the current thick translucent vertical Drop point cylinder with a thin
dotted guide. The guide remains full-height from the overhead Drop point marker
to the detected landing surface, preserving spatial clarity while reducing
visual weight.

## Functional Requirements

1. Keep the violet Drop point marker unchanged.
2. Render the vertical landing guide as a thin sequence of subtle teal dots.
3. Span the dotted guide from the Drop point to the current landing surface.
4. Continue updating the guide during Drop point movement and track edits.
5. Hide the dotted guide when no valid landing exists.
6. Preserve existing landing-raycast, readiness, spawning, persistence, and
   cleanup behavior.
7. Keep the guide lightweight and readable on desktop and mobile.

## Non-Functional Requirements

- Remain fully procedural and offline.
- Preserve accessibility, touch behavior, reduced-motion behavior, and bundle
  limits.
- Follow existing TypeScript, Three.js, and Biome conventions.
- Verify visually on desktop and a narrow mobile viewport.

## Acceptance Criteria

- A valid Drop point shows a full-height thin dotted guide ending at the landing
  surface.
- An invalid or missing landing hides the guide without hiding the marker.
- Moving the Drop point or editing track pieces updates the dotted endpoint
  continuously.
- Drop/Stream behavior and all existing tests remain unchanged.
- Desktop and mobile verification show no visual or runtime regressions.

## Out of Scope

Changes to landing detection, guide height/raycast limits, Drop point placement
rules, status copy, spawning, persistence, track geometry, or graph behavior.
