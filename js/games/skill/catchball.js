const CatchBall = {
    canvas: null, ctx: null, ui: null,
    paddle: { x: 0, w: 80, h: 14 }, balls: [],
    score: 0, lives: 3, gameOver: false, paused: false, animFrame: null,
    spawnTimer: 0, speed: 2,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.paddle.x = ui.canvasW / 2 - this.paddle.w / 2;
        this.handleMove = this.handleMove.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('mousemove', this.handleMove);
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        this.score = 0; this.lives = 3; this.gameOver = false; this.paused = false;
        this.balls = []; this.speed = 2; this.spawnTimer = 0;
        this.ui.setScore(0); this.ui.hideGameOver(); this.ui.hidePause();
        this.loop();
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused) this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        this.spawnTimer++;
        if (this.spawnTimer >= 40) {
            this.spawnTimer = 0;
            const isBomb = Math.random() < 0.15;
            this.balls.push({
                x: 10 + Math.random() * (this.ui.canvasW - 20),
                y: -10,
                r: isBomb ? 10 : 8,
                speed: this.speed + Math.random() * 1.5,
                bomb: isBomb
            });
        }

        const py = this.ui.canvasH - 40;
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const b = this.balls[i];
            b.y += b.speed;
            // Catch check
            if (b.y + b.r >= py && b.y - b.r <= py + this.paddle.h &&
                b.x >= this.paddle.x && b.x <= this.paddle.x + this.paddle.w) {
                this.balls.splice(i, 1);
                if (b.bomb) { this.endGame(); return; }
                else { this.score++; this.ui.setScore(this.score); }
                continue;
            }
            if (b.y > this.ui.canvasH + 20) {
                this.balls.splice(i, 1);
            }
        }
        this.speed = 2 + this.score * 0.03;
    },

    handleMove(e) { const r = this.canvas.getBoundingClientRect(); this.paddle.x = Math.max(0, Math.min(this.ui.canvasW - this.paddle.w, e.clientX - r.left - this.paddle.w/2)); },
    handleTouchMove(e) { e.preventDefault(); const r = this.canvas.getBoundingClientRect(); this.paddle.x = Math.max(0, Math.min(this.ui.canvasW - this.paddle.w, e.touches[0].clientX - r.left - this.paddle.w/2)); },
    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') { this.paused = !this.paused; if (this.paused) this.ui.showPause(); else this.ui.hidePause(); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); this.paddle.x = Math.max(0, this.paddle.x - 20); }
        if (e.key === 'ArrowRight') { e.preventDefault(); this.paddle.x = Math.min(this.ui.canvasW - this.paddle.w, this.paddle.x + 20); }
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#e8e8f0'; ctx.font = '14px Outfit, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('\u2764'.repeat(this.lives), 20, 30);

        // Balls
        for (const b of this.balls) {
            ctx.save();
            ctx.shadowColor = b.bomb ? '#ff2d7b' : '#ffd60a';
            ctx.shadowBlur = 10;
            ctx.fillStyle = b.bomb ? '#ff2d7b' : '#ffd60a';
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }

        // Paddle
        const py = h - 40;
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath(); ctx.roundRect(this.paddle.x, py, this.paddle.w, this.paddle.h, 7); ctx.fill();
        ctx.save(); ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 12;
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath(); ctx.roundRect(this.paddle.x, py, this.paddle.w, this.paddle.h, 7); ctx.fill();
        ctx.restore();

        // Legend
        ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd60a'; ctx.fillText('\u25CF Catch', w/2 - 40, h - 10);
        ctx.fillStyle = '#ff2d7b'; ctx.fillText('\u25CF Avoid', w/2 + 40, h - 10);
    },

    endGame() {
        this.gameOver = true; cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKey); }
};
export default CatchBall;
