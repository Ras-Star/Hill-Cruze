document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('gameCanvas')) return;

    const gameState = {
        canvas: document.getElementById('gameCanvas'),
        ctx: null,
        state: 'start',
        score: 0,
        distance: 0,
        maxSpeed: 0,
        gameSpeed: 5,
        audioEnabled: true,
        canvasWidth: window.innerWidth,
        canvasHeight: window.innerHeight
    };

    const Utils = {
        clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
        random: (min, max) => Math.random() * (max - min) + min,
        randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        rectCollision: (r1, r2) => r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y
    };

    const audioSystem = {
        context: null,
        init() {
            try { this.context = new (window.AudioContext || window.webkitAudioContext)(); }
            catch (e) { console.warn('Web Audio API not supported.'); }
        },
        playTone(frequency, duration) {
            if (!this.context || !gameState.audioEnabled) return;
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.connect(gain);
            gain.connect(this.context.destination);
            gain.gain.setValueAtTime(0.1, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
            osc.frequency.setValueAtTime(frequency, this.context.currentTime);
            osc.start(this.context.currentTime);
            osc.stop(this.context.currentTime + duration);
        },
        jump() { this.playTone(440, 0.2); },
        powerup() { this.playTone(660, 0.3); },
        crash() { this.playTone(160, 0.5); }
    };

    const inputSystem = {
        keys: {},
        init() {
            document.addEventListener('keydown', e => { this.keys[e.code] = true; });
            document.addEventListener('keyup', e => { this.keys[e.code] = false; });
            this.setupMobileControl('leftBtn', 'ArrowLeft');
            this.setupMobileControl('rightBtn', 'ArrowRight');
            this.setupMobileControl('jumpBtn', 'ArrowUp');
            this.setupMobileControl('duckBtn', 'ArrowDown');
        },
        setupMobileControl(btnId, keyCode) {
            const btn = document.getElementById(btnId);
            if (!btn) return;
            const setKey = (state) => (e) => {
                this.keys[keyCode] = state;
                e.preventDefault();
                e.stopPropagation();
            };
            btn.addEventListener('touchstart', setKey(true));
            btn.addEventListener('touchend', setKey(false));
            btn.addEventListener('mousedown', setKey(true));
            btn.addEventListener('mouseup', setKey(false));
        },
        getInput: () => ({
            left: inputSystem.keys['ArrowLeft'] || inputSystem.keys['KeyA'],
            right: inputSystem.keys['ArrowRight'] || inputSystem.keys['KeyD'],
            up: inputSystem.keys['ArrowUp'] || inputSystem.keys['KeyW'] || inputSystem.keys['Space'],
            down: inputSystem.keys['ArrowDown'] || inputSystem.keys['KeyS']
        })
    };

    const backgroundSystem = {
        colors: {},
        palettes: [
            { t: 0,    sky1: {r:135, g:206, b:234}, sky2: {r:255, g:228, b:181}, ground1: {r:139, g:69,  b:19},  ground2: {r:205, g:133, b:63},  ground3: {r:222, g:184, b:135} },
            { t: 2500, sky1: {r:255, g:127, b:80},  sky2: {r:255, g:182, b:193}, ground1: {r:107, g:53,  b:19},  ground2: {r:173, g:101, b:63},  ground3: {r:190, g:152, b:103} },
            { t: 5000, sky1: {r:0,   g:0,   b:128}, sky2: {r:72,  g:61,  b:139}, ground1: {r:47,  g:30,  b:10},  ground2: {r:75,  g:54,  b:33},  ground3: {r:92,  g:64,  b:51}  },
            { t: 7500, sky1: {r:255, g:127, b:80},  sky2: {r:147, g:112, b:219}, ground1: {r:75,  g:54,  b:33},  ground2: {r:107, g:69,  b:33},  ground3: {r:139, g:107, b:80}  }
        ],
        cycleDuration: 10000,
        lerp: (a, b, t) => a + (b - a) * t,
        lerpColorObjects(obj1, obj2, t) {
            const r = this.lerp(obj1.r, obj2.r, t);
            const g = this.lerp(obj1.g, obj2.g, t);
            const b = this.lerp(obj1.b, obj2.b, t);
            return {r: Math.round(r), g: Math.round(g), b: Math.round(b)};
        },
        rgbToHex(colorObj) {
            return `#${colorObj.r.toString(16).padStart(2, '0')}${colorObj.g.toString(16).padStart(2, '0')}${colorObj.b.toString(16).padStart(2, '0')}`;
        },
        update(distance) {
            const cycleProgress = distance % this.cycleDuration;
            let currentPalette = this.palettes[0], nextPalette = this.palettes[1];
            for (let i = 0; i < this.palettes.length; i++) {
                if (cycleProgress >= this.palettes[i].t) {
                    currentPalette = this.palettes[i];
                    nextPalette = this.palettes[(i + 1) % this.palettes.length];
                }
            }
            const segmentDuration = (nextPalette.t > currentPalette.t ? nextPalette.t : this.cycleDuration) - currentPalette.t;
            const segmentProgress = segmentDuration === 0 ? 0 : (cycleProgress - currentPalette.t) / segmentDuration;
            Object.keys(currentPalette).forEach(key => {
                if (key !== 't') this.colors[key] = this.lerpColorObjects(currentPalette[key], nextPalette[key], segmentProgress);
            });
        },
        getColors() {
            const hexColors = {};
            for (const key in this.colors) hexColors[key] = this.rgbToHex(this.colors[key]);
            return hexColors;
        }
    };

    const terrain = {
        offset: 0,
        baseY: 480,
        update(speed, dt) {
            this.offset += speed * (dt * 60);
        },
        getTrackHeightAt(x) {
            const adjustedX = x + this.offset;
            const wave1 = Math.sin(adjustedX * 0.003) * 40;
            const wave2 = Math.sin(adjustedX * 0.008) * 15;
            return this.baseY + wave1 + wave2;
        },
        draw() {
            const { ctx, canvas } = gameState;
            const colors = backgroundSystem.getColors();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGradient.addColorStop(0, colors.sky1);
            skyGradient.addColorStop(0.7, colors.sky2);
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const terrainGradient = ctx.createLinearGradient(0, this.baseY - 50, 0, canvas.height);
            terrainGradient.addColorStop(0, colors.ground1);
            terrainGradient.addColorStop(0.5, colors.ground2);
            terrainGradient.addColorStop(1, colors.ground3);
            ctx.fillStyle = terrainGradient;
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            for (let x = 0; x <= canvas.width; x += 15) ctx.lineTo(x, this.getTrackHeightAt(x));
            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 20;
            ctx.beginPath();
            for (let x = 0; x <= canvas.width; x += 10) {
                const y = this.getTrackHeightAt(x) - 10;
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    };

    const cyclist = {
        x: 200, y: 400, width: 50, height: 70,
        velocityX: 0, velocityY: 0, onGround: false, ducking: false, stamina: 100,
        powerUps: { speed: { active: false, timer: 0 }, energy: { active: false, timer: 0 }, shield: { active: false, timer: 0 } },
        update(input, dt) {
            const dts = dt * 60;
            // CORRECTED: Tuned physics values for a better, higher jump
            const maxSpeed = 12, acceleration = 0.3, friction = 0.92, gravity = 0.5, jumpPower = -13, forwardJumpPower = 5;

            if (input.left && this.stamina > 0) { this.velocityX -= acceleration * dts; this.stamina -= 0.1 * dts; }
            if (input.right && this.stamina > 0) { this.velocityX += acceleration * dts; this.stamina -= 0.1 * dts; }
            
            if (input.up && this.onGround && this.stamina > 3) {
                this.velocityY = jumpPower; // Apply vertical jump
                this.velocityX += forwardJumpPower; // Apply forward push
                this.onGround = false;
                this.stamina -= 3;
                audioSystem.jump();
            }

            this.ducking = input.down;
            this.height = this.ducking ? 35 : 70;
            
            let speedMultiplier = this.powerUps.speed.active ? 1.5 : 1;
            this.velocityX = Utils.clamp(this.velocityX, -maxSpeed * speedMultiplier, maxSpeed * speedMultiplier);
            this.velocityX *= Math.pow(friction, dts);
            
            this.velocityY += gravity * dts;
            this.x += this.velocityX * dts;
            this.y += this.velocityY * dts;
            
            const groundY = terrain.getTrackHeightAt(this.x + this.width / 2) - this.height;
            if (this.y >= groundY && this.velocityY >= 0) { // Only land if moving downwards
                this.y = groundY;
                this.velocityY = 0;
                this.onGround = true;
            }

            this.x = Utils.clamp(this.x, 0, gameState.canvas.width - this.width);
            if (!input.left && !input.right && this.stamina < 100) this.stamina += 0.5 * dts;
            Object.values(this.powerUps).forEach(p => { if (p.active) p.timer -= dts; if (p.active && p.timer <= 0) p.active = false; });
            if (this.powerUps.energy.active) this.stamina = Math.min(100, this.stamina + (1 * dts));
            this.stamina = Utils.clamp(this.stamina, 0, 100);
        },
        activatePowerUp(type) {
            this.powerUps[type].active = true;
            this.powerUps[type].timer = { speed: 300, energy: 300, shield: 600 }[type];
            audioSystem.powerup();
        },
        getBounds: () => ({ x: cyclist.x + 5, y: cyclist.y + 5, width: cyclist.width - 10, height: cyclist.height - 10 }),
        draw() {
            const { ctx } = gameState;
            ctx.save();
            if (this.powerUps.shield.active) {
                ctx.strokeStyle = '#4444FF'; ctx.lineWidth = 3; ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 100) * 0.3;
                ctx.beginPath(); ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 + 10, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
            }
            ctx.strokeStyle = '#2C3E50'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(this.x + 8, this.y + this.height - 15); ctx.lineTo(this.x + 30, this.y + this.height - 35); ctx.lineTo(this.x + 42, this.y + this.height - 15); ctx.stroke();
            ctx.strokeStyle = '#34495E'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(this.x + 10, this.y + this.height - 8, 10, 0, Math.PI * 2); ctx.arc(this.x + 35, this.y + this.height - 8, 10, 0, Math.PI * 2); ctx.stroke();
            const bodyY = this.ducking ? this.y + this.height - 25 : this.y + this.height - 35, bodyHeight = this.ducking ? 12 : 20;
            ctx.fillStyle = '#E74C3C'; ctx.fillRect(this.x + 18, bodyY, 14, bodyHeight);
            const headY = this.ducking ? bodyY - 8 : bodyY - 12; ctx.fillStyle = '#D4AF37'; ctx.beginPath(); ctx.arc(this.x + 25, headY + 6, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FF6400'; ctx.beginPath(); ctx.arc(this.x + 25, headY + 4, 8, Math.PI, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    };

    let obstacles = [], powerUps = [], obstacleTimer = 0, powerUpTimer = 0;
    
    const entityProto = {
        update(dt, speed) {
            const dts = dt * 60;
            this.x -= speed * dts;
            if (this.isPowerUp) {
                this.animFrame = (this.animFrame || 0) + 0.2 * dts;
                this.y += Math.sin(this.animFrame) * 0.5;
            }
            if (this.x < -this.width) this.active = false;
        },
        getBounds() { return { x: this.x, y: this.y, width: this.width, height: this.height }; },
        draw(ctx) {}
    };

    function createObstacle(x, y, type) {
        const obs = Object.assign(Object.create(entityProto), { x, y, type, width: 30, height: 30, active: true });
        obs.draw = (ctx) => {
            ctx.save(); const styles = { rock: '#696969', log: '#8B4513', snake: '#228B22' }; ctx.fillStyle = ctx.strokeStyle = styles[type];
            ctx.beginPath(); if (type === 'rock') ctx.ellipse(obs.x + 15, obs.y + 15, 15, 15, 0, 0, Math.PI * 2); else if (type === 'log') ctx.fillRect(obs.x, obs.y + 10, obs.width, 10); else { ctx.lineWidth = 8; ctx.moveTo(obs.x, obs.y + 15); ctx.quadraticCurveTo(obs.x + 15, obs.y, obs.x + 30, obs.y + 15); ctx.stroke(); }
            if (type !== 'snake') ctx.fill(); ctx.restore();
        }; return obs;
    }

    function createPowerUp(x, y, type) {
        const pu = Object.assign(Object.create(entityProto), { x, y, type, width: 25, height: 25, active: true, isPowerUp: true });
        pu.draw = (ctx) => {
            ctx.save(); const styles = { speed: { c: '#FF4444', i: '🚀' }, energy: { c: '#44FF44', i: '💉' }, shield: { c: '#4444FF', i: '🛡️' } }; ctx.fillStyle = styles[type].c;
            ctx.beginPath(); ctx.arc(pu.x + 12.5, pu.y + 12.5, 12.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'white'; ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.fillText(styles[type].i, pu.x + 12.5, pu.y + 17); ctx.restore();
        }; return pu;
    }

    function spawnObstacle(dts) {
        obstacleTimer -= dts;
        if (obstacleTimer <= 0) {
            const types = ['rock', 'log', 'snake']; const type = types[Utils.randomInt(0, 2)];
            const x = gameState.canvas.width + 50; const y = terrain.getTrackHeightAt(x) - 40;
            obstacles.push(createObstacle(x, y, type));
            const base = 70, min = 30, factor = Math.max(0, 1 - (gameState.distance / 5000));
            obstacleTimer = Utils.random((min + (base - min) * factor), (min + (base - min) * factor) * 1.5);
        }
    }

    function spawnPowerUp(dts) {
        powerUpTimer -= dts;
        if (powerUpTimer <= 0) {
            const types = ['speed', 'energy', 'shield']; const type = types[Utils.randomInt(0, 2)];
            const x = gameState.canvas.width + 50; const y = terrain.getTrackHeightAt(x) - 60;
            powerUps.push(createPowerUp(x, y, type));
            powerUpTimer = Utils.random(300, 500);
        }
    }

    function checkCollisions() {
        const cyclistBounds = cyclist.getBounds();
        for (const obs of obstacles) {
            if (obs.active && Utils.rectCollision(cyclistBounds, obs.getBounds())) {
                if (cyclist.powerUps.shield.active) { obs.active = false; gameState.score += 50; cyclist.powerUps.shield.active = false; }
                else { gameOver(); }
                return;
            }
        }
        for (const pu of powerUps) {
            if (pu.active && Utils.rectCollision(cyclistBounds, pu.getBounds())) {
                cyclist.activatePowerUp(pu.type);
                pu.active = false;
                gameState.score += 100;
                return;
            }
        }
    }

    function updateGame(dt) {
        if (gameState.state !== 'playing') return;
        const dts = dt * 60;
        
        gameState.gameSpeed = Utils.clamp(3 + (gameState.distance / 500), 3, 12);
        
        backgroundSystem.update(gameState.distance);
        terrain.update(gameState.gameSpeed, dt);
        cyclist.update(inputSystem.getInput(), dt);

        spawnObstacle(dts);
        spawnPowerUp(dts);
        [...obstacles, ...powerUps].forEach(obj => obj.update(dt, gameState.gameSpeed));
        
        obstacles = obstacles.filter(obs => obs.active);
        powerUps = powerUps.filter(pu => pu.active);

        checkCollisions();
        gameState.distance += gameState.gameSpeed * 0.1 * dts;
        gameState.score += Math.floor(gameState.gameSpeed * dts);
        gameState.maxSpeed = Math.max(gameState.maxSpeed, Math.abs(cyclist.velocityX) + gameState.gameSpeed);
        updateHUD();
    }

    function drawGame() {
        terrain.draw();
        [...obstacles, ...powerUps, cyclist].forEach(obj => obj.draw(gameState.ctx));
    }

    let lastTime = 0;
    function gameLoop(currentTime) {
        if (gameState.state !== 'playing') {
            if (gameState.state === 'start' || gameState.state === 'paused') lastTime = 0;
            return;
        }
        if (!lastTime) lastTime = currentTime;
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        updateGame(deltaTime);
        drawGame();
        
        requestAnimationFrame(gameLoop);
    }

    function updateHUD() {
        document.getElementById('score').textContent = `Score: ${gameState.score}`;
        document.getElementById('distance').textContent = `Distance: ${Math.floor(gameState.distance)}m`;
        document.getElementById('speed').textContent = `Speed: ${Math.floor(Math.abs(cyclist.velocityX) + gameState.gameSpeed)} km/h`;
        document.getElementById('stamina-fill').style.width = `${cyclist.stamina}%`;
        const indicator = document.getElementById('powerUpIndicator'); indicator.innerHTML = '';
        Object.entries(cyclist.powerUps).forEach(([type, data]) => {
            if (data.active) {
                const icon = document.createElement('div'); icon.className = `power-up-icon power-up-${type}`;
                icon.textContent = { speed: '🚀', energy: '💉', shield: '🛡️' }[type]; indicator.appendChild(icon);
            }
        });
    }
    
    function setScreenVisibility(start, pause, over) {
        document.getElementById('startScreen').classList.toggle('hidden', !start);
        document.getElementById('pauseScreen').classList.toggle('hidden', !pause);
        document.getElementById('gameOverScreen').classList.toggle('hidden', !over);
    }
    
    function startGame() {
        setScreenVisibility(false, false, false);
        gameState.state = 'playing';
        Object.assign(gameState, { score: 0, distance: 0, maxSpeed: 0, gameSpeed: 3 });
        Object.assign(cyclist, { x: 200, y: 400, velocityX: 0, velocityY: 0, stamina: 100, powerUps: { speed: { active: false, timer: 0 }, energy: { active: false, timer: 0 }, shield: { active: false, timer: 0 } } });
        terrain.offset = 0; obstacles = []; powerUps = []; obstacleTimer = 70; powerUpTimer = 300;
        lastTime = 0;
        requestAnimationFrame(gameLoop);
    }
    
    function togglePause() {
        if (gameState.state === 'playing') {
            gameState.state = 'paused';
            setScreenVisibility(false, true, false);
        } else if (gameState.state === 'paused') {
            setScreenVisibility(false, false, false);
            gameState.state = 'playing';
            requestAnimationFrame(gameLoop);
        }
    }

    function gameOver() {
        gameState.state = 'gameOver';
        audioSystem.crash();
        const prevHighScore = localStorage.getItem('hillCruzeHighScore') || 0;
        if (gameState.score > prevHighScore) localStorage.setItem('hillCruzeHighScore', gameState.score);
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('finalDistance').textContent = Math.floor(gameState.distance);
        document.getElementById('maxSpeed').textContent = Math.floor(gameState.maxSpeed);
        setScreenVisibility(false, false, true);
    }

    function init() {
        gameState.ctx = gameState.canvas.getContext('2d');
        const resizeCanvas = () => {
            gameState.canvas.width = window.innerWidth;
            gameState.canvas.height = window.innerHeight;
            gameState.canvasWidth = window.innerWidth;
            gameState.canvasHeight = window.innerHeight;
            terrain.baseY = gameState.canvas.height * 0.8; // Adjust terrain level based on new height
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        audioSystem.init(); inputSystem.init();
        backgroundSystem.update(0);

        document.getElementById('startGameBtn').addEventListener('click', startGame);
        document.getElementById('restartGameBtn').addEventListener('click', startGame);
        document.getElementById('restartFromPauseBtn').addEventListener('click', startGame);
        document.getElementById('resumeGameBtn').addEventListener('click', togglePause);
        document.getElementById('pauseBtn').addEventListener('click', togglePause);
        document.getElementById('audioToggle').addEventListener('click', () => {
            gameState.audioEnabled = !gameState.audioEnabled;
            document.getElementById('audioToggle').textContent = gameState.audioEnabled ? '🔊' : '🔇';
        });
        document.addEventListener('click', () => {
            if (audioSystem.context && audioSystem.context.state === 'suspended') audioSystem.context.resume();
        }, { once: true });
        
        setScreenVisibility(true, false, false);
        console.log('🚴 Hill Cruze: Downhill Madness - Ready!');
    }

    init();
});