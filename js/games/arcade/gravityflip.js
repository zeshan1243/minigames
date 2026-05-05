const GravityFlip = {
    canvas: null,
    ctx: null,
    ui: null,
    // Player
    player: { x: 100, y: 0, size: 24, vy: 0, onCeiling: false, flipping: false },
    // World
    floorY: 0,
    ceilY: 0,
    gravity: 0.45,
    flipForce: 10,
    gameSpeed: 4,
    maxSpeed: 14,
    score: 0,
    // Objects
    obstacles: [],
    stars: [],
    particles: [],
    trail: [],
    speedLines: [],
    // State
    gameOver: false,
    paused: false,
    animFrame: null,
    spawnTimer: 0,
    spawnInterval: 80,
    hue: 180,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.floorY = ui.canvasH - 40;
        this.ceilY = 40;
        this.handleKey = this.handleKey.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        const p = this.player;
        p.onCeiling = false;
        p.flipping = false;
        p.y = this.floorY - p.size;
        p.vy = 0;
        this.gameSpeed = 4;
        this.score = 0;
        this.obstacles = [];
        this.particles = [];
        this.trail = [];
        this.speedLines = [];
        this.spawnTimer = 0;
        this.spawnInterval = 80;
        this.hue = 180;
        this.ui.setScore(0);

        // Init parallax stars
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.ui.canvasW,
                y: this.ceilY + Math.random() * (this.floorY - this.ceilY),
                size: 0.5 + Math.random() * 2,
                speed: 0.1 + Math.random() * 0.4,
                brightness: 0.2 + Math.random() * 0.6
            });
        }
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused) {
            this.update();
        }
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        const p = this.player;
        const gravDir = p.onCeiling ? -1 : 1;

        // Apply gravity (toward current surface)
        p.vy += this.gravity * gravDir;
        p.y += p.vy;

        // Floor collision
        if (p.y >= this.floorY - p.size) {
            p.y = this.floorY - p.size;
            p.vy = 0;
            p.flipping = false;
            p.onCeiling = false;
        }

        // Ceiling collision
        if (p.y <= this.ceilY) {
            p.y = this.ceilY;
            p.vy = 0;
            p.flipping = false;
            p.onCeiling = true;
        }

        // Trail
        this.trail.push({ x: p.x + p.size / 2, y: p.y + p.size / 2, alpha: 1 });
        if (this.trail.length > 20) this.trail.shift();
        for (const t of this.trail) {
            t.alpha -= 0.05;
        }

        // Speed lines
        if (Math.random() < 0.3) {
            this.speedLines.push({
                x: this.ui.canvasW,
                y: this.ceilY + Math.random() * (this.floorY - this.ceilY),
                len: 30 + Math.random() * 60,
                alpha: 0.15 + Math.random() * 0.2
            });
        }
        for (let i = this.speedLines.length - 1; i >= 0; i--) {
            this.speedLines[i].x -= this.gameSpeed * 3;
            if (this.speedLines[i].x + this.speedLines[i].len < 0) {
                this.speedLines.splice(i, 1);
            }
        }

        // Score
        this.score += this.gameSpeed * 0.1;
        this.ui.setScore(Math.floor(this.score));

        // Speed increase
        this.gameSpeed = Math.min(this.maxSpeed, 4 + this.score * 0.003);

        // Hue shift
        this.hue = 180 + (this.score * 0.5) % 180;

        // Spawn obstacles
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(35, 80 - this.score * 0.04);
            this.spawnObstacle();
        }

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const o = this.obstacles[i];
            o.x -= this.gameSpeed;
            if (o.x + o.w < 0) {
                this.obstacles.splice(i, 1);
                continue;
            }
            // Collision (slight padding for fairness)
            if (
                p.x + 4 < o.x + o.w &&
                p.x + p.size - 4 > o.x &&
                p.y + 4 < o.y + o.h &&
                p.y + p.size - 4 > o.y
            ) {
                this.endGame();
                return;
            }
        }

        // Parallax stars
        for (const s of this.stars) {
            s.x -= s.speed * this.gameSpeed * 0.3;
            if (s.x < -2) {
                s.x = this.ui.canvasW + 2;
                s.y = this.ceilY + Math.random() * (this.floorY - this.ceilY);
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.vy += 0.15;
            pt.alpha -= 0.02;
            if (pt.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },

    spawnObstacle() {
        const w = this.ui.canvasW;
        const spikeH = 25 + Math.random() * 30;
        const spikeW = 18 + Math.random() * 16;

        // Check last obstacle — ensure enough gap for dual obstacles
        const lastOb = this.obstacles.length > 0 ? this.obstacles[this.obstacles.length - 1] : null;
        const lastIsDual = lastOb && lastOb._dual;
        const minGapAfterDual = 200; // pixels of clear space after a dual obstacle

        // Don't spawn dual if last was dual and too close
        let canSpawnDual = true;
        if (lastIsDual && lastOb.x > w - minGapAfterDual) {
            canSpawnDual = false;
        }

        const rand = Math.random();

        if (rand < 0.35) {
            // Floor spike
            this.obstacles.push({
                x: w, y: this.floorY - spikeH, w: spikeW, h: spikeH, type: 'floor'
            });
        } else if (rand < 0.7 || !canSpawnDual) {
            // Ceiling spike
            this.obstacles.push({
                x: w, y: this.ceilY, w: spikeW, h: spikeH, type: 'ceil'
            });
        } else {
            // Both floor and ceiling — forces a timed flip
            const gap = 160 + Math.random() * 80;
            const midY = (this.floorY + this.ceilY) / 2;
            const topH = midY - gap / 2 - this.ceilY;
            const botH = this.floorY - (midY + gap / 2);
            if (topH > 10 && botH > 10) {
                this.obstacles.push({
                    x: w, y: this.ceilY, w: spikeW + 6, h: topH, type: 'ceil', _dual: true
                });
                this.obstacles.push({
                    x: w, y: this.floorY - botH, w: spikeW + 6, h: botH, type: 'floor', _dual: true
                });
                // Add extra spacing — increase spawn timer to guarantee clearance
                this.spawnTimer = -Math.floor(minGapAfterDual / this.gameSpeed);
            }
        }
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const p = this.player;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Stars
        for (const s of this.stars) {
            ctx.fillStyle = `rgba(200,220,255,${s.brightness})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Speed lines
        for (const sl of this.speedLines) {
            ctx.strokeStyle = `rgba(0,212,255,${sl.alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sl.x, sl.y);
            ctx.lineTo(sl.x + sl.len, sl.y);
            ctx.stroke();
        }

        // Floor and ceiling lines
        const lineColor = `hsl(${this.hue}, 100%, 60%)`;
        const lineGlow = `hsla(${this.hue}, 100%, 60%, 0.3)`;

        // Floor
        ctx.shadowColor = lineGlow;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, this.floorY);
        ctx.lineTo(w, this.floorY);
        ctx.stroke();

        // Ceiling
        ctx.beginPath();
        ctx.moveTo(0, this.ceilY);
        ctx.lineTo(w, this.ceilY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Floor/ceiling fill
        ctx.fillStyle = 'rgba(20,20,40,0.8)';
        ctx.fillRect(0, 0, w, this.ceilY);
        ctx.fillRect(0, this.floorY, w, h - this.floorY);

        // Obstacles
        for (const o of this.obstacles) {
            const isCeil = o.type === 'ceil';
            this.renderSpike(ctx, o, isCeil);
        }

        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            if (t.alpha <= 0) continue;
            const size = p.size * (t.alpha * 0.6);
            ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, ${t.alpha * 0.4})`;
            ctx.fillRect(t.x - size / 2, t.y - size / 2, size, size);
        }

        // Player
        const glowColor = `hsl(${this.hue}, 100%, 60%)`;
        const glowAlpha = `hsla(${this.hue}, 100%, 60%, 0.5)`;

        // Outer glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 18;
        ctx.fillStyle = glowAlpha;
        ctx.fillRect(p.x - 3, p.y - 3, p.size + 6, p.size + 6);

        // Main body
        ctx.shadowBlur = 10;
        ctx.fillStyle = glowColor;
        ctx.fillRect(p.x, p.y, p.size, p.size);

        // Inner highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = `hsla(${this.hue}, 100%, 85%, 0.6)`;
        ctx.fillRect(p.x + 4, p.y + 4, p.size - 8, p.size - 8);

        // Gravity indicator (small arrow showing current gravity direction)
        ctx.fillStyle = `hsla(${this.hue}, 100%, 80%, 0.8)`;
        const arrowY = p.onCeiling ? p.y - 6 : p.y + p.size + 6;
        const arrowDir = p.onCeiling ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(p.x + p.size / 2, arrowY + 4 * arrowDir);
        ctx.lineTo(p.x + p.size / 2 - 4, arrowY - 2 * arrowDir);
        ctx.lineTo(p.x + p.size / 2 + 4, arrowY - 2 * arrowDir);
        ctx.closePath();
        ctx.fill();

        // Death particles
        for (const pt of this.particles) {
            ctx.fillStyle = `hsla(${pt.hue}, 100%, 60%, ${pt.alpha})`;
            ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
        }

        // Paused overlay
        if (this.paused) {
            ctx.fillStyle = 'rgba(10,10,15,0.6)';
            ctx.fillRect(0, 0, w, h);
        }
    },

    renderSpike(ctx, o, isCeil) {
        const spikeColor = '#ff2d7b';
        const spikeGlow = 'rgba(255,45,123,0.3)';

        ctx.shadowColor = spikeGlow;
        ctx.shadowBlur = 8;
        ctx.fillStyle = spikeColor;

        // Draw as triangular spike
        ctx.beginPath();
        if (isCeil) {
            // Points downward
            ctx.moveTo(o.x, o.y);
            ctx.lineTo(o.x + o.w, o.y);
            ctx.lineTo(o.x + o.w / 2, o.y + o.h);
        } else {
            // Points upward
            ctx.moveTo(o.x + o.w / 2, o.y);
            ctx.lineTo(o.x + o.w, o.y + o.h);
            ctx.lineTo(o.x, o.y + o.h);
        }
        ctx.closePath();
        ctx.fill();

        // Highlight edge
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,100,150,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
    },

    flipGravity() {
        if (this.gameOver || this.paused) return;
        const p = this.player;
        // Flip direction
        p.onCeiling = !p.onCeiling;
        p.flipping = true;
        // Apply impulse toward the target surface
        p.vy = p.onCeiling ? -this.flipForce : this.flipForce;
    },

    spawnDeathParticles() {
        const p = this.player;
        const cx = p.x + p.size / 2;
        const cy = p.y + p.size / 2;
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                alpha: 1,
                hue: this.hue + Math.random() * 40 - 20
            });
        }
    },

    endGame() {
        this.gameOver = true;
        this.spawnDeathParticles();
        // Render one more frame to show particles
        this.renderDeathFrame();
        cancelAnimationFrame(this.animFrame);
        const finalScore = Math.floor(this.score);
        this.ui.setHighScore(finalScore);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(finalScore, best);
    },

    renderDeathFrame() {
        // Animate death particles briefly
        let frames = 0;
        const deathLoop = () => {
            if (frames > 40) return;
            frames++;
            for (const pt of this.particles) {
                pt.x += pt.vx;
                pt.y += pt.vy;
                pt.vy += 0.15;
                pt.alpha -= 0.02;
            }
            this.render();
            requestAnimationFrame(deathLoop);
        };
        deathLoop();
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }
        if (e.key === ' ' || e.key === 'ArrowUp') {
            e.preventDefault();
            this.flipGravity();
        }
    },

    handleTouch(e) {
        e.preventDefault();
        this.flipGravity();
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) {
            this.ui.showPause();
        } else {
            this.ui.hidePause();
        }
    },

    pause() { if (!this.paused) this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
    }
};

export default GravityFlip;
