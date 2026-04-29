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

let gameInstance = null;

function updateProfilePanel(profile) {
    const rider = getCatalogItem("riders", profile.selectedRider).label;
    const bike = getCatalogItem("bikes", profile.selectedBike).label;
    const badge = getCatalogItem("badges", profile.selectedBadge).label;
    const background = getBiome(profile.selectedBackgroundPack).label;

    document.getElementById("profileRider").textContent = rider;
    document.getElementById("profileBike").textContent = bike;
    document.getElementById("profileBadge").textContent = badge;
    document.getElementById("profileBackground").textContent = background;
    document.getElementById("profileSummary").textContent = `${rider} / ${bike} / ${badge} / ${background}`;
}

function updateHud(detail) {
    document.getElementById("hudScore").textContent = formatInteger(detail.score);
    document.getElementById("hudDistance").textContent = `${formatInteger(detail.distance)} m`;
    document.getElementById("hudCoins").textContent = formatInteger(detail.coins);
    document.getElementById("hudSpeed").textContent = `${formatInteger(detail.speed)} km/h`;
    document.getElementById("hudBiome").textContent = detail.phase || detail.biome;
    document.getElementById("hudWarning").textContent = detail.warning || "Track clear";
    document.getElementById("hudStaminaLabel").textContent = `${Math.round(detail.stamina)}%`;
    document.getElementById("hudStaminaFill").style.width = `${detail.stamina}%`;
    document.getElementById("hudCountdown").textContent = detail.countdown || "";
    const biomeCardLabel = document.getElementById("hudBiomeLabel");
    if (biomeCardLabel) {
        biomeCardLabel.textContent = detail.phase ? detail.biome : "Biome";
    }
    const warningCard = document.getElementById("hudWarning");
    if (warningCard) {
        const warningText = detail.warning || "Track clear";
        const isDanger = /jump|duck|hot|find the lane|hold the gap|thread|pressure|brace/i.test(warningText);
        warningCard.dataset.state = isDanger ? "danger" : "clear";
        const gameStage = document.querySelector(".game-stage");
        if (gameStage) {
            gameStage.dataset.danger = isDanger ? "hot" : "clear";
        }
    }

    const container = document.getElementById("hudPowerups");
    container.innerHTML = "";
    if (!detail.powerups.length) {
        container.innerHTML = `<span class="hc-chip hc-chip--empty">No active boosts</span>`;
    } else {
        detail.powerups.forEach((powerup) => {
            const pill = document.createElement("span");
            pill.className = "hc-chip hc-chip--powerup";
            pill.textContent = powerup;
            container.appendChild(pill);
        });
    }
}

function applyStatus(detail = {}) {
    const toast = document.getElementById("hudToast");
    if (!toast) return;

    toast.dataset.tone = detail.tone || "info";
    document.getElementById("hudRunState").textContent = detail.label || "Course Status";
    document.getElementById("hudStatusText").textContent = detail.message || "Course ready.";
}

function updateLoader(detail = {}) {
    const loader = document.getElementById("gameLoader");
    if (!loader) return;

    const state = detail.state || "loading";
    const progress = typeof detail.progress === "number" ? Phaser.Math.Clamp(detail.progress, 0, 1) : null;

    loader.dataset.state = state;
    if (detail.label) document.getElementById("gameLoaderEyebrow").textContent = detail.label;
    if (detail.title) document.getElementById("gameLoaderTitle").textContent = detail.title;
    if (detail.message) document.getElementById("gameLoaderMessage").textContent = detail.message;

    if (progress !== null) {
        document.getElementById("gameLoaderFill").style.width = `${Math.round(progress * 100)}%`;
        document.getElementById("gameLoaderPercent").textContent = `${Math.round(progress * 100)}%`;
    }
}

function hideLoaderSoon() {
    window.setTimeout(() => updateLoader({ state: "hidden", progress: 1 }), 180);
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

    button.disabled = mode !== "run" && mode !== "paused";
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
        if (!action) return;
        controller.set(action, true);
        event.preventDefault();
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
        const setState = (active) => (event) => {
            button.classList.toggle("is-pressed", active);
            controller.set(action, active);
            if (active && typeof button.setPointerCapture === "function") {
                try {
                    button.setPointerCapture(event.pointerId);
                } catch {
                    // Ignore browsers that reject capture for synthetic interactions.
                }
            }
            event.preventDefault();
        };

        button.addEventListener("pointerdown", setState(true));
        button.addEventListener("pointerup", setState(false));
        button.addEventListener("pointercancel", setState(false));
        button.addEventListener("pointerleave", setState(false));
        button.addEventListener("lostpointercapture", () => {
            button.classList.remove("is-pressed");
            controller.set(action, false);
        });
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
        applyStatus({ label: "Run Live", message: "Ride resumed.", tone: "info" });
    } else {
        game.scene.pause("RunScene");
        game.scene.launch("PauseScene", { startBiomeId: runScene.startBiomeId });
        document.body.dataset.mode = "paused";
    }
}

async function waitForFonts() {
    if (!document.fonts?.ready) return;
    await Promise.race([
        document.fonts.ready.catch(() => undefined),
        new Promise((resolve) => window.setTimeout(resolve, 1200))
    ]);
}

async function initializeGame() {
    updateLoader({
        state: "loading",
        label: "Booting",
        title: "Preparing Hill Cruze",
        message: "Warming up the renderer, fonts, and run systems.",
        progress: 0.06
    });

    await waitForFonts();

    if (gameInstance) return gameInstance;

    gameInstance = new Phaser.Game({
        type: Phaser.AUTO,
        parent: "phaser-root",
        width: WORLD.width,
        height: WORLD.height,
        backgroundColor: "#08111a",
        render: {
            antialias: false,
            powerPreference: "high-performance",
            pixelArt: true,
            roundPixels: true,
            clearBeforeRender: true,
            premultipliedAlpha: true
        },
        fps: {
            target: 60,
            smoothStep: true,
            forceSetTimeOut: true
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: WORLD.width,
            height: WORLD.height,
            expandParent: false
        },
        physics: {
            default: false
        },
        scene: [BootScene, PreloadScene, MenuScene, RunScene, MilestoneScene, PauseScene, GameOverScene]
    });

    return gameInstance;
}

document.addEventListener("DOMContentLoaded", () => {
    const profile = getProfile();
    updateProfilePanel(profile);
    updatePauseButton("loading");
    applyStatus({ label: "Course Status", message: "Loading course assets.", tone: "info" });
    updateLoader({
        state: "loading",
        label: "Booting",
        title: "Preparing Hill Cruze",
        message: "Checking the page shell before the game boots.",
        progress: 0.02
    });

    const controls = new InputController();
    window.hillCruzeControls = controls;
    bindKeyboard(controls);
    bindMobileControls(controls);

    document.getElementById("pauseToggleBtn").addEventListener("click", () => {
        if (gameInstance) togglePause(gameInstance);
    });
    document.getElementById("gameLoaderRetry").addEventListener("click", () => window.location.reload());

    window.addEventListener("hill-cruze:toggle-pause", () => {
        if (gameInstance) togglePause(gameInstance);
    });
    window.addEventListener("hill-cruze:mode", (event) => {
        document.body.dataset.mode = event.detail.mode;
        updatePauseButton(event.detail.mode);
        if (event.detail.mode === "menu" || event.detail.mode === "run") hideLoaderSoon();
    });
    window.addEventListener("hill-cruze:status", (event) => applyStatus(event.detail));
    window.addEventListener("hill-cruze:hud", (event) => updateHud(event.detail));
    window.addEventListener("hill-cruze:profile", (event) => updateProfilePanel(event.detail.profile));
    window.addEventListener("hill-cruze:loader", (event) => updateLoader(event.detail));

    initializeGame().catch((error) => {
        console.error("Unable to initialize Hill Cruze.", error);
        updateLoader({
            state: "error",
            label: "Load Error",
            title: "Hill Cruze Could Not Start",
            message: "The game hit a startup error. Retry the load and check the console for details.",
            progress: 1
        });
        applyStatus({
            label: "Load Error",
            message: "Game startup failed. Retry the load.",
            tone: "warn"
        });
    });
});
