const Pong = {
    canvas: null, ctx: null, ui: null,
    player: { y: 0, h: 80, w: 10 }, ai: { y: 0, h: 80, w: 10, speed: 2.5 },
    ball: { x: 0, y: 0, vx: 4, vy: 2, r: 6 },
    playerScore: 0, aiScore: 0, maxScore: 7,
    gameOver: false, paused: false, animFrame: null, frozen: false, frozenTimer: null,
    keysDown: {},

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleMove = this.handleMove.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleKey = this.handleKey.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        canvas.addEventListener('mousemove', this.handleMove);
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('keydown', this.handleKey);
        document.addEventListener('keyup', this.handleKeyUp);
    },

    start() {
        this.playerScore = 0; this.aiScore = 0; this.gameOver = false; this.paused = false;
        const h = this.ui.canvasH;
        this.player.y = h/2 - this.player.h/2;
        this.ai.y = h/2 - this.ai.h/2;
        this.ui.setScore('0 - 0'); this.ui.hideGameOver(); this.ui.hidePause();
        this.resetBall(1);
        this.loop();
    },

    freezeAndReset(dir) {
        this.frozen = true;
        this.resetBall(dir);
        clearTimeout(this.frozenTimer);
        this.frozenTimer = setTimeout(() => { this.frozen = false; }, 1000);
    },

    resetBall(dir) {
        this.ball.x = this.ui.canvasW / 2;
        this.ball.y = this.ui.canvasH / 2;
        this.ball.vx = dir * 4;
        this.ball.vy = (Math.random() - 0.5) * 4;
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused && !this.frozen) this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        const b = this.ball, w = this.ui.canvasW, h = this.ui.canvasH;
        b.x += b.vx; b.y += b.vy;

        if (b.y - b.r <= 0 || b.y + b.r >= h) b.vy = -b.vy;

        // Player paddle (left)
        const px = 20;
        if (b.vx < 0 && b.x - b.r <= px + this.player.w && b.y >= this.player.y && b.y <= this.player.y + this.player.h) {
            b.vx = Math.abs(b.vx) * 1.05;
            b.vy += (b.y - (this.player.y + this.player.h/2)) * 0.1;
        }

        // AI paddle (right)
        const ax = w - 20 - this.ai.w;
        if (b.vx > 0 && b.x + b.r >= ax && b.y >= this.ai.y && b.y <= this.ai.y + this.ai.h) {
            b.vx = -Math.abs(b.vx) * 1.05;
            b.vy += (b.y - (this.ai.y + this.ai.h/2)) * 0.1;
        }

        // AI / Player 2 movement
        if (this.ui.mode === '2p') {
            const p2Speed = 6;
            if (this.keysDown['ArrowUp']) this.ai.y = Math.max(0, this.ai.y - p2Speed);
            if (this.keysDown['ArrowDown']) this.ai.y = Math.min(h - this.ai.h, this.ai.y + p2Speed);
        } else {
            const aiCenter = this.ai.y + this.ai.h/2;
            const aiSpeed = this.ai.speed + this.aiScore * 0.3;
            if (aiCenter < b.y - 10) this.ai.y += aiSpeed;
            else if (aiCenter > b.y + 10) this.ai.y -= aiSpeed;
            this.ai.y = Math.max(0, Math.min(h - this.ai.h, this.ai.y));
        }

        // Score
        if (b.x < 0) { this.aiScore++; this.checkScore(); this.freezeAndReset(1); return; }
        else if (b.x > w) { this.playerScore++; this.checkScore(); this.freezeAndReset(-1); return; }

        // Clamp speed
        const maxV = 10;
        b.vx = Math.max(-maxV, Math.min(maxV, b.vx));
        b.vy = Math.max(-maxV, Math.min(maxV, b.vy));
    },

    checkScore() {
        this.ui.setScore(`${this.playerScore} - ${this.aiScore}`);
        if (this.playerScore >= this.maxScore || this.aiScore >= this.maxScore) this.endGame();
    },

    handleMove(e) {
        if (this.ui.mode === '2p') return;
        const r = this.canvas.getBoundingClientRect();
        this.player.y = Math.max(0, Math.min(this.ui.canvasH - this.player.h, e.clientY - r.top - this.player.h/2));
    },
    handleTouchMove(e) {
        e.preventDefault();
        const r = this.canvas.getBoundingClientRect();
        if (this.ui.mode === '2p') {
            for (let i = 0; i < e.touches.length; i++) {
                const t = e.touches[i];
                const tx = t.clientX - r.left;
                if (tx < this.ui.canvasW / 2) {
                    this.player.y = Math.max(0, Math.min(this.ui.canvasH - this.player.h, t.clientY - r.top - this.player.h/2));
                } else {
                    this.ai.y = Math.max(0, Math.min(this.ui.canvasH - this.ai.h, t.clientY - r.top - this.ai.h/2));
                }
            }
        } else {
            this.player.y = Math.max(0, Math.min(this.ui.canvasH - this.player.h, e.touches[0].clientY - r.top - this.player.h/2));
        }
    },
    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') { this.paused = !this.paused; if (this.paused) this.ui.showPause(); else this.ui.hidePause(); }
        this.keysDown[e.key] = true;
        if (this.ui.mode === '2p') {
            if (e.key === 'w' || e.key === 'W') this.player.y = Math.max(0, this.player.y - 20);
            if (e.key === 's' || e.key === 'S') this.player.y = Math.min(this.ui.canvasH - this.player.h, this.player.y + 20);
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
        } else {
            if (e.key === 'ArrowUp') this.player.y = Math.max(0, this.player.y - 20);
            if (e.key === 'ArrowDown') this.player.y = Math.min(this.ui.canvasH - this.player.h, this.player.y + 20);
        }
    },
    handleKeyUp(e) {
        delete this.keysDown[e.key];
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        // Center line
        ctx.setLineDash([8, 8]); ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
        ctx.setLineDash([]);

        // Score
        ctx.fillStyle = '#333'; ctx.font = 'bold 60px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText(String(this.playerScore), w/2 - 60, 70);
        ctx.fillText(String(this.aiScore), w/2 + 60, 70);

        // Paddles
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath(); ctx.roundRect(20, this.player.y, this.player.w, this.player.h, 5); ctx.fill();
        ctx.fillStyle = '#ff2d7b';
        ctx.beginPath(); ctx.roundRect(w - 20 - this.ai.w, this.ai.y, this.ai.w, this.ai.h, 5); ctx.fill();

        // Ball
        ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
        ctx.fillStyle = '#e8e8f0';
        ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    },

    endGame() {
        this.gameOver = true; cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.playerScore);
        if (this.ui.mode === '2p') {
            const msg = this.playerScore >= this.maxScore ? 'Player 1 Wins!' : 'Player 2 Wins!';
            this.ui.showGameOver(`${this.playerScore} - ${this.aiScore}`, msg);
        } else {
            this.ui.showGameOver(`${this.playerScore} - ${this.aiScore}`, this.playerScore >= this.maxScore ? 'You Win!' : 'AI Wins');
        }
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); clearTimeout(this.frozenTimer); this.frozen = false; },
    destroy() { cancelAnimationFrame(this.animFrame); clearTimeout(this.frozenTimer); document.removeEventListener('keydown', this.handleKey); document.removeEventListener('keyup', this.handleKeyUp); }
};
export default Pong;
