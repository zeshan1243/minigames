const DoodleJump = {
    canvas: null, ctx: null, ui: null,
    player: { x: 0, y: 0, vx: 0, vy: 0, w: 30, h: 30 },
    platforms: [], score: 0, maxY: 0,
    gameOver: false, paused: false, animFrame: null,
    keys: {},

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleKeyDown = (e) => { this.keys[e.key] = true; if (e.key==='p'||e.key==='P'){this.paused=!this.paused;if(this.paused)ui.showPause();else ui.hidePause();} };
        this.handleKeyUp = (e) => { this.keys[e.key] = false; };
        this.handleTilt = this.handleTilt.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        canvas.addEventListener('touchstart', this.handleTilt, { passive: false });
    },

    start() {
        const w = this.ui.canvasW, h = this.ui.canvasH;
        this.player.x = w/2 - 15; this.player.y = h - 80; this.player.vx = 0; this.player.vy = -6;
        this.platforms = []; this.score = 0; this.maxY = this.player.y;
        this.gameOver = false; this.paused = false;
        this.ui.setScore(0); this.ui.hideGameOver(); this.ui.hidePause();
        // Platform sizing scales with canvas width
        this.platW = Math.max(80, w * 0.11);
        this.platCount = Math.max(8, Math.round(w / 60));
        this.platGapY = Math.min(75, h / (this.platCount + 2));
        // Generate initial platforms
        for (let i = 0; i < this.platCount; i++) {
            this.platforms.push({ x: Math.random() * (w - this.platW), y: h - i * this.platGapY, w: this.platW, h: 12, type: 'static', vx: 0 });
        }
        this.platforms.push({ x: w/2 - this.platW/2, y: h - 30, w: this.platW, h: 12, type: 'static', vx: 0 }); // base platform
        this.loop();
    },

    handleTilt(e) {
        e.preventDefault();
        const r = this.canvas.getBoundingClientRect();
        const tx = e.touches[0].clientX - r.left;
        const tiltSpeed = Math.max(3.5, this.ui.canvasW * 0.006);
        this.player.vx = (tx < this.ui.canvasW / 2) ? -tiltSpeed : tiltSpeed;
        setTimeout(() => this.player.vx = 0, 200);
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused) this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        const p = this.player, w = this.ui.canvasW, h = this.ui.canvasH;
        const moveSpeed = Math.max(3.5, this.ui.canvasW * 0.006);
        if (this.keys['ArrowLeft'] || this.keys['a']) p.vx = -moveSpeed;
        else if (this.keys['ArrowRight'] || this.keys['d']) p.vx = moveSpeed;
        else p.vx *= 0.85;

        p.vy += 0.2; // gravity
        p.x += p.vx; p.y += p.vy;

        // Wrap horizontally
        if (p.x > w) p.x = -p.w;
        if (p.x + p.w < 0) p.x = w;

        // Scroll camera when player goes above midpoint
        if (p.y < h / 2) {
            const shift = h / 2 - p.y;
            p.y = h / 2;
            for (const plat of this.platforms) plat.y += shift;
            this.score += Math.floor(shift);
            this.ui.setScore(this.score);
        }

        // Platform collision (only when falling)
        if (p.vy > 0) {
            for (const plat of this.platforms) {
                if (p.x + p.w > plat.x && p.x < plat.x + plat.w &&
                    p.y + p.h >= plat.y && p.y + p.h <= plat.y + plat.h + 8) {
                    p.vy = -7.5;
                    break;
                }
            }
        }

        // Move moving platforms
        for (const plat of this.platforms) {
            if (plat.type === 'moving') {
                plat.x += plat.vx;
                if (plat.x <= 0 || plat.x + plat.w >= w) plat.vx = -plat.vx;
            }
        }

        // Remove off-screen platforms, add new ones
        for (let i = this.platforms.length - 1; i >= 0; i--) {
            if (this.platforms[i].y > h + 20) this.platforms.splice(i, 1);
        }
        while (this.platforms.length < this.platCount) {
            const topY = Math.min(...this.platforms.map(p2 => p2.y));
            this.platforms.push({
                x: Math.random() * (w - this.platW), y: topY - this.platGapY - Math.random() * 30,
                w: this.platW, h: 12, type: Math.random() < 0.2 ? 'moving' : 'static', vx: (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5)
            });
        }

        // Fall death
        if (p.y > h + 50) this.endGame();
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        // Platforms
        for (const plat of this.platforms) {
            ctx.fillStyle = plat.type === 'moving' ? '#ffd60a' : '#00e676';
            ctx.beginPath(); ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 5); ctx.fill();
        }

        // Player
        const p = this.player;
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 8); ctx.fill();
        // Eyes
        ctx.fillStyle = '#0a0a0f';
        ctx.beginPath(); ctx.arc(p.x + 10, p.y + 12, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x + 20, p.y + 12, 3, 0, Math.PI*2); ctx.fill();
    },

    endGame() {
        this.gameOver = true; cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKeyDown); document.removeEventListener('keyup', this.handleKeyUp); }
};
export default DoodleJump;
