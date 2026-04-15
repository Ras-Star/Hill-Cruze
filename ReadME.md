# Hill Cruze

Hill Cruze is a browser-based survival cycling game built around a Phaser 3 run loop with a lightweight HTML shell for staging, HUD framing, and mobile controls. The current direction is "motorsport safari": fast, high-contrast, biome-driven, and survival-focused instead of app-like or Bootstrap-heavy.

## Stack And How It Is Used

- `Phaser 3`
  Used for the actual game. Phaser owns the loading flow, background rendering, track drawing, player motion, obstacle and pickup spawning, collision detection, survival pacing, biome transitions, and in-canvas overlay scenes such as menu, pause, milestone, and game over.

- `Bootstrap 5`
  Used as a layout helper, not as the visual identity of the game. Bootstrap provides containers, spacing utilities, responsive helpers, and Bootstrap Icons, while the buttons, chips, panels, HUD cards, loaders, and mobile controls are styled by the project's own CSS.

- `Native ES modules`
  Used to keep the runtime split into clear browser-side modules. `js/config.js` defines game data and tuning, `js/storage.js` handles persistence, `js/landing.js` drives the hub page, and `js/game/main.js` plus `js/game/scenes.js` boot and run the Phaser experience.

- `Node.js local dev server`
  Used through `tools/serve.mjs` to serve the project locally so browser ES modules, assets, and page-to-page navigation work correctly during development.

- `Sharp`
  Used only in the asset pipeline. `tools/fetch-backgrounds.mjs` uses Sharp to convert curated background references into optimized local WebP files for the biome system.

- `localStorage`
  Used for player persistence under the `hillCruzeProfileV2` key. The stored profile keeps best score, longest distance, total tokens, unlocked cosmetics, and the currently selected rider, bike, badge, and background pack.

## Runtime Architecture

- `index.html`
  The staging hub. This page shows progression, lets the player pick unlocked cosmetics, previews the selected biome pack, and launches the run.

- `game.html`
  The gameplay shell. This page hosts the Phaser canvas, the slim HUD frame, the loader overlay, the status strip, and the mobile touch controls.

- `js/game/scenes.js`
  The gameplay core. This file contains the boot/preload scenes plus the survival runner itself, including lane logic, hazards, rewards, warning telegraphs, and biome progression.

- `js/game/main.js`
  The browser bridge between DOM and Phaser. It initializes the game, binds keyboard and touch input, listens to `hill-cruze:*` events, and updates the HUD and loader state.

- `js/landing.js`
  The hub controller. It renders the card-based loadout options and progression rail using the same stored profile data as the game runtime.

## Project Structure

- `assets/backgrounds/` - local biome backgrounds and source records
- `assets/sprites/` - local SVG sprites and source notes
- `js/config.js` - world tuning, biome catalog, cosmetic catalog, defaults, and unlock data
- `js/storage.js` - profile reads, writes, unlock progression, and selection updates
- `tools/serve.mjs` - local static dev server
- `tools/fetch-backgrounds.mjs` - background download and conversion tool

## Requirements

- Node.js 18 or later

## Installation

```bash
npm install
```

## Running The Game

Start the local server:

```bash
npm start
```

Then open:

```text
http://localhost:8080
```

This is the recommended way to run the project because the game depends on ES modules, local assets, and page-to-page browser loading behavior.

## Refreshing Background Assets

Re-download and convert the curated biome backgrounds:

```bash
npm run fetch:backgrounds
```

This refreshes:

- `assets/backgrounds/*.webp`
- `assets/backgrounds/sources.json`

Reference links are documented in `assets/backgrounds/SOURCES.md`, and sprite/source notes live in `assets/sprites/SOURCES.md`.

## Controls

Desktop:

- `Left / Right` or `A / D` - move between lanes
- `Up / W / Space` - jump low hazards
- `Down / S` - duck branches
- `Shift` - boost while stamina lasts
- `Esc` - pause or resume

Mobile:

- Left thumb cluster - steer lanes
- Right thumb cluster - jump, duck, and boost

## Game Flow

1. Open the hub on `index.html`.
2. Pick an unlocked rider, bike, badge, and staging pack.
3. Start a run from `game.html`.
4. Survive hazards, collect tokens, and manage stamina.
5. Hit biome milestones and progression unlocks.
6. Bank the results back into the persistent profile.
