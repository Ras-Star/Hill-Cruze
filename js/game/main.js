import { WORLD, formatInteger, getBiome, getCatalogItem } from "../config.js";
import { getProfile } from "../storage.js";
import {
    BootScene,
    GameOverScene,
    MenuScene,
    MilestoneScene,
    PauseScene,
    PreloadScene,
    RunScene
} from "./scenes.js";

class InputController {
    constructor() {
        this.held = new Set();
        this.pressed = new Set();
    }

    set(action, active) {
        if (active) {
            if (!this.held.has(action)) this.pressed.add(action);
            this.held.add(action);
        } else {
            this.held.delete(action);
        }
    }

    isDown(action) {
        return this.held.has(action);
    }

    consume(action) {
        const value = this.pressed.has(action);
        this.pressed.delete(action);
        return value;
    }

    releaseAll() {
        this.held.clear();
        this.pressed.clear();
    }
}

function updateProfilePanel(profile) {
    document.getElementById("profileRider").textContent = getCatalogItem("riders", profile.selectedRider).label;
    document.getElementById("profileBike").textContent = getCatalogItem("bikes", profile.selectedBike).label;
    document.getElementById("profileBadge").textContent = getCatalogItem("badges", profile.selectedBadge).label;
    document.getElementById("profileBackground").textContent = getBiome(profile.selectedBackgroundPack).label;
}

function updateHud(detail) {
    document.getElementById("hudScore").textContent = formatInteger(detail.score);
    document.getElementById("hudDistance").textContent = `${formatInteger(detail.distance)} m`;
    document.getElementById("hudCoins").textContent = formatInteger(detail.coins);
    document.getElementById("hudSpeed").textContent = `${formatInteger(detail.speed)} km/h`;
    document.getElementById("hudBiome").textContent = detail.biome;
    document.getElementById("hudStaminaLabel").textContent = `${Math.round(detail.stamina)}%`;
    document.getElementById("hudStaminaFill").style.width = `${detail.stamina}%`;

    const container = document.getElementById("hudPowerups");
    container.innerHTML = "";
    if (!detail.powerups.length) {
        container.innerHTML = `<span class="text-light-emphasis small">No active boosts</span>`;
        return;
    }

    detail.powerups.forEach((powerup) => {
        const pill = document.createElement("span");
        pill.className = "powerup-pill";
        pill.textContent = powerup;
        container.appendChild(pill);
    });
}

function updatePauseButton(mode) {
    const button = document.getElementById("pauseToggleBtn");
    if (!button) return;

    if (mode === "run") {
        button.disabled = false;
        button.innerHTML = `<i class="bi bi-pause-circle me-2"></i>Pause`;
        return;
    }

    if (mode === "paused") {
        button.disabled = false;
        button.innerHTML = `<i class="bi bi-play-circle me-2"></i>Resume`;
        return;
    }

    button.disabled = true;
    button.innerHTML = `<i class="bi bi-pause-circle me-2"></i>Pause`;
}

function bindKeyboard(controller) {
    const map = {
        ArrowLeft: "left",
        KeyA: "left",
        ArrowRight: "right",
        KeyD: "right",
        ArrowUp: "jump",
        KeyW: "jump",
        Space: "jump",
        ArrowDown: "duck",
        KeyS: "duck",
        ShiftLeft: "boost",
        ShiftRight: "boost"
    };

    window.addEventListener("keydown", (event) => {
        const action = map[event.code];
        if (action) {
            controller.set(action, true);
            event.preventDefault();
        }
    });

    window.addEventListener("keyup", (event) => {
        const action = map[event.code];
        if (action) controller.set(action, false);
    });

    window.addEventListener("blur", () => controller.releaseAll());
}

function bindMobileControls(controller) {
    document.querySelectorAll("[data-action]").forEach((button) => {
        const action = button.dataset.action;
        const press = (active) => (event) => {
            controller.set(action, active);
            event.preventDefault();
        };

        button.addEventListener("pointerdown", press(true));
        button.addEventListener("pointerup", press(false));
        button.addEventListener("pointercancel", press(false));
        button.addEventListener("pointerleave", press(false));
    });
}

function togglePause(game) {
    if (game.scene.isActive("GameOverScene")) return;
    if (!game.scene.isActive("RunScene") && !game.scene.isPaused("RunScene")) return;
    const runScene = game.scene.getScene("RunScene");
    if (game.scene.isPaused("RunScene")) {
        if (game.scene.isActive("PauseScene")) game.scene.stop("PauseScene");
        game.scene.resume("RunScene");
        document.body.dataset.mode = "run";
        document.getElementById("gameStatus").textContent = "Ride resumed.";
    } else {
        game.scene.pause("RunScene");
        game.scene.launch("PauseScene", { startBiomeId: runScene.startBiomeId });
        document.body.dataset.mode = "paused";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const profile = getProfile();
    updateProfilePanel(profile);
    updatePauseButton("menu");

    const controls = new InputController();
    window.hillCruzeControls = controls;
    bindKeyboard(controls);
    bindMobileControls(controls);

    const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: "phaser-root",
        width: WORLD.width,
        height: WORLD.height,
        backgroundColor: "#0e1d2b",
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: WORLD.width,
            height: WORLD.height
        },
        scene: [BootScene, PreloadScene, MenuScene, RunScene, MilestoneScene, PauseScene, GameOverScene]
    });

    document.getElementById("pauseToggleBtn").addEventListener("click", () => togglePause(game));

    window.addEventListener("hill-cruze:toggle-pause", () => togglePause(game));
    window.addEventListener("hill-cruze:mode", (event) => {
        document.body.dataset.mode = event.detail.mode;
        updatePauseButton(event.detail.mode);
    });
    window.addEventListener("hill-cruze:status", (event) => {
        document.getElementById("gameStatus").textContent = event.detail.message;
    });
    window.addEventListener("hill-cruze:hud", (event) => updateHud(event.detail));
    window.addEventListener("hill-cruze:profile", (event) => updateProfilePanel(event.detail.profile));
});
