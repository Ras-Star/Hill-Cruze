# Hill Cruze

Hill Cruze is an endless cycling game built with Phaser 3 and a Bootstrap-based interface shell. The experience includes biome transitions, collectible tokens, persistent cosmetic rewards, and responsive controls for desktop and mobile.

## Tech Stack

- Phaser 3
- Bootstrap 5
- Native ES modules
- Sharp for converting curated terrain images to local WebP assets

## Project Structure

- `index.html` - landing page, profile summary, reward overview, and instructions
- `game.html` - gameplay host and responsive HUD shell
- `js/game/` - Phaser scenes and runtime entrypoint
- `js/config.js` - game tuning, biome data, unlock catalog, and defaults
- `js/storage.js` - localStorage profile persistence
- `assets/backgrounds/` - local WebP biome backgrounds and source records
- `tools/serve.mjs` - lightweight local development server
- `tools/fetch-backgrounds.mjs` - downloads and converts background images to WebP

## Requirements

- Node.js 18 or later

## Installation

```bash
npm install
```

## Running The Game

Start the local static server:

```bash
npm start
```

Then open:

```text
http://localhost:8080
```

This is the recommended way to run the project because the game uses ES modules and local assets.

## Refreshing Background Assets

To re-download the curated terrain references and convert them into optimized WebP files:

```bash
npm run fetch:backgrounds
```

This updates:

- `assets/backgrounds/*.webp`
- `assets/backgrounds/sources.json`

Reference links are also listed in `assets/backgrounds/SOURCES.md`.

## Controls

Desktop:

- `Left / Right` or `A / D` - move
- `Up / W / Space` - jump
- `Down / S` - duck
- `Shift` - boost
- `Esc` - pause

Mobile:

- Use the on-screen control buttons for movement, jump, duck, and boost

## Game Flow

1. Open the hub on `index.html`
2. Review instructions, profile progress, and unlocked cosmetics
3. Start a ride from `game.html`
4. Collect tokens, avoid hazards, and pass distance milestones
5. Reach new biomes during the run and earn milestone bonuses
6. Finish the ride and save results back into the local profile

## Persistence

Player progress is stored in the browser under the `hillCruzeProfileV2` localStorage key.

Saved data includes:

- best score
- longest distance
- total tokens earned
- unlocked riders, bikes, badges, and background packs
- selected cosmetic loadout

## Git Repository

Current connected remote:

```text
origin https://github.com/cruze-tech/Hill_Cruze-Downhill-Madness.git
```
