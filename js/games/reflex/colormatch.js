const COLORS = [
    { name: 'RED',    hex: '#ff2d2d' },
    { name: 'BLUE',   hex: '#2d7bff' },
    { name: 'GREEN',  hex: '#00e676' },
    { name: 'YELLOW', hex: '#ffd60a' },
    { name: 'PURPLE', hex: '#b44dff' },
    { name: 'ORANGE', hex: '#ff8c00' }
];

const ColorMatch = {
    canvas: null,
    ctx: null,
    ui: null,
    score: 0,
    lives: 3,
    streak: 0,
    bestStreak: 0,
    currentWord: null,
    currentColor: null,
    isMatch: false,
    timeLimit: 2500,
    timeLeft: 0,
    timer: null,
    gameOver: false,
    paused: false,
    animFrame: null,
    feedback: null, // { type: 'correct'|'wrong', timer: 0 }
    buttons: { match: null, nope: null },
    roundActive: false,
    startTime: 0,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        document.addEventListener('keydown', this.handleKey);

        // Button positions
        const w = ui.canvasW;
        const btnW = 130;
        const btnH = 55;
        const gap = 20;
        const totalW = btnW * 2 + gap;
        const startX = (w - totalW) / 2;
        const btnY = ui.canvasH - 110;
        this.buttons.match = { x: startX, y: btnY, w: btnW, h: btnH };
        this.buttons.nope = { x: startX + btnW + gap, y: btnY, w: btnW, h: btnH };
    },

    start() {
        this.score = 0;
        this.lives = 3;
        this.streak = 0;
        this.bestStreak = 0;
        this.timeLimit = 2500;
        this.gameOver = false;
        this.paused = false;
        this.feedback = null;
        this.ui.setScore(0);
        this.ui.hideGameOver();
        this.nextRound();
        this.renderLoop();
    },

    nextRound() {
        // Pick random word and random display color
        const wordIdx = Math.floor(Math.random() * COLORS.length);
        const colorIdx = Math.floor(Math.random() * COLORS.length);

        // ~40% match rate
        if (Math.random() < 0.4) {
            // Force match
            this.currentWord = COLORS[wordIdx];
            this.currentColor = COLORS[wordIdx];
            this.isMatch = true;
        } else {
            // Force mismatch
            this.currentWord = COLORS[wordIdx];
            let ci = colorIdx;
            while (ci === wordIdx) {
                ci = Math.floor(Math.random() * COLORS.length);
            }
            this.currentColor = COLORS[ci];
            this.isMatch = false;
        }

        this.timeLeft = this.timeLimit;
        this.startTime = performance.now();
        this.roundActive = true;

        clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (this.paused || !this.roundActive) return;
            this.timeLeft = Math.max(0, this.timeLimit - (performance.now() - this.startTime));
            if (this.timeLeft <= 0) {
                this.answer(null); // timeout
            }
        }, 30);
    },

    answer(playerSaidMatch) {
        if (!this.roundActive || this.gameOver) return;
        this.roundActive = false;
        clearInterval(this.timer);

        const correct = playerSaidMatch === this.isMatch;

        if (correct) {
            this.score++;
            this.streak++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
            this.feedback = { type: 'correct', timer: 20 };
            this.ui.setScore(this.score);

            // Increase difficulty every 5 correct
            if (this.score % 5 === 0 && this.timeLimit > 1000) {
                this.timeLimit -= 50;
            }
        } else {
            this.lives--;
            this.streak = 0;
            this.feedback = { type: 'wrong', timer: 20 };
        }

        if (this.lives <= 0) {
            this.endGame();
            return;
        }

        // Brief pause then next round
        setTimeout(() => {
            if (!this.gameOver) this.nextRound();
        }, 500);
    },

    endGame() {
        this.gameOver = true;
        clearInterval(this.timer);
        cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(this.score, best);
    },

    renderLoop() {
        if (this.gameOver) return;
        this.render();
        this.animFrame = requestAnimationFrame(() => this.renderLoop());
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Background
        let bg = '#0a0a0f';
        if (this.feedback) {
            this.feedback.timer--;
            if (this.feedback.timer > 0) {
                bg = this.feedback.type === 'correct'
                    ? `rgba(0,230,118,${this.feedback.timer * 0.005})`
                    : `rgba(255,45,123,${this.feedback.timer * 0.005})`;
            } else {
                this.feedback = null;
            }
        }
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        if (this.feedback && this.feedback.timer > 0) {
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, w, h);
        }

        // Timer bar
        const barW = w - 60;
        const barH = 8;
        const barX = 30;
        const barY = 30;
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.fill();

        const pct = this.timeLeft / this.timeLimit;
        const timerColor = pct > 0.5 ? '#00d4ff' : pct > 0.25 ? '#ffd60a' : '#ff2d7b';
        ctx.fillStyle = timerColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * pct, barH, 4);
        ctx.fill();

        // Lives
        ctx.fillStyle = '#e8e8f0';
        ctx.font = '16px Outfit, sans-serif';
        ctx.textAlign = 'left';
        const hearts = '\u2764'.repeat(this.lives) + '\u2661'.repeat(3 - this.lives);
        ctx.fillText(hearts, 30, 65);

        // Streak
        ctx.textAlign = 'right';
        ctx.fillStyle = this.streak >= 3 ? '#ffd60a' : '#8888a0';
        ctx.font = 'bold 16px JetBrains Mono, monospace';
        ctx.fillText(`Streak: ${this.streak}`, w - 30, 65);

        // Instruction
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillText('Does the word match its color?', w / 2, 110);

        // Color word
        if (this.currentWord && this.currentColor) {
            ctx.fillStyle = this.currentColor.hex;
            ctx.font = 'bold 72px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.currentWord.name, w / 2, h / 2 - 40);
            ctx.textBaseline = 'alphabetic';
        }

        // Buttons
        const mb = this.buttons.match;
        const nb = this.buttons.nope;

        // Match button
        ctx.fillStyle = '#1a3a2a';
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(mb.x, mb.y, mb.w, mb.h, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MATCH', mb.x + mb.w / 2, mb.y + mb.h / 2 + 8);

        // Nope button
        ctx.fillStyle = '#3a1a1a';
        ctx.strokeStyle = '#ff2d7b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(nb.x, nb.y, nb.w, nb.h, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ff2d7b';
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.fillText('NOPE', nb.x + nb.w / 2, nb.y + nb.h / 2 + 8);

        // Key hints
        ctx.fillStyle = '#555';
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillText('A / \u2190', mb.x + mb.w / 2, mb.y + mb.h + 18);
        ctx.fillText('D / \u2192', nb.x + nb.w / 2, nb.y + nb.h + 18);
    },

    hitTest(x, y) {
        const mb = this.buttons.match;
        const nb = this.buttons.nope;
        if (x >= mb.x && x <= mb.x + mb.w && y >= mb.y && y <= mb.y + mb.h) return 'match';
        if (x >= nb.x && x <= nb.x + nb.w && y >= nb.y && y <= nb.y + nb.h) return 'nope';
        return null;
    },

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const hit = this.hitTest(x, y);
        if (hit === 'match') this.answer(true);
        else if (hit === 'nope') this.answer(false);
    },

    handleTouch(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        const hit = this.hitTest(x, y);
        if (hit === 'match') this.answer(true);
        else if (hit === 'nope') this.answer(false);
    },

    handleKey(e) {
        if (this.gameOver) return;
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
            e.preventDefault();
            this.answer(true);
        } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
            e.preventDefault();
            this.answer(false);
        }
    },

    pause() {},
    resume() {},
    reset() {
        clearInterval(this.timer);
        cancelAnimationFrame(this.animFrame);
    },
    destroy() {
        clearInterval(this.timer);
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default ColorMatch;
