const GolfPutt = {
    canvas: null, ctx: null, ui: null,
    ball: null, hole: null, obstacles: [],
    aiming: false, power: 0, maxPower: 600,
    aimAngle: 0, aimDir: { x: 0, y: 0 },
    mouseX: 0, mouseY: 0, charging: false,
    strokes: 0, currentHole: 0, totalHoles: 3,
    ballMoving: false, friction: 0.985, bounceRestitution: 0.7,
    gameOver: false, paused: false, animFrame: null,
    lastTime: 0, trail: [], holeComplete: false,
    holePar: [3, 4, 5], powerBarWidth: 0,
    walls: [], sinkAnim: 0,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleDown = this.handleDown.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleUp = this.handleUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('mousedown', this.handleDown);
        canvas.addEventListener('mousemove', this.handleMove);
        canvas.addEventListener('mouseup', this.handleUp);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        this.strokes = 0; this.currentHole = 0;
        this.gameOver = false; this.paused = false;
        this.ui.setScore(0); this.ui.hideGameOver(); this.ui.hidePause();
        this.setupHole(0);
        this.lastTime = performance.now();
        this.loop();
    },

    setupHole(idx) {
        const w = this.ui.canvasW, h = this.ui.canvasH;
        this.holeComplete = false; this.sinkAnim = 0;
        this.charging = false; this.power = 0;
        this.trail = [];
        this.ballMoving = false;
        this.powerBarWidth = Math.min(w * 0.5, 200);

        // Wall bounds
        const margin = 30;
        this.walls = [
            { x: margin, y: margin, w: w - margin * 2, h: 4 },            // top
            { x: margin, y: h - margin, w: w - margin * 2, h: 4 },        // bottom
            { x: margin, y: margin, w: 4, h: h - margin * 2 },            // left
            { x: w - margin - 4, y: margin, w: 4, h: h - margin * 2 }    // right
        ];

        if (idx === 0) {
            this.ball = { x: w * 0.2, y: h * 0.75, vx: 0, vy: 0, r: 8 };
            this.hole = { x: w * 0.8, y: h * 0.25, r: 12 };
            this.obstacles = [
                { x: w * 0.45, y: h * 0.35, w: 20, h: h * 0.35 }
            ];
        } else if (idx === 1) {
            this.ball = { x: w * 0.15, y: h * 0.85, vx: 0, vy: 0, r: 8 };
            this.hole = { x: w * 0.85, y: h * 0.15, r: 12 };
            this.obstacles = [
                { x: w * 0.3, y: h * 0.2, w: 20, h: h * 0.4 },
                { x: w * 0.6, y: h * 0.45, w: 20, h: h * 0.4 }
            ];
        } else {
            this.ball = { x: w * 0.5, y: h * 0.85, vx: 0, vy: 0, r: 8 };
            this.hole = { x: w * 0.5, y: h * 0.12, r: 12 };
            this.obstacles = [
                { x: w * 0.2, y: h * 0.55, w: w * 0.25, h: 16 },
                { x: w * 0.55, y: h * 0.55, w: w * 0.25, h: 16 },
                { x: w * 0.35, y: h * 0.3, w: w * 0.3, h: 16 }
            ];
        }
    },

    getCanvasPos(clientX, clientY) {
        const r = this.canvas.getBoundingClientRect();
        return { x: clientX - r.left, y: clientY - r.top };
    },

    handleTouchStart(e) {
        e.preventDefault();
        const t = e.touches[0];
        const pos = this.getCanvasPos(t.clientX, t.clientY);
        this.mouseX = pos.x; this.mouseY = pos.y;
        this.startAim(pos.x, pos.y);
    },
    handleTouchMove(e) {
        e.preventDefault();
        const t = e.touches[0];
        const pos = this.getCanvasPos(t.clientX, t.clientY);
        this.mouseX = pos.x; this.mouseY = pos.y;
    },
    handleTouchEnd(e) {
        e.preventDefault();
        this.releaseShot();
    },

    handleDown(e) {
        const pos = this.getCanvasPos(e.clientX, e.clientY);
        this.mouseX = pos.x; this.mouseY = pos.y;
        this.startAim(pos.x, pos.y);
    },

    handleMove(e) {
        const pos = this.getCanvasPos(e.clientX, e.clientY);
        this.mouseX = pos.x; this.mouseY = pos.y;
    },

    handleUp(e) {
        this.releaseShot();
    },

    startAim(mx, my) {
        if (this.paused || this.gameOver || this.ballMoving || this.holeComplete) return;
        this.charging = true;
        this.power = 0;
    },

    releaseShot() {
        if (!this.charging) return;
        this.charging = false;
        if (this.power < 5) return;

        const dx = this.ball.x - this.mouseX;
        const dy = this.ball.y - this.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) return;

        this.ball.vx = (dx / dist) * this.power;
        this.ball.vy = (dy / dist) * this.power;
        this.ballMoving = true;
        this.strokes++;
        this.ui.setScore(this.strokes);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') this.togglePause();
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) this.ui.showPause();
        else { this.ui.hidePause(); this.lastTime = performance.now(); }
    },

    loop() {
        this.animFrame = requestAnimationFrame(() => this.loop());
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.03);
        this.lastTime = now;

        if (!this.paused) this.update(dt);
        this.draw();
    },

    update(dt) {
        // Charging power
        if (this.charging) {
            this.power = Math.min(this.power + this.maxPower * dt * 1.2, this.maxPower);
        }

        if (this.holeComplete) {
            this.sinkAnim += dt * 3;
            if (this.sinkAnim >= 1) {
                this.currentHole++;
                if (this.currentHole >= this.totalHoles) {
                    this.endGame();
                } else {
                    this.setupHole(this.currentHole);
                }
            }
            return;
        }

        if (!this.ballMoving) return;

        const b = this.ball;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Friction
        b.vx *= Math.pow(this.friction, dt * 60);
        b.vy *= Math.pow(this.friction, dt * 60);

        // Trail
        this.trail.push({ x: b.x, y: b.y, life: 1 });
        if (this.trail.length > 30) this.trail.shift();
        for (const t of this.trail) t.life -= dt * 3;
        this.trail = this.trail.filter(t => t.life > 0);

        // Wall collisions
        const margin = 30;
        const w = this.ui.canvasW, h = this.ui.canvasH;
        if (b.x - b.r < margin + 4) { b.x = margin + 4 + b.r; b.vx = Math.abs(b.vx) * this.bounceRestitution; }
        if (b.x + b.r > w - margin - 4) { b.x = w - margin - 4 - b.r; b.vx = -Math.abs(b.vx) * this.bounceRestitution; }
        if (b.y - b.r < margin + 4) { b.y = margin + 4 + b.r; b.vy = Math.abs(b.vy) * this.bounceRestitution; }
        if (b.y + b.r > h - margin - 4) { b.y = h - margin - 4 - b.r; b.vy = -Math.abs(b.vy) * this.bounceRestitution; }

        // Obstacle collisions
        for (const ob of this.obstacles) {
            if (this.ballRectCollide(b, ob)) {
                this.resolveBallRect(b, ob);
            }
        }

        // Check hole
        const hDx = b.x - this.hole.x, hDy = b.y - this.hole.y;
        const hDist = Math.sqrt(hDx * hDx + hDy * hDy);
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (hDist < this.hole.r && speed < 300) {
            this.holeComplete = true;
            this.sinkAnim = 0;
            b.vx = 0; b.vy = 0;
            this.ballMoving = false;
        }

        // Stop if slow
        if (speed < 3) {
            b.vx = 0; b.vy = 0;
            this.ballMoving = false;
        }
    },

    ballRectCollide(b, r) {
        const cx = Math.max(r.x, Math.min(b.x, r.x + r.w));
        const cy = Math.max(r.y, Math.min(b.y, r.y + r.h));
        const dx = b.x - cx, dy = b.y - cy;
        return (dx * dx + dy * dy) < (b.r * b.r);
    },

    resolveBallRect(b, r) {
        const cx = Math.max(r.x, Math.min(b.x, r.x + r.w));
        const cy = Math.max(r.y, Math.min(b.y, r.y + r.h));
        const dx = b.x - cx, dy = b.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;
        const nx = dx / dist, ny = dy / dist;
        // Push out
        b.x = cx + nx * (b.r + 1);
        b.y = cy + ny * (b.r + 1);
        // Reflect velocity
        const dot = b.vx * nx + b.vy * ny;
        b.vx = (b.vx - 2 * dot * nx) * this.bounceRestitution;
        b.vy = (b.vy - 2 * dot * ny) * this.bounceRestitution;
    },

    endGame() {
        this.gameOver = true;
        const best = this.ui.getHighScore() || 9999;
        if (this.strokes < best) this.ui.setHighScore(this.strokes);
        this.ui.showGameOver(this.strokes, Math.min(this.strokes, best));
    },

    draw() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        const margin = 30;

        // Green playing field
        ctx.fillStyle = '#0d1a0d';
        ctx.fillRect(margin, margin, w - margin * 2, h - margin * 2);

        // Field border
        ctx.strokeStyle = '#00d4ff44';
        ctx.lineWidth = 3;
        ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

        // Hole info
        ctx.fillStyle = '#00d4ff';
        ctx.font = `bold ${Math.min(w * 0.04, 16)}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`Hole ${this.currentHole + 1}/${this.totalHoles}`, margin + 8, margin - 8);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd60a';
        ctx.fillText(`Strokes: ${this.strokes}`, w - margin - 8, margin - 8);

        // Obstacles
        for (const ob of this.obstacles) {
            const grad = ctx.createLinearGradient(ob.x, ob.y, ob.x + ob.w, ob.y + ob.h);
            grad.addColorStop(0, '#2a1a3a');
            grad.addColorStop(1, '#1a1030');
            ctx.fillStyle = grad;
            ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
            ctx.strokeStyle = '#a855f766';
            ctx.lineWidth = 2;
            ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
        }

        // Hole
        const ho = this.hole;
        ctx.beginPath();
        ctx.arc(ho.x, ho.y, ho.r + 4, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ho.x, ho.y, ho.r, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.strokeStyle = '#ffd60a66';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Flag
        ctx.strokeStyle = '#ffd60a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ho.x, ho.y - ho.r);
        ctx.lineTo(ho.x, ho.y - ho.r - 20);
        ctx.stroke();
        ctx.fillStyle = '#ff2d7b';
        ctx.beginPath();
        ctx.moveTo(ho.x, ho.y - ho.r - 20);
        ctx.lineTo(ho.x + 12, ho.y - ho.r - 15);
        ctx.lineTo(ho.x, ho.y - ho.r - 10);
        ctx.fill();

        // Ball trail
        for (const t of this.trail) {
            ctx.globalAlpha = t.life * 0.3;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.ball.r * t.life * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Ball
        if (!this.holeComplete || this.sinkAnim < 0.5) {
            const b = this.ball;
            const scale = this.holeComplete ? 1 - this.sinkAnim * 2 : 1;
            const glow = ctx.createRadialGradient(b.x - 2, b.y - 2, 0, b.x, b.y, b.r * 1.5);
            glow.addColorStop(0, '#ffffff');
            glow.addColorStop(0.5, '#dddddd');
            glow.addColorStop(1, '#88888800');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Aim line
        if (!this.ballMoving && !this.holeComplete && !this.gameOver) {
            const b = this.ball;
            const dx = b.x - this.mouseX, dy = b.y - this.mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                const nx = dx / dist, ny = dy / dist;
                const lineLen = this.charging ? (this.power / this.maxPower) * 100 + 20 : 40;
                ctx.strokeStyle = '#00d4ff66';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(b.x, b.y);
                ctx.lineTo(b.x + nx * lineLen, b.y + ny * lineLen);
                ctx.stroke();
                ctx.setLineDash([]);

                // Arrow head
                const ax = b.x + nx * lineLen, ay = b.y + ny * lineLen;
                ctx.fillStyle = '#00d4ff66';
                ctx.beginPath();
                ctx.moveTo(ax + nx * 8, ay + ny * 8);
                ctx.lineTo(ax + ny * 5, ay - nx * 5);
                ctx.lineTo(ax - ny * 5, ay + nx * 5);
                ctx.fill();
            }
        }

        // Power bar
        if (this.charging) {
            const barW = this.powerBarWidth;
            const barH = 14;
            const barX = (w - barW) / 2;
            const barY = h - margin + 8;
            const pct = this.power / this.maxPower;

            ctx.fillStyle = '#1a1a2e';
            this.roundRect(ctx, barX, barY, barW, barH, 7);
            ctx.fill();

            const grad = ctx.createLinearGradient(barX, barY, barX + barW * pct, barY);
            grad.addColorStop(0, '#00e676');
            grad.addColorStop(0.5, '#ffd60a');
            grad.addColorStop(1, '#ff2d7b');
            ctx.fillStyle = grad;
            this.roundRect(ctx, barX, barY, barW * pct, barH, 7);
            ctx.fill();

            ctx.strokeStyle = '#ffffff33';
            ctx.lineWidth = 1;
            this.roundRect(ctx, barX, barY, barW, barH, 7);
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = `bold 11px 'Segoe UI', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('POWER', w / 2, barY - 4);
        }
    },

    roundRect(ctx, x, y, w, h, r) {
        if (w < 0) w = 0;
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    reset() { cancelAnimationFrame(this.animFrame); },
    pause() { this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        this.canvas.removeEventListener('mousedown', this.handleDown);
        this.canvas.removeEventListener('mousemove', this.handleMove);
        this.canvas.removeEventListener('mouseup', this.handleUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default GolfPutt;
