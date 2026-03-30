const RhythmSurvival = {
    canvas: null,
    ctx: null,
    ui: null,
    animFrame: null,
    gameOver: false,
    paused: false,
    lastTime: 0,
    score: 0,
    elapsed: 0,

    // Beat system
    bpm: 80,
    beatInterval: 0,      // ms per beat, derived from bpm
    beatTimer: 0,          // accumulates time toward next beat
    beatCount: 0,          // total beats elapsed
    beatPhase: 0,          // 0-1 phase within current beat (for ring animation)
    beatFlash: 0,          // flash intensity on beat (1 -> 0)
    ringRadius: 0,         // current ring radius for visual metronome
    bpmIncreaseTimer: 0,   // time since last bpm increase

    // Player
    player: null,
    playerSpeed: 500,
    playerTrail: [],
    targetX: -1,           // for mobile tap targeting

    // Obstacles
    obstacles: [],
    pendingDrop: false,     // flag: drop obstacles on next beat
    beatsSinceLastDrop: 0,

    // Particles & effects
    particles: [],
    nearMissParticles: [],
    bgPulse: 0,

    // Input
    keys: {},
    touchSide: null,       // 'left' or 'right' for mobile

    // Lane system
    laneCount: 5,
    laneWidth: 0,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.laneWidth = ui.canvasW / this.laneCount;
        this.handleKey = this.handleKey.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        document.addEventListener('keydown', this.handleKey);
        document.addEventListener('keyup', this.handleKeyUp);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.lastTime = performance.now();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        this.laneWidth = W / this.laneCount;
        this.player = {
            x: W / 2,
            y: H - 50,
            w: 36,
            h: 36,
            lane: Math.floor(this.laneCount / 2)
        };
        this.player.x = this.player.lane * this.laneWidth + this.laneWidth / 2;
        this.score = 0;
        this.elapsed = 0;
        this.bpm = 80;
        this.beatInterval = 60000 / this.bpm;
        this.beatTimer = 0;
        this.beatCount = 0;
        this.beatPhase = 0;
        this.beatFlash = 0;
        this.ringRadius = 0;
        this.bpmIncreaseTimer = 0;
        this.beatsSinceLastDrop = 0;
        this.pendingDrop = false;
        this.obstacles = [];
        this.particles = [];
        this.nearMissParticles = [];
        this.playerTrail = [];
        this.bgPulse = 0;
        this.keys = {};
        this.touchSide = null;
        this.targetX = -1;
        this.ui.setScore(0);
    },

    pause() {
        this.paused = true;
        this.ui.showPause();
    },

    resume() {
        this.paused = false;
        this.ui.hidePause();
        this.lastTime = performance.now();
        this.loop();
    },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            if (!this.gameOver) {
                this.paused ? this.resume() : this.pause();
            }
            return;
        }
        if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) {
            e.preventDefault();
            this.keys[e.key] = true;
        }
    },

    handleKeyUp(e) {
        this.keys[e.key] = false;
    },

    handleTouchStart(e) {
        e.preventDefault();
        if (this.gameOver || this.paused) return;
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        if (x < rect.width / 2) {
            this.touchSide = 'left';
        } else {
            this.touchSide = 'right';
        }
    },

    handleTouchEnd(e) {
        e.preventDefault();
        this.touchSide = null;
    },

    loop() {
        if (this.gameOver) return;
        if (this.paused) return;
        const now = performance.now();
        const dt = Math.min(now - this.lastTime, 50) / 1000; // seconds, capped
        this.lastTime = now;
        this.update(dt);
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update(dt) {
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        this.elapsed += dt;

        // BPM increase every 30 seconds
        this.bpmIncreaseTimer += dt;
        if (this.bpmIncreaseTimer >= 30) {
            this.bpmIncreaseTimer -= 30;
            this.bpm += 5;
            this.beatInterval = 60000 / this.bpm;
        }

        // Beat timing
        this.beatTimer += dt * 1000;
        this.beatPhase = this.beatTimer / this.beatInterval;

        // Ring: contracts from max radius to 0 over each beat
        const maxRing = 80;
        this.ringRadius = maxRing * (1 - this.beatPhase);

        if (this.beatTimer >= this.beatInterval) {
            this.beatTimer -= this.beatInterval;
            this.beatCount++;
            this.beatFlash = 1;
            this.bgPulse = 1;
            this.score = this.beatCount;
            this.ui.setScore(this.score);

            // Every 4 beats, drop obstacles
            this.beatsSinceLastDrop++;
            if (this.beatsSinceLastDrop >= 4) {
                this.beatsSinceLastDrop = 0;
                this.spawnObstacles();
            }

            // Update high score
            const best = this.ui.getHighScore();
            if (this.score > best) {
                this.ui.setHighScore(this.score);
            }
        }

        // Decay flash
        this.beatFlash = Math.max(0, this.beatFlash - dt * 4);
        this.bgPulse = Math.max(0, this.bgPulse - dt * 3);

        // Player movement
        const p = this.player;
        let moveDir = 0;
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) moveDir = -1;
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) moveDir = 1;
        if (this.touchSide === 'left') moveDir = -1;
        if (this.touchSide === 'right') moveDir = 1;

        p.x += moveDir * this.playerSpeed * dt;
        p.x = Math.max(p.w / 2, Math.min(W - p.w / 2, p.x));

        // Determine current lane
        p.lane = Math.floor(p.x / this.laneWidth);
        p.lane = Math.max(0, Math.min(this.laneCount - 1, p.lane));

        // Player trail
        this.playerTrail.push({ x: p.x, y: p.y, alpha: 1 });
        if (this.playerTrail.length > 12) this.playerTrail.shift();
        for (let t of this.playerTrail) {
            t.alpha -= dt * 4;
        }
        this.playerTrail = this.playerTrail.filter(t => t.alpha > 0);

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const ob = this.obstacles[i];
            ob.y += ob.speed * dt;

            // Near-miss detection (close but not colliding)
            const dx = Math.abs(ob.x + ob.w / 2 - p.x);
            const dy = Math.abs(ob.y + ob.h / 2 - p.y);
            if (dx < ob.w / 2 + p.w / 2 + 15 && dy < ob.h / 2 + p.h / 2 + 15 &&
                !(dx < ob.w / 2 + p.w / 2 - 4 && dy < ob.h / 2 + p.h / 2 - 4)) {
                if (!ob.nearMissTriggered) {
                    ob.nearMissTriggered = true;
                    this.spawnNearMissParticles(p.x, p.y);
                }
            }

            // Collision detection
            if (p.x - p.w / 2 < ob.x + ob.w &&
                p.x + p.w / 2 > ob.x &&
                p.y - p.h / 2 < ob.y + ob.h &&
                p.y + p.h / 2 > ob.y) {
                this.endGame();
                return;
            }

            // Remove off-screen
            if (ob.y > H + 50) {
                this.obstacles.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const part = this.particles[i];
            part.x += part.vx * dt;
            part.y += part.vy * dt;
            part.life -= dt;
            if (part.life <= 0) this.particles.splice(i, 1);
        }
        for (let i = this.nearMissParticles.length - 1; i >= 0; i--) {
            const part = this.nearMissParticles[i];
            part.x += part.vx * dt;
            part.y += part.vy * dt;
            part.life -= dt;
            if (part.life <= 0) this.nearMissParticles.splice(i, 1);
        }
    },

    spawnObstacles() {
        const W = this.ui.canvasW;
        // Pick random lanes to be dangerous (leave at least 1 safe lane)
        const dangerCount = Math.min(this.laneCount - 1, 2 + Math.floor(this.elapsed / 60));
        const lanes = [];
        for (let i = 0; i < this.laneCount; i++) lanes.push(i);
        // Shuffle and pick
        for (let i = lanes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
        }
        const dangerLanes = lanes.slice(0, dangerCount);

        const colors = ['#ff2d7b', '#00d4ff', '#ffd60a', '#00e676', '#b347ff'];
        const fallSpeed = 250 + this.elapsed * 2;

        for (const lane of dangerLanes) {
            const obW = this.laneWidth - 12;
            const obH = 28;
            this.obstacles.push({
                x: lane * this.laneWidth + 6,
                y: -obH,
                w: obW,
                h: obH,
                speed: fallSpeed,
                color: colors[lane % colors.length],
                nearMissTriggered: false
            });
        }

        // Spawn beat particles at top
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: Math.random() * W,
                y: 0,
                vx: (Math.random() - 0.5) * 60,
                vy: Math.random() * 100 + 30,
                life: 1.2,
                maxLife: 1.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                r: Math.random() * 4 + 2
            });
        }
    },

    spawnNearMissParticles(x, y) {
        const colors = ['#ffd60a', '#ff2d7b', '#00d4ff'];
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 150 + 50;
            this.nearMissParticles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.6,
                maxLife: 0.6,
                color: colors[Math.floor(Math.random() * colors.length)],
                r: Math.random() * 3 + 1.5
            });
        }
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        const best = this.ui.getHighScore();
        if (this.score > best) this.ui.setHighScore(this.score);
        this.ui.showGameOver(this.score, Math.max(this.score, best));
    },

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        // Background with subtle pulse
        const pulseVal = Math.floor(this.bgPulse * 20);
        ctx.fillStyle = `rgb(${10 + pulseVal}, ${10 + pulseVal}, ${15 + pulseVal})`;
        ctx.fillRect(0, 0, W, H);

        // Beat flash overlay
        if (this.beatFlash > 0) {
            ctx.fillStyle = `rgba(0, 212, 255, ${this.beatFlash * 0.08})`;
            ctx.fillRect(0, 0, W, H);
        }

        // Lane lines (subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 1; i < this.laneCount; i++) {
            const lx = i * this.laneWidth;
            ctx.beginPath();
            ctx.moveTo(lx, 0);
            ctx.lineTo(lx, H);
            ctx.stroke();
        }

        // Beat ring (visual metronome) - centered at top area
        const ringCx = W / 2;
        const ringCy = 60;
        const maxRing = 80;
        if (this.ringRadius > 2) {
            ctx.beginPath();
            ctx.arc(ringCx, ringCy, this.ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.3 + this.beatPhase * 0.5})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        // Center dot on beat
        const dotAlpha = this.beatFlash;
        if (dotAlpha > 0) {
            ctx.beginPath();
            ctx.arc(ringCx, ringCy, 8 + dotAlpha * 12, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 212, 255, ${dotAlpha * 0.8})`;
            ctx.fill();
        }
        // Inner ring glow
        ctx.beginPath();
        ctx.arc(ringCx, ringCy, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, 0.6)`;
        ctx.fill();

        // BPM and beat counter text
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.fillStyle = '#8888a0';
        ctx.textAlign = 'left';
        ctx.fillText(`BPM: ${this.bpm}`, 16, 30);
        ctx.textAlign = 'right';
        ctx.fillText(`Beat: ${this.beatCount}`, W - 16, 30);

        // Next drop indicator (beats until next obstacle wave)
        const beatsUntilDrop = 4 - this.beatsSinceLastDrop;
        ctx.textAlign = 'center';
        ctx.fillStyle = beatsUntilDrop <= 1 ? '#ff2d7b' : '#8888a0';
        ctx.fillText(`Drop in: ${beatsUntilDrop}`, W / 2, 110);

        // Obstacles
        for (const ob of this.obstacles) {
            // Glow
            ctx.shadowColor = ob.color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = ob.color;
            this.roundRect(ctx, ob.x, ob.y, ob.w, ob.h, 6);
            ctx.fill();
            // Inner highlight
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            this.roundRect(ctx, ob.x + 3, ob.y + 3, ob.w - 6, ob.h / 2 - 2, 3);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Particles
        for (const part of this.particles) {
            const alpha = part.life / part.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = part.color;
            ctx.beginPath();
            ctx.arc(part.x, part.y, part.r, 0, Math.PI * 2);
            ctx.fill();
        }
        // Near-miss particles
        for (const part of this.nearMissParticles) {
            const alpha = part.life / part.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = part.color;
            ctx.beginPath();
            ctx.arc(part.x, part.y, part.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Player trail
        for (const t of this.playerTrail) {
            ctx.globalAlpha = t.alpha * 0.3;
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.player.w / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Player (glowing diamond shape)
        const p = this.player;
        const half = p.w / 2;

        // Outer glow
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - half);
        ctx.lineTo(p.x + half, p.y);
        ctx.lineTo(p.x, p.y + half);
        ctx.lineTo(p.x - half, p.y);
        ctx.closePath();
        ctx.fill();

        // Inner bright core
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const inner = half * 0.4;
        ctx.moveTo(p.x, p.y - inner);
        ctx.lineTo(p.x + inner, p.y);
        ctx.lineTo(p.x, p.y + inner);
        ctx.lineTo(p.x - inner, p.y);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
    },

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
};

export default RhythmSurvival;
