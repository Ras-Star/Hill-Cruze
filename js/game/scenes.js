import { BIOMES, COSMETICS, RUN_CONFIG, WORLD, formatInteger, getBiome, getCatalogItem } from "../config.js";
import { applyRunResults, getProfile } from "../storage.js";

const OBSTACLES = {
    rock: { key: "obstacle-rock", width: 96, height: 58, yOffset: 28 },
    crate: { key: "obstacle-crate", width: 112, height: 78, yOffset: 38 },
    branch: { key: "obstacle-branch", width: 156, height: 36, yOffset: 170 }
};

const POWERUPS = {
    shield: { key: "powerup-shield", label: "Shield", duration: 10 },
    rush: { key: "powerup-rush", label: "Rush", duration: 8 },
    energy: { key: "powerup-energy", label: "Energy", duration: 9 }
};

function emit(eventName, detail) {
    window.dispatchEvent(new CustomEvent(`hill-cruze:${eventName}`, { detail }));
}

function createButton(scene, x, y, label, onClick, width = 360) {
    const container = scene.add.container(x, y);
    const bg = scene.add.rectangle(0, 0, width, 68, 0xffb347, 1).setStrokeStyle(2, 0xffffff, 0.3);
    const text = scene.add.text(0, 0, label, {
        fontFamily: "Manrope",
        fontSize: "28px",
        fontStyle: "700",
        color: "#1a1207"
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, 68).setInteractive({ useHandCursor: true });
    container.on("pointerover", () => bg.setFillStyle(0xffd166));
    container.on("pointerout", () => bg.setFillStyle(0xffb347));
    container.on("pointerdown", onClick);
    return container;
}

export class BootScene extends Phaser.Scene {
    constructor() {
        super("BootScene");
    }

    create() {
        const profile = getProfile();
        const rider = getCatalogItem("riders", profile.selectedRider);
        const bike = getCatalogItem("bikes", profile.selectedBike);
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0xffcf88).fillCircle(86, 28, 14);
        g.fillStyle(rider.suit).fillRoundedRect(68, 38, 36, 42, 12);
        g.fillStyle(rider.accent).fillRoundedRect(67, 24, 38, 14, 7);
        g.lineStyle(10, bike.frame, 1);
        g.strokeCircle(42, 98, 24);
        g.strokeCircle(132, 98, 24);
        g.beginPath();
        g.moveTo(42, 98);
        g.lineTo(76, 56);
        g.lineTo(112, 90);
        g.lineTo(66, 90);
        g.lineTo(42, 98);
        g.moveTo(76, 56);
        g.lineTo(114, 44);
        g.moveTo(114, 44);
        g.lineTo(132, 98);
        g.strokePath();
        g.lineStyle(6, bike.trim, 1);
        g.beginPath();
        g.moveTo(114, 44);
        g.lineTo(132, 44);
        g.moveTo(64, 56);
        g.lineTo(54, 40);
        g.strokePath();
        g.generateTexture("cyclist", 176, 124);
        g.clear();

        g.fillStyle(0xd0b16d).fillCircle(28, 28, 24).fillCircle(28, 28, 18);
        g.generateTexture("coin", 56, 56);
        g.clear();

        g.fillStyle(0x767676).fillEllipse(54, 34, 92, 58);
        g.generateTexture("obstacle-rock", 108, 68);
        g.clear();

        g.fillStyle(0x8d5a30).fillRoundedRect(8, 8, 94, 64, 12);
        g.lineStyle(4, 0xbf8455).strokeRoundedRect(8, 8, 94, 64, 12);
        g.generateTexture("obstacle-crate", 110, 80);
        g.clear();

        g.fillStyle(0x5c3b21).fillRoundedRect(0, 8, 156, 24, 10);
        g.generateTexture("obstacle-branch", 156, 40);
        g.clear();

        g.fillStyle(0x7a91ff).fillCircle(28, 28, 24);
        g.lineStyle(4, 0xffffff).strokeCircle(28, 28, 20);
        g.generateTexture("powerup-shield", 56, 56);
        g.clear();

        g.fillStyle(0xff8f3d).fillCircle(28, 28, 24);
        g.lineStyle(6, 0xffffff).beginPath().moveTo(20, 12).lineTo(34, 26).lineTo(24, 26).lineTo(36, 44).strokePath();
        g.generateTexture("powerup-rush", 56, 56);
        g.clear();

        g.fillStyle(0x82c991).fillCircle(28, 28, 24);
        g.fillStyle(0xffffff).fillRoundedRect(22, 12, 12, 28, 6).fillRoundedRect(18, 18, 20, 8, 4);
        g.generateTexture("powerup-energy", 56, 56);
        g.clear();

        g.fillStyle(0x17212a).fillRect(0, 0, 256, 96);
        g.fillStyle(0xffffff, 0.08).fillRect(12, 10, 36, 76).fillRect(72, 10, 36, 76).fillRect(132, 10, 36, 76);
        g.generateTexture("track-pattern", 256, 96);
        g.clear();

        g.fillStyle(0xffffff).fillEllipse(60, 110, 120, 78).fillEllipse(170, 80, 190, 110).fillEllipse(310, 116, 150, 72);
        g.generateTexture("ridge-strip", 360, 180);
        g.clear();

        g.fillStyle(0xffffff).fillEllipse(70, 140, 130, 86).fillEllipse(210, 118, 180, 104).fillEllipse(320, 152, 112, 64);
        g.generateTexture("canopy-strip", 360, 190);
        g.destroy();

        this.scene.start("PreloadScene");
    }
}

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");
    }

    preload() {
        const label = this.add.text(WORLD.width / 2, WORLD.height / 2 - 46, "Loading course art", {
            fontFamily: "Bebas Neue",
            fontSize: "68px",
            color: "#ffffff",
            letterSpacing: 4
        }).setOrigin(0.5);
        const barBg = this.add.rectangle(WORLD.width / 2, WORLD.height / 2 + 18, 440, 18, 0xffffff, 0.12);
        const bar = this.add.rectangle(WORLD.width / 2 - 216, WORLD.height / 2 + 18, 0, 18, 0xffb347, 1).setOrigin(0, 0.5);

        this.load.on("progress", (value) => bar.width = 432 * value);
        this.load.on("complete", () => {
            label.setText("Course art ready");
            this.time.delayedCall(180, () => this.scene.start("MenuScene"));
        });

        BIOMES.forEach((biome) => this.load.image(biome.id, biome.asset));
        barBg.setStrokeStyle(2, 0xffffff, 0.2);
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
        emit("status", { message: "Course ready. Start when you are ready." });

        this.add.image(WORLD.width / 2, WORLD.height / 2, biome.id).setDisplaySize(WORLD.width, WORLD.height);
        this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x061017, 0.55);
        this.add.text(WORLD.width / 2, 178, "Hill Cruze", {
            fontFamily: "Bebas Neue",
            fontSize: "124px",
            color: "#fff7df",
            letterSpacing: 6
        }).setOrigin(0.5);
        this.add.text(WORLD.width / 2, 278, "Endless cycling across changing African terrain", {
            fontFamily: "Manrope",
            fontSize: "34px",
            color: "#e6f3f1"
        }).setOrigin(0.5);
        this.add.text(WORLD.width / 2, 392,
            `Starting pack: ${biome.label}\nBadge: ${getCatalogItem("badges", profile.selectedBadge).label}\nStored tokens: ${formatInteger(profile.totalCoins)}`,
            { fontFamily: "Manrope", fontSize: "30px", align: "center", color: "#d2dfdc", lineSpacing: 10 }
        ).setOrigin(0.5);

        createButton(this, WORLD.width / 2, 590, "Start Run", () => {
            this.scene.start("RunScene", { startBiomeId: profile.selectedBackgroundPack });
        });

        this.add.text(WORLD.width / 2, 730, "Controls: steer with Left/Right, jump with Up or Space, duck with Down, hold Shift to boost.", {
            fontFamily: "Manrope",
            fontSize: "24px",
            color: "#f0f6f5",
            align: "center",
            wordWrap: { width: 1220 }
        }).setOrigin(0.5);
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
        this.distance = 0;
        this.score = 0;
        this.coins = 0;
        this.currentSpeed = RUN_CONFIG.baseSpeed;
        this.stamina = 100;
        this.segmentIndex = 0;
        this.currentBiomeIndex = Math.max(0, BIOMES.findIndex((biome) => biome.id === this.startBiomeId));
        this.powerTimers = { shield: 0, rush: 0, energy: 0 };
        this.playerVelocityX = 0;
        this.playerVelocityY = 0;
        this.isGrounded = false;
        this.ducking = false;
        this.finished = false;
        this.spawnClock = { obstacle: 1200, coins: 1800, powerup: 5600 };
        this.hudClock = 0;
        this.trackRedrawCooldown = 0;
        this.obstacles = [];
        this.coinSprites = [];
        this.powerupSprites = [];

        this.backgrounds = BIOMES.map((biome, index) => this.add.image(WORLD.width / 2, WORLD.height / 2, biome.id)
            .setDisplaySize(WORLD.width, WORLD.height)
            .setAlpha(index === this.currentBiomeIndex ? 1 : 0)
            .setDepth(0));

        this.ridgeLayer = this.add.tileSprite(WORLD.width / 2, 510, WORLD.width + 240, 280, "ridge-strip").setTint(BIOMES[this.currentBiomeIndex].ridgeTint).setAlpha(0.38).setDepth(1);
        this.canopyLayer = this.add.tileSprite(WORLD.width / 2, 600, WORLD.width + 240, 320, "canopy-strip").setTint(BIOMES[this.currentBiomeIndex].canopyTint).setAlpha(0.54).setDepth(2);
        this.trackPattern = this.add.tileSprite(WORLD.width / 2, 890, WORLD.width + 240, 180, "track-pattern").setTint(BIOMES[this.currentBiomeIndex].laneTint).setAlpha(0.28).setDepth(4);
        this.trackGraphics = this.add.graphics().setDepth(3);

        this.player = this.add.sprite(WORLD.riderBaseX, 600, "cyclist").setOrigin(0.5, 1).setDepth(6);
        this.player.setScale(1);
        this.player.x = WORLD.riderBaseX;
        this.player.y = this.getGroundY(this.player.x);
        this.isGrounded = true;
        emit("mode", { mode: "run" });
        emit("profile", { profile: this.profile });
        emit("status", { message: `${BIOMES[this.currentBiomeIndex].label} active. Keep moving, collect tokens, and avoid hazards.` });
        this.drawTrack();
        this.emitHud(true);
    }

    update(_, delta) {
        const dt = delta / 1000;
        if (this.finished) {
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
            emit("toggle-pause", {});
        }

        const leftHeld = this.keys.LEFT.isDown || this.keys.A.isDown || this.controls?.isDown("left");
        const rightHeld = this.keys.RIGHT.isDown || this.keys.D.isDown || this.controls?.isDown("right");
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.UP) || Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || this.controls?.consume("jump");
        const duckHeld = this.keys.DOWN.isDown || this.keys.S.isDown || this.controls?.isDown("duck");
        const boostHeld = this.keys.SHIFT.isDown || this.controls?.isDown("boost");

        if (leftHeld) this.playerVelocityX -= RUN_CONFIG.lateralAcceleration * dt;
        if (rightHeld) this.playerVelocityX += RUN_CONFIG.lateralAcceleration * dt;
        if (!leftHeld && !rightHeld) this.playerVelocityX *= RUN_CONFIG.lateralFriction;
        this.playerVelocityX = Phaser.Math.Clamp(this.playerVelocityX, -RUN_CONFIG.maxLateralSpeed, RUN_CONFIG.maxLateralSpeed);

        this.player.x = Phaser.Math.Clamp(this.player.x + this.playerVelocityX * dt, WORLD.trackMinX, WORLD.trackMaxX);
        this.ducking = duckHeld;
        if (jumpPressed && this.isGrounded) {
            this.playerVelocityY = -RUN_CONFIG.jumpVelocity;
            this.isGrounded = false;
        }

        this.playerVelocityY += RUN_CONFIG.gravity * dt;
        this.player.y += this.playerVelocityY * dt;

        const groundY = this.getGroundY(this.player.x);
        if (this.player.y >= groundY) {
            this.player.y = groundY;
            this.playerVelocityY = 0;
            this.isGrounded = true;
        }

        this.player.setScale(1, this.ducking ? 0.82 : 1);

        const rushBonus = this.powerTimers.rush > 0 ? 1.12 : 1;
        const boostBonus = boostHeld && this.stamina > 0 ? RUN_CONFIG.boostMultiplier : 1;
        this.currentSpeed = (RUN_CONFIG.baseSpeed + Math.min(RUN_CONFIG.maxBonusSpeed, this.distance * 0.18)) * rushBonus * boostBonus;

        this.stamina += (boostBonus > 1 ? -24 : 14) * dt;
        if (this.powerTimers.energy > 0) this.stamina += 18 * dt;
        this.stamina = Phaser.Math.Clamp(this.stamina, 0, 100);

        Object.keys(this.powerTimers).forEach((key) => {
            this.powerTimers[key] = Math.max(0, this.powerTimers[key] - dt);
        });

        this.distance += this.currentSpeed * dt * 0.085;
        this.score += this.currentSpeed * dt * 0.46;
        this.ridgeLayer.tilePositionX += this.currentSpeed * dt * 0.02;
        this.canopyLayer.tilePositionX += this.currentSpeed * dt * 0.04;
        this.trackPattern.tilePositionX += this.currentSpeed * dt * 0.16;
        this.trackRedrawCooldown -= delta;
        if (this.trackRedrawCooldown <= 0) {
            this.drawTrack();
            this.trackRedrawCooldown = 34;
        }
        this.updateBiomeCycle();
        this.updateSpawns(delta);
        this.updateEntities(dt);

        this.hudClock += delta;
        if (this.hudClock > 90) {
            this.emitHud(false);
            this.hudClock = 0;
        }
    }

    getGroundY(x) {
        return 720 + Math.sin((x * 0.008) + (this.distance * 0.02)) * 46 + Math.sin((x * 0.02) + (this.distance * 0.05)) * 18;
    }

    drawTrack() {
        const biome = BIOMES[this.currentBiomeIndex];
        const g = this.trackGraphics;
        g.clear();

        g.fillStyle(biome.canopyTint, 0.18);
        g.beginPath();
        g.moveTo(0, WORLD.height);
        for (let x = 0; x <= WORLD.width; x += 80) g.lineTo(x, this.getGroundY(x) - 140);
        g.lineTo(WORLD.width, WORLD.height);
        g.closePath();
        g.fillPath();

        g.fillStyle(biome.laneTint, 0.88);
        g.beginPath();
        g.moveTo(0, WORLD.height);
        for (let x = 0; x <= WORLD.width; x += 80) g.lineTo(x, this.getGroundY(x));
        g.lineTo(WORLD.width, WORLD.height);
        g.closePath();
        g.fillPath();

        g.lineStyle(8, Phaser.Display.Color.HexStringToColor(biome.accent).color, 0.42);
        g.beginPath();
        for (let x = 0; x <= WORLD.width; x += 80) {
            const y = this.getGroundY(x) - 8;
            if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.strokePath();
    }

    updateBiomeCycle() {
        const nextSegment = Math.floor(this.distance / RUN_CONFIG.milestoneSpacing);
        if (nextSegment <= this.segmentIndex) return;

        this.segmentIndex = nextSegment;
        const nextBiomeIndex = (Math.max(0, BIOMES.findIndex((biome) => biome.id === this.startBiomeId)) + nextSegment) % BIOMES.length;
        if (nextBiomeIndex !== this.currentBiomeIndex) {
            this.backgrounds[this.currentBiomeIndex].setAlpha(0);
            this.currentBiomeIndex = nextBiomeIndex;
            this.backgrounds[this.currentBiomeIndex].setAlpha(1);
            this.ridgeLayer.setTint(BIOMES[this.currentBiomeIndex].ridgeTint);
            this.canopyLayer.setTint(BIOMES[this.currentBiomeIndex].canopyTint);
            this.trackPattern.setTint(BIOMES[this.currentBiomeIndex].laneTint);
            this.drawTrack();
        }

        const bonus = 25 + (nextSegment * 5);
        this.coins += bonus;
        emit("status", { message: `${BIOMES[this.currentBiomeIndex].label} reached. Bonus awarded: ${bonus} tokens.` });
        if (this.scene.isActive("MilestoneScene")) this.scene.stop("MilestoneScene");
        this.scene.launch("MilestoneScene", { biome: BIOMES[this.currentBiomeIndex], bonus });
    }

    updateSpawns(delta) {
        this.spawnClock.obstacle -= delta;
        this.spawnClock.coins -= delta;
        this.spawnClock.powerup -= delta;

        if (this.spawnClock.obstacle <= 0) {
            this.spawnObstacle();
            this.spawnClock.obstacle = Phaser.Math.Between(...RUN_CONFIG.obstacleInterval) - Math.min(260, this.distance * 0.4);
        }

        if (this.spawnClock.coins <= 0) {
            for (let index = 0; index < 5; index += 1) {
                const coin = this.add.sprite(WORLD.width + 180 + (index * 88), 0, "coin").setDepth(5);
                coin.setData("phase", index * 0.5);
                this.coinSprites.push(coin);
            }
            this.spawnClock.coins = Phaser.Math.Between(...RUN_CONFIG.coinInterval);
        }

        if (this.spawnClock.powerup <= 0) {
            const type = Phaser.Utils.Array.GetRandom(Object.keys(POWERUPS));
            const sprite = this.add.sprite(WORLD.width + 200, 0, POWERUPS[type].key).setDepth(5);
            sprite.setData("type", type);
            sprite.setData("phase", Math.random() * 5);
            this.powerupSprites.push(sprite);
            this.spawnClock.powerup = Phaser.Math.Between(...RUN_CONFIG.powerupInterval);
        }
    }

    spawnObstacle() {
        const type = Phaser.Utils.Array.GetRandom(["rock", "rock", "crate", "branch"]);
        const sprite = this.add.sprite(WORLD.width + 180, 0, OBSTACLES[type].key).setDepth(5);
        sprite.setData("type", type);
        this.obstacles.push(sprite);
    }

    updateEntities(dt) {
        const playerBounds = this.getPlayerBounds();

        this.obstacles = this.obstacles.filter((sprite) => {
            const type = sprite.getData("type");
            const spec = OBSTACLES[type];
            sprite.x -= this.currentSpeed * dt;
            sprite.y = this.getGroundY(sprite.x) - spec.yOffset;
            if (sprite.x < -240) {
                sprite.destroy();
                return false;
            }

            if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.getBounds(sprite, spec.width, spec.height))) {
                sprite.destroy();
                this.handleObstacleHit();
                return false;
            }

            return true;
        });

        this.coinSprites = this.coinSprites.filter((sprite) => {
            sprite.x -= this.currentSpeed * dt;
            sprite.y = this.getGroundY(sprite.x) - 112 - Math.sin((this.time.now * 0.006) + sprite.getData("phase")) * 16;
            if (sprite.x < -120) {
                sprite.destroy();
                return false;
            }
            if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.getBounds(sprite, 40, 40))) {
                this.coins += 1;
                this.score += 12;
                sprite.destroy();
                return false;
            }
            return true;
        });

        this.powerupSprites = this.powerupSprites.filter((sprite) => {
            sprite.x -= this.currentSpeed * dt;
            sprite.y = this.getGroundY(sprite.x) - 158 - Math.sin((this.time.now * 0.006) + sprite.getData("phase")) * 20;
            if (sprite.x < -120) {
                sprite.destroy();
                return false;
            }
            if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, this.getBounds(sprite, 48, 48))) {
                this.applyPowerup(sprite.getData("type"));
                sprite.destroy();
                return false;
            }
            return true;
        });
    }

    getPlayerBounds() {
        const width = 72;
        const height = this.ducking ? 54 : 92;
        return new Phaser.Geom.Rectangle(this.player.x - 36, this.player.y - height, width, height);
    }

    getBounds(sprite, width, height) {
        return new Phaser.Geom.Rectangle(sprite.x - (width / 2), sprite.y - height, width, height);
    }

    applyPowerup(type) {
        this.powerTimers[type] = POWERUPS[type].duration;
        if (type === "energy") this.stamina = Math.min(100, this.stamina + 18);
        emit("status", { message: `${POWERUPS[type].label} collected.` });
    }

    handleObstacleHit() {
        if (this.powerTimers.shield > 0) {
            this.powerTimers.shield = 0;
            emit("status", { message: "Shield absorbed the impact." });
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
        emit("status", { message: "Ride complete. Results saved to your profile." });

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

    emitHud(force) {
        emit("hud", {
            force,
            score: this.score,
            distance: this.distance,
            coins: this.coins,
            speed: this.currentSpeed * 0.22,
            stamina: this.stamina,
            biome: BIOMES[this.currentBiomeIndex].label,
            powerups: Object.entries(this.powerTimers)
                .filter(([, time]) => time > 0)
                .map(([key, time]) => `${POWERUPS[key].label} ${time.toFixed(1)}s`)
        });
    }
}

export class MilestoneScene extends Phaser.Scene {
    constructor() {
        super("MilestoneScene");
    }

    create(data) {
        this.add.rectangle(WORLD.width / 2, 150, 680, 120, 0x091521, 0.75).setStrokeStyle(2, 0xffffff, 0.2);
        this.add.text(WORLD.width / 2, 128, data.biome.label, {
            fontFamily: "Bebas Neue",
            fontSize: "68px",
            color: "#fff2d2",
            letterSpacing: 4
        }).setOrigin(0.5);
        this.add.text(WORLD.width / 2, 182, `Milestone bonus: ${data.bonus} tokens`, {
            fontFamily: "Manrope",
            fontSize: "28px",
            color: "#d9ece7"
        }).setOrigin(0.5);
        this.time.delayedCall(1500, () => this.scene.stop());
    }
}

export class PauseScene extends Phaser.Scene {
    constructor() {
        super("PauseScene");
    }

    create(data) {
        emit("mode", { mode: "paused" });
        emit("status", { message: "Ride paused. Resume, restart, or return to the hub." });
        this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x050b12, 0.65);
        this.add.text(WORLD.width / 2, 260, "Paused", {
            fontFamily: "Bebas Neue",
            fontSize: "110px",
            color: "#fff1d4",
            letterSpacing: 6
        }).setOrigin(0.5);
        createButton(this, WORLD.width / 2, 470, "Resume Run", () => {
            this.scene.stop();
            this.scene.resume("RunScene");
            emit("mode", { mode: "run" });
            emit("status", { message: "Ride resumed." });
        });
        createButton(this, WORLD.width / 2, 570, "Restart Run", () => {
            this.scene.stop("RunScene");
            this.scene.stop();
            this.scene.start("RunScene", { startBiomeId: data.startBiomeId });
        });
        createButton(this, WORLD.width / 2, 670, "Return To Hub", () => window.location.assign("index.html"), 420);
    }
}

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super("GameOverScene");
    }

    create(data) {
        this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 0x050b12, 0.72);
        this.add.text(WORLD.width / 2, 178, "Run Complete", {
            fontFamily: "Bebas Neue",
            fontSize: "112px",
            color: "#fff1d4",
            letterSpacing: 5
        }).setOrigin(0.5);
        this.add.text(WORLD.width / 2, 330,
            `Score ${formatInteger(data.score)}   |   Distance ${formatInteger(data.distance)} m   |   Tokens ${formatInteger(data.coins)}`,
            { fontFamily: "Manrope", fontSize: "30px", color: "#e2efed", align: "center" }
        ).setOrigin(0.5);

        const unlockText = data.unlockedThisRun.length
            ? `New rewards: ${data.unlockedThisRun.map((unlock) => unlock.label).join(", ")}`
            : data.nextUnlock
                ? `Next reward: ${getCatalogItem(data.nextUnlock.kind, data.nextUnlock.id).label} at ${formatInteger(data.nextUnlock.cost)} tokens`
                : "All rewards unlocked";

        this.add.text(WORLD.width / 2, 428, unlockText, {
            fontFamily: "Manrope",
            fontSize: "26px",
            color: "#cfe4df",
            align: "center",
            wordWrap: { width: 1120 }
        }).setOrigin(0.5);

        createButton(this, WORLD.width / 2, 610, "Race Again", () => {
            this.scene.stop("RunScene");
            this.scene.stop();
            this.scene.start("RunScene", { startBiomeId: data.startBiomeId });
        });
        createButton(this, WORLD.width / 2, 710, "Return To Hub", () => window.location.assign("index.html"), 420);
    }
}
