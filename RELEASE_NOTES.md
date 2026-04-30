# Hill Cruze Release Notes

## Overview

Hill Cruze is now a fixed-screen endless cyclist arcade game. The hub is compact, gameplay owns the full viewport, and progression is centered on cumulative score, cumulative distance, and badge unlocks.

## Gameplay

- Fixed side-view cyclist on one scrolling hilly track.
- Ground hazards are cleared by jumping.
- High hazards are cleared by ducking.
- Coins, shield, rush, and energy pickups remain part of the run loop.
- Boost uses stamina and rewards clean timing.
- Scene palettes change automatically from distance and run time.
- Game-over results bank score, distance, coins, runs, and badge progress.
- CC0 Kenney sound effects now play for jumps, coins, landings, boosts, powerups, impacts, and scene shifts, with generated fallback tones.

## UI

- `index.html` is a fixed-screen hub with Ride, How, Badges, and Stats panels.
- A How panel explains jump, duck, boost, coin, and scene-shift rules.
- `game.html` uses a lean HUD: score, distance, speed, boost, warning, and countdown.
- Hub and gameplay UI now use project-owned fixed-screen styling.
- Theme selection and duplicated progression copy have been removed.

## Progression

- Badges unlock from cumulative score and cumulative distance.
- The active badge is shown in the hub.
- Coins are still collected and tracked, but they are not the current reward gate.
