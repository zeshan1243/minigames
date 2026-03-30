const Flappy = {
    canvas: null, ctx: null, ui: null,
    bird: { x: 80, y: 0, vy: 0, r: 14 },
    pipes: [], score: 0, gravity: 0.18, jumpForce: -4.8,
    gameOver: false, paused: false, animFrame: null,
    pipeGap: 180, pipeWidth: 50, pipeTimer: 0, speed: 1.4, started: false,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        canvas.addEventListener('click', () => this.flap());
    },

    start() {
        this.bird.y = this.ui.canvasH / 2; this.bird.vy = 0;
        this.pipes = []; this.score = 0; this.pipeTimer = 0; this.speed = 2.5;
        this.gameOver = false; this.paused = false; this.started = false;
        this.ui.setScore(0); this.ui.hideGameOver(); this.ui.hidePause();
        this.loop();
    },

    flap() {
        if (this.gameOver) return;
        if (!this.started) this.started = true;
        if (!this.paused) this.bird.vy = this.jumpForce;
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused && this.started) this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        const b = this.bird, h = this.ui.canvasH, w = this.ui.canvasW;
        b.vy += this.gravity;
        b.y += b.vy;

        if (b.y + b.r > h || b.y - b.r < 0) { this.endGame(); return; }

        this.pipeTimer++;
        if (this.pipeTimer >= 160) {
            this.pipeTimer = 0;
            const gapY = 80 + Math.random() * (h - 200);
            this.pipes.push({ x: w, gapY, scored: false });
        }

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const p = this.pipes[i];
            p.x -= this.speed;
            if (p.x + this.pipeWidth < 0) { this.pipes.splice(i, 1); continue; }

            // Score
            if (!p.scored && p.x + this.pipeWidth < b.x) {
                p.scored = true; this.score++; this.ui.setScore(this.score);
                this.speed = Math.min(2.8, 1.4 + this.score * 0.02);
            }

            // Collision
            if (b.x + b.r > p.x && b.x - b.r < p.x + this.pipeWidth) {
                if (b.y - b.r < p.gapY || b.y + b.r > p.gapY + this.pipeGap) {
                    this.endGame(); return;
                }
            }
        }
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        // Sky
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0a1a'); grad.addColorStop(1, '#12122e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

        // Pipes
        for (const p of this.pipes) {
            ctx.fillStyle = '#00e676';
            ctx.fillRect(p.x, 0, this.pipeWidth, p.gapY);
            ctx.fillRect(p.x, p.gapY + this.pipeGap, this.pipeWidth, h - p.gapY - this.pipeGap);
            // Pipe caps
            ctx.fillStyle = '#00c060';
            ctx.fillRect(p.x - 3, p.gapY - 20, this.pipeWidth + 6, 20);
            ctx.fillRect(p.x - 3, p.gapY + this.pipeGap, this.pipeWidth + 6, 20);
        }

        // Bird
        const b = this.bird;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.min(Math.max(b.vy * 0.05, -0.5), 0.5));
        ctx.fillStyle = '#ffd60a';
        ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI*2); ctx.fill();
        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(6, -4, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(7, -4, 2.5, 0, Math.PI*2); ctx.fill();
        // Beak
        ctx.fillStyle = '#ff6600';
        ctx.beginPath(); ctx.moveTo(b.r, -2); ctx.lineTo(b.r + 10, 2); ctx.lineTo(b.r, 6); ctx.closePath(); ctx.fill();
        ctx.restore();

        if (!this.started) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 22px Outfit, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('Tap or SPACE to fly', w/2, h/2);
        }
    },

    endGame() {
        this.gameOver = true; cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') { this.paused = !this.paused; if (this.paused) this.ui.showPause(); else this.ui.hidePause(); return; }
        if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); this.flap(); }
    },
    handleTouch(e) { e.preventDefault(); this.flap(); },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKey); }
};
export default Flappy;
