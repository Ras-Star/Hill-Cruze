# Hill Cruze - Tester Gameplay Rebuild

## Overview

Hill Cruze has been rebuilt as a Dino-style endless cyclist game. The old lane-based runner has been replaced with a side-view cyclist on one scrolling hilly track.

## Gameplay Changes

- Fixed side-view cyclist on the left side of the screen.
- Scrolling hilly terrain with a stable collision baseline.
- Ground hazards, rocks and crates, are cleared by jumping.
- High hazards, branches, are cleared by ducking.
- Coins spawn in lines and arcs with forgiving pickup bounds.
- Boost uses stamina and is meant for open stretches.
- Shield, rush, and energy powerups give clear active feedback.
- Speed ramps from score, distance, and run time.
- Climate scenes transition during a run and award coin bonuses.

## Controls

Desktop:

- `Space / Up / W` - jump
- `Down / S` - duck
- `Shift` - boost
- `Esc` - pause

Mobile:

- Tap the canvas or Jump button to jump.
- Hold the canvas or use the Duck button to duck.
- Hold Boost to spend stamina.

## UI And Documentation

- `index.html` now explains the side-scroller flow and progression.
- `game.html` HUD labels focus on score, distance, coins, speed, climate, and boost stamina.
- Touch controls are centered around Jump, Duck, and Boost.
- `ReadME.md` documents how Phaser powers the game loop and how Bootstrap powers the shell/UI.
- `assets/sprites/SOURCES.md` records that the cyclist is a project-owned SVG, with no downloaded cyclist frames shipped.

## Tester Checklist

- Start at `index.html`, launch `game.html`, and start from the Phaser tutorial menu.
- Verify jump clears rocks and crates.
- Verify duck clears branches.
- Verify wrong timing ends the run unless shield is active.
- Verify coins update the HUD and persist after game over.
- Verify powerups activate and expire.
- Verify pause, restart, hub return, and game-over flows.
- Test desktop, tablet, and phone viewports.
