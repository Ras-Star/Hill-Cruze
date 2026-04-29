# Hill Cruze - Deployment Guide

## Release Shape

Hill Cruze is now a Dino-style side-scrolling cyclist game. Deploy it as a static browser app with `index.html` as the hub and `game.html` as the Phaser gameplay page.

## Required Stack

- Phaser 3 is loaded on `game.html` and runs the game scenes.
- Bootstrap 5 and Bootstrap Icons are loaded on the hub and game shell for responsive layout, buttons, and iconography.
- Local SVG and WebP assets are served from `assets/`.
- Progress is stored in browser `localStorage`.

## Local Smoke Test

```bash
npm install
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
├── index.html
├── game.html
├── style.css
├── package.json
├── assets/
│   ├── backgrounds/
│   └── sprites/
├── js/
│   ├── config.js
│   ├── storage.js
│   ├── landing.js
│   └── game/
│       ├── main.js
│       └── scenes.js
└── tools/
```

## Tester Checklist

- Load `index.html` and verify best score, distance, coins, rewards, and launch CTA.
- Launch `game.html` and verify loader, Phaser tutorial menu, run, pause, restart, hub return, and game over.
- Test keyboard controls: jump, duck, boost, pause.
- Test touch controls: Jump, Duck, Boost.
- Verify collisions: jump clears rocks and crates; duck clears branches; wrong timing ends the run unless shield is active.
- Verify rewards: coins update immediately, powerups activate, final coins persist.
- Verify climate changes: scenery shifts without changing obstacle rules.
- Test desktop, tablet, and phone viewport sizes.

## Known Notes

- Audio is not implemented yet.
- No cloud sync or leaderboard exists yet.
- The current cyclist is a project-owned SVG, documented in `assets/sprites/SOURCES.md`.

## Deployment Status

Ready for tester deployment.
