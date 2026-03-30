function getDailySeed() {
    const now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function seededRandom(seed) {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const Puzzle = {
    canvas: null,
    ctx: null,
    ui: null,
    target: 0,
    guesses: [],
    maxGuesses: 6,
    solved: false,
    failed: false,
    inputValue: '',
    buttons: [],
    retryBtn: null,
    freePlay: false,
    dateStr: '',

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const x = (e.touches[0].clientX - rect.left);
            const y = (e.touches[0].clientY - rect.top);
            this.processClick(x, y);
        }, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        const seed = getDailySeed();
        const now = new Date();
        this.dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        this.target = Math.floor(seededRandom(seed) * 100) + 1;
        this.guesses = [];
        this.solved = false;
        this.failed = false;
        this.inputValue = '';

        // Restore state if same day
        const saved = this.ui.getHighScore ? null : null;
        try {
            const raw = localStorage.getItem('mgh_daily_puzzle');
            if (raw) {
                const state = JSON.parse(raw);
                if (state.date === this.dateStr) {
                    this.guesses = state.guesses || [];
                    this.solved = state.solved || false;
                    this.failed = state.failed || false;
                }
            }
        } catch (e) {}

        this.ui.setScore(this.solved ? 'Solved!' : `${this.maxGuesses - this.guesses.length} left`);
        this.buildButtons();
        this.render();
    },

    buildButtons() {
        const w = this.ui.canvasW;
        const btnW = 50;
        const btnH = 44;
        const gap = 6;
        const cols = 5;
        const startX = (w - (cols * btnW + (cols - 1) * gap)) / 2;
        const startY = 420;
        this.buttons = [];

        // Number buttons 1-9, 0
        for (let i = 1; i <= 9; i++) {
            const col = (i - 1) % cols;
            const row = Math.floor((i - 1) / cols);
            this.buttons.push({
                label: String(i), type: 'num',
                x: startX + col * (btnW + gap),
                y: startY + row * (btnH + gap),
                w: btnW, h: btnH
            });
        }
        // 0
        this.buttons.push({
            label: '0', type: 'num',
            x: startX + 0 * (btnW + gap),
            y: startY + 2 * (btnH + gap),
            w: btnW, h: btnH
        });
        // Delete
        this.buttons.push({
            label: 'DEL', type: 'del',
            x: startX + 1 * (btnW + gap),
            y: startY + 2 * (btnH + gap),
            w: btnW * 2 + gap, h: btnH
        });
        // Enter
        this.buttons.push({
            label: 'GO', type: 'enter',
            x: startX + 3 * (btnW + gap),
            y: startY + 2 * (btnH + gap),
            w: btnW * 2 + gap, h: btnH
        });
    },

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.processClick(x, y);
    },

    processClick(x, y) {
        // Check retry button if game ended
        if (this.solved || this.failed) {
            const rb = this.retryBtn;
            if (rb && x >= rb.x && x <= rb.x + rb.w && y >= rb.y && y <= rb.y + rb.h) {
                this.startFreePlay();
            }
            return;
        }

        for (const btn of this.buttons) {
            if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                if (btn.type === 'num') {
                    if (this.inputValue.length < 3) {
                        this.inputValue += btn.label;
                    }
                } else if (btn.type === 'del') {
                    this.inputValue = this.inputValue.slice(0, -1);
                } else if (btn.type === 'enter') {
                    this.submitGuess();
                }
                this.render();
                return;
            }
        }
    },

    handleKey(e) {
        if (this.solved || this.failed) {
            if (e.key === 'Enter') this.startFreePlay();
            return;
        }
        if (e.key >= '0' && e.key <= '9' && this.inputValue.length < 3) {
            this.inputValue += e.key;
        } else if (e.key === 'Backspace') {
            this.inputValue = this.inputValue.slice(0, -1);
        } else if (e.key === 'Enter') {
            this.submitGuess();
        }
        this.render();
    },

    submitGuess() {
        if (!this.inputValue) return;
        const guess = parseInt(this.inputValue);
        if (isNaN(guess) || guess < 1 || guess > 100) {
            this.inputValue = '';
            return;
        }

        let hint;
        if (guess === this.target) {
            hint = 'Correct!';
            this.solved = true;
            this.ui.setHighScore(this.maxGuesses - this.guesses.length + 1);
        } else if (guess < this.target) {
            hint = 'Too low';
        } else {
            hint = 'Too high';
        }

        this.guesses.push({ guess, hint });
        this.inputValue = '';

        if (!this.solved && this.guesses.length >= this.maxGuesses) {
            this.failed = true;
        }

        this.ui.setScore(this.solved ? 'Solved!' : this.failed ? 'Failed' : `${this.maxGuesses - this.guesses.length} left`);

        // Save state
        this.saveState();
        this.render();

        if (this.solved || this.failed) {
            setTimeout(() => {
                const best = this.ui.getHighScore();
                this.ui.showGameOver(
                    this.solved ? `Solved in ${this.guesses.length}` : `Answer: ${this.target}`,
                    best > 0 ? `Best: ${best} guesses` : '—'
                );
            }, 600);
        }
    },

    saveState() {
        localStorage.setItem('mgh_daily_puzzle', JSON.stringify({
            date: this.dateStr,
            guesses: this.guesses,
            solved: this.solved,
            failed: this.failed
        }));
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 24px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Guess the Number (1–100)', w / 2, 40);

        ctx.fillStyle = '#8888a0';
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillText(this.freePlay ? 'Free Play \u2022 Random Puzzle' : `Daily Puzzle \u2022 ${this.dateStr}`, w / 2, 65);

        // Input display
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        const inputW = 160;
        const inputH = 50;
        const inputX = (w - inputW) / 2;
        const inputY = 85;
        ctx.beginPath();
        ctx.roundRect(inputX, inputY, inputW, inputH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 28px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.inputValue || '_', w / 2, inputY + 34);

        // Guesses
        const guessStartY = 160;
        for (let i = 0; i < this.maxGuesses; i++) {
            const y = guessStartY + i * 40;
            const g = this.guesses[i];

            ctx.fillStyle = '#12121a';
            ctx.beginPath();
            ctx.roundRect(60, y, w - 120, 34, 8);
            ctx.fill();

            if (g) {
                ctx.textAlign = 'left';
                ctx.font = 'bold 16px JetBrains Mono, monospace';
                ctx.fillStyle = '#e8e8f0';
                ctx.fillText(String(g.guess), 80, y + 23);

                ctx.textAlign = 'right';
                ctx.fillStyle = g.hint === 'Correct!' ? '#00e676' :
                                g.hint === 'Too low' ? '#00d4ff' : '#ff2d7b';
                ctx.font = '14px Outfit, sans-serif';
                ctx.fillText(g.hint, w - 80, y + 23);
            } else {
                ctx.textAlign = 'center';
                ctx.fillStyle = '#333';
                ctx.font = '14px Outfit, sans-serif';
                ctx.fillText(`Guess ${i + 1}`, w / 2, y + 23);
            }
        }

        // Final messages
        if (this.solved) {
            ctx.fillStyle = '#00e676';
            ctx.font = 'bold 22px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`You got it in ${this.guesses.length} guess${this.guesses.length > 1 ? 'es' : ''}!`, w / 2, 405);
        } else if (this.failed) {
            ctx.fillStyle = '#ff2d7b';
            ctx.font = 'bold 22px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`The answer was ${this.target}`, w / 2, 405);
        }

        // Buttons (only if game active)
        if (!this.solved && !this.failed) {
            for (const btn of this.buttons) {
                ctx.fillStyle = btn.type === 'enter' ? '#00d4ff' : '#1a1a2e';
                ctx.beginPath();
                ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 8);
                ctx.fill();

                ctx.fillStyle = btn.type === 'enter' ? '#000' : '#e8e8f0';
                ctx.font = btn.type === 'num' ? 'bold 18px JetBrains Mono, monospace' : 'bold 14px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
            }
        } else {
            // Retry button
            const rbW = 200;
            const rbH = 50;
            const rbX = (w - rbW) / 2;
            const rbY = 440;
            this.retryBtn = { x: rbX, y: rbY, w: rbW, h: rbH };

            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.roundRect(rbX, rbY, rbW, rbH, 12);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.font = 'bold 18px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Play Again (random)', rbX + rbW / 2, rbY + rbH / 2);

            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#8888a0';
            ctx.font = '13px Outfit, sans-serif';
            ctx.fillText('Press Enter or tap the button', w / 2, rbY + rbH + 24);
        }

        ctx.textBaseline = 'alphabetic';
    },

    startFreePlay() {
        this.freePlay = true;
        this.guesses = [];
        this.solved = false;
        this.failed = false;
        this.inputValue = '';
        this.target = Math.floor(Math.random() * 100) + 1;
        this.ui.hideGameOver();
        this.ui.setScore(`${this.maxGuesses} left`);
        this.buildButtons();
        this.render();
    },

    pause() {},
    resume() {},
    reset() {
        this.guesses = [];
        this.solved = false;
        this.failed = false;
        this.inputValue = '';
        this.freePlay = false;
    },
    destroy() {
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default Puzzle;
