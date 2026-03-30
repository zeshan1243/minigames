const Breakout = {
    canvas: null, ctx: null, ui: null,
    paddle: { w: 80, h: 12, x: 0 },
    ball: { x: 0, y: 0, vx: 3, vy: -3, r: 6 },
    bricks: [], score: 0, lives: 3,
    gameOver: false, paused: false, animFrame: null, started: false,
    rows: 6, cols: 8,

    // Animation state
    particles: [],       // brick-break particles [{x, y, vx, vy, life, maxLife, color}]
    shakeFrames: 0,      // remaining screen shake frames
    shakeMagnitude: 3,   // max pixel offset for shake
    ballTrail: [],       // recent ball positions for trail [{x, y}]
    trailMaxLength: 8,   // how many trail positions to keep

    // 2P state
    paddle2: { w: 80, h: 12, x: 0 },
    p1Keys: {},
    p2Keys: {},
    p1Touch: null,       // touch x for player 1 (bottom half)
    p2Touch: null,       // touch x for player 2 (top half)

    is2P() { return this.ui && this.ui.mode === '2p'; },

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleMove = this.handleMove.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleKey = this.handleKey.bind(this);
        this.handleKeyUp2P = this.handleKeyUp2P.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleTouchStart2P = this.handleTouchStart2P.bind(this);
        this.handleTouchEnd2P = this.handleTouchEnd2P.bind(this);
        canvas.addEventListener('mousemove', this.handleMove);
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouchStart2P, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd2P, { passive: false });
        document.addEventListener('keydown', this.handleKey);
        document.addEventListener('keyup', this.handleKeyUp2P);
    },

    start() {
        // Configure difficulty
        const level = (this.ui && this.ui.level) || 'medium';
        if (level === 'easy') {
            this.rows = 4; this._ballSpeed = 2.5; this.paddle.w = 100; this.paddle2.w = 100;
        } else if (level === 'hard') {
            this.rows = 8; this._ballSpeed = 4; this.paddle.w = 60; this.paddle2.w = 60;
        } else {
            this.rows = 6; this._ballSpeed = 3; this.paddle.w = 80; this.paddle2.w = 80;
        }
        this._hardMode = (level === 'hard');

        this.score = 0; this.lives = 3; this.gameOver = false; this.paused = false; this.started = false;
        this.particles = []; this.shakeFrames = 0; this.ballTrail = [];
        this.p1Keys = {}; this.p2Keys = {}; this.p1Touch = null; this.p2Touch = null;
        this.ui.setScore(0); this.ui.hideGameOver(); this.ui.hidePause();
        this.paddle.x = this.ui.canvasW / 2 - this.paddle.w / 2;
        if (this.is2P()) {
            this.paddle2.x = this.ui.canvasW / 2 - this.paddle2.w / 2;
        }
        this.resetBall();
        this.buildBricks();
        this.loop();
    },

    resetBall() {
        const spd = this._ballSpeed || 3;
        this.ball.x = this.ui.canvasW / 2;
        this.ball.y = this.ui.canvasH / 2;
        this.ball.vx = (Math.random() > 0.5 ? 1 : -1) * spd;
        this.ball.vy = (Math.random() > 0.5 ? 1 : -1) * spd;
        this.started = false;
        this.ballTrail = [];
    },

    buildBricks() {
        this.bricks = [];
        const bw = (this.ui.canvasW - 20) / this.cols - 4;
        const bh = 18;
        const topOffset = this.is2P() ? 80 : 50;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Hard mode: top 2 rows take 2 hits
                const hp = (this._hardMode && r < 2) ? 2 : 1;
                this.bricks.push({
                    x: 12 + c * (bw + 4), y: topOffset + r * (bh + 4),
                    w: bw, h: bh, alive: true,
                    hue: r * 40,
                    hp: hp, maxHp: hp
                });
            }
        }
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused && this.started) this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        const b = this.ball, w = this.ui.canvasW, h = this.ui.canvasH;

        // 2P paddle movement from keys
        if (this.is2P()) {
            const step = 6;
            if (this.p1Keys['a'] || this.p1Keys['A']) this.paddle.x = Math.max(0, this.paddle.x - step);
            if (this.p1Keys['d'] || this.p1Keys['D']) this.paddle.x = Math.min(w - this.paddle.w, this.paddle.x + step);
            if (this.p2Keys['ArrowLeft']) this.paddle2.x = Math.max(0, this.paddle2.x - step);
            if (this.p2Keys['ArrowRight']) this.paddle2.x = Math.min(w - this.paddle2.w, this.paddle2.x + step);
        }

        // Record ball trail
        this.ballTrail.push({ x: b.x, y: b.y });
        if (this.ballTrail.length > this.trailMaxLength) {
            this.ballTrail.shift();
        }

        b.x += b.vx; b.y += b.vy;

        // Wall bounce (left/right)
        if (b.x - b.r <= 0 || b.x + b.r >= w) b.vx = -b.vx;

        if (this.is2P()) {
            // Top - lose life (ball passes P2 paddle)
            if (b.y - b.r <= 0) {
                this.lives--;
                if (this.lives <= 0) { this.endGame(); return; }
                this.resetBall();
                return;
            }
            // Bottom - lose life (ball passes P1 paddle)
            if (b.y + b.r >= h) {
                this.lives--;
                if (this.lives <= 0) { this.endGame(); return; }
                this.resetBall();
                return;
            }

            // P1 paddle (bottom)
            const p1y = h - 40;
            if (b.vy > 0 && b.y + b.r >= p1y && b.y + b.r <= p1y + this.paddle.h + 5 &&
                b.x >= this.paddle.x && b.x <= this.paddle.x + this.paddle.w) {
                b.vy = -Math.abs(b.vy);
                const hit = (b.x - this.paddle.x) / this.paddle.w - 0.5;
                b.vx = hit * 6;
            }

            // P2 paddle (top)
            const p2y = 28;
            if (b.vy < 0 && b.y - b.r <= p2y + this.paddle2.h && b.y - b.r >= p2y - 5 &&
                b.x >= this.paddle2.x && b.x <= this.paddle2.x + this.paddle2.w) {
                b.vy = Math.abs(b.vy);
                const hit = (b.x - this.paddle2.x) / this.paddle2.w - 0.5;
                b.vx = hit * 6;
            }
        } else {
            // 1P: original behavior
            if (b.y - b.r <= 0) b.vy = -b.vy;

            // Bottom - lose life
            if (b.y + b.r >= h) {
                this.lives--;
                if (this.lives <= 0) { this.endGame(); return; }
                this.resetBall();
                return;
            }

            // Paddle
            const py = h - 40;
            if (b.vy > 0 && b.y + b.r >= py && b.y + b.r <= py + this.paddle.h + 5 &&
                b.x >= this.paddle.x && b.x <= this.paddle.x + this.paddle.w) {
                b.vy = -Math.abs(b.vy);
                const hit = (b.x - this.paddle.x) / this.paddle.w - 0.5;
                b.vx = hit * 6;
            }
        }

        // Bricks
        for (const brick of this.bricks) {
            if (!brick.alive) continue;
            if (b.x + b.r > brick.x && b.x - b.r < brick.x + brick.w &&
                b.y + b.r > brick.y && b.y - b.r < brick.y + brick.h) {
                brick.hp = (brick.hp || 1) - 1;
                if (brick.hp <= 0) {
                    brick.alive = false;
                } else {
                    // Brick damaged but not destroyed - just bounce
                    b.vy = -b.vy;
                    break;
                }
                b.vy = -b.vy;
                this.score += 10;
                this.ui.setScore(this.score);

                // Spawn particles from destroyed brick
                const brickColor = `hsl(${brick.hue}, 70%, 55%)`;
                const bcx = brick.x + brick.w / 2;
                const bcy = brick.y + brick.h / 2;
                const numParticles = 5 + Math.floor(Math.random() * 4); // 5-8
                for (let i = 0; i < numParticles; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 3;
                    this.particles.push({
                        x: bcx + (Math.random() - 0.5) * brick.w * 0.6,
                        y: bcy + (Math.random() - 0.5) * brick.h * 0.6,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 0,
                        maxLife: 20 + Math.random() * 15,
                        color: brickColor
                    });
                }

                // Trigger screen shake
                this.shakeFrames = 3;

                if (this.bricks.every(br => !br.alive)) {
                    this.buildBricks();
                    this.resetBall();
                }
                break;
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12; // gravity
            p.life++;
            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
            }
        }

        // Decrement shake
        if (this.shakeFrames > 0) this.shakeFrames--;
    },

    handleMove(e) {
        const r = this.canvas.getBoundingClientRect();
        const mx = e.clientX - r.left - this.paddle.w / 2;
        if (this.is2P()) {
            // Mouse controls P1 (bottom) only
            this.paddle.x = Math.max(0, Math.min(this.ui.canvasW - this.paddle.w, mx));
        } else {
            this.paddle.x = Math.max(0, Math.min(this.ui.canvasW - this.paddle.w, mx));
        }
    },
    handleTouchMove(e) {
        e.preventDefault();
        if (this.is2P()) {
            const r = this.canvas.getBoundingClientRect();
            const halfH = this.ui.canvasH / 2;
            for (const touch of e.touches) {
                const tx = touch.clientX - r.left - this.paddle.w / 2;
                const ty = (touch.clientY - r.top) * (this.ui.canvasH / r.height);
                if (ty >= halfH) {
                    // Bottom half -> P1
                    this.paddle.x = Math.max(0, Math.min(this.ui.canvasW - this.paddle.w, tx));
                } else {
                    // Top half -> P2
                    this.paddle2.x = Math.max(0, Math.min(this.ui.canvasW - this.paddle2.w, tx));
                }
            }
        } else {
            const r = this.canvas.getBoundingClientRect();
            this.paddle.x = Math.max(0, Math.min(this.ui.canvasW - this.paddle.w, e.touches[0].clientX - r.left - this.paddle.w / 2));
        }
    },
    handleTouchStart2P(e) {
        e.preventDefault();
        if (!this.started) this.started = true;
        if (this.is2P()) {
            // Also process position for touch start
            const r = this.canvas.getBoundingClientRect();
            const halfH = this.ui.canvasH / 2;
            for (const touch of e.touches) {
                const tx = touch.clientX - r.left - this.paddle.w / 2;
                const ty = (touch.clientY - r.top) * (this.ui.canvasH / r.height);
                if (ty >= halfH) {
                    this.paddle.x = Math.max(0, Math.min(this.ui.canvasW - this.paddle.w, tx));
                } else {
                    this.paddle2.x = Math.max(0, Math.min(this.ui.canvasW - this.paddle2.w, tx));
                }
            }
        }
    },
    handleTouchEnd2P(e) { e.preventDefault(); },
    handleClick() { if (!this.started) this.started = true; },
    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') { this.paused = !this.paused; if (this.paused) this.ui.showPause(); else this.ui.hidePause(); return; }
        if (e.key === ' ') { e.preventDefault(); if (!this.started) this.started = true; }
        if (this.is2P()) {
            // P1: A/D
            if (e.key === 'a' || e.key === 'A') this.p1Keys['a'] = true;
            if (e.key === 'd' || e.key === 'D') this.p1Keys['d'] = true;
            // P2: Arrow keys
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.p2Keys['ArrowLeft'] = true; }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.p2Keys['ArrowRight'] = true; }
        } else {
            if (e.key === 'ArrowLeft') this.paddle.x = Math.max(0, this.paddle.x - 20);
            if (e.key === 'ArrowRight') this.paddle.x = Math.min(this.ui.canvasW - this.paddle.w, this.paddle.x + 20);
        }
    },
    handleKeyUp2P(e) {
        if (e.key === 'a' || e.key === 'A') this.p1Keys['a'] = false;
        if (e.key === 'd' || e.key === 'D') this.p1Keys['d'] = false;
        if (e.key === 'ArrowLeft') this.p2Keys['ArrowLeft'] = false;
        if (e.key === 'ArrowRight') this.p2Keys['ArrowRight'] = false;
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;

        // Apply screen shake
        ctx.save();
        if (this.shakeFrames > 0) {
            const sx = (Math.random() - 0.5) * this.shakeMagnitude * 2;
            const sy = (Math.random() - 0.5) * this.shakeMagnitude * 2;
            ctx.translate(sx, sy);
        }

        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        // Lives
        ctx.fillStyle = '#e8e8f0'; ctx.font = '12px Outfit, sans-serif'; ctx.textAlign = 'left';
        if (this.is2P()) {
            ctx.fillText('\u2764'.repeat(this.lives) + ' (Co-op)', 10, 20);
        } else {
            ctx.fillText('\u2764'.repeat(this.lives), 10, 20);
        }

        // Bricks
        for (const brick of this.bricks) {
            if (!brick.alive) continue;
            // Darken damaged bricks (hp < maxHp)
            const lightness = (brick.hp < brick.maxHp) ? '35%' : '55%';
            ctx.fillStyle = `hsl(${brick.hue}, 70%, ${lightness})`;
            ctx.beginPath(); ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 3); ctx.fill();
            // Draw crack indicator on damaged bricks
            if (brick.hp < brick.maxHp) {
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(brick.x + brick.w * 0.3, brick.y + 2);
                ctx.lineTo(brick.x + brick.w * 0.5, brick.y + brick.h / 2);
                ctx.lineTo(brick.x + brick.w * 0.7, brick.y + brick.h - 2);
                ctx.stroke();
            }
        }

        // Ball trail
        for (let i = 0; i < this.ballTrail.length; i++) {
            const tp = this.ballTrail[i];
            const alpha = (i + 1) / this.ballTrail.length * 0.35;
            const radius = this.ball.r * ((i + 1) / this.ballTrail.length) * 0.8;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Ball
        ctx.save(); ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#e8e8f0';
        ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        // P1 Paddle (bottom, cyan)
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath(); ctx.roundRect(this.paddle.x, h - 40, this.paddle.w, this.paddle.h, 6); ctx.fill();

        // P2 Paddle (top, magenta) - 2P only
        if (this.is2P()) {
            ctx.fillStyle = '#ff2d7b';
            ctx.beginPath(); ctx.roundRect(this.paddle2.x, 28, this.paddle2.w, this.paddle2.h, 6); ctx.fill();
        }

        // Particles
        for (const p of this.particles) {
            const alpha = 1 - p.life / p.maxLife;
            const size = 3 * alpha + 1;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Restore from screen shake
        ctx.restore();

        if (!this.started) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.textAlign = 'center';
            if (this.is2P()) {
                ctx.fillText('Click or SPACE to launch', w/2, h/2 - 12);
                ctx.font = '14px Outfit, sans-serif';
                ctx.fillStyle = '#00d4ff';
                ctx.fillText('P1 (bottom): Mouse or A/D', w/2, h/2 + 16);
                ctx.fillStyle = '#ff2d7b';
                ctx.fillText('P2 (top): Arrow Left/Right', w/2, h/2 + 36);
            } else {
                ctx.fillText('Click or SPACE to launch', w/2, h/2);
            }
        }
    },

    endGame() {
        this.gameOver = true; cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
        document.removeEventListener('keyup', this.handleKeyUp2P);
    }
};
export default Breakout;
