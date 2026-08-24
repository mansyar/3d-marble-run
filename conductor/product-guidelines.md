# Marblescape — Product Guidelines

## Brand Identity

Marblescape feels like a physical toy set on a playroom table: **bold primary-colored plastic pieces on a warm wooden surface**. Digital but tactile — everything invites being touched.

## Visual Design

### Color System

- **World:** warm wood neutrals — soft tan play-surface, bright airy ambience
- **Pieces:** bold primaries; each piece *type* owns one color so players learn shapes by hue (straight · curve · ramp · funnel · cup)
- **Marble:** one signature glossy candy-glass look
- **UI:** light neutral panels, high-contrast text, accents borrowed from piece colors
- Rules: pieces always read clearly against the background; never rely on hue alone (shape differentiates too); ≤6 saturated hues on screen — neutrals carry everything else

### Lighting & Rendering

- Bright, soft, even lighting with gentle shadows — no dark corners, no murk
- Gloss comes from environment reflection; surfaces feel like polished toy plastic

### Typography & UI Chrome

- Rounded friendly sans-serif; large enough to read at arm's length on a phone
- **Minimal HUD:** piece tray at the bottom, a few icon buttons in a corner; everything else appears contextually near the current selection
- Touch targets ≥44px; icons self-explanatory, labels on hover (desktop)

## UX Principles

1. **Zero instructions** — first run opens on a small pre-built starter track; the Release button is obvious and irresistible
2. **Forgiveness everywhere** — undo is always available; deletion never scolds; mistakes cost nothing
3. **Direct manipulation** — drag pieces in 3D; ghost previews show exactly where a snap will land before you commit
4. **Context over chrome** — controls appear when relevant, vanish when not
5. **Instant gratification** — marbles can be running within seconds of first touch

## Copy & Voice

- **Friendly helper:** brief, warm, useful — *"Nice! Try a curve next."*
- Quiet celebration on micro-wins: first marble reaches a cup → pop + counter bounce
- Sentence case, kid-safe vocabulary, never walls of text
- Errors as gentle guidance: *"That port is busy — try this one."*

## Motion Personality

- **Bouncy & playful:** placement snaps overshoot-and-settle like real plastic clicking together; goal cups pop; counters bounce
- Marble motion stays strictly physical — juice *decorates* the simulation, never fakes it
- Respect `prefers-reduced-motion` where practical
