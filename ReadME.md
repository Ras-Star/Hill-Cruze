# Hill Cruze

Hill Cruze is now a Phaser-based endless cyclist game with a Bootstrap shell, milestone biome swaps, local WebP terrain backgrounds, and cosmetic meta-progression stored in `localStorage`.

## Stack

- Phaser 3 for scene-driven gameplay
- Bootstrap 5 for the landing shell and responsive UI framing
- Sharp for background fetching and WebP conversion

## Run Notes

Open `index.html` for the hub and `game.html` for the gameplay host.

Controls:

- `Left / Right` or `A / D`: steer
- `Up / W / Space`: jump
- `Down / S`: duck
- `Shift`: boost

## Background Assets

Terrain references are documented in [assets/backgrounds/SOURCES.md](assets/backgrounds/SOURCES.md).

To refresh the local WebP backgrounds:

```bash
npm run fetch:backgrounds
```

This command writes:

- `assets/backgrounds/*.webp`
- `assets/backgrounds/sources.json`

## Persistence

The game stores:

- best score
- longest distance
- total tokens
- unlocked riders, bikes, badges, and background packs
- current cosmetic selections

All profile data is saved under the `hillCruzeProfileV2` localStorage key.
