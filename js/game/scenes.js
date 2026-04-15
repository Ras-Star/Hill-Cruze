import { BIOMES, RUN_CONFIG, WORLD, formatInteger, getBiome, getCatalogItem } from "../config.js";
import { applyRunResults, getProfile } from "../storage.js";

const OBSTACLES = {
    rock: {
        key: "obstacle-rock",
        baseWidth: 124,
        baseHeight: 82,
        collisionWidth: 92,
        collisionHeight: 58,
        yLift: 24,
        maneuver: "jump",
        label: "Jump or switch"
    },
    crate: {
        key: "obstacle-crate",
        baseWidth: 138,
        baseHeight: 96,
        collisionWidth: 98,
        collisionHeight: 72,
        yLift: 38,
        maneuver: "jump",
        label: "Jump or switch"
    },
    branch: {
        key: "obstacle-branch",
        baseWidth: 210,
        baseHeight: 78,
        collisionWidth: 166,
        collisionHeight: 42,
        yLift: 188,
        maneuver: "duck",
        label: "Duck or switch"
    }
};

const POWERUPS = {
    shield: { key: "powerup-shield", label: "Shield", duration: 10, accent: 0x7eb7ff, tone: "boost" },
    rush: { key: "powerup-rush", label: "Rush", duration: 8, accent: 0xffa34d, tone: "boost" },
    energy: { key: "powerup-energy", label: "Energy", duration: 9, accent: 0x82dd9e, tone: "boost" }
};

const LANE_LABELS = ["Left", "Center", "Right"];

function emit(eventName, detail) {
    window.dispatchEvent(new CustomEvent(`hill-cruze:${eventName}`, { detail }));
}

function biomeColor(biome) {
    return Phaser.Display.Color.HexStringToColor(biome.accent).color;
}

function rangeValue(range) {
    return Phaser.Math.Between(range[0], range[1]);
}

function createButton(scene, x, y, label, onClick, options = {}) {
    const { width = 360, variant = "primary" } = options;
    const container = scene.add.container(x, y);
    const isPrimary = variant === "primary";
    const fillColor = isPrimary ? 0xffb347 : 0x08111a;
    const fillAlpha = isPrimary ? 1 : 0.78;
    const strokeColor = isPrimary ? 0xffffff : 0xfff1d4;
    const textColor = isPrimary ? "#160d06" : "#f5f8ff";
    const bg = scene.add.rectangle(0, 0, width, 68, fillColor, fillAlpha).setStrokeStyle(2, strokeColor, isPrimary ? 0.26 : 0.18);
    const text = scene.add.text(0, 0, label, {
        fontFamily: "Sora",
        fontSize: "24px",
        fontStyle: "700",
        color: textColor
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, 68).setInteractive({ useHandCursor: true });
    container.on("pointerover", () => {
        bg.setScale(1.02);
        bg.setAlpha(isPrimary ? 1 : 0.9);
    });
    container.on("pointerout", () => {
        bg.setScale(1);
        bg.setAlpha(fillAlpha);
    });
    container.on("pointerdown", onClick);
    return container;
}

function createPanel(scene, x, y, width, height, options = {}) {
    const {
        fillColor = 0x06111c,
        fillAlpha = 0.82,
        strokeColor = 0xffffff,
        strokeAlpha = 0.16
    } = options;
    const container = scene.add.container(x, y);
    const bg = scene.add.rectangle(0, 0, width, height, fillColor, fillAlpha).setStrokeStyle(2, strokeColor, strokeAlpha);
    const accent = scene.add.rectangle(0, (-height / 2) + 6, width * 0.84, 3, 0xffd166, 0.52);
    container.add([bg, accent]);
    return container;
}

function createMiniStat(scene, x, y, label, value) {
    const container = scene.add.container(x, y);
    const bg = scene.add.rectangle(0, 0, 212, 96, 0xffffff, 0.08).setStrokeStyle(2, 0xffffff, 0.14);
    const labelText = scene.add.text(-82, -22, label, {
        fontFamily: "Sora",
        fontSize: "14px",
        fontStyle: "700",
        color: "#aebfd6"
    });
    const valueText = scene.add.text(-82, 6, value, {
        fontFamily: "Teko",
        fontSize: "42px",
        color: "#fff5df",
        letterSpacing: 2
    });
    container.add([bg, labelText, valueText]);
    return { container, valueText };
}

export class BootScene extends Phaser.Scene {
    constructor() {
        super("BootScene");
    }

    create() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0xffffff, 0.16).fillRect(0, 10, 260, 18).fillRect(24, 44, 220, 10).fillRect(44, 72, 176, 8);
        g.generateTexture("panel-grid", 260, 92);
        g.clear();

        g.fillStyle(0xffffff).fillEllipse(70, 110, 120, 78).fillEllipse(170, 80, 190, 110).fillEllipse(310, 116, 150, 72);
        g.generateTexture("ridge-strip", 360, 180);
        g.clear();

        g.fillStyle(0xffffff).fillEllipse(70, 140, 130, 86).fillEllipse(210, 118, 180, 104).fillEllipse(320, 152, 112, 64);
        g.generateTexture("canopy-strip", 360, 190);
        g.clear();

        g.fillStyle(0xffffff, 0.92).fillEllipse(74, 66, 128, 62).fillEllipse(154, 58, 152, 72).fillEllipse(254, 74, 112, 48);
        g.generateTexture("cloud-strip", 320, 140);
        g.clear();

        g.fillStyle(0xff5d68, 0.16).fillEllipse(48, 24, 100, 34);
        g.fillStyle(0xff5d68, 0.26).fillEllipse(48, 24, 76, 22);
        g.generateTexture("danger-glow", 100, 48);
        g.clear();

        g.fillStyle(0xffd866, 0.12).fillCircle(32, 32, 30);
        g.fillStyle(0xffd866, 0.24).fillCircle(32, 32, 22);
        g.generateTexture("reward-glow", 64, 64);
        g.clear();

        g.fillStyle(0xffffff, 0.88).fillCircle(6, 6, 6);
        g.generateTexture("dust-dot", 12, 12);
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
        emit("status", { label: "Course Status", message: "Loading art and lane systems.", tone: "info" });

        this.cameras.main.setBackgroundColor("#07111a");
        this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x07111a, 1);
        this.add.image(WORLD.width / 2, WORLD.height / 2 + 160, "panel-grid").setAlpha(0.08).setScale(5.4);

        const label = this.add.text(WORLD.width / 2, WORLD.height / 2 - 92, "Loading Course", {
            fontFamily: "Teko",
            fontSize: "104px",
            color: "#fff7df",
            letterSpacing: 6
        }).setOrigin(0.5);
        const status = this.add.text(WORLD.width / 2, WORLD.height / 2 - 10, "Preparing backgrounds, sprites, and lane telegraphs", {
            fontFamily: "Sora",
            fontSize: "22px",
            color: "#cedbea"
        }).setOrigin(0.5);
        const barBg = this.add.rectangle(WORLD.width / 2, WORLD.height / 2 + 56, 540, 18, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.12);
        const bar = this.add.rectangle(WORLD.width / 2 - 266, WORLD.height / 2 + 56, 0, 18, 0xffb347, 1).setOrigin(0, 0.5);
        const percent = this.add.text(WORLD.width / 2, WORLD.height / 2 + 118, "0%", {
            fontFamily: "Teko",
            fontSize: "52px",
            color: "#ffdca0",
            letterSpacing: 4
        }).setOrigin(0.5);

        this.load.on("progress", (value) => {
            bar.width = 532 * value;
            percent.setText(`${Math.round(value * 100)}%`);
        });

        this.load.on("complete", () => {
            label.setText("Course Ready");
            status.setText("Entering the staging menu");
            emit("status", { label: "Course Status", message: "Course ready. Entering the staging menu.", tone: "info" });
            this.time.delayedCall(220, () => this.scene.start("MenuScene"));
        });

        BIOMES.forEach((biome) => this.load.image(biome.id, biome.asset));
        this.load.svg("cyclist", "assets/sprites/cyclist.svg");
        this.load.svg("coin", "assets/sprites/coin.svg");
        this.load.svg("obstacle-rock", "assets/sprites/obstacle-rock.svg");
        this.load.svg("obstacle-crate", "assets/sprites/obstacle-crate.svg");
        this.load.svg("obstacle-branch", "assets/sprites/obstacle-branch.svg");
        this.load.svg("powerup-shield", "assets/sprites/powerup-shield.svg");
        this.load.svg("powerup-rush", "assets/sprites/powerup-rush.svg");
        this.load.svg("powerup-energy", "assets/sprites/powerup-energy.svg");

        void barBg;
    }
}

export class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    create() {
        const profile = getProfile();
        const biome = getBiome(profile.selectedBackgroundPack);

        emit("mode", { mode: "menu" });
        emit("profile", { profile });
        emit("status", { label: "Staging", message: "Course ready. Launch when you are set.", tone: "info" });
        emit("hud", {
            score: 0,
            distance: 0,
            coins: 0,
            speed: 0,
            stamina: 100,
            biome: biome.label,
            warning: "Clear track",
            countdown: "",
            powerups: []
        });

        this.add.image(WORLD.width / 2, WORLD.height / 2, biome.id).setDisplaySize(WORLD.width, WORLD.height);
        this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x040a11, 0.52);
        this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, biomeColor(biome), 0.08);
        this.add.tileSprite(WORLD.width / 2, 170, WORLD.width + 280, 160, "cloud-strip").setAlpha(0.18);

        const title = this.add.text(WORLD.width / 2, 164, "Hill Cruze", {
            fontFamily: "Teko",
            fontSize: "146px",
            color: "#fff7df",
            letterSpacing: 8
        }).setOrigin(0.5);
        const subtitle = this.add.text(WORLD.width / 2, 256, "Hardcore downhill lines with truthful lanes and biome shifts", {
            fontFamily: "Sora",
            fontSize: "28px",
            color: "#dce7f6"
        }).setOrigin(0.5);

        const panel = createPanel(this, WORLD.width / 2, 610, 980, 520);
        const heading = this.add.text(WORLD.width / 2, 428, `Staging In ${biome.label}`, {
            fontFamily: "Teko",
            fontSize: "78px",
            color: "#fff2d2",
            letterSpacing: 4
        }).setOrigin(0.5);
        const body = this.add.text(WORLD.width / 2, 504,
            `Rider: ${getCatalogItem("riders", profile.selectedRider).label}\nBike: ${getCatalogItem("bikes", profile.selectedBike).label}\nBadge: ${getCatalogItem("badges", profile.selectedBadge).label}\nStored tokens: ${formatInteger(profile.totalCoins)}`,
            {
                fontFamily: "Sora",
                fontSize: "24px",
                color: "#cfdced",
                align: "center",
                lineSpacing: 14
            }
        ).setOrigin(0.5);

        const controls = this.add.text(WORLD.width / 2, 720,
            "Left / Right steers lanes. Jump low hazards. Duck branches. Hold Shift or tap boost to burn speed.",
            {
                fontFamily: "Sora",
                fontSize: "21px",
                color: "#eef5ff",
                align: "center",
                wordWrap: { width: 760 }
            }
        ).setOrigin(0.5);

        createButton(this, WORLD.width / 2, 814, "Start Run", () => {
            this.scene.start("RunScene", { startBiomeId: profile.selectedBackgroundPack });
        });

        const legendLeft = this.add.container(WORLD.width / 2 - 212, 924);
        legendLeft.add([
            this.add.sprite(0, 0, "obstacle-rock").setDisplaySize(88, 58),
            this.add.text(86, 0, "Jump low hazards\nor switch lanes early", {
                fontFamily: "Sora",
                fontSize: "18px",
                color: "#ffe2d8",
                lineSpacing: 8
            }).setOrigin(0, 0.5)
        ]);

        const legendRight = this.add.container(WORLD.width / 2 + 126, 924);
        legendRight.add([
            this.add.sprite(0, 0, "coin").setScale(0.92),
            this.add.text(84, 0, "Collect bright rewards\nfor score, tokens, and boosts", {
                fontFamily: "Sora",
                fontSize: "18px",
                color: "#fff4d1",
                lineSpacing: 8
            }).setOrigin(0, 0.5)
        ]);

        this.tweens.add({
            targets: [title, subtitle, heading, body, controls, panel],
            alpha: { from: 0, to: 1 },
            y: "-=12",
            duration: 520,
            ease: "Quad.Out",
            stagger: 34
        });
        this.tweens.add({
            targets: title,
            scale: { from: 0.985, to: 1.02 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: "Sine.InOut"
        });
    }
}

export class RunScene extends Phaser.Scene {
    constructor() {
        super("RunScene");
    }

    init(data) {
        this.profile = getProfile();
        this.startBiomeId = data.startBiomeId || this.profile.selectedBackgroundPack;
    }

    create() {
        this.controls = window.hillCruzeControls;
        this.keys = this.input.keyboard.addKeys("LEFT,RIGHT,UP,DOWN,SPACE,W,A,S,D,SHIFT,ESC");

        this.track = {
            horizonY: 250,
            laneTopX: [806, 960, 1114],
            laneBottomX: [580, 960, 1340],
            playerGroundY: 858
        };

        this.currentLane = 1;
        this.targetLane = 1;
        this.playerX = this.track.laneBottomX[this.currentLane];
        this.playerYOffset = 0;
        this.playerVelocityY = 0;
        this.isGrounded = true;
        this.ducking = false;
        this.finished = false;
        this.distance = 0;
        this.score = 0;
        this.coins = 0;
        this.currentSpeed = 0;
        this.stamina = 100;
        this.segmentIndex = 0;
        this.currentBiomeIndex = Math.max(0, BIOMES.findIndex((biome) => biome.id === this.startBiomeId));
        this.powerTimers = { shield: 0, rush: 0, energy: 0 };
        this.elapsedRunTime = 0;
        this.spawnClock = { pattern: 920, powerup: 6200 };
        this.hudClock = 0;
        this.trackRedrawCooldown = 0;
        this.floatTime = 0;
        this.liveStarted = false;
        this.hazardsLive = false;
        this.warmupTrailSpawned = false;
        this.entities = [];
        this.threatLevels = [0, 0, 0];

        this.backgrounds = BIOMES.map((biome, index) => this.add.image(WORLD.width / 2, WORLD.height / 2, biome.id)
            .setDisplaySize(WORLD.width, WORLD.height)
            .setAlpha(index === this.currentBiomeIndex ? 1 : 0)
            .setDepth(0));

        this.skyGlow = this.add.circle(1536, 164, 160, biomeColor(BIOMES[this.currentBiomeIndex]), 0.14).setDepth(0.3);
        this.cloudLayer = this.add.tileSprite(WORLD.width / 2, 180, WORLD.width + 360, 180, "cloud-strip").setAlpha(0.2).setDepth(0.7);
        this.ridgeLayer = this.add.tileSprite(WORLD.width / 2, 444, WORLD.width + 300, 300, "ridge-strip").setTint(BIOMES[this.currentBiomeIndex].ridgeTint).setAlpha(0.32).setDepth(1);
        this.canopyLayer = this.add.tileSprite(WORLD.width / 2, 566, WORLD.width + 320, 340, "canopy-strip").setTint(BIOMES[this.currentBiomeIndex].canopyTint).setAlpha(0.48).setDepth(1.5);

        this.trackGraphics = this.add.graphics().setDepth(2);
        this.laneGraphics = this.add.graphics().setDepth(4);

        const rider = getCatalogItem("riders", this.profile.selectedRider);
        const bike = getCatalogItem("bikes", this.profile.selectedBike);
        this.playerShadow = this.add.ellipse(this.playerX, this.track.playerGroundY + 12, 140, 44, 0x000000, 0.22).setDepth(5);
        this.playerAura = this.add.circle(this.playerX, this.track.playerGroundY - 84, 92, rider.accent, 0.12).setDepth(5.3);
        this.player = this.add.sprite(this.playerX, this.track.playerGroundY, "cyclist").setOrigin(0.5, 1).setDepth(6);
        this.player.setDisplaySize(226, 154);
        this.player.setTint(rider.accent, rider.suit, bike.frame, bike.trim);

        this.cameras.main.setRoundPixels(true);

        emit("mode", { mode: "run" });
        emit("profile", { profile: this.profile });
        emit("status", { label: "Countdown", message: "3. Hold the line and get ready.", tone: "info" });

        this.drawTrack();
        this.emitHud(true);
    }

    update(_, delta) {
        const dt = delta / 1000;
        if (this.finished) return;

        this.elapsedRunTime += dt;
        this.floatTime += dt;

        if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
            emit("toggle-pause", {});
        }

        const leftPressed = Phaser.Input.Keyboard.JustDown(this.keys.LEFT) || Phaser.Input.Keyboard.JustDown(this.keys.A) || this.controls?.consume("left");
        const rightPressed = Phaser.Input.Keyboard.JustDown(this.keys.RIGHT) || Phaser.Input.Keyboard.JustDown(this.keys.D) || this.controls?.consume("right");
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.UP) || Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || this.controls?.consume("jump");
        const duckHeld = this.keys.DOWN.isDown || this.keys.S.isDown || this.controls?.isDown("duck");
        const boostHeld = this.keys.SHIFT.isDown || this.controls?.isDown("boost");

        if (leftPressed) this.changeLane(-1);
        if (rightPressed) this.changeLane(1);

        const liveRun = this.elapsedRunTime >= RUN_CONFIG.countdownDuration;
        const hazardsReady = this.elapsedRunTime >= RUN_CONFIG.countdownDuration + RUN_CONFIG.warmupDuration;

        if (!this.liveStarted && liveRun) {
            this.liveStarted = true;
            emit("status", { label: "Run Live", message: "Ride live. Build speed and read the opening line.", tone: "info" });
        }

        if (!this.hazardsLive && hazardsReady) {
            this.hazardsLive = true;
            emit("status", { label: "Hazards Live", message: "Hazards are live. Read the incoming lane calls.", tone: "warn" });
        }

        this.playerX = Phaser.Math.Linear(this.playerX, this.track.laneBottomX[this.targetLane], Math.min(1, dt * 12));
        this.ducking = duckHeld;

        if (jumpPressed && this.isGrounded && liveRun) {
            this.playerVelocityY = -RUN_CONFIG.jumpVelocity;
            this.isGrounded = false;
            this.cameras.main.shake(70, 0.0012);
        }

        this.playerVelocityY += RUN_CONFIG.gravity * dt;
        this.playerYOffset += this.playerVelocityY * dt;
        if (this.playerYOffset >= 0) {
            this.playerYOffset = 0;
            this.playerVelocityY = 0;
            this.isGrounded = true;
        }

        const rushBonus = this.powerTimers.rush > 0 ? 1.14 : 1;
        const boostBonus = liveRun && boostHeld && this.stamina > 0 ? RUN_CONFIG.boostMultiplier : 1;
        const baseSpeed = liveRun ? RUN_CONFIG.baseSpeed : 0;
        this.currentSpeed = (baseSpeed + Math.min(RUN_CONFIG.maxBonusSpeed, this.distance * 0.22)) * rushBonus * boostBonus;

        if (liveRun) {
            this.stamina += (boostBonus > 1 ? -24 : 13) * dt;
            if (this.powerTimers.energy > 0) this.stamina += 18 * dt;
            this.stamina = Phaser.Math.Clamp(this.stamina, 0, 100);
            this.distance += this.currentSpeed * dt * 0.09;
            this.score += this.currentSpeed * dt * 0.52;
        }

        Object.keys(this.powerTimers).forEach((key) => {
            this.powerTimers[key] = Math.max(0, this.powerTimers[key] - dt);
        });

        const ambientSpeed = liveRun ? this.currentSpeed : 64;
        this.cloudLayer.tilePositionX += ambientSpeed * dt * 0.008;
        this.ridgeLayer.tilePositionX += ambientSpeed * dt * 0.018;
        this.canopyLayer.tilePositionX += ambientSpeed * dt * 0.036;
        this.skyGlow.setAlpha(0.1 + Math.sin(this.time.now * 0.0009) * 0.03);

        if (liveRun && !this.warmupTrailSpawned) {
            this.spawnCoinLine(this.targetLane, 5, { progressStart: 0.04, spacing: 0.07, lift: 182 });
            this.warmupTrailSpawned = true;
        }

        if (this.hazardsLive) {
            this.updateSpawns(delta);
        }

        this.updateEntities(dt);
        this.updateBiomeCycle();
        this.updatePlayerVisuals();

        this.trackRedrawCooldown -= delta;
        if (this.trackRedrawCooldown <= 0) {
            this.drawTrack();
            this.trackRedrawCooldown = 36;
        }

        this.hudClock += delta;
        if (this.hudClock >= 80) {
            this.emitHud(false);
            this.hudClock = 0;
        }
    }

    changeLane(direction) {
        this.targetLane = Phaser.Math.Clamp(this.targetLane + direction, 0, 2);
    }

    getPerspectivePoint(lane, progress) {
        const clamped = Phaser.Math.Clamp(progress, 0, 1);
        const eased = Phaser.Math.Easing.Cubic.Out(clamped);
        return {
            x: Phaser.Math.Linear(this.track.laneTopX[lane], this.track.laneBottomX[lane], eased),
            y: Phaser.Math.Linear(this.track.horizonY + 20, this.track.playerGroundY + 22, eased)
        };
    }

    getPerspectiveScale(progress, minScale = 0.24, maxScale = 1.02) {
        return Phaser.Math.Linear(minScale, maxScale, Phaser.Math.Clamp(progress, 0, 1));
    }

    drawTrack() {
        const biome = BIOMES[this.currentBiomeIndex];
        const accent = biomeColor(biome);
        const leftTop = this.track.laneTopX[0] - 124;
        const rightTop = this.track.laneTopX[2] + 124;
        const leftBottom = this.track.laneBottomX[0] - 244;
        const rightBottom = this.track.laneBottomX[2] + 244;
        const g = this.trackGraphics;
        const fx = this.laneGraphics;

        g.clear();
        fx.clear();

        g.fillStyle(0x08111a, 0.26);
        g.fillRect(0, this.track.horizonY - 40, WORLD.width, WORLD.height - this.track.horizonY + 40);

        g.fillStyle(biome.canopyTint, 0.18);
        g.beginPath();
        g.moveTo(leftTop - 100, this.track.horizonY + 90);
        g.lineTo(rightTop + 100, this.track.horizonY + 90);
        g.lineTo(rightBottom + 140, WORLD.height);
        g.lineTo(leftBottom - 140, WORLD.height);
        g.closePath();
        g.fillPath();

        g.fillStyle(biome.laneTint, 0.88);
        g.beginPath();
        g.moveTo(leftTop, this.track.horizonY);
        g.lineTo(rightTop, this.track.horizonY);
        g.lineTo(rightBottom, WORLD.height);
        g.lineTo(leftBottom, WORLD.height);
        g.closePath();
        g.fillPath();

        g.lineStyle(8, accent, 0.56);
        g.beginPath();
        g.moveTo(leftTop, this.track.horizonY + 4);
        g.lineTo(leftBottom, WORLD.height);
        g.moveTo(rightTop, this.track.horizonY + 4);
        g.lineTo(rightBottom, WORLD.height);
        g.strokePath();

        this.threatLevels.forEach((threat, lane) => {
            const active = lane === this.targetLane;
            const color = threat > 0.24 ? 0xff5d68 : (active ? 0xffffff : accent);
            const alpha = active ? 0.4 : Math.max(0.12, threat * 0.3);
            const width = active ? 6 : 4;
            fx.lineStyle(width, color, alpha);
            fx.beginPath();
            for (let step = 0; step <= 16; step += 1) {
                const progress = step / 16;
                const point = this.getPerspectivePoint(lane, progress);
                if (step === 0) fx.moveTo(point.x, point.y);
                else fx.lineTo(point.x, point.y);
            }
            fx.strokePath();
        });

        fx.fillStyle(accent, 0.12);
        fx.fillEllipse(WORLD.width / 2, this.track.horizonY + 10, 420, 46);
    }

    updatePlayerVisuals() {
        const lean = Phaser.Math.Clamp((this.track.laneBottomX[this.targetLane] - this.playerX) / 220, -0.16, 0.16);
        const bob = this.isGrounded ? Math.sin(this.floatTime * 10) * 3 : 0;
        const groundY = this.track.playerGroundY;
        const rider = getCatalogItem("riders", this.profile.selectedRider);

        this.player.x = this.playerX;
        this.player.y = groundY + this.playerYOffset + bob;
        this.player.setDisplaySize(226, this.ducking ? 126 : 154);
        this.player.setRotation(lean + (this.isGrounded ? Math.sin(this.floatTime * 7) * 0.018 : -0.06));

        this.playerShadow.x = this.playerX;
        this.playerShadow.y = groundY + 14;
        this.playerShadow.setScale(this.isGrounded ? 1 : Math.max(0.55, 1 - (Math.abs(this.playerYOffset) / 280)));

        this.playerAura.x = this.playerX;
        this.playerAura.y = this.player.y - 92;
        this.playerAura.setFillStyle(rider.accent, 0.1 + (this.powerTimers.rush > 0 ? 0.06 : 0));
        this.playerAura.setScale(0.96 + Math.sin(this.time.now * 0.004) * 0.05);
    }

    updateBiomeCycle() {
        const nextSegment = Math.floor(this.distance / RUN_CONFIG.milestoneSpacing);
        if (nextSegment <= this.segmentIndex) return;

        this.segmentIndex = nextSegment;
        const nextBiomeIndex = (Math.max(0, BIOMES.findIndex((biome) => biome.id === this.startBiomeId)) + nextSegment) % BIOMES.length;
        const bonus = 25 + (nextSegment * 5);
        this.coins += bonus;

        if (nextBiomeIndex !== this.currentBiomeIndex) {
            const previous = this.currentBiomeIndex;
            this.currentBiomeIndex = nextBiomeIndex;
            this.tweens.add({ targets: this.backgrounds[previous], alpha: 0, duration: 650, ease: "Quad.Out" });
            this.backgrounds[this.currentBiomeIndex].setAlpha(0);
            this.tweens.add({ targets: this.backgrounds[this.currentBiomeIndex], alpha: 1, duration: 650, ease: "Quad.Out" });
            this.ridgeLayer.setTint(BIOMES[this.currentBiomeIndex].ridgeTint);
            this.canopyLayer.setTint(BIOMES[this.currentBiomeIndex].canopyTint);
        }

        emit("status", {
            label: "Milestone",
            message: `${BIOMES[this.currentBiomeIndex].label} reached. Bonus awarded: ${bonus} tokens.`,
            tone: "reward"
        });

        if (this.scene.isActive("MilestoneScene")) this.scene.stop("MilestoneScene");
        this.scene.launch("MilestoneScene", { biome: BIOMES[this.currentBiomeIndex], bonus });
    }

    updateSpawns(delta) {
        this.spawnClock.pattern -= delta;
        this.spawnClock.powerup -= delta;

        if (this.spawnClock.pattern <= 0) {
            this.spawnPattern();
            const nextInterval = rangeValue(RUN_CONFIG.patternInterval) - Math.min(320, this.distance * 0.12);
            this.spawnClock.pattern = Math.max(520, nextInterval);
        }

        if (this.spawnClock.powerup <= 0) {
            this.spawnPowerupDrop();
            this.spawnClock.powerup = rangeValue(RUN_CONFIG.powerupInterval);
        }
    }

    spawnPattern() {
        const patterns = [
            () => this.patternCoinLane(),
            () => this.patternSingleLow(),
            () => this.patternSingleHigh()
        ];

        if (this.distance > 260) patterns.push(() => this.patternZigZagCoins());
        if (this.distance > 540) patterns.push(() => this.patternDualThreat());
        if (this.distance > 900) patterns.push(() => this.patternStaggered());
        if (this.distance > 1320) patterns.push(() => this.patternComboBox());

        Phaser.Utils.Array.GetRandom(patterns)();
    }

    patternCoinLane() {
        const lane = Phaser.Math.Between(0, 2);
        this.spawnCoinLine(lane, 6, { progressStart: -0.02, spacing: 0.07, lift: 178 });
    }

    patternSingleLow() {
        const lane = Phaser.Math.Between(0, 2);
        const type = Phaser.Utils.Array.GetRandom(["rock", "crate"]);
        const rewardLane = Phaser.Math.Between(0, 2);

        this.spawnObstacle(type, lane, { progress: 0.02 });

        if (rewardLane === lane) {
            this.spawnCoinLine(lane, 4, { progressStart: -0.1, spacing: 0.07, lift: 210 });
        } else {
            this.spawnCoinLine(rewardLane, 4, { progressStart: -0.02, spacing: 0.07, lift: 170 });
        }
    }

    patternSingleHigh() {
        const lane = Phaser.Math.Between(0, 2);
        const safeLane = Phaser.Math.Between(0, 2);

        this.spawnObstacle("branch", lane, { progress: 0.02 });

        if (safeLane === lane) {
            this.spawnCoinLine((lane + 1) % 3, 4, { progressStart: -0.02, spacing: 0.07, lift: 170 });
        } else {
            this.spawnCoinLine(safeLane, 4, { progressStart: -0.02, spacing: 0.07, lift: 170 });
        }
    }

    patternZigZagCoins() {
        const startLane = Phaser.Math.Between(0, 2);
        const direction = startLane === 0 ? 1 : (startLane === 2 ? -1 : Phaser.Utils.Array.GetRandom([-1, 1]));

        for (let index = 0; index < 6; index += 1) {
            const lane = Phaser.Math.Clamp(startLane + (index % 2 === 0 ? 0 : direction), 0, 2);
            this.spawnCoin(lane, { progress: -0.02 - (index * 0.065), lift: 176 });
        }
    }

    patternDualThreat() {
        const safeLane = Phaser.Math.Between(0, 2);
        const blocked = [0, 1, 2].filter((lane) => lane !== safeLane);
        const firstType = Phaser.Utils.Array.GetRandom(["rock", "crate", "branch"]);
        const secondType = Phaser.Utils.Array.GetRandom(["rock", "crate", "branch"]);

        this.spawnObstacle(firstType, blocked[0], { progress: 0.03 });
        this.spawnObstacle(secondType, blocked[1], { progress: -0.12 });
        this.spawnCoinLine(safeLane, 5, { progressStart: -0.02, spacing: 0.07, lift: 175 });
    }

    patternStaggered() {
        const firstLane = Phaser.Math.Between(0, 2);
        const secondLane = Phaser.Utils.Array.GetRandom([0, 1, 2].filter((lane) => lane !== firstLane));
        const rewardLane = Phaser.Utils.Array.GetRandom([0, 1, 2].filter((lane) => lane !== secondLane));

        this.spawnObstacle(Phaser.Utils.Array.GetRandom(["rock", "crate"]), firstLane, { progress: 0.02 });
        this.spawnObstacle(Phaser.Utils.Array.GetRandom(["rock", "branch"]), secondLane, { progress: -0.14 });
        this.spawnCoinLine(rewardLane, 4, { progressStart: -0.04, spacing: 0.07, lift: 172 });
    }

    patternComboBox() {
        const safeLane = Phaser.Utils.Array.GetRandom([0, 2]);
        const branchLane = 1;
        const lowLane = safeLane === 0 ? 2 : 0;

        this.spawnObstacle("branch", branchLane, { progress: 0.04 });
        this.spawnObstacle(Phaser.Utils.Array.GetRandom(["rock", "crate"]), lowLane, { progress: -0.08 });
        this.spawnCoinLine(safeLane, 6, { progressStart: -0.02, spacing: 0.065, lift: 174 });
    }

    spawnPowerupDrop() {
        const lane = Phaser.Math.Between(0, 2);
        const type = Phaser.Utils.Array.GetRandom(Object.keys(POWERUPS));

        this.spawnPowerup(type, lane, { progress: -0.06, lift: 208 });
        this.spawnCoinLine(lane, 3, { progressStart: -0.18, spacing: 0.07, lift: 192 });
    }

    spawnObstacle(type, lane, options = {}) {
        const spec = OBSTACLES[type];
        const sprite = this.add.sprite(0, 0, spec.key).setDepth(6);
        const glow = this.add.sprite(0, 0, "danger-glow").setDepth(5.2);
        const shadow = this.add.ellipse(0, 0, 124, 34, 0x000000, 0.2).setDepth(4.8);
        const warning = this.add.text(0, 0, spec.maneuver === "duck" ? "DUCK" : "JUMP", {
            fontFamily: "Teko",
            fontSize: "46px",
            color: "#fff2d2",
            stroke: "#89212a",
            strokeThickness: 6,
            letterSpacing: 4
        }).setOrigin(0.5).setDepth(5.4);

        this.entities.push({
            kind: "obstacle",
            type,
            lane,
            progress: options.progress ?? 0,
            lift: options.lift ?? 0,
            phase: Math.random() * 10,
            sprite,
            glow,
            shadow,
            warning
        });
    }

    spawnCoin(lane, options = {}) {
        const sprite = this.add.sprite(0, 0, "coin").setDepth(6.4);
        const glow = this.add.sprite(0, 0, "reward-glow").setTint(0xffd866).setDepth(5.2);
        const shadow = this.add.ellipse(0, 0, 86, 24, 0x000000, 0.15).setDepth(4.8);

        this.entities.push({
            kind: "coin",
            lane,
            progress: options.progress ?? 0,
            lift: options.lift ?? 178,
            phase: options.phase ?? Math.random() * 6,
            sprite,
            glow,
            shadow
        });
    }

    spawnCoinLine(lane, count, options = {}) {
        const progressStart = options.progressStart ?? 0;
        const spacing = options.spacing ?? 0.07;
        const lift = options.lift ?? 176;

        for (let index = 0; index < count; index += 1) {
            this.spawnCoin(lane, {
                progress: progressStart - (index * spacing),
                lift,
                phase: index * 0.5
            });
        }
    }

    spawnPowerup(type, lane, options = {}) {
        const sprite = this.add.sprite(0, 0, POWERUPS[type].key).setDepth(6.5);
        const glow = this.add.sprite(0, 0, "reward-glow").setTint(POWERUPS[type].accent).setDepth(5.3);
        const shadow = this.add.ellipse(0, 0, 92, 26, 0x000000, 0.15).setDepth(4.8);

        this.entities.push({
            kind: "powerup",
            type,
            lane,
            progress: options.progress ?? 0,
            lift: options.lift ?? 206,
            phase: Math.random() * 6,
            sprite,
            glow,
            shadow
        });
    }

    updateEntities(dt) {
        const playerBounds = this.getPlayerBounds();
        this.threatLevels = [0, 0, 0];

        this.entities = this.entities.filter((entity) => {
            entity.progress += (0.22 + (this.currentSpeed / 2800)) * dt;

            if (entity.progress > 1.18) {
                this.destroyEntity(entity);
                return false;
            }

            if (!this.positionEntity(entity)) {
                return true;
            }

            if (entity.kind === "obstacle") {
                const spec = OBSTACLES[entity.type];
                if (entity.progress > 0.04 && entity.progress < 0.92) {
                    this.threatLevels[entity.lane] = Math.max(this.threatLevels[entity.lane], 1 - (entity.progress * 0.72));
                }

                if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.getObstacleBounds(entity))) {
                    this.destroyEntity(entity);
                    this.handleObstacleHit(spec);
                    return false;
                }

                return true;
            }

            if (entity.kind === "coin") {
                if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.getPickupBounds(entity, 0.56))) {
                    this.coins += 1;
                    this.score += 14;
                    this.destroyEntity(entity);
                    return false;
                }

                return true;
            }

            if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.getPickupBounds(entity, 0.62))) {
                this.applyPowerup(entity.type);
                this.destroyEntity(entity);
                return false;
            }

            return true;
        });
    }

    positionEntity(entity) {
        const visible = entity.progress > -0.2;
        entity.sprite.setVisible(visible);
        if (entity.glow) entity.glow.setVisible(visible);
        if (entity.shadow) entity.shadow.setVisible(visible);
        if (entity.warning) entity.warning.setVisible(visible);
        if (!visible) return false;

        const point = this.getPerspectivePoint(entity.lane, entity.progress);

        if (entity.kind === "obstacle") {
            const spec = OBSTACLES[entity.type];
            const scale = this.getPerspectiveScale(entity.progress, 0.28, 1.12);

            entity.sprite.setDisplaySize(spec.baseWidth * scale, spec.baseHeight * scale);
            entity.sprite.setPosition(point.x, point.y - (spec.yLift * scale));
            entity.sprite.setDepth(6 + entity.progress);

            entity.glow.setPosition(point.x, point.y - (spec.yLift * scale) + 10).setScale(scale * 0.9).setAlpha(0.38);
            entity.shadow.setPosition(point.x, point.y + 10).setScale(scale, scale);
            entity.warning.setPosition(this.track.laneTopX[entity.lane], this.track.horizonY + 30);
            entity.warning.setAlpha(entity.progress < 0.34 ? 0.2 + Math.sin(this.time.now * 0.018) * 0.16 : Math.max(0, 0.48 - entity.progress));
            entity.warning.setScale(0.76 + (1 - Phaser.Math.Clamp(entity.progress, 0, 1)) * 0.08);
            return true;
        }

        const baseLift = entity.lift + Math.sin((this.time.now * 0.006) + entity.phase) * 12;
        const scale = this.getPerspectiveScale(entity.progress, 0.24, entity.kind === "powerup" ? 0.94 : 0.86);
        entity.sprite.setPosition(point.x, point.y - (baseLift * scale));
        entity.sprite.setScale(scale);
        entity.sprite.setDepth(6.2 + entity.progress);
        entity.glow.setPosition(point.x, point.y - (baseLift * scale)).setScale(scale * 0.84);
        entity.shadow.setPosition(point.x, point.y + 8).setScale(scale * 0.85, scale * 0.85);
        return true;
    }

    getPlayerBounds() {
        const width = this.ducking ? 108 : 102;
        const height = this.ducking ? 68 : 116;
        return new Phaser.Geom.Rectangle(this.player.x - (width / 2), this.player.y - height, width, height);
    }

    getObstacleBounds(entity) {
        const spec = OBSTACLES[entity.type];
        const width = entity.sprite.displayWidth * (spec.collisionWidth / spec.baseWidth);
        const height = entity.sprite.displayHeight * (spec.collisionHeight / spec.baseHeight);
        return new Phaser.Geom.Rectangle(entity.sprite.x - (width / 2), entity.sprite.y - height, width, height);
    }

    getPickupBounds(entity, factor) {
        const width = entity.sprite.displayWidth * factor;
        const height = entity.sprite.displayHeight * factor;
        return new Phaser.Geom.Rectangle(entity.sprite.x - (width / 2), entity.sprite.y - height, width, height);
    }

    applyPowerup(type) {
        this.powerTimers[type] = POWERUPS[type].duration;
        if (type === "energy") this.stamina = Math.min(100, this.stamina + 18);
        emit("status", {
            label: "Boost Live",
            message: `${POWERUPS[type].label} collected for ${POWERUPS[type].duration}s.`,
            tone: POWERUPS[type].tone
        });
    }

    handleObstacleHit(spec) {
        if (this.powerTimers.shield > 0) {
            this.powerTimers.shield = 0;
            this.cameras.main.flash(120, 126, 183, 255, false);
            emit("status", { label: "Shield Break", message: "Shield absorbed the impact.", tone: "boost" });
            return;
        }

        this.finished = true;
        const results = applyRunResults({
            score: this.score,
            distance: this.distance,
            coins: this.coins
        });

        emit("mode", { mode: "gameover" });
        emit("profile", { profile: results.profile });
        emit("status", { label: "Run Complete", message: `${spec.label}. Results banked to your profile.`, tone: "reward" });

        this.scene.launch("GameOverScene", {
            score: this.score,
            distance: this.distance,
            coins: this.coins,
            startBiomeId: this.startBiomeId,
            unlockedThisRun: results.unlockedThisRun,
            nextUnlock: results.nextUnlock
        });
        this.scene.pause();
    }

    getCountdownLabel() {
        const countdownRemaining = RUN_CONFIG.countdownDuration - this.elapsedRunTime;
        if (countdownRemaining > 0) return `${Math.ceil(countdownRemaining)}`;
        if (countdownRemaining > -0.42) return "GO";
        return "";
    }

    getWarningText() {
        if (!this.liveStarted) return "Hold the center";
        if (!this.hazardsLive) return "Opening sprint";

        const activeThreats = this.threatLevels.filter((threat) => threat > 0.26).length;
        const obstacles = this.entities
            .filter((entity) => entity.kind === "obstacle" && entity.progress > 0.18)
            .sort((a, b) => b.progress - a.progress);

        if (!obstacles.length) return "Clear track";

        const nearest = obstacles[0];
        const spec = OBSTACLES[nearest.type];

        if (nearest.lane === this.targetLane && nearest.progress > 0.46) {
            return spec.label;
        }

        if (activeThreats >= 2 && this.threatLevels[this.targetLane] < 0.22) {
            return "Hold the gap";
        }

        if (activeThreats >= 2) {
            return "Find the lane";
        }

        return `${LANE_LABELS[nearest.lane]} lane hot`;
    }

    emitHud(force) {
        emit("hud", {
            force,
            score: this.score,
            distance: this.distance,
            coins: this.coins,
            speed: this.currentSpeed * 0.24,
            stamina: this.stamina,
            biome: BIOMES[this.currentBiomeIndex].label,
            warning: this.getWarningText(),
            countdown: this.getCountdownLabel(),
            powerups: Object.entries(this.powerTimers)
                .filter(([, time]) => time > 0)
                .map(([key, time]) => `${POWERUPS[key].label} ${time.toFixed(1)}s`)
        });
    }

    destroyEntity(entity) {
        entity.sprite.destroy();
        if (entity.glow) entity.glow.destroy();
        if (entity.shadow) entity.shadow.destroy();
        if (entity.warning) entity.warning.destroy();
    }

    getSnapshot() {
        return {
            score: this.score,
            distance: this.distance,
            coins: this.coins,
            biome: BIOMES[this.currentBiomeIndex].label
        };
    }
}

export class MilestoneScene extends Phaser.Scene {
    constructor() {
        super("MilestoneScene");
    }

    create(data) {
        const card = createPanel(this, WORLD.width / 2, 152, 700, 136, {
            fillColor: 0x05101a,
            fillAlpha: 0.82,
            strokeColor: biomeColor(data.biome),
            strokeAlpha: 0.34
        });

        const title = this.add.text(WORLD.width / 2, 128, data.biome.label, {
            fontFamily: "Teko",
            fontSize: "72px",
            color: "#fff2d2",
            letterSpacing: 4
        }).setOrigin(0.5);
        const bonus = this.add.text(WORLD.width / 2, 182, `Milestone bonus: ${data.bonus} tokens`, {
            fontFamily: "Sora",
            fontSize: "24px",
            color: "#dbe8f7"
        }).setOrigin(0.5);

        this.tweens.add({
            targets: [card, title, bonus],
            y: "+=18",
            alpha: { from: 0, to: 1 },
            duration: 260,
            ease: "Quad.Out"
        });

        this.time.delayedCall(1450, () => {
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

        this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x04090f, 0.72);
        createPanel(this, WORLD.width / 2, WORLD.height / 2, 860, 620);
        this.add.text(WORLD.width / 2, 250, "Paused", {
            fontFamily: "Teko",
            fontSize: "132px",
            color: "#fff2d2",
            letterSpacing: 8
        }).setOrigin(0.5);

        createMiniStat(this, WORLD.width / 2 - 230, 392, "Score", formatInteger(snapshot.score));
        createMiniStat(this, WORLD.width / 2, 392, "Distance", `${formatInteger(snapshot.distance)} m`);
        createMiniStat(this, WORLD.width / 2 + 230, 392, "Tokens", formatInteger(snapshot.coins));

        this.add.text(WORLD.width / 2, 492, `Current biome: ${snapshot.biome}`, {
            fontFamily: "Sora",
            fontSize: "22px",
            color: "#d2dfef"
        }).setOrigin(0.5);

        createButton(this, WORLD.width / 2, 564, "Resume Run", () => {
            this.scene.stop();
            this.scene.resume("RunScene");
            emit("mode", { mode: "run" });
            emit("status", { label: "Run Live", message: "Ride resumed.", tone: "info" });
        });
        createButton(this, WORLD.width / 2, 656, "Restart Run", () => {
            this.scene.stop("RunScene");
            this.scene.stop();
            this.scene.start("RunScene", { startBiomeId: data.startBiomeId });
        }, { variant: "secondary" });
        createButton(this, WORLD.width / 2, 748, "Return To Hub", () => window.location.assign("index.html"), { width: 420, variant: "secondary" });
    }
}

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super("GameOverScene");
    }

    create(data) {
        this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x04090f, 0.78);
        createPanel(this, WORLD.width / 2, WORLD.height / 2, 980, 680, {
            fillColor: 0x050f18,
            fillAlpha: 0.88,
            strokeColor: 0xffd166,
            strokeAlpha: 0.26
        });

        this.add.text(WORLD.width / 2, 194, "Run Complete", {
            fontFamily: "Teko",
            fontSize: "136px",
            color: "#fff2d2",
            letterSpacing: 6
        }).setOrigin(0.5);

        createMiniStat(this, WORLD.width / 2 - 250, 332, "Score", formatInteger(data.score));
        createMiniStat(this, WORLD.width / 2, 332, "Distance", `${formatInteger(data.distance)} m`);
        createMiniStat(this, WORLD.width / 2 + 250, 332, "Tokens", formatInteger(data.coins));

        const unlockText = data.unlockedThisRun.length
            ? `New rewards: ${data.unlockedThisRun.map((unlock) => unlock.label).join(", ")}`
            : data.nextUnlock
                ? `Next reward: ${getCatalogItem(data.nextUnlock.kind, data.nextUnlock.id).label} at ${formatInteger(data.nextUnlock.cost)} tokens`
                : "All rewards unlocked";

        this.add.text(WORLD.width / 2, 462, unlockText, {
            fontFamily: "Sora",
            fontSize: "24px",
            color: "#d2dfef",
            align: "center",
            wordWrap: { width: 760 }
        }).setOrigin(0.5);

        this.add.text(WORLD.width / 2, 528, "Keep the line cleaner, build longer chains, and bank the next unlock.", {
            fontFamily: "Sora",
            fontSize: "20px",
            color: "#aebfd6",
            align: "center"
        }).setOrigin(0.5);

        createButton(this, WORLD.width / 2, 612, "Race Again", () => {
            this.scene.stop("RunScene");
            this.scene.stop();
            this.scene.start("RunScene", { startBiomeId: data.startBiomeId });
        });
        createButton(this, WORLD.width / 2, 704, "Return To Hub", () => window.location.assign("index.html"), { width: 420, variant: "secondary" });
    }
}
