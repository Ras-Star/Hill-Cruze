# Hill Cruze

Hill Cruze is a browser-based endless cyclist game inspired by the Google Dino runner. The player rides a fixed side-view cyclist across a scrolling hilly track, jumps ground hazards, ducks high hazards, collects coins, boosts with stamina, and pushes through climate-themed scenery changes.

## Stack

- `Phaser 3`
  Phaser is the game engine. It owns the loader, tutorial/menu scene, side-scroller run loop, hilly terrain drawing, cyclist motion, jump/duck/boost state, obstacle and coin spawning, collision checks, scoring, climate transitions, pause, milestone, and game-over scenes.

- `Bootstrap 5`
  Bootstrap is the page shell and UI layer. It provides the responsive hub layout, game-page framing, grid/container utilities, buttons, and Bootstrap Icons. The visual identity, HUD, touch controls, panels, chips, loader, and progression cards are styled in `style.css`.

- `Native ES modules`
  Runtime code is split across `js/config.js`, `js/storage.js`, `js/landing.js`, `js/game/main.js`, and `js/game/scenes.js`.

- `localStorage`
  Player progress is stored under `hillCruzeProfileV2`: best score, longest distance, total coins, unlocked climate packs, and the selected opening climate.

## Game Flow

1. Open `index.html` to view best score, distance, total coins, rewards, and the selected climate pack.
2. Launch `game.html`.
3. Read the Phaser tutorial menu.
4. Start the run, survive hazards, collect coins, and use boost stamina.
5. Pause, restart, return to hub, or bank results on game over.

## Controls

Desktop:

- `Space / Up / W` - jump rocks, crates, and coin arcs
- `Down / S` - duck branches
- `Shift` - boost while stamina lasts
- `Esc` - pause or resume

Mobile:

- Tap the game canvas or Jump button to jump
- Hold the canvas or use the Duck button to duck
- Hold the Boost button to spend stamina

## Assets

Gameplay sprites are local SVGs in `assets/sprites/`. The cyclist is an original side-view SVG created for this project; no downloaded cyclist frame set is required. Sprite notes live in `assets/sprites/SOURCES.md`.

Biome backgrounds are local WebP files in `assets/backgrounds/`, with source records in `assets/backgrounds/SOURCES.md` and `assets/backgrounds/sources.json`.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the local server:

```bash
npm start
```

Open:

```text
http://localhost:8080
```

Use the local server for development because the app uses ES modules, local assets, and page-to-page browser navigation.

## Project Structure

- `index.html` - Bootstrap welcome hub, rewards, progression, and launch CTA
- `game.html` - Bootstrap game shell, HUD, loader, and touch controls
- `js/game/scenes.js` - Phaser gameplay scenes and side-scroller loop
- `js/game/main.js` - DOM-to-Phaser bridge, input binding, HUD updates
- `js/config.js` - world constants, run tuning, biome catalog, unlock data
- `js/storage.js` - localStorage profile handling and reward unlocks
- `style.css` - custom responsive UI and game shell styling
