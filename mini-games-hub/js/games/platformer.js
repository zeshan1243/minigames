const Platformer = {
    canvas: null,
    ctx: null,
    ui: null,
    animFrame: null,
    gameOver: false,
    paused: false,
    won: false,
    lastTime: 0,
    score: 0,

    // Player
    player: null,
    gravity: 1200,
    jumpForce: -520,
    moveSpeed: 250,
    keys: {},

    // World
    platforms: [],
    coins: [],
    flag: null,
    cameraX: 0,
    cameraY: 0,
    worldW: 2400,
    worldH: 900,

    // Touch
    touchLeft: false,
    touchRight: false,
    touchJump: false,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        document.addEventListener('keydown', this.handleKey);
        document.addEventListener('keyup', this.handleKeyUp);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.won = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.lastTime = performance.now();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.score = 0;
        this.keys = {};
        this.touchLeft = false;
        this.touchRight = false;
        this.touchJump = false;
        this.ui.setScore(0);
        this.buildLevel();
    },

    buildLevel() {
        const W = this.worldW;
        const H = this.worldH;
        const level = (this.ui && this.ui.level) || 'medium';
        this.worldW = (level === 'hard') ? 3200 : 2400;
        this.player = { x: 60, y: H - 100, w: 28, h: 36, vx: 0, vy: 0, grounded: false, facing: 1 };
        this.enemies = [];
        this._movingPlatforms = [];

        if (level === 'easy') {
            this.platforms = [
                // Ground - more continuous
                { x: 0, y: H - 40, w: 500, h: 40 },
                { x: 550, y: H - 40, w: 400, h: 40 },
                { x: 1000, y: H - 40, w: 400, h: 40 },
                // Simple ascending platforms with low gaps
                { x: 150, y: H - 120, w: 140, h: 16 },
                { x: 350, y: H - 170, w: 130, h: 16 },
                { x: 550, y: H - 130, w: 140, h: 16 },
                { x: 750, y: H - 180, w: 130, h: 16 },
                { x: 950, y: H - 220, w: 140, h: 16 },
                { x: 1150, y: H - 270, w: 130, h: 16 },
                { x: 1350, y: H - 320, w: 140, h: 16 },
            ];
            // 8 coins
            this.coins = [];
            for (let i = 3; i < 10; i++) {
                const p = this.platforms[i];
                this.coins.push({ x: p.x + p.w / 2, y: p.y - 25, r: 10, collected: false });
            }
            this.coins.push({ x: 100, y: H - 70, r: 10, collected: false });

            this.flag = { x: 1400, y: H - 380, w: 10, h: 60 };
        } else if (level === 'hard') {
            this.worldW = 3200;
            this.platforms = [
                // Ground - sparse
                { x: 0, y: H - 40, w: 300, h: 40 },
                // Ascending platforms with wider gaps
                { x: 200, y: H - 150, w: 100, h: 16 },
                { x: 420, y: H - 220, w: 90, h: 16 },
                { x: 600, y: H - 160, w: 110, h: 16 },
                { x: 820, y: H - 260, w: 90, h: 16 },
                { x: 1020, y: H - 200, w: 100, h: 16 },
                { x: 1250, y: H - 320, w: 100, h: 16 },
                { x: 1480, y: H - 240, w: 90, h: 16 },
                { x: 1680, y: H - 370, w: 100, h: 16 },
                { x: 1900, y: H - 300, w: 90, h: 16 },
                { x: 2100, y: H - 420, w: 110, h: 16 },
                { x: 2300, y: H - 350, w: 90, h: 16 },
                { x: 2500, y: H - 480, w: 100, h: 16 },
                { x: 2700, y: H - 560, w: 110, h: 16 },
                // Moving platforms (marked with _moving data)
                { x: 380, y: H - 100, w: 80, h: 16, _moving: true, _minX: 330, _maxX: 530, _speed: 40, _dir: 1 },
                { x: 900, y: H - 140, w: 80, h: 16, _moving: true, _minX: 850, _maxX: 1050, _speed: 50, _dir: -1 },
                { x: 1600, y: H - 180, w: 80, h: 16, _moving: true, _minX: 1500, _maxX: 1700, _speed: 45, _dir: 1 },
                { x: 2000, y: H - 250, w: 80, h: 16, _moving: true, _minX: 1950, _maxX: 2150, _speed: 55, _dir: -1 },
                { x: 2400, y: H - 400, w: 80, h: 16, _moving: true, _minX: 2350, _maxX: 2550, _speed: 50, _dir: 1 },
                { x: 2800, y: H - 500, w: 80, h: 16, _moving: true, _minX: 2700, _maxX: 2900, _speed: 45, _dir: -1 },
                // Ground patches
                { x: 700, y: H - 40, w: 200, h: 40 },
            ];
            // Track moving platforms for update
            this._movingPlatforms = this.platforms.filter(p => p._moving);

            // 25 coins
            this.coins = [];
            const coinIdxs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
            for (const idx of coinIdxs) {
                const p = this.platforms[idx];
                this.coins.push({ x: p.x + p.w / 2, y: p.y - 25, r: 10, collected: false });
            }
            // Extra coins on ground and near platforms
            for (let i = 0; i < 5; i++) {
                this.coins.push({ x: 60 + i * 50, y: H - 70, r: 10, collected: false });
            }
            // Coins on/near moving platforms
            for (let i = 0; i < this._movingPlatforms.length; i++) {
                const mp = this._movingPlatforms[i];
                this.coins.push({ x: mp.x + mp.w / 2, y: mp.y - 25, r: 10, collected: false, _followPlatIdx: this.platforms.indexOf(mp) });
            }
            // Fill remaining to 25
            const remaining = 25 - this.coins.length;
            for (let i = 0; i < remaining; i++) {
                this.coins.push({ x: 250 + i * 200, y: H - 70, r: 10, collected: false });
            }

            // 2 patrolling enemies
            this.enemies = [
                { x: 700, y: H - 72, w: 24, h: 24, minX: 700, maxX: 880, speed: 60, dir: 1 },
                { x: 1250, y: H - 352, w: 24, h: 24, minX: 1250, maxX: 1340, speed: 50, dir: -1 }
            ];

            this.flag = { x: 2760, y: H - 620, w: 10, h: 60 };
        } else {
            // Medium (default/current layout)
            this.platforms = [
                // Ground
                { x: 0, y: H - 40, w: 400, h: 40 },
                // Ascending platforms
                { x: 150, y: H - 130, w: 120, h: 16 },
                { x: 350, y: H - 200, w: 100, h: 16 },
                { x: 500, y: H - 140, w: 140, h: 16 },
                { x: 680, y: H - 240, w: 110, h: 16 },
                { x: 850, y: H - 180, w: 100, h: 16 },
                { x: 1000, y: H - 300, w: 130, h: 16 },
                { x: 1200, y: H - 220, w: 100, h: 16 },
                { x: 1350, y: H - 350, w: 120, h: 16 },
                { x: 1550, y: H - 280, w: 110, h: 16 },
                { x: 1700, y: H - 400, w: 130, h: 16 },
                { x: 1900, y: H - 330, w: 100, h: 16 },
                { x: 2050, y: H - 460, w: 120, h: 16 },
                { x: 2200, y: H - 540, w: 140, h: 16 },
                // Ground patches
                { x: 600, y: H - 40, w: 300, h: 40 },
                { x: 1100, y: H - 40, w: 200, h: 40 },
            ];

            // Coins on or near platforms
            this.coins = [];
            const coinPlatforms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
            for (const idx of coinPlatforms) {
                const p = this.platforms[idx];
                this.coins.push({ x: p.x + p.w / 2, y: p.y - 25, r: 10, collected: false });
            }
            // Extra coins on ground
            for (let i = 0; i < 4; i++) {
                this.coins.push({ x: 80 + i * 60, y: H - 70, r: 10, collected: false });
            }

            this.flag = { x: 2260, y: H - 600, w: 10, h: 60 };
        }

        this.cameraX = 0;
        this.cameraY = 0;
    },

    loop() {
        if (this.gameOver) return;
        this.animFrame = requestAnimationFrame(() => this.loop());
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;
        if (this.paused) { this.render(); return; }
        this.update(dt);
        this.render();
    },

    update(dt) {
        const p = this.player;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        // Input
        let moveDir = 0;
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.touchLeft) moveDir -= 1;
        if (this.keys['ArrowRight'] || this.keys['d'] || this.touchRight) moveDir += 1;
        if (moveDir !== 0) p.facing = moveDir;

        p.vx = moveDir * this.moveSpeed;

        if ((this.keys[' '] || this.keys['ArrowUp'] || this.keys['w'] || this.touchJump) && p.grounded) {
            p.vy = this.jumpForce;
            p.grounded = false;
        }

        // Physics
        p.vy += this.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Collision with platforms
        p.grounded = false;
        for (const plat of this.platforms) {
            if (p.x + p.w > plat.x && p.x < plat.x + plat.w) {
                // Landing on top
                if (p.vy >= 0 && p.y + p.h > plat.y && p.y + p.h < plat.y + plat.h + p.vy * dt + 5) {
                    p.y = plat.y - p.h;
                    p.vy = 0;
                    p.grounded = true;
                }
            }
        }

        // Update moving platforms
        if (this._movingPlatforms) {
            for (const mp of this._movingPlatforms) {
                const prevX = mp.x;
                mp.x += mp._dir * mp._speed * dt;
                if (mp.x <= mp._minX) { mp.x = mp._minX; mp._dir = 1; }
                if (mp.x >= mp._maxX) { mp.x = mp._maxX; mp._dir = -1; }
                const dx = mp.x - prevX;
                // Carry player if standing on this platform
                if (p.grounded && p.x + p.w > mp.x - Math.abs(dx) - 5 && p.x < mp.x + mp.w + Math.abs(dx) + 5 &&
                    Math.abs((p.y + p.h) - mp.y) < 5) {
                    p.x += dx;
                }
            }
        }

        // Update enemies
        if (this.enemies) {
            for (const e of this.enemies) {
                e.x += e.dir * e.speed * dt;
                if (e.x <= e.minX) { e.x = e.minX; e.dir = 1; }
                if (e.x + e.w >= e.maxX + e.w) { e.x = e.maxX; e.dir = -1; }
                // Check collision with player
                if (p.x + p.w > e.x && p.x < e.x + e.w && p.y + p.h > e.y && p.y < e.y + e.h) {
                    this.endGame();
                    return;
                }
            }
        }

        // Fall off world
        if (p.y > this.worldH + 100) {
            this.endGame();
            return;
        }

        // Clamp
        if (p.x < 0) p.x = 0;
        if (p.x + p.w > this.worldW) p.x = this.worldW - p.w;

        // Coins
        for (const c of this.coins) {
            if (c.collected) continue;
            const dx = (p.x + p.w / 2) - c.x;
            const dy = (p.y + p.h / 2) - c.y;
            if (dx * dx + dy * dy < (c.r + 18) * (c.r + 18)) {
                c.collected = true;
                this.score++;
                this.ui.setScore(this.score);
            }
        }

        // Flag
        const f = this.flag;
        if (p.x + p.w > f.x && p.x < f.x + f.w && p.y + p.h > f.y && p.y < f.y + f.h) {
            this.won = true;
            this.endGame();
            return;
        }

        // Camera
        this.cameraX = p.x - W / 3;
        this.cameraY = p.y - H / 2;
        this.cameraX = Math.max(0, Math.min(this.worldW - W, this.cameraX));
        this.cameraY = Math.max(0, Math.min(this.worldH - H, this.cameraY));
    },

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.translate(-this.cameraX, -this.cameraY);

        // BG stars
        ctx.fillStyle = '#1a1a2f';
        for (let i = 0; i < 40; i++) {
            const sx = (i * 137 + 50) % this.worldW;
            const sy = (i * 97 + 30) % this.worldH;
            ctx.fillRect(sx, sy, 2, 2);
        }

        // Platforms
        for (const p of this.platforms) {
            const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
            grad.addColorStop(0, '#2a2a4a');
            grad.addColorStop(1, '#1a1a30');
            ctx.fillStyle = grad;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.fillStyle = p._moving ? '#ff2d7b' : '#00d4ff';
            ctx.fillRect(p.x, p.y, p.w, 2);
        }

        // Coins
        for (const c of this.coins) {
            if (c.collected) continue;
            ctx.shadowColor = '#ffd60a';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ffd60a';
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#b8960a';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', c.x, c.y + 1);
        }

        // Flag
        const f = this.flag;
        ctx.fillStyle = '#aaa';
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.fillStyle = '#00e676';
        ctx.beginPath();
        ctx.moveTo(f.x + f.w, f.y);
        ctx.lineTo(f.x + f.w + 30, f.y + 15);
        ctx.lineTo(f.x + f.w, f.y + 30);
        ctx.fill();

        // Enemies (red patrolling blocks)
        if (this.enemies) {
            for (const e of this.enemies) {
                ctx.fillStyle = '#ff2d44';
                ctx.fillRect(e.x, e.y, e.w, e.h);
                // Eyes
                ctx.fillStyle = '#fff';
                const eDir = e.dir > 0 ? e.x + e.w - 8 : e.x + 2;
                ctx.fillRect(eDir, e.y + 5, 5, 5);
                ctx.fillRect(eDir, e.y + 14, 5, 5);
            }
        }

        // Player
        const pl = this.player;
        if (pl) {
            // Body
            ctx.fillStyle = '#00d4ff';
            ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
            // Eyes
            ctx.fillStyle = '#fff';
            const eyeX = pl.facing > 0 ? pl.x + pl.w - 10 : pl.x + 4;
            ctx.fillRect(eyeX, pl.y + 8, 6, 6);
            ctx.fillStyle = '#0a0a0f';
            const pupilX = pl.facing > 0 ? eyeX + 3 : eyeX + 1;
            ctx.fillRect(pupilX, pl.y + 10, 3, 3);
            // Feet
            ctx.fillStyle = '#ff2d7b';
            ctx.fillRect(pl.x + 2, pl.y + pl.h - 6, 10, 6);
            ctx.fillRect(pl.x + pl.w - 12, pl.y + pl.h - 6, 10, 6);
        }

        ctx.restore();

        // Touch controls overlay
        this.renderTouchControls(ctx, W, H);
    },

    renderTouchControls(ctx, W, H) {
        // Only hint on touch devices
        if (!('ontouchstart' in window)) return;
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#fff';
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Left button
        ctx.beginPath();
        ctx.arc(60, H - 60, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0a0f';
        ctx.fillText('◀', 60, H - 60);
        // Right button
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(150, H - 60, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0a0f';
        ctx.fillText('▶', 150, H - 60);
        ctx.globalAlpha = 1;
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        this.render();
        this.ui.setHighScore(this.score);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(this.score, best);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') { this.togglePause(); return; }
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'a', 'd', 'w'].includes(e.key)) {
            e.preventDefault();
            this.keys[e.key] = true;
        }
    },

    handleKeyUp(e) {
        this.keys[e.key] = false;
    },

    handleTouchStart(e) {
        e.preventDefault();
        this.updateTouches(e.touches);
    },

    handleTouchMove(e) {
        e.preventDefault();
        this.updateTouches(e.touches);
    },

    handleTouchEnd(e) {
        e.preventDefault();
        this.updateTouches(e.touches);
    },

    updateTouches(touches) {
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const rect = this.canvas.getBoundingClientRect();
        this.touchLeft = false;
        this.touchRight = false;
        this.touchJump = false;
        for (let i = 0; i < touches.length; i++) {
            const tx = (touches[i].clientX - rect.left) * (W / rect.width);
            const ty = (touches[i].clientY - rect.top) * (H / rect.height);
            if (tx < W * 0.33 && ty > H * 0.5) this.touchLeft = true;
            else if (tx < W * 0.5 && ty > H * 0.5) this.touchRight = true;
            else if (tx > W * 0.5) this.touchJump = true;
        }
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) this.ui.showPause();
        else this.ui.hidePause();
    },

    pause() { if (!this.paused) this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    }
};

export default Platformer;
