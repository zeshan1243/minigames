const COLORS = [
    { name: 'RED',    hex: '#ff2d2d', key: 'r', numKey: '1' },
    { name: 'BLUE',   hex: '#2d7bff', key: 'b', numKey: '2' },
    { name: 'GREEN',  hex: '#00e676', key: 'g', numKey: '3' },
    { name: 'YELLOW', hex: '#ffd60a', key: 'y', numKey: '4' }
];

// Modes: 'word' = press the word text, 'color' = press the display color
const MODES = ['word', 'color'];

const DontThink = {
    canvas: null,
    ctx: null,
    ui: null,
    score: 0,
    lives: 3,
    streak: 0,
    bestStreak: 0,
    combo: 1,
    mode: 'word',           // current instruction mode
    roundsInMode: 0,        // rounds played in current mode
    roundsUntilSwitch: 2,   // how many rounds before potential switch
    currentWord: null,       // the color object for the word text
    currentDisplayColor: null, // the color object for display color
    correctIndex: -1,        // index into COLORS for the correct answer
    timeLimit: 2000,
    timeLeft: 0,
    startTime: 0,
    timer: null,
    gameOver: false,
    paused: false,
    animFrame: null,
    feedback: null,          // { type: 'correct'|'wrong', timer: 0 }
    roundActive: false,
    buttons: [],
    modeFlash: 0,           // flash timer when mode changes

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

        // Layout 4 color buttons at bottom
        this._layoutButtons();
    },

    _layoutButtons() {
        const w = this.ui.canvasW;
        const btnW = 140;
        const btnH = 60;
        const gap = 16;
        const totalW = btnW * 4 + gap * 3;
        const startX = (w - totalW) / 2;
        const btnY = this.ui.canvasH - 120;
        this.buttons = COLORS.map((c, i) => ({
            x: startX + i * (btnW + gap),
            y: btnY,
            w: btnW,
            h: btnH,
            color: c
        }));
    },

    start() {
        this.score = 0;
        this.lives = 3;
        this.streak = 0;
        this.bestStreak = 0;
        this.combo = 1;
        this.timeLimit = 2000;
        this.gameOver = false;
        this.paused = false;
        this.feedback = null;
        this.mode = 'word';
        this.roundsInMode = 0;
        this.roundsUntilSwitch = 2 + Math.floor(Math.random() * 2); // 2-3
        this.modeFlash = 0;
        this.ui.setScore(0);
        this.ui.hideGameOver();
        this.nextRound();
        this.renderLoop();
    },

    nextRound() {
        // Check if mode should switch
        this.roundsInMode++;
        if (this.roundsInMode >= this.roundsUntilSwitch) {
            const oldMode = this.mode;
            this.mode = this.mode === 'word' ? 'color' : 'word';
            this.roundsInMode = 0;
            this.roundsUntilSwitch = 2 + Math.floor(Math.random() * 2);
            if (oldMode !== this.mode) {
                this.modeFlash = 40; // flash to alert player of mode change
            }
        }

        // Pick a random word and a different random display color
        const wordIdx = Math.floor(Math.random() * COLORS.length);
        let colorIdx = Math.floor(Math.random() * COLORS.length);

        // ~35% chance the word matches the display color (to keep it tricky)
        if (Math.random() < 0.35) {
            colorIdx = wordIdx;
        } else {
            while (colorIdx === wordIdx) {
                colorIdx = Math.floor(Math.random() * COLORS.length);
            }
        }

        this.currentWord = COLORS[wordIdx];
        this.currentDisplayColor = COLORS[colorIdx];

        // Determine correct answer based on mode
        if (this.mode === 'word') {
            this.correctIndex = wordIdx;   // press the word itself
        } else {
            this.correctIndex = colorIdx;  // press the display color
        }

        this.timeLeft = this.timeLimit;
        this.startTime = performance.now();
        this.roundActive = true;

        clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (this.paused || !this.roundActive) return;
            this.timeLeft = Math.max(0, this.timeLimit - (performance.now() - this.startTime));
            if (this.timeLeft <= 0) {
                this.answer(-1); // timeout
            }
        }, 20);
    },

    answer(selectedIndex) {
        if (!this.roundActive || this.gameOver) return;
        this.roundActive = false;
        clearInterval(this.timer);

        const correct = selectedIndex === this.correctIndex;

        if (correct) {
            this.streak++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
            // Combo: every 5 streak adds +1 multiplier, max 5x
            this.combo = Math.min(5, 1 + Math.floor(this.streak / 5));
            this.score += this.combo;
            this.feedback = { type: 'correct', timer: 25 };
            this.ui.setScore(this.score);

            // Decrease time limit every 5 correct (min 800ms)
            if (this.score % 5 === 0 && this.timeLimit > 800) {
                this.timeLimit -= 60;
            }
        } else {
            this.lives--;
            this.streak = 0;
            this.combo = 1;
            this.feedback = { type: 'wrong', timer: 25 };
        }

        if (this.lives <= 0) {
            this.endGame();
            return;
        }

        setTimeout(() => {
            if (!this.gameOver) this.nextRound();
        }, 550);
    },

    endGame() {
        this.gameOver = true;
        clearInterval(this.timer);
        cancelAnimationFrame(this.animFrame);
        this.render(); // final frame
        this.ui.setHighScore(this.score);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(this.score, best);
    },

    renderLoop() {
        if (this.gameOver) return;
        if (!this.paused) this.render();
        this.animFrame = requestAnimationFrame(() => this.renderLoop());
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Feedback flash overlay
        if (this.feedback) {
            this.feedback.timer--;
            if (this.feedback.timer > 0) {
                const alpha = this.feedback.timer * 0.006;
                ctx.fillStyle = this.feedback.type === 'correct'
                    ? `rgba(0,230,118,${alpha})`
                    : `rgba(255,45,123,${alpha})`;
                ctx.fillRect(0, 0, w, h);
            } else {
                this.feedback = null;
            }
        }

        // Mode flash background pulse
        if (this.modeFlash > 0) {
            this.modeFlash--;
            const alpha = this.modeFlash * 0.008;
            ctx.fillStyle = `rgba(255,214,10,${alpha})`;
            ctx.fillRect(0, 0, w, h);
        }

        // Timer bar
        const barW = w - 60;
        const barH = 10;
        const barX = 30;
        const barY = 28;
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 5);
        ctx.fill();

        const pct = this.timeLeft / this.timeLimit;
        const timerColor = pct > 0.5 ? '#00d4ff' : pct > 0.25 ? '#ffd60a' : '#ff2d7b';
        ctx.fillStyle = timerColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY, Math.max(0, barW * pct), barH, 5);
        ctx.fill();

        // Lives (hearts)
        ctx.fillStyle = '#e8e8f0';
        ctx.font = '20px Outfit, sans-serif';
        ctx.textAlign = 'left';
        const hearts = '\u2764'.repeat(this.lives) + '\u2661'.repeat(Math.max(0, 3 - this.lives));
        ctx.fillText(hearts, 30, 68);

        // Streak + combo
        ctx.textAlign = 'right';
        ctx.font = 'bold 16px JetBrains Mono, monospace';
        if (this.streak >= 5) {
            ctx.fillStyle = '#ffd60a';
            ctx.fillText(`x${this.combo} COMBO`, w - 30, 58);
            ctx.fillStyle = '#ffd60a';
            ctx.font = '13px JetBrains Mono, monospace';
            ctx.fillText(`Streak: ${this.streak}`, w - 30, 76);
        } else {
            ctx.fillStyle = this.streak >= 3 ? '#ffd60a' : '#8888a0';
            ctx.fillText(`Streak: ${this.streak}`, w - 30, 68);
        }

        // Mode instruction at top
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px Outfit, sans-serif';
        const modeText = this.mode === 'word'
            ? 'Match the WORD'
            : 'Match the COLOR';
        const modeColor = this.mode === 'word' ? '#00d4ff' : '#ff2d7b';
        // Glow effect for instruction
        ctx.shadowColor = modeColor;
        ctx.shadowBlur = this.modeFlash > 0 ? 20 : 8;
        ctx.fillStyle = modeColor;
        ctx.fillText(modeText, w / 2, 115);
        ctx.shadowBlur = 0;

        // Sub-instruction
        ctx.fillStyle = '#666680';
        ctx.font = '13px Outfit, sans-serif';
        const subText = this.mode === 'word'
            ? 'Press the button matching the WORD shown'
            : 'Press the button matching the INK COLOR';
        ctx.fillText(subText, w / 2, 140);

        // Large color word in center
        if (this.currentWord && this.currentDisplayColor) {
            ctx.fillStyle = this.currentDisplayColor.hex;
            ctx.font = 'bold 80px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Subtle text shadow/glow
            ctx.shadowColor = this.currentDisplayColor.hex;
            ctx.shadowBlur = 16;
            ctx.fillText(this.currentWord.name, w / 2, h / 2 - 50);
            ctx.shadowBlur = 0;
            ctx.textBaseline = 'alphabetic';
        }

        // Score display
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 28px JetBrains Mono, monospace';
        ctx.fillText(`${this.score}`, w / 2, h / 2 + 30);
        ctx.fillStyle = '#555570';
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillText('SCORE', w / 2, h / 2 + 48);

        // Color buttons
        for (let i = 0; i < this.buttons.length; i++) {
            const btn = this.buttons[i];
            const c = btn.color;

            // Button background (darker shade)
            ctx.fillStyle = this._darken(c.hex, 0.25);
            ctx.strokeStyle = c.hex;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 14);
            ctx.fill();
            ctx.stroke();

            // Button label
            ctx.fillStyle = c.hex;
            ctx.font = 'bold 20px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(c.name, btn.x + btn.w / 2, btn.y + btn.h / 2 + 7);

            // Key hint below button
            ctx.fillStyle = '#444460';
            ctx.font = '11px JetBrains Mono, monospace';
            ctx.fillText(`${c.numKey} / ${c.key.toUpperCase()}`, btn.x + btn.w / 2, btn.y + btn.h + 18);
        }
    },

    _darken(hex, amount) {
        // Simple darken: parse hex, multiply channels
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const f = 1 - amount;
        return `rgb(${Math.floor(r * f)},${Math.floor(g * f)},${Math.floor(b * f)})`;
    },

    hitTest(x, y) {
        for (let i = 0; i < this.buttons.length; i++) {
            const btn = this.buttons[i];
            if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                return i;
            }
        }
        return -1;
    },

    handleClick(e) {
        if (this.gameOver || this.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const hit = this.hitTest(x, y);
        if (hit >= 0) this.answer(hit);
    },

    handleTouch(e) {
        e.preventDefault();
        if (this.gameOver || this.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const x = (e.touches[0].clientX - rect.left) * scaleX;
        const y = (e.touches[0].clientY - rect.top) * scaleY;
        const hit = this.hitTest(x, y);
        if (hit >= 0) this.answer(hit);
    },

    handleKey(e) {
        if (this.gameOver || this.paused) return;

        let idx = -1;
        const key = e.key.toLowerCase();

        // Number keys 1-4
        if (key === '1') idx = 0;
        else if (key === '2') idx = 1;
        else if (key === '3') idx = 2;
        else if (key === '4') idx = 3;
        // Letter keys R, B, G, Y
        else if (key === 'r') idx = 0;
        else if (key === 'b') idx = 1;
        else if (key === 'g') idx = 2;
        else if (key === 'y') idx = 3;

        if (idx >= 0) {
            e.preventDefault();
            this.answer(idx);
        }
    },

    pause() {
        this.paused = true;
        // Pause the timer by recording elapsed
        if (this.roundActive) {
            this._pauseElapsed = performance.now() - this.startTime;
        }
    },

    resume() {
        this.paused = false;
        if (this.roundActive) {
            this.startTime = performance.now() - (this._pauseElapsed || 0);
        }
    },

    reset() {
        clearInterval(this.timer);
        cancelAnimationFrame(this.animFrame);
        this.roundActive = false;
        this.gameOver = false;
    },

    destroy() {
        clearInterval(this.timer);
        cancelAnimationFrame(this.animFrame);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default DontThink;
