import { BIOMES, RUN_CONFIG, WORLD, formatInteger, getBiome, getCatalogItem } from "../config.js";
import { applyRunResults, getProfile } from "../storage.js";

const PLAYER = {
    x: 360,
    groundY: 790,
    width: 276,
    height: 202,
    normalBounds: { x: -42, y: -154, width: 84, height: 132 },
    duckBounds: { x: -58, y: -84, width: 116, height: 58 }
};

const OBSTACLES = {
    rock: {
        key: "obstacle-rock",
        label: "Rock",
        action: "jump",
        width: 126,
        height: 84,
        y: PLAYER.groundY + 4,
        bounds: { x: -36, y: -56, width: 72, height: 44 },
        warning: "Jump rocks"
    },
    crate: {
        key: "obstacle-crate",
        label: "Crate",
        action: "jump",
        width: 138,
        height: 94,
        y: PLAYER.groundY + 6,
        bounds: { x: -40, y: -66, width: 80, height: 52 },
        warning: "Jump crates"
    },
    branch: {
        key: "obstacle-branch",
        label: "Branch",
        action: "duck",
        width: 240,
        height: 104,
        y: PLAYER.groundY - 166,
        bounds: { x: -88, y: -48, width: 176, height: 58 },
        warning: "Duck branches"
    }
};

const POWERUPS = {
    shield: { key: "powerup-shield", label: "Shield", duration: 12, accent: 0x7eb7ff },
    rush: { key: "powerup-rush", label: "Rush", duration: 7, accent: 0xffb347 },
    energy: { key: "powerup-energy", label: "Energy", duration: 3, accent: 0x82dd9e }
};

const PHASES = [
    { label: "Warmup", message: "Clean opening stretch.", threshold: 0 },
    { label: "Clean Reads", message: "Hazards are live.", threshold: 850 },
    { label: "Quick Rhythm", message: "The course is tightening.", threshold: 2300 },
    { label: "Mixed Timing", message: "The rhythm is changing faster.", threshold: 4600 },
    { label: "Redline", message: "Speed is high. Commit early and stay smooth.", threshold: 7600 }
];

function emit(eventName, detail) {
    window.dispatchEvent(new CustomEvent(`hill-cruze:${eventName}`, { detail }));
}

function biomeColor(biome) {
    return Phaser.Display.Color.HexStringToColor(biome.accent).color;
}

function mixColor(from, to, amount) {
    const t = Phaser.Math.Clamp(amount, 0, 1);
    const fromR = (from >> 16) & 255;
    const fromG = (from >> 8) & 255;
    const fromB = from & 255;
    const toR = (to >> 16) & 255;
    const toG = (to >> 8) & 255;
    const toB = to & 255;
    return Phaser.Display.Color.GetColor(
        Math.round(Phaser.Math.Linear(fromR, toR, t)),
        Math.round(Phaser.Math.Linear(fromG, toG, t)),
        Math.round(Phaser.Math.Linear(fromB, toB, t))
    );
}

function paintColorBackdrop(graphics, biome) {
    graphics.clear();

    const bands = 30;
    const bandHeight = Math.ceil(WORLD.height / bands);
    for (let index = 0; index < bands; index += 1) {
        const t = index / Math.max(1, bands - 1);
        const color = t < 0.58
            ? mixColor(biome.skyTop, biome.skyMid, t / 0.58)
            : mixColor(biome.skyMid, biome.skyBottom, (t - 0.58) / 0.42);
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, index * bandHeight, WORLD.width, bandHeight + 2);
    }

    graphics.fillStyle(biome.glow, 0.16);
    graphics.fillEllipse(WORLD.width * 0.76, WORLD.height * 0.23, 520, 240);
    graphics.fillStyle(0xffffff, 0.08);
    graphics.fillEllipse(WORLD.width * 0.78, WORLD.height * 0.22, 280, 112);
    graphics.fillStyle(biome.skyTop, 0.22);
    graphics.fillRect(0, 0, WORLD.width, WORLD.height * 0.18);

    for (let index = 0; index < 8; index += 1) {
        const x = index * 280 - 60;
        graphics.fillStyle(index % 2 === 0 ? 0xffffff : biome.glow, 0.035);
        graphics.fillTriangle(x, 0, x + 180, 0, x + 520, WORLD.height);
    }
}

function createColorBackdrop(scene, biome, depth = 0, alpha = 1) {
    const backdrop = scene.add.graphics().setDepth(depth).setAlpha(alpha);
    paintColorBackdrop(backdrop, biome);
    return backdrop;
}

class GameAudio {
    constructor(scene) {
        this.scene = scene;
        this.context = null;
        this.masterGain = null;
        this.enabled = Boolean(window.AudioContext || window.webkitAudioContext);
        this.assets = {
            jump: { key: "sfx-jump", volume: 0.3, rate: 1.08 },
            land: { key: "sfx-land", volume: 0.35, rate: 0.82 },
            coin: { key: "sfx-coin", volume: 0.38, rate: 1.18 },
            clear: { key: "sfx-clear", volume: 0.3, rate: 1.12 },
            powerup: { key: "sfx-powerup", volume: 0.4, rate: 1 },
            shield: { key: "sfx-shield", volume: 0.42, rate: 0.88 },
            hit: { key: "sfx-hit", volume: 0.46, rate: 0.78 },
            boost: { key: "sfx-boost", volume: 0.24, rate: 1.28 },
            theme: { key: "sfx-theme", volume: 0.42, rate: 0.92 }
        };
    }

    resume() {
        if (!this.enabled) return;
        if (!this.context) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContextClass();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = 0.16;
            this.masterGain.connect(this.context.destination);
        }
        if (this.context.state === "suspended") this.context.resume();
    }

    tone(frequency, duration, options = {}) {
        this.resume();
        if (!this.context) return;

        const {
            type = "sine",
            gain = 0.24,
            start = 0,
            endFrequency = frequency,
            attack = 0.012
        } = options;
        const now = this.context.currentTime + start;
        const oscillator = this.context.createOscillator();
        const envelope = this.context.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
        envelope.gain.setValueAtTime(0.0001, now);
        envelope.gain.exponentialRampToValueAtTime(gain, now + attack);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        oscillator.connect(envelope);
        envelope.connect(this.masterGain);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.03);
    }

    play(name) {
        const asset = this.assets[name];
        if (asset && this.scene?.cache?.audio?.exists(asset.key)) {
            try {
                this.scene.sound.play(asset.key, {
                    volume: asset.volume,
                    rate: asset.rate,
                    detune: 0
                });
                return;
            } catch {
                // Fall back to generated tones when browser audio playback is blocked.
            }
        }

        if (name === "jump") this.tone(240, 0.18, { type: "triangle", endFrequency: 620, gain: 0.16 });
        if (name === "land") this.tone(130, 0.11, { type: "sine", endFrequency: 70, gain: 0.18 });
        if (name === "coin") {
            this.tone(920, 0.08, { type: "sine", endFrequency: 1380, gain: 0.14 });
            this.tone(1460, 0.09, { type: "sine", start: 0.055, endFrequency: 1840, gain: 0.1 });
        }
        if (name === "clear") this.tone(520, 0.12, { type: "triangle", endFrequency: 780, gain: 0.11 });
        if (name === "powerup") {
            this.tone(380, 0.16, { type: "sine", endFrequency: 760, gain: 0.13 });
            this.tone(760, 0.16, { type: "sine", start: 0.08, endFrequency: 1140, gain: 0.11 });
        }
        if (name === "shield") this.tone(180, 0.22, { type: "sawtooth", endFrequency: 90, gain: 0.16 });
        if (name === "hit") this.tone(120, 0.26, { type: "sawtooth", endFrequency: 42, gain: 0.22 });
        if (name === "boost") this.tone(190, 0.18, { type: "square", endFrequency: 360, gain: 0.08 });
        if (name === "theme") {
            this.tone(330, 0.22, { type: "sine", gain: 0.1 });
            this.tone(495, 0.24, { type: "sine", start: 0.04, gain: 0.1 });
            this.tone(660, 0.28, { type: "sine", start: 0.08, gain: 0.1 });
        }
    }
}

function getProfileBiomeId(profile) {
    const index = Math.floor(((Number(profile.totalDistance) || 0) / 2200) + ((Number(profile.totalRuns) || 0) / 3)) % BIOMES.length;
    return BIOMES[index]?.id || BIOMES[0].id;
}

function syncResponsiveCamera(scene, options = {}) {
    const {
        focusX = WORLD.width / 2,
        focusY = WORLD.height / 2,
        anchorX = 0.5,
        anchorY = 0.5
    } = options;
    const camera = scene.cameras.main;
    const viewWidth = Math.max(1, scene.scale.width || WORLD.width);
    const viewHeight = Math.max(1, scene.scale.height || WORLD.height);
    const zoom = Math.max(viewWidth / WORLD.width, viewHeight / WORLD.height);
    const visibleWidth = viewWidth / zoom;
    const visibleHeight = viewHeight / zoom;
    const maxScrollX = Math.max(0, WORLD.width - visibleWidth);
    const maxScrollY = Math.max(0, WORLD.height - visibleHeight);

    camera.setZoom(zoom);
    camera.setScroll(
        Phaser.Math.Clamp(focusX - (visibleWidth * anchorX), 0, maxScrollX),
        Phaser.Math.Clamp(focusY - (visibleHeight * anchorY), 0, maxScrollY)
    );
}

function randomRange(range) {
    return Phaser.Math.Between(range[0], range[1]);
}

function createPanel(scene, x, y, width, height, options = {}) {
    const {
        fillColor = 0x06111c,
        fillAlpha = 0.84,
        strokeColor = 0xffffff,
        strokeAlpha = 0.16
    } = options;
    const container = scene.add.container(x, y);
    const shadow = scene.add.rectangle(0, 16, width, height, 0x000000, 0.18);
    const bg = scene.add.rectangle(0, 0, width, height, fillColor, fillAlpha).setStrokeStyle(2, strokeColor, strokeAlpha);
    const accent = scene.add.rectangle(0, (-height / 2) + 6, width * 0.84, 3, 0xffd166, 0.5);
    container.add([shadow, bg, accent]);
    return container;
}

function createButton(scene, x, y, label, onClick, options = {}) {
    const { width = 350, variant = "primary" } = options;
    const isPrimary = variant === "primary";
    const fill = isPrimary ? 0xffb347 : 0x0b1724;
    const textColor = isPrimary ? "#160d06" : "#f5f8ff";
    const container = scene.add.container(x, y);
    const shadow = scene.add.ellipse(0, 36, width * 0.68, 24, 0x000000, 0.22);
    const bg = scene.add.rectangle(0, 0, width, 70, fill, isPrimary ? 1 : 0.82).setStrokeStyle(2, 0xffffff, isPrimary ? 0.28 : 0.18);
    const shine = scene.add.rectangle((-width / 2) + 36, -2, 26, 78, 0xffffff, isPrimary ? 0.14 : 0.08).setAngle(16);
    const text = scene.add.text(0, 2, label, {
        fontFamily: "Teko",
        fontSize: "34px",
        fontStyle: "600",
        color: textColor
    }).setOrigin(0.5);

    container.add([shadow, bg, shine, text]);
    container.setSize(width, 70).setInteractive({ useHandCursor: true });
    container.on("pointerover", () => scene.tweens.add({ targets: container, scale: 1.025, y: y - 4, duration: 130, ease: "Quad.Out" }));
    container.on("pointerout", () => scene.tweens.add({ targets: container, scale: 1, y, duration: 130, ease: "Quad.Out" }));
    container.on("pointerdown", () => scene.tweens.add({ targets: container, scale: 0.98, y: y + 1, duration: 80, ease: "Quad.Out" }));
    container.on("pointerup", () => {
        scene.tweens.add({ targets: container, scale: 1.02, y: y - 3, duration: 100, ease: "Quad.Out" });
        onClick();
    });
    return container;
}

function createMiniStat(scene, x, y, label, value) {
    const container = scene.add.container(x, y);
    const bg = scene.add.rectangle(0, 0, 214, 96, 0xffffff, 0.08).setStrokeStyle(2, 0xffffff, 0.14);
    const labelText = scene.add.text(-84, -22, label, {
        fontFamily: "Sora",
        fontSize: "14px",
        fontStyle: "700",
        color: "#aebfd6"
    });
    const valueText = scene.add.text(-84, 8, value, {
        fontFamily: "Teko",
        fontSize: "42px",
        color: "#fff5df"
    });
    container.add([bg, labelText, valueText]);
    return container;
}

export class BootScene extends Phaser.Scene {
    constructor() {
        super("BootScene");
    }

    create() {
        emit("loader", {
            state: "loading",
            label: "Booting",
            title: "Preparing Hill Cruze",
            message: "Generating runner textures and initializing the renderer.",
            progress: 0.08
        });

        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0xffffff, 0.88)
            .fillEllipse(74, 66, 128, 62)
            .fillEllipse(154, 58, 152, 72)
            .fillEllipse(254, 74, 112, 48);
        g.generateTexture("cloud-strip", 320, 140);
        g.clear();

        g.fillStyle(0xffffff, 0.14).fillRect(0, 20, 260, 16).fillRect(24, 54, 210, 10).fillRect(62, 82, 150, 8);
        g.generateTexture("speed-lines", 260, 110);
        g.clear();

        g.fillStyle(0xffffff, 0.9).fillCircle(8, 8, 8);
        g.generateTexture("dust-dot", 16, 16);
        g.clear();

        g.fillStyle(0xffd866, 0.12).fillCircle(38, 38, 36);
        g.fillStyle(0xffd866, 0.24).fillCircle(38, 38, 26);
        g.generateTexture("reward-glow", 76, 76);
        g.clear();

        g.fillStyle(0xff5d68, 0.14).fillEllipse(62, 28, 124, 42);
        g.fillStyle(0xff5d68, 0.28).fillEllipse(62, 28, 86, 24);
        g.generateTexture("danger-glow", 124, 56);
        g.destroy();

        this.scene.start("PreloadScene");
    }
}

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");
    }

    preload() {
        emit("mode", { mode: "loading" });
        emit("status", { label: "Course Status", message: "Loading side-scroller assets.", tone: "info" });
        emit("loader", {
            state: "loading",
            label: "Loading",
            title: "Loading Runner Assets",
            message: "Preparing course art, cyclist, hazards, coins, and powerups.",
            progress: 0.12
        });

        syncResponsiveCamera(this);
        this.cameras.main.setBackgroundColor("#07111a");
        this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x07111a, 1);
        this.add.tileSprite(WORLD.width / 2, WORLD.height / 2, WORLD.width + 300, 120, "speed-lines").setAlpha(0.12);

        const title = this.add.text(WORLD.width / 2, WORLD.height / 2 - 92, "Loading Run", {
            fontFamily: "Teko",
            fontSize: "104px",
            color: "#fff7df"
        }).setOrigin(0.5);
        const status = this.add.text(WORLD.width / 2, WORLD.height / 2 - 10, "Preparing cyclist, hills, rewards, and hazards", {
            fontFamily: "Sora",
            fontSize: "22px",
            color: "#cedbea"
        }).setOrigin(0.5);
        const bar = this.add.rectangle(WORLD.width / 2 - 266, WORLD.height / 2 + 58, 0, 18, 0xffb347, 1).setOrigin(0, 0.5);
        this.add.rectangle(WORLD.width / 2, WORLD.height / 2 + 58, 540, 18, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.12);
        const percent = this.add.text(WORLD.width / 2, WORLD.height / 2 + 120, "0%", {
            fontFamily: "Teko",
            fontSize: "52px",
            color: "#ffdca0"
        }).setOrigin(0.5);

        this.load.on("progress", (value) => {
            bar.width = 532 * value;
            percent.setText(`${Math.round(value * 100)}%`);
            emit("loader", {
                state: "loading",
                label: "Loading",
                title: "Loading Runner Assets",
                message: "Preparing course art, cyclist, hazards, coins, and powerups.",
                progress: 0.12 + (value * 0.78)
            });
        });

        this.load.on("loaderror", (file) => {
            emit("loader", {
                state: "error",
                label: "Load Error",
                title: "Asset Load Failed",
                message: `Unable to load ${file.key}. Retry the page load.`,
                progress: 1
            });
            emit("status", { label: "Load Error", message: `Asset load failed for ${file.key}. Retry the page load.`, tone: "warn" });
        });

        this.load.on("complete", () => {
            title.setText("Ready");
            status.setText("Opening the start screen");
            emit("loader", {
                state: "loading",
                label: "Ready",
                title: "Course Ready",
                message: "Opening the start screen.",
                progress: 1
            });
            this.time.delayedCall(180, () => this.scene.start("MenuScene"));
        });

        this.load.svg("cyclist", "assets/sprites/cyclist.svg");
        this.load.svg("coin", "assets/sprites/coin.svg");
        this.load.svg("obstacle-rock", "assets/sprites/obstacle-rock.svg");
        this.load.svg("obstacle-crate", "assets/sprites/obstacle-crate.svg");
        this.load.svg("obstacle-branch", "assets/sprites/obstacle-branch.svg");
        this.load.svg("powerup-shield", "assets/sprites/powerup-shield.svg");
        this.load.svg("powerup-rush", "assets/sprites/powerup-rush.svg");
        this.load.svg("powerup-energy", "assets/sprites/powerup-energy.svg");
        this.load.audio("sfx-jump", "assets/audio/sfx/select_001.ogg");
        this.load.audio("sfx-land", "assets/audio/sfx/drop_001.ogg");
        this.load.audio("sfx-coin", "assets/audio/sfx/confirmation_001.ogg");
        this.load.audio("sfx-clear", "assets/audio/sfx/tick_001.ogg");
        this.load.audio("sfx-powerup", "assets/audio/sfx/pluck_001.ogg");
        this.load.audio("sfx-shield", "assets/audio/sfx/switch_001.ogg");
        this.load.audio("sfx-hit", "assets/audio/sfx/error_001.ogg");
        this.load.audio("sfx-boost", "assets/audio/sfx/switch_001.ogg");
        this.load.audio("sfx-theme", "assets/audio/sfx/confirmation_001.ogg");
    }
}

export class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    create() {
        const profile = getProfile();
        const biome = getBiome(getProfileBiomeId(profile));
        const activeBadge = getCatalogItem("badges", profile.selectedBadge);

        emit("mode", { mode: "menu" });
        emit("profile", { profile });
        emit("status", { label: "Ready", message: "Course ready.", tone: "info" });
        emit("hud", {
            score: 0,
            distance: 0,
            coins: 0,
            speed: 0,
            stamina: 100,
            biome: biome.label,
            phase: "Ready",
            warning: "Clear track",
            countdown: "",
            powerups: []
        });

        syncResponsiveCamera(this, { focusX: WORLD.width * 0.5, focusY: 430, anchorX: 0.5, anchorY: 0.48 });
        this.scale.on("resize", this.handleResize, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));

        createColorBackdrop(this, biome, 0);
        this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x030812, 0.52);
        this.add.tileSprite(WORLD.width / 2, 154, WORLD.width + 260, 140, "cloud-strip").setTint(0xffffff).setAlpha(0.22);

        this.drawMenuGround(biome);
        const cyclist = this.add.sprite(410, PLAYER.groundY, "cyclist").setOrigin(0.5, 1).setDisplaySize(PLAYER.width, PLAYER.height).setDepth(7);
        this.tweens.add({ targets: cyclist, y: PLAYER.groundY - 8, duration: 520, yoyo: true, repeat: -1, ease: "Sine.InOut" });

        this.add.text(118, 130, "Hill Cruze", {
            fontFamily: "Teko",
            fontSize: "142px",
            color: "#fff7df"
        }).setDepth(8);
        this.add.text(124, 242, "Endless cyclist arcade.", {
            fontFamily: "Sora",
            fontSize: "28px",
            color: "#dce7f6"
        }).setDepth(8);

        createPanel(this, 1262, 512, 780, 520, {
            fillColor: 0x07111c,
            fillAlpha: 0.84,
            strokeColor: biomeColor(biome),
            strokeAlpha: 0.3
        }).setDepth(8);
        this.add.text(990, 290, "How To Play", {
            fontFamily: "Teko",
            fontSize: "78px",
            color: "#fff2d2"
        }).setDepth(9);

        const rules = [
            ["Jump", "Rocks and crates"],
            ["Duck", "Branches overhead"],
            ["Boost", "Open track only"]
        ];
        rules.forEach(([action, copy], index) => {
            const y = 404 + (index * 74);
            this.add.text(1010, y, action, {
                fontFamily: "Teko",
                fontSize: "38px",
                color: "#ffdca0"
            }).setDepth(9);
            this.add.text(1210, y + 7, copy, {
                fontFamily: "Sora",
                fontSize: "22px",
                color: "#d6e4f4"
            }).setDepth(9);
        });

        this.add.text(1000, 650, `Best: ${formatInteger(profile.bestScore)}   Longest: ${formatInteger(profile.longestDistance)} m   Badge: ${activeBadge.label}`, {
            fontFamily: "Sora",
            fontSize: "20px",
            color: "#aebfd6",
        }).setDepth(9);

        let started = false;
        const startRide = () => {
            if (started) return;
            started = true;
            this.scene.start("RunScene", { startBiomeId: biome.id });
        };

        createButton(this, 1262, 750, "Start Ride", startRide, { width: 390 }).setDepth(9);
        this.input.keyboard.once("keydown-SPACE", startRide);
        this.input.once("pointerup", startRide);
    }

    handleResize() {
        syncResponsiveCamera(this, { focusX: WORLD.width * 0.5, focusY: 430, anchorX: 0.5, anchorY: 0.48 });
    }

    drawMenuGround(biome) {
        const g = this.add.graphics().setDepth(4);
        g.fillStyle(biome.ridgeTint, 0.82);
        g.beginPath();
        g.moveTo(0, PLAYER.groundY + 28);
        for (let x = 0; x <= WORLD.width; x += 52) {
            const y = PLAYER.groundY + 12 + Math.sin(x * 0.009) * 26 + Math.sin(x * 0.019) * 10;
            g.lineTo(x, y);
        }
        g.lineTo(WORLD.width, WORLD.height);
        g.lineTo(0, WORLD.height);
        g.closePath();
        g.fillPath();
        g.lineStyle(8, biome.laneTint, 0.92);
        g.beginPath();
        for (let x = 0; x <= WORLD.width; x += 52) {
            const y = PLAYER.groundY + Math.sin(x * 0.009) * 26 + Math.sin(x * 0.019) * 10;
            if (x === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
        }
        g.strokePath();
    }
}

export class RunScene extends Phaser.Scene {
    constructor() {
        super("RunScene");
    }

    init(data) {
        this.profile = getProfile();
        this.startBiomeId = data.startBiomeId || getProfileBiomeId(this.profile);
    }

    create() {
        this.audio = new GameAudio(this);
        this.controls = window.hillCruzeControls;
        this.keys = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            shift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            esc: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        };

        this.currentBiomeIndex = Math.max(0, BIOMES.findIndex((biome) => biome.id === this.startBiomeId));
        this.nextBiomeIndex = this.currentBiomeIndex;
        this.entities = [];
        this.score = 0;
        this.distance = 0;
        this.coins = 0;
        this.elapsed = 0;
        this.runTime = 0;
        this.currentSpeed = 0;
        this.speedPulse = 0;
        this.stamina = 100;
        this.playerY = PLAYER.groundY;
        this.velocityY = 0;
        this.grounded = true;
        this.ducking = false;
        this.boosting = false;
        this.finished = false;
        this.hazardsLive = false;
        this.phaseIndex = 0;
        this.lastPhaseIndex = 0;
        this.terrainOffset = 0;
        this.cloudOffset = 0;
        this.coinTimer = 420;
        this.obstacleTimer = 2100;
        this.powerupTimer = 5400;
        this.dustTimer = 0;
        this.hudTimer = 0;
        this.themeSegment = 0;
        this.powerTimers = { shield: 4.5, rush: 0, energy: 0 };
        this.pointerDown = false;
        this.pointerDownAt = 0;
        this.pointerJumpQueued = false;
        this.lastWarning = "Get ready";

        this.createWorld();
        this.createPlayer();
        this.createInput();
        this.handleResize();
        this.scale.on("resize", this.handleResize, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));

        emit("mode", { mode: "run" });
        emit("profile", { profile: this.profile });
        emit("status", { label: "Ready", message: "Countdown started. Jump, duck, boost, collect coins.", tone: "info" });
        this.emitHud(true);
    }

    createWorld() {
        const biome = BIOMES[this.currentBiomeIndex];
        this.bg = createColorBackdrop(this, biome, 0);
        this.bgNext = createColorBackdrop(this, biome, 0.1, 0);
        this.tint = this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, biomeColor(biome), 0.06).setDepth(0.2);
        this.skyShade = this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x020610, 0.18).setDepth(0.25);
        this.cloudsFar = this.add.tileSprite(WORLD.width / 2, 150, WORLD.width + 360, 142, "cloud-strip").setDepth(1).setAlpha(0.24);
        this.cloudsNear = this.add.tileSprite(WORLD.width / 2, 250, WORLD.width + 360, 142, "cloud-strip").setDepth(1.1).setAlpha(0.16).setScale(1.28);
        this.hillBack = this.add.graphics().setDepth(2);
        this.track = this.add.graphics().setDepth(4);
        this.speedLines = this.add.tileSprite(WORLD.width / 2, 360, WORLD.width + 260, 110, "speed-lines").setDepth(5).setAlpha(0);
        this.drawTerrain();
    }

    createPlayer() {
        this.playerShadow = this.add.ellipse(PLAYER.x, PLAYER.groundY + 20, 184, 30, 0x000000, 0.24).setDepth(5.2);
        this.playerGroup = this.add.container(PLAYER.x, PLAYER.groundY).setDepth(8);
        this.player = this.add.sprite(0, 0, "cyclist").setOrigin(0.5, 1).setDisplaySize(PLAYER.width, PLAYER.height);

        this.wheelSprites = [];
        [-84, 82].forEach((x) => {
            const ring = this.add.circle(x, -48, 31).setStrokeStyle(4, 0xffffff, 0.24);
            const spokeA = this.add.rectangle(x, -48, 56, 3, 0xffffff, 0.26);
            const spokeB = this.add.rectangle(x, -48, 56, 3, 0xffffff, 0.2).setAngle(90);
            this.wheelSprites.push(spokeA, spokeB);
            this.playerGroup.add([ring, spokeA, spokeB]);
        });
        this.playerGroup.add(this.player);
    }

    createInput() {
        this.input.on("pointerdown", () => {
            this.audio?.resume();
            this.pointerDown = true;
            this.pointerDownAt = this.time.now;
        });
        this.input.on("pointerup", () => {
            const heldFor = this.time.now - this.pointerDownAt;
            if (heldFor > 0 && heldFor < 240) this.pointerJumpQueued = true;
            this.pointerDown = false;
            this.pointerDownAt = 0;
        });
        this.input.on("pointercancel", () => {
            this.pointerDown = false;
            this.pointerDownAt = 0;
        });
    }

    handleResize() {
        syncResponsiveCamera(this, {
            focusX: PLAYER.x,
            focusY: PLAYER.groundY,
            anchorX: 0.28,
            anchorY: 0.76
        });
    }

    update(_, deltaMs) {
        if (this.finished) return;
        const dt = Math.min(deltaMs / 1000, 0.04);

        if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) {
            window.dispatchEvent(new CustomEvent("hill-cruze:toggle-pause"));
            return;
        }

        this.elapsed += dt;
        const live = this.elapsed >= RUN_CONFIG.countdownDuration;
        if (live) {
            this.runTime += dt;
            this.hazardsLive = this.runTime >= RUN_CONFIG.warmupDuration;
        }

        this.updatePhase();
        this.updateMovement(dt, live);
        this.updateSpawning(dt, live);
        this.updateEntities(dt);
        this.updateTerrain(dt);
        this.updatePlayerVisual(dt);
        this.updateTheme();
        this.updatePowerTimers(dt);

        this.hudTimer -= deltaMs;
        if (this.hudTimer <= 0) {
            this.hudTimer = 45;
            this.emitHud();
        }
    }

    updatePhase() {
        const pressure = this.distance + (this.score * 0.18) + (this.runTime * 150);
        let nextPhase = 0;
        PHASES.forEach((phase, index) => {
            if (pressure >= phase.threshold) nextPhase = index;
        });
        this.phaseIndex = nextPhase;

        if (this.phaseIndex !== this.lastPhaseIndex) {
            this.lastPhaseIndex = this.phaseIndex;
            const phase = PHASES[this.phaseIndex];
            emit("status", { label: phase.label, message: phase.message, tone: this.phaseIndex > 1 ? "warn" : "info" });
        }
    }

    updateMovement(dt, live) {
        const wasBoosting = this.boosting;
        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(this.keys.up) ||
            Phaser.Input.Keyboard.JustDown(this.keys.w) ||
            Phaser.Input.Keyboard.JustDown(this.keys.space) ||
            this.controls?.consume("jump") ||
            this.pointerJumpQueued;
        this.pointerJumpQueued = false;

        const pointerHeldLong = this.pointerDown && (this.time.now - this.pointerDownAt > 260);
        const duckHeld =
            this.keys.down.isDown ||
            this.keys.s.isDown ||
            this.controls?.isDown("duck") ||
            pointerHeldLong;
        const boostHeld = this.keys.shift.isDown || this.controls?.isDown("boost");

        if (live && jumpPressed && this.grounded) {
            this.audio?.play("jump");
            this.velocityY = -RUN_CONFIG.jumpVelocity;
            this.grounded = false;
            this.ducking = false;
            this.spawnDustBurst(PLAYER.x - 18, PLAYER.groundY + 4, 0xd8b06d, 8, 42);
            emit("status", { label: "Jump", message: "Airborne. Clear rocks, crates, and coin arcs.", tone: "info" });
        }

        this.ducking = live && duckHeld && this.grounded;
        this.boosting = live && boostHeld && this.stamina > 1;
        if (this.boosting && !wasBoosting) this.audio?.play("boost");

        const rushBonus = this.powerTimers.rush > 0 ? 1.12 : 1;
        const baseSpeed = RUN_CONFIG.baseSpeed + Math.min(RUN_CONFIG.maxBonusSpeed, (this.distance * 0.22) + (this.runTime * 10));
        this.currentSpeed = live ? baseSpeed * rushBonus * (this.boosting ? RUN_CONFIG.boostMultiplier : 1) : 0;

        if (this.boosting) {
            this.stamina = Math.max(0, this.stamina - (36 * dt));
            this.speedPulse = Math.min(1, this.speedPulse + (dt * 5));
        } else {
            const recover = this.grounded && !this.ducking ? 18 : 11;
            this.stamina = Math.min(100, this.stamina + (recover * dt));
            this.speedPulse = Math.max(0, this.speedPulse - (dt * 3));
        }

        if (!this.grounded) {
            this.velocityY += RUN_CONFIG.gravity * dt;
            this.playerY += this.velocityY * dt;
            if (this.playerY >= PLAYER.groundY) {
                this.playerY = PLAYER.groundY;
                this.velocityY = 0;
                this.grounded = true;
                this.audio?.play("land");
                this.spawnDustBurst(PLAYER.x - 10, PLAYER.groundY + 8, 0xcaa06a, 9, 48);
            }
        }

        if (live) {
            this.distance += this.currentSpeed * dt * 0.075;
            this.score += this.currentSpeed * dt * (this.boosting ? 0.19 : 0.13);
        }
    }

    updateSpawning(dt, live) {
        if (!live) return;

        this.coinTimer -= dt * 1000;
        if (this.coinTimer <= 0) {
            this.spawnCoinPattern();
            this.coinTimer = Math.max(520, randomRange(RUN_CONFIG.coinInterval) - Math.min(160, this.phaseIndex * 28));
        }

        if (!this.hazardsLive) {
            this.obstacleTimer = Math.max(this.obstacleTimer - (dt * 1000), 980);
            return;
        }

        this.obstacleTimer -= dt * 1000;
        if (this.obstacleTimer <= 0) {
            this.spawnHazardPattern();
            const squeeze = Math.min(260, this.phaseIndex * 58 + this.runTime * 1.4);
            this.obstacleTimer = Math.max(820, randomRange(RUN_CONFIG.patternInterval) - squeeze);
        }

        this.powerupTimer -= dt * 1000;
        if (this.powerupTimer <= 0) {
            this.spawnPowerup();
            this.powerupTimer = randomRange(RUN_CONFIG.powerupInterval);
        }
    }

    spawnHazardPattern() {
        const groundType = Math.random() > 0.48 ? "rock" : "crate";
        const highType = "branch";

        if (this.phaseIndex <= 1) {
            this.spawnObstacle(Math.random() > 0.72 ? highType : groundType);
            return;
        }

        if (this.phaseIndex === 2) {
            const repeatType = Math.random() > 0.5 ? groundType : highType;
            this.spawnObstacle(repeatType, 0);
            if (Math.random() > 0.62) this.spawnObstacle(repeatType, 520);
            return;
        }

        const first = Math.random() > 0.5 ? groundType : highType;
        const second = first === highType ? groundType : highType;
        this.spawnObstacle(first, 0);
        if (Math.random() > 0.44) this.spawnObstacle(second, this.phaseIndex >= 4 ? 500 : 560);
    }

    spawnObstacle(type, extraX = 0) {
        const spec = OBSTACLES[type];
        const sprite = this.add.sprite(this.getSpawnX(170 + extraX), spec.y, spec.key)
            .setDisplaySize(spec.width, spec.height)
            .setDepth(type === "branch" ? 7.4 : 7.2);
        if (type !== "branch") sprite.setOrigin(0.5, 1);

        const glow = this.add.sprite(sprite.x, type === "branch" ? spec.y : PLAYER.groundY + 8, "danger-glow")
            .setDepth(6.4)
            .setAlpha(0.38)
            .setTint(0xff5d68);

        this.entities.push({
            kind: "obstacle",
            type,
            sprite,
            glow,
            x: sprite.x,
            cleared: false
        });
    }

    spawnCoinPattern() {
        const startX = this.getSpawnX(150);
        const count = this.phaseIndex < 2 ? 7 : Phaser.Math.Between(6, 10);
        const arc = this.phaseIndex > 0 && Math.random() > 0.38;
        const duckLine = this.phaseIndex > 2 && Math.random() > 0.74;

        for (let index = 0; index < count; index += 1) {
            const x = startX + (index * 82);
            let y = PLAYER.groundY - 150;
            if (arc) y -= Math.sin(index / Math.max(1, count - 1) * Math.PI) * 96;
            if (duckLine) y = PLAYER.groundY - 94;
            this.spawnCoin(x, y, index);
        }
    }

    spawnCoin(x, y, index) {
        const sprite = this.add.sprite(x, y, "coin").setDepth(7.1).setScale(0.84);
        const glow = this.add.sprite(x, y, "reward-glow").setDepth(6.5).setTint(0xffd866).setAlpha(0.28).setScale(0.78);
        this.entities.push({
            kind: "coin",
            sprite,
            glow,
            x,
            baseY: y,
            phase: index * 0.58
        });
    }

    spawnPowerup() {
        const types = this.stamina < 38 ? ["energy", "energy", "shield", "rush"] : ["shield", "rush", "energy"];
        const type = Phaser.Utils.Array.GetRandom(types);
        const spec = POWERUPS[type];
        const x = this.getSpawnX(220);
        const y = PLAYER.groundY - 188;
        const sprite = this.add.sprite(x, y, spec.key).setDepth(7.3).setScale(0.92);
        const glow = this.add.sprite(x, y, "reward-glow").setDepth(6.5).setTint(spec.accent).setAlpha(0.36);
        this.entities.push({ kind: "powerup", type, sprite, glow, x, baseY: y, phase: Math.random() * 6 });
    }

    updateEntities(dt) {
        const playerBounds = this.getPlayerBounds();
        let nearestObstacle = null;

        this.entities = this.entities.filter((entity) => {
            entity.x -= this.currentSpeed * dt;
            if (entity.kind === "coin" || entity.kind === "powerup") {
                entity.sprite.x = entity.x;
                entity.sprite.y = entity.baseY + Math.sin((this.time.now * 0.006) + entity.phase) * 10;
                entity.sprite.rotation += dt * (entity.kind === "coin" ? 4.4 : 1.1);
                entity.glow.setPosition(entity.sprite.x, entity.sprite.y).setAlpha(entity.kind === "coin" ? 0.26 : 0.34);
            } else {
                entity.sprite.x = entity.x;
                entity.glow.setPosition(entity.x, entity.type === "branch" ? entity.sprite.y : PLAYER.groundY + 10);
                entity.glow.setAlpha(0.26 + Math.sin(this.time.now * 0.018) * 0.1);
            }

            if (entity.x < this.getDespawnX()) {
                this.destroyEntity(entity);
                return false;
            }

            if (entity.kind === "obstacle") {
                if (entity.x > PLAYER.x - 40 && (!nearestObstacle || entity.x < nearestObstacle.x)) nearestObstacle = entity;
                const bounds = this.getObstacleBounds(entity);
                if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, bounds)) {
                    if (this.isObstacleCleared(entity.type)) {
                        this.audio?.play("clear");
                        this.score += 70;
                        this.spawnImpact(entity.x, entity.type === "branch" ? entity.sprite.y : PLAYER.groundY - 32, entity.type === "branch" ? 0x7dc8ff : 0xffd166);
                        this.emitHud(true);
                        this.destroyEntity(entity);
                        return false;
                    }
                    this.handleObstacleHit(entity.type);
                    this.destroyEntity(entity);
                    return false;
                }
                return true;
            }

            if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.getPickupBounds(entity))) {
                if (entity.kind === "coin") {
                    this.audio?.play("coin");
                    this.coins += 1;
                    this.score += 40;
                    this.spawnImpact(entity.sprite.x, entity.sprite.y, 0xffd866);
                    if (this.coins <= 3 || this.coins % 10 === 0) {
                        emit("status", { label: "Coin", message: `${formatInteger(this.coins)} coins collected this run.`, tone: "reward" });
                    }
                } else {
                    this.audio?.play("powerup");
                    this.applyPowerup(entity.type);
                    this.spawnImpact(entity.sprite.x, entity.sprite.y, POWERUPS[entity.type].accent);
                }
                this.emitHud(true);
                this.destroyEntity(entity);
                return false;
            }

            return true;
        });

        this.lastWarning = this.getWarningText(nearestObstacle);
    }

    isObstacleCleared(type) {
        const spec = OBSTACLES[type];
        if (spec.action === "duck") return this.ducking;
        return !this.grounded && this.playerY < PLAYER.groundY - 44;
    }

    handleObstacleHit(type) {
        if (this.finished) return;

        if (this.powerTimers.shield > 0) {
            this.powerTimers.shield = 0;
            this.audio?.play("shield");
            this.cameras.main.flash(140, 126, 183, 255, false);
            this.spawnImpact(PLAYER.x, this.playerY - 80, 0x7eb7ff);
            emit("status", { label: "Shield Break", message: "Shield absorbed the hit. Keep riding.", tone: "boost" });
            return;
        }

        const spec = OBSTACLES[type];
        this.finished = true;
        this.audio?.play("hit");
        this.cameras.main.shake(180, 0.006);

        const results = applyRunResults({
            score: this.score,
            distance: this.distance,
            coins: this.coins
        });

        emit("mode", { mode: "gameover" });
        emit("profile", { profile: results.profile });
        emit("status", { label: "Run Complete", message: `${spec.warning}. Results banked to your profile.`, tone: "reward" });

        this.scene.launch("GameOverScene", {
            score: this.score,
            distance: this.distance,
            coins: this.coins,
            biome: BIOMES[this.currentBiomeIndex].label,
            phase: PHASES[this.phaseIndex].label,
            startBiomeId: this.startBiomeId,
            reason: spec.action === "duck" ? "Duck branches before impact." : "Jump ground hazards before impact.",
            unlockedThisRun: results.unlockedThisRun,
            nextUnlock: results.nextUnlock
        });
        this.scene.pause();
    }

    applyPowerup(type) {
        const spec = POWERUPS[type];
        this.powerTimers[type] = spec.duration;
        if (type === "energy") this.stamina = Math.min(100, this.stamina + 52);
        if (type === "shield") this.cameras.main.flash(120, 126, 183, 255, false);
        this.emitHud(true);
        emit("status", {
            label: spec.label,
            message: type === "shield"
                ? "Shield will absorb one failed obstacle hit."
                : type === "rush"
                    ? "Rush is live. Speed and scoring are boosted."
                    : "Energy refilled boost stamina.",
            tone: "boost"
        });
    }

    updatePowerTimers(dt) {
        Object.keys(this.powerTimers).forEach((key) => {
            this.powerTimers[key] = Math.max(0, this.powerTimers[key] - dt);
        });
    }

    updateTerrain(dt) {
        this.terrainOffset += this.currentSpeed * dt;
        this.cloudOffset += this.currentSpeed * dt * 0.1;
        this.cloudsFar.tilePositionX = this.cloudOffset * 0.45;
        this.cloudsNear.tilePositionX = this.cloudOffset * 0.82;
        this.speedLines.tilePositionX = this.terrainOffset * 1.65;
        this.speedLines.setAlpha(this.boosting ? 0.22 + (this.speedPulse * 0.22) : Math.max(0, this.speedLines.alpha - dt * 2));
        this.drawTerrain();
    }

    drawTerrain() {
        const biome = BIOMES[this.currentBiomeIndex];
        const back = this.hillBack;
        const track = this.track;
        back.clear();
        track.clear();

        back.fillStyle(biome.canopyTint, 0.48);
        back.beginPath();
        back.moveTo(0, 610);
        for (let x = 0; x <= WORLD.width + 80; x += 80) {
            const y = 610 + Math.sin((x + this.terrainOffset * 0.18) * 0.004) * 42 + Math.sin((x + this.terrainOffset * 0.11) * 0.011) * 20;
            back.lineTo(x, y);
        }
        back.lineTo(WORLD.width, WORLD.height);
        back.lineTo(0, WORLD.height);
        back.closePath();
        back.fillPath();

        track.fillStyle(biome.ridgeTint, 0.92);
        track.beginPath();
        track.moveTo(0, PLAYER.groundY + 28);
        for (let x = 0; x <= WORLD.width + 60; x += 42) {
            const y = this.getVisualGroundY(x);
            track.lineTo(x, y + 28);
        }
        track.lineTo(WORLD.width, WORLD.height);
        track.lineTo(0, WORLD.height);
        track.closePath();
        track.fillPath();

        track.lineStyle(8, biome.laneTint, 0.96);
        track.beginPath();
        for (let x = 0; x <= WORLD.width + 60; x += 42) {
            const y = this.getVisualGroundY(x);
            if (x === 0) track.moveTo(x, y);
            else track.lineTo(x, y);
        }
        track.strokePath();

        track.lineStyle(3, 0xffffff, 0.24);
        for (let x = -180 + (this.terrainOffset % 220); x < WORLD.width + 180; x += 220) {
            const y = this.getVisualGroundY(x);
            track.lineBetween(x, y - 12, x + 92, this.getVisualGroundY(x + 92) - 12);
        }
    }

    getVisualGroundY(x) {
        return PLAYER.groundY + Math.sin((x + this.terrainOffset) * 0.006) * 22 + Math.sin((x + this.terrainOffset) * 0.016) * 8;
    }

    updatePlayerVisual(dt) {
        const duckScale = this.ducking ? 0.66 : 1;
        const bob = this.grounded && !this.ducking ? Math.sin(this.time.now * 0.026) * 2.4 : 0;
        const lean = this.boosting ? -7 : this.ducking ? -10 : this.grounded ? Math.sin(this.time.now * 0.012) * 1.8 : -4;

        this.playerGroup.setPosition(PLAYER.x, this.playerY + bob);
        this.playerGroup.setScale(1, Phaser.Math.Linear(this.playerGroup.scaleY, duckScale, 0.22));
        this.playerGroup.setAngle(Phaser.Math.Linear(this.playerGroup.angle, lean, 0.2));
        this.playerShadow.setPosition(PLAYER.x, PLAYER.groundY + 22);
        this.playerShadow.setScale(this.grounded ? 1 : Phaser.Math.Clamp(1 - ((PLAYER.groundY - this.playerY) / 360), 0.42, 1), this.ducking ? 0.72 : 1);

        const spin = this.currentSpeed * dt * 0.09;
        this.wheelSprites.forEach((spoke, index) => {
            spoke.rotation += spin + (index % 2 ? spin * 0.2 : 0);
        });

        this.dustTimer -= dt;
        if (this.grounded && this.currentSpeed > 30 && this.dustTimer <= 0) {
            this.dustTimer = this.boosting ? 0.045 : 0.085;
            this.spawnDust(PLAYER.x - 116, PLAYER.groundY + 12, this.boosting ? 0xffd166 : 0xd4a15f);
        }
    }

    updateTheme() {
        const nextSegment = Math.floor((this.distance / RUN_CONFIG.milestoneSpacing) + (this.runTime / 24));
        if (nextSegment === this.themeSegment) return;

        this.themeSegment = nextSegment;
        this.nextBiomeIndex = (this.currentBiomeIndex + 1) % BIOMES.length;
        const biome = BIOMES[this.nextBiomeIndex];
        const bonus = 150 + (this.themeSegment * 35);
        this.score += bonus;
        this.audio?.play("theme");
        this.cameras.main.flash(180, (biome.glow >> 16) & 255, (biome.glow >> 8) & 255, biome.glow & 255, false);

        paintColorBackdrop(this.bgNext, biome);
        this.bgNext.setAlpha(0);
        this.tweens.add({
            targets: this.bgNext,
            alpha: 1,
            duration: 700,
            ease: "Sine.Out",
            onComplete: () => {
                paintColorBackdrop(this.bg, biome);
                this.bgNext.setAlpha(0);
                this.currentBiomeIndex = this.nextBiomeIndex;
                this.tint.setFillStyle(biomeColor(biome), 0.1);
                this.cloudsFar.setTint(biome.glow).setAlpha(0.28);
                this.cloudsNear.setTint(0xffffff).setAlpha(0.2);
            }
        });

        this.scene.launch("MilestoneScene", { biome, bonus });
        emit("status", { label: "Scene Shift", message: `${biome.label}. Momentum bonus added.`, tone: "reward" });
        this.emitHud(true);
    }

    getVisibleWorldBounds() {
        const camera = this.cameras.main;
        const zoom = camera.zoom || 1;
        return {
            left: camera.scrollX,
            right: camera.scrollX + ((this.scale.width || WORLD.width) / zoom)
        };
    }

    getSpawnX(padding = 160) {
        return this.getVisibleWorldBounds().right + padding;
    }

    getDespawnX(padding = 260) {
        return this.getVisibleWorldBounds().left - padding;
    }

    getPlayerBounds() {
        const spec = this.ducking ? PLAYER.duckBounds : PLAYER.normalBounds;
        return new Phaser.Geom.Rectangle(
            PLAYER.x + spec.x,
            this.playerY + spec.y,
            spec.width,
            spec.height
        );
    }

    getObstacleBounds(entity) {
        const spec = OBSTACLES[entity.type];
        return new Phaser.Geom.Rectangle(
            entity.sprite.x + spec.bounds.x,
            entity.sprite.y + spec.bounds.y,
            spec.bounds.width,
            spec.bounds.height
        );
    }

    getPickupBounds(entity) {
        const size = entity.kind === "coin" ? 82 : 104;
        return new Phaser.Geom.Rectangle(entity.sprite.x - (size / 2), entity.sprite.y - (size / 2), size, size);
    }

    getWarningText(nearestObstacle) {
        if (this.elapsed < RUN_CONFIG.countdownDuration) return "Get ready";
        if (!this.hazardsLive) return "Collect coins";
        if (!nearestObstacle) return "Track clear";
        const spec = OBSTACLES[nearestObstacle.type];
        if (nearestObstacle.x < PLAYER.x + 560 && nearestObstacle.x > PLAYER.x - 100) {
            return spec.action === "duck" ? "Duck now" : "Jump now";
        }
        return spec.warning;
    }

    getCountdownLabel() {
        const remaining = RUN_CONFIG.countdownDuration - this.elapsed;
        if (remaining > 0) return `${Math.ceil(remaining)}`;
        if (remaining > -0.42) return "GO";
        return "";
    }

    getActivePowerups() {
        return Object.entries(this.powerTimers)
            .filter(([, time]) => time > 0)
            .map(([key, time]) => key === "shield" ? "Shield ready" : `${POWERUPS[key].label} ${time.toFixed(1)}s`);
    }

    emitHud(force = false) {
        emit("hud", {
            force,
            score: Math.floor(this.score),
            distance: Math.floor(this.distance),
            coins: this.coins,
            speed: this.currentSpeed * 0.12,
            stamina: this.stamina,
            biome: BIOMES[this.currentBiomeIndex].label,
            phase: PHASES[this.phaseIndex].label,
            warning: this.lastWarning,
            countdown: this.getCountdownLabel(),
            powerups: this.getActivePowerups()
        });
    }

    spawnDust(x, y, tint) {
        const dot = this.add.sprite(x, y, "dust-dot").setTint(tint).setDepth(7).setAlpha(0.3);
        dot.setScale(Phaser.Math.FloatBetween(0.8, 1.8));
        this.tweens.add({
            targets: dot,
            x: x - Phaser.Math.Between(24, 78),
            y: y - Phaser.Math.Between(10, 34),
            alpha: 0,
            scale: dot.scale + Phaser.Math.FloatBetween(0.6, 1.2),
            duration: Phaser.Math.Between(260, 440),
            ease: "Quad.Out",
            onComplete: () => dot.destroy()
        });
    }

    spawnDustBurst(x, y, tint, count, spread) {
        for (let index = 0; index < count; index += 1) {
            this.time.delayedCall(index * 12, () => this.spawnDust(x + Phaser.Math.Between(-spread, spread), y, tint));
        }
    }

    spawnImpact(x, y, tint) {
        this.spawnDustBurst(x, y, tint, 7, 34);
        const ring = this.add.ellipse(x, y, 40, 18).setStrokeStyle(4, tint, 0.3).setDepth(7.5);
        this.tweens.add({
            targets: ring,
            width: 120,
            height: 54,
            alpha: 0,
            duration: 280,
            ease: "Quad.Out",
            onComplete: () => ring.destroy()
        });
    }

    destroyEntity(entity) {
        entity.sprite.destroy();
        if (entity.glow) entity.glow.destroy();
    }

    getSnapshot() {
        return {
            score: this.score,
            distance: this.distance,
            coins: this.coins,
            biome: BIOMES[this.currentBiomeIndex].label,
            phase: PHASES[this.phaseIndex].label
        };
    }
}

export class MilestoneScene extends Phaser.Scene {
    constructor() {
        super("MilestoneScene");
    }

    create(data) {
        syncResponsiveCamera(this, { focusX: WORLD.width / 2, focusY: 210, anchorX: 0.5, anchorY: 0.24 });
        const card = createPanel(this, WORLD.width / 2, 150, 710, 136, {
            fillColor: 0x05101a,
            fillAlpha: 0.86,
            strokeColor: biomeColor(data.biome),
            strokeAlpha: 0.36
        });

        const title = this.add.text(WORLD.width / 2, 124, data.biome.label, {
            fontFamily: "Teko",
            fontSize: "72px",
            color: "#fff2d2"
        }).setOrigin(0.5);
        const bonus = this.add.text(WORLD.width / 2, 180, `Momentum +${formatInteger(data.bonus)}`, {
            fontFamily: "Sora",
            fontSize: "24px",
            color: "#dbe8f7"
        }).setOrigin(0.5);

        this.tweens.add({
            targets: [card, title, bonus],
            y: "+=18",
            alpha: { from: 0, to: 1 },
            duration: 240,
            ease: "Quad.Out"
        });

        this.time.delayedCall(1320, () => {
            this.tweens.add({
                targets: [card, title, bonus],
                alpha: 0,
                y: "-=20",
                duration: 220,
                onComplete: () => this.scene.stop()
            });
        });
    }
}

export class PauseScene extends Phaser.Scene {
    constructor() {
        super("PauseScene");
    }

    create(data) {
        emit("mode", { mode: "paused" });
        emit("status", { label: "Paused", message: "Ride paused. Resume, restart, or return to the hub.", tone: "info" });

        const snapshot = this.scene.get("RunScene").getSnapshot();
        syncResponsiveCamera(this, { focusX: WORLD.width / 2, focusY: WORLD.height / 2, anchorX: 0.5, anchorY: 0.5 });
        this.scale.on("resize", this.handleResize, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));

        this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x04090f, 0.72);
        createPanel(this, WORLD.width / 2, WORLD.height / 2, 860, 620);
        this.add.text(WORLD.width / 2, 250, "Paused", {
            fontFamily: "Teko",
            fontSize: "132px",
            color: "#fff2d2"
        }).setOrigin(0.5);

        createMiniStat(this, WORLD.width / 2 - 230, 392, "Score", formatInteger(snapshot.score));
        createMiniStat(this, WORLD.width / 2, 392, "Distance", `${formatInteger(snapshot.distance)} m`);
        createMiniStat(this, WORLD.width / 2 + 230, 392, "Coins", formatInteger(snapshot.coins));

        this.add.text(WORLD.width / 2, 492, `${snapshot.biome} - ${snapshot.phase}`, {
            fontFamily: "Sora",
            fontSize: "22px",
            color: "#d2dfef"
        }).setOrigin(0.5);

        createButton(this, WORLD.width / 2, 564, "Resume Ride", () => {
            this.scene.stop();
            this.scene.resume("RunScene");
            emit("mode", { mode: "run" });
            emit("status", { label: "Run Live", message: "Ride resumed.", tone: "info" });
        });
        createButton(this, WORLD.width / 2, 656, "Restart Ride", () => {
            this.scene.stop("RunScene");
            this.scene.stop();
            this.scene.start("RunScene", { startBiomeId: data.startBiomeId });
        }, { variant: "secondary" });
        createButton(this, WORLD.width / 2, 748, "Return To Hub", () => window.location.assign("index.html"), { width: 420, variant: "secondary" });
    }

    handleResize() {
        syncResponsiveCamera(this, { focusX: WORLD.width / 2, focusY: WORLD.height / 2, anchorX: 0.5, anchorY: 0.5 });
    }
}

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super("GameOverScene");
    }

    create(data) {
        syncResponsiveCamera(this, { focusX: WORLD.width / 2, focusY: WORLD.height / 2, anchorX: 0.5, anchorY: 0.5 });
        this.scale.on("resize", this.handleResize, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));

        this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x04090f, 0.78);
        createPanel(this, WORLD.width / 2, WORLD.height / 2, 980, 690, {
            fillColor: 0x050f18,
            fillAlpha: 0.9,
            strokeColor: 0xffd166,
            strokeAlpha: 0.28
        });

        this.add.text(WORLD.width / 2, 188, "Run Complete", {
            fontFamily: "Teko",
            fontSize: "134px",
            color: "#fff2d2"
        }).setOrigin(0.5);

        createMiniStat(this, WORLD.width / 2 - 250, 332, "Score", formatInteger(data.score));
        createMiniStat(this, WORLD.width / 2, 332, "Distance", `${formatInteger(data.distance)} m`);
        createMiniStat(this, WORLD.width / 2 + 250, 332, "Coins", formatInteger(data.coins));

        const unlockText = data.unlockedThisRun.length
            ? `New badge: ${data.unlockedThisRun.map((unlock) => unlock.label).join(", ")}`
            : data.nextUnlock
                ? `Next badge: ${getCatalogItem(data.nextUnlock.kind, data.nextUnlock.id).label}`
                : "All badges unlocked";

        this.add.text(WORLD.width / 2, 456, data.reason, {
            fontFamily: "Sora",
            fontSize: "25px",
            color: "#ffe7c2",
            align: "center"
        }).setOrigin(0.5);
        this.add.text(WORLD.width / 2, 516, unlockText, {
            fontFamily: "Sora",
            fontSize: "23px",
            color: "#d2dfef",
            align: "center",
            wordWrap: { width: 760 }
        }).setOrigin(0.5);
        this.add.text(WORLD.width / 2, 572, `${data.biome} - ${data.phase}. Ride again for more score and distance.`, {
            fontFamily: "Sora",
            fontSize: "20px",
            color: "#aebfd6",
            align: "center"
        }).setOrigin(0.5);

        createButton(this, WORLD.width / 2, 642, "Ride Again", () => {
            this.scene.stop("RunScene");
            this.scene.stop();
            this.scene.start("RunScene", { startBiomeId: data.startBiomeId });
        });
        createButton(this, WORLD.width / 2, 734, "Return To Hub", () => window.location.assign("index.html"), { width: 420, variant: "secondary" });
    }

    handleResize() {
        syncResponsiveCamera(this, { focusX: WORLD.width / 2, focusY: WORLD.height / 2, anchorX: 0.5, anchorY: 0.5 });
    }
}
