# Hill Cruze

Hill Cruze is a browser-based endless cyclist game. The player rides a fixed side-view cyclist across a scrolling hilly track, jumps ground hazards, ducks high hazards, collects coins, boosts with stamina, and pushes through color-driven scene changes during each run.

## Stack

- `Phaser 3`
  Powers the loader, menu, run loop, terrain drawing, cyclist motion, obstacle spawning, collision checks, scoring, pause, scene transitions, and game-over flow.

- `Native HTML, CSS, and ES modules`
  The hub, HUD, loader, touch controls, badge panels, and fixed-screen layouts are built as project-owned UI.

- `localStorage`
  Player progress is stored under `hillCruzeProfileV2`: best score, longest distance, total score, total distance, run count, coins collected, and unlocked badges.

## Game Flow

1. Open `index.html` to view the fixed-screen hub, ride record, and badge progression.
2. Use the How tab for controls and obstacle rules.
3. Launch `game.html`.
4. Start the ride from the Phaser start screen.
5. Bank score, distance, coins, and badge progress when the run ends.

## Controls

Desktop:

- `Space / Up / W` - jump
- `Down / S` - duck
- `Shift` - boost
- `Esc` - pause or resume

Mobile:

- Tap or use the Jump control to jump
- Hold or use the Duck control to duck
- Hold Boost to spend stamina

## Assets

Gameplay sprites are local SVGs in `assets/sprites/`. The cyclist is an original side-view SVG created for this project. Sprite notes live in `assets/sprites/SOURCES.md`.

Scene visuals are generated from color palettes in `js/config.js`.

Action sounds use selected CC0 Kenney effects in `assets/audio/sfx/`, with a Web Audio fallback for browsers that block asset playback before the first interaction. Audio source notes live in `assets/audio/SOURCES.md`.

## Running Locally

```bash
npm start
```

Open:

```text
http://localhost:8080
```

## Project Structure

- `index.html` - fixed-screen hub, badge progression, stats, and launch action
- `game.html` - fixed-screen game shell, HUD, loader, and touch controls
- `js/game/scenes.js` - Phaser gameplay scenes and side-scroller loop
- `js/game/main.js` - DOM-to-Phaser bridge, input binding, HUD updates
- `js/config.js` - world constants, run tuning, scene palettes, badge unlock data
- `js/storage.js` - localStorage profile handling and badge unlocks
- `style.css` - fixed-screen hub, HUD, controls, and visual styling
