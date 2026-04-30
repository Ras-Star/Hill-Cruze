# Hill Cruze Deployment Guide

## Release Shape

Hill Cruze is a static browser game with `index.html` as the fixed-screen hub and `game.html` as the Phaser gameplay page.

## Required Stack

- Phaser 3 is loaded on `game.html` and runs the game scenes.
- Native HTML, CSS, and ES modules power the hub and shell UI.
- Local SVG assets are served from `assets/sprites/`.
- CC0 sound effects are served from `assets/audio/sfx/`.
- Progress is stored in browser `localStorage`.

## Local Smoke Test

```bash
npm start
```

Open:

```text
http://localhost:8080/
http://localhost:8080/game.html
```

## Static Hosting

Suitable hosts include Vercel, Netlify, GitHub Pages, S3 static hosting, and Azure Static Web Apps.

Deploy the full project folder and keep relative paths intact:

```text
/
|-- index.html
|-- game.html
|-- style.css
|-- package.json
|-- assets/
|   |-- sprites/
|-- js/
|   |-- config.js
|   |-- storage.js
|   |-- landing.js
|   |-- game/
|       |-- main.js
|       |-- scenes.js
|-- tools/
```

## Tester Checklist

- Load `index.html` and verify the hub fits in one viewport without scroll.
- Verify ride metrics, the How panel, stats, badges, and launch action.
- Launch `game.html` and verify loader, start screen, run, pause, restart, hub return, and game over.
- Test keyboard and touch controls.
- Verify collisions: jump clears rocks and crates; duck clears branches; wrong timing ends the run unless shield is active.
- Verify badge progression uses cumulative score and cumulative distance.
- Verify scene changes happen automatically during a run.
- Verify jump, coin, boost, powerup, impact, landing, and scene-shift sounds after the first user interaction.
- Test desktop, tablet, and phone viewport sizes.

## Deployment Status

Ready for production deployment.
