const Pinball = {
    canvas: null, ctx: null, ui: null,
    animFrame: null, gameOver: false, paused: false,
    lastTime: 0, score: 0, lives: 3,

    // Ball
    ball: null, ballR: 7, gravity: 520, launched: false,
    springPower: 0, springCharging: false,

    // Flippers
    leftFlipper: null, rightFlipper: null,
    flipperLen: 55, flipperW: 9,
    leftFlipUp: false, rightFlipUp: false,

    // Table elements
    bumpers: [], slingshots: [], walls: [], particles: [],
    // Table dimensions
    tableL: 0, tableR: 0, tableT: 0, tableB: 0,
    laneDivX: 0,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
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
        this.setupTable();
        this.gameOver = false; this.paused = false;
        this.ui.hideGameOver(); this.ui.hidePause();
        this.lastTime = performance.now();
        this.loop();
    },

    setupTable() {
        cancelAnimationFrame(this.animFrame);
        const W = this.ui.canvasW, H = this.ui.canvasH;
        this.score = 0; this.lives = 3; this.particles = [];
        this.launched = false; this.springPower = 0; this.springCharging = false;
        this.leftFlipUp = false; this.rightFlipUp = false;
        this.ui.setScore(0);

        this.tableL = 15; this.tableR = W - 50; this.tableT = 15; this.tableB = H - 10;
        this.laneDivX = W - 45;

        // Ball in spring lane
        this.ball = { x: W - 25, y: H - 90, vx: 0, vy: 0 };

        // Flippers — positioned symmetrically
        const flipY = H - 75;
        const cxL = this.tableL + (this.tableR - this.tableL) * 0.32;
        const cxR = this.tableL + (this.tableR - this.tableL) * 0.68;
        this.leftFlipper = { x: cxL, y: flipY, angle: 0.38, restAngle: 0.38, upAngle: -0.55 };
        this.rightFlipper = { x: cxR, y: flipY, angle: Math.PI - 0.38, restAngle: Math.PI - 0.38, upAngle: Math.PI + 0.55 };

        // Bumpers
        const cx = (this.tableL + this.tableR) / 2;
        this.bumpers = [
            { x: cx - 70, y: H * 0.22, r: 22, pts: 10, hit: 0 },
            { x: cx + 70, y: H * 0.22, r: 22, pts: 10, hit: 0 },
            { x: cx,      y: H * 0.14, r: 26, pts: 20, hit: 0 },
            { x: cx - 50, y: H * 0.38, r: 18, pts: 10, hit: 0 },
            { x: cx + 50, y: H * 0.38, r: 18, pts: 10, hit: 0 },
            { x: cx,      y: H * 0.30, r: 20, pts: 15, hit: 0 },
            { x: cx - 90, y: H * 0.50, r: 14, pts: 5,  hit: 0 },
            { x: cx + 90, y: H * 0.50, r: 14, pts: 5,  hit: 0 }
        ];

        // Wall segments (line segments the ball bounces off)
        this.walls = [
            // Table boundary
            { x1: this.tableL, y1: this.tableT + 30, x2: this.tableL, y2: this.tableB },          // left wall
            { x1: this.tableL, y1: this.tableT + 30, x2: this.tableL + 50, y2: this.tableT },     // top-left curve
            { x1: this.tableL + 50, y1: this.tableT, x2: this.tableR - 50, y2: this.tableT },     // top
            { x1: this.tableR - 50, y1: this.tableT, x2: this.tableR, y2: this.tableT + 30 },     // top-right curve
            { x1: this.tableR, y1: this.tableT + 30, x2: this.tableR, y2: H * 0.55 },             // right wall upper
            { x1: this.laneDivX, y1: this.tableT + 30, x2: this.laneDivX, y2: H * 0.55 },         // lane divider
            // Guide walls (angled walls above flippers)
            { x1: this.tableL, y1: H - 140, x2: cxL - 25, y2: flipY + 5 },
            { x1: this.tableR, y1: H - 140, x2: cxR + 25, y2: flipY + 5 }
        ];
    },

    loop() {
        if (this.gameOver) return;
        this.animFrame = requestAnimationFrame(() => this.loop());
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.025);
        this.lastTime = now;
        if (this.paused) { this.render(); return; }
        // Sub-step physics for accuracy
        const steps = 3;
        const subDt = dt / steps;
        for (let s = 0; s < steps; s++) {
            this.update(subDt);
            if (this.gameOver) return;
        }
        this.render();
    },

    update(dt) {
        const W = this.ui.canvasW, H = this.ui.canvasH;
        const b = this.ball, R = this.ballR;

        // Spring charging
        if (this.springCharging && !this.launched) {
            this.springPower = Math.min(1, this.springPower + dt * 1.8);
        }

        // Flipper animation (fast snap)
        const flipSpeed = 18;
        const lTarget = this.leftFlipUp ? this.leftFlipper.upAngle : this.leftFlipper.restAngle;
        const rTarget = this.rightFlipUp ? this.rightFlipper.upAngle : this.rightFlipper.restAngle;
        this.leftFlipper.angle += (lTarget - this.leftFlipper.angle) * Math.min(1, flipSpeed * dt);
        this.rightFlipper.angle += (rTarget - this.rightFlipper.angle) * Math.min(1, flipSpeed * dt);

        if (!this.launched) return;

        // Gravity
        b.vy += this.gravity * dt;

        // Apply velocity
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Clamp max speed
        const maxSpeed = 900;
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (spd > maxSpeed) { b.vx = (b.vx / spd) * maxSpeed; b.vy = (b.vy / spd) * maxSpeed; }

        // Wall segment collisions
        for (const w of this.walls) {
            this.collideWallSeg(w);
        }

        // Spring lane right wall
        if (b.x + R > W - 10) { b.x = W - 10 - R; b.vx = -Math.abs(b.vx) * 0.7; }

        // Bumper collisions
        for (const bump of this.bumpers) {
            const dx = b.x - bump.x, dy = b.y - bump.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < R + bump.r) {
                const nx = dx / dist, ny = dy / dist;
                b.x = bump.x + nx * (R + bump.r + 1);
                b.y = bump.y + ny * (R + bump.r + 1);
                // Reflect
                const dot = b.vx * nx + b.vy * ny;
                b.vx -= 2 * dot * nx;
                b.vy -= 2 * dot * ny;
                // Boost on hit
                const s2 = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                const boost = Math.max(350, s2 * 1.15);
                b.vx = (b.vx / s2) * boost; b.vy = (b.vy / s2) * boost;
                this.score += bump.pts;
                this.ui.setScore(this.score);
                bump.hit = 0.3;
                this.spawnParticles(bump.x, bump.y, '#ffd60a');
            }
            if (bump.hit > 0) bump.hit -= dt;
        }

        // Flipper collisions
        this.collideFlipper(this.leftFlipper, 1);
        this.collideFlipper(this.rightFlipper, -1);

        // Ball drain
        if (b.y > H + 30) {
            this.lives--;
            if (this.lives <= 0) { this.endGame(); return; }
            this.resetBall();
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    collideWallSeg(w) {
        const b = this.ball, R = this.ballR;
        const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
        const fx = b.x - w.x1, fy = b.y - w.y1;
        const lenSq = dx * dx + dy * dy;
        let t = (fx * dx + fy * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const closestX = w.x1 + t * dx, closestY = w.y1 + t * dy;
        const distX = b.x - closestX, distY = b.y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);
        if (dist < R) {
            const nx = distX / dist || 0, ny = distY / dist || -1;
            b.x = closestX + nx * (R + 0.5);
            b.y = closestY + ny * (R + 0.5);
            const dot = b.vx * nx + b.vy * ny;
            b.vx -= 2 * dot * nx * 0.85;
            b.vy -= 2 * dot * ny * 0.85;
        }
    },

    collideFlipper(flip, side) {
        const b = this.ball, R = this.ballR;
        const len = this.flipperLen;
        const ex = flip.x + Math.cos(flip.angle) * len * side;
        const ey = flip.y + Math.sin(flip.angle) * len;
        const dx = ex - flip.x, dy = ey - flip.y;
        const fx = b.x - flip.x, fy = b.y - flip.y;
        const lenSq = dx * dx + dy * dy;
        let t = (fx * dx + fy * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const closestX = flip.x + t * dx, closestY = flip.y + t * dy;
        const distX = b.x - closestX, distY = b.y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);
        const hitR = R + this.flipperW / 2;

        if (dist < hitR) {
            const nx = distX / dist || 0, ny = distY / dist || -1;
            b.x = closestX + nx * (hitR + 1);
            b.y = closestY + ny * (hitR + 1);
            const dot = b.vx * nx + b.vy * ny;
            b.vx -= 2 * dot * nx;
            b.vy -= 2 * dot * ny;
            // Flip power boost
            const isUp = (side === 1 && this.leftFlipUp) || (side === -1 && this.rightFlipUp);
            if (isUp) {
                b.vy -= 320;
                b.vx += side * 120;
            }
            // Small score for flipper hit
            this.score += 1;
            this.ui.setScore(this.score);
        }
    },

    resetBall() {
        const W = this.ui.canvasW, H = this.ui.canvasH;
        this.ball = { x: W - 25, y: H - 90, vx: 0, vy: 0 };
        this.launched = false; this.springPower = 0;
    },

    spawnParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 60 + Math.random() * 150;
            this.particles.push({
                x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                r: 1.5 + Math.random() * 2.5, color, life: 0.3 + Math.random() * 0.4
            });
        }
    },

    render() {
        const ctx = this.ctx, W = this.ui.canvasW, H = this.ui.canvasH;
        ctx.fillStyle = '#060610'; ctx.fillRect(0, 0, W, H);

        // Table background
        ctx.fillStyle = '#0c0c1c';
        ctx.beginPath();
        ctx.moveTo(this.tableL, this.tableT + 30);
        ctx.lineTo(this.tableL + 50, this.tableT);
        ctx.lineTo(this.tableR - 50, this.tableT);
        ctx.lineTo(this.tableR, this.tableT + 30);
        ctx.lineTo(this.tableR, this.tableB);
        ctx.lineTo(this.tableL, this.tableB);
        ctx.closePath();
        ctx.fill();

        // Spring lane background
        ctx.fillStyle = '#0a0a18';
        ctx.fillRect(this.laneDivX, this.tableT + 30, W - 10 - this.laneDivX, H - this.tableT - 40);

        // Wall segments
        ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (const w of this.walls) {
            ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();
        }
        // Right outer wall
        ctx.beginPath(); ctx.moveTo(W - 10, this.tableT + 30); ctx.lineTo(W - 10, H - 10); ctx.stroke();

        // Drain zone indicator
        ctx.fillStyle = 'rgba(255,45,123,0.06)';
        const drainY = this.leftFlipper.y + 20;
        ctx.fillRect(this.tableL, drainY, this.tableR - this.tableL, H - drainY);

        // Bumpers
        for (const bump of this.bumpers) {
            const glow = bump.hit > 0;
            ctx.save();
            ctx.shadowColor = glow ? '#ffd60a' : '#ff2d7b';
            ctx.shadowBlur = glow ? 25 : 6;
            // Outer ring
            ctx.strokeStyle = glow ? '#ffd60a' : '#ff2d7b';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(bump.x, bump.y, bump.r, 0, Math.PI * 2); ctx.stroke();
            // Inner fill
            ctx.fillStyle = glow ? 'rgba(255,214,10,0.3)' : 'rgba(255,45,123,0.15)';
            ctx.beginPath(); ctx.arc(bump.x, bump.y, bump.r - 3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            // Points label
            ctx.fillStyle = glow ? '#ffd60a' : '#ff6688';
            ctx.font = `bold ${Math.floor(bump.r * 0.6)}px JetBrains Mono, monospace`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(bump.pts, bump.x, bump.y + 1);
        }

        // Flippers
        this.renderFlipper(ctx, this.leftFlipper, 1);
        this.renderFlipper(ctx, this.rightFlipper, -1);

        // Spring
        if (!this.launched) {
            const springX = W - 25, springBottom = H - 35;
            const springH = 50 * this.springPower;
            // Spring coils
            ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
            const coils = 6;
            for (let i = 0; i < coils; i++) {
                const cy = springBottom - (i / coils) * (50 - springH);
                ctx.beginPath();
                ctx.moveTo(springX - 8, cy);
                ctx.lineTo(springX + 8, cy);
                ctx.stroke();
            }
            // Power bar
            ctx.fillStyle = `hsl(${120 - this.springPower * 120}, 80%, 50%)`;
            ctx.fillRect(W - 33, springBottom - springH, 16, springH);
            // Label
            ctx.fillStyle = '#888'; ctx.font = '9px Outfit, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('HOLD', springX, H - 18);
            ctx.fillText('SPACE', springX, H - 8);
        }

        // Ball
        const b = this.ball;
        ctx.save();
        ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#e8e8f0';
        ctx.beginPath(); ctx.arc(b.x, b.y, this.ballR, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.arc(b.x - 2, b.y - 2, this.ballR * 0.35, 0, Math.PI * 2); ctx.fill();

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life * 2.5);
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // HUD
        ctx.textBaseline = 'top'; ctx.textAlign = 'left';
        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.fillText('\u2764'.repeat(this.lives), 20, 22);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd60a'; ctx.font = 'bold 16px JetBrains Mono, monospace';
        ctx.fillText(String(this.score), this.tableR - 5, 22);
        ctx.textBaseline = 'alphabetic';
    },

    renderFlipper(ctx, flip, side) {
        const len = this.flipperLen;
        const ex = flip.x + Math.cos(flip.angle) * len * side;
        const ey = flip.y + Math.sin(flip.angle) * len;
        ctx.save();
        ctx.shadowColor = '#00e676'; ctx.shadowBlur = 6;
        ctx.strokeStyle = '#00e676'; ctx.lineWidth = this.flipperW; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(flip.x, flip.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.restore();
        // Pivot dot
        ctx.fillStyle = '#00e676';
        ctx.beginPath(); ctx.arc(flip.x, flip.y, 4, 0, Math.PI * 2); ctx.fill();
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        this.render();
        this.ui.setHighScore(this.score);
        this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') { this.togglePause(); return; }
        if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); this.leftFlipUp = true; }
        if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); this.rightFlipUp = true; }
        if (e.key === ' ') { e.preventDefault(); if (!this.launched) this.springCharging = true; }
    },

    handleKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a') this.leftFlipUp = false;
        if (e.key === 'ArrowRight' || e.key === 'd') this.rightFlipUp = false;
        if (e.key === ' ' && !this.launched && this.springCharging) {
            this.springCharging = false;
            this.launched = true;
            this.ball.vy = -(350 + this.springPower * 550);
            this.ball.vx = -40 - Math.random() * 60;
        }
    },

    handleTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const W = this.ui.canvasW;
        for (let i = 0; i < e.touches.length; i++) {
            const tx = (e.touches[i].clientX - rect.left) * (W / rect.width);
            if (!this.launched) {
                this.springCharging = true;
                this.springPower = 0.75;
                setTimeout(() => {
                    if (!this.launched) {
                        this.launched = true; this.springCharging = false;
                        this.ball.vy = -(350 + this.springPower * 550);
                        this.ball.vx = -40 - Math.random() * 60;
                    }
                }, 250);
            }
            if (tx < W / 2) this.leftFlipUp = true;
            else this.rightFlipUp = true;
        }
    },

    handleTouchEnd(e) {
        e.preventDefault();
        this.leftFlipUp = false; this.rightFlipUp = false;
        const rect = this.canvas.getBoundingClientRect();
        const W = this.ui.canvasW;
        for (let i = 0; i < e.touches.length; i++) {
            const tx = (e.touches[i].clientX - rect.left) * (W / rect.width);
            if (tx < W / 2) this.leftFlipUp = true;
            else this.rightFlipUp = true;
        }
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) this.ui.showPause(); else { this.ui.hidePause(); this.lastTime = performance.now(); }
    },

    pause() { if (!this.paused) this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
};

export default Pinball;
