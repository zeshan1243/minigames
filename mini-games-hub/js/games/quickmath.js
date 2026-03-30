const QuickMath = {
    canvas: null, ctx: null, ui: null,
    score: 0, lives: 3, timeLeft: 0, maxTime: 5000,
    question: '', answer: 0, input: '', gameOver: false,
    startTime: 0, animFrame: null, feedback: null,
    buttons: [],

    // 2P state
    p1Score: 0, p2Score: 0, p2Input: '', winScore: 5,
    p2Buttons: [], matchOver: false, roundFeedback: null,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });

        const btnW = 55, btnH = 44, gap = 6, cols = 5;
        const startX = (ui.canvasW - (cols * btnW + (cols-1) * gap)) / 2;
        const startY = 400;
        this.buttons = [];
        for (let i = 0; i <= 9; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            this.buttons.push({ label: String(i), x: startX + col * (btnW + gap), y: startY + row * (btnH + gap), w: btnW, h: btnH, type: 'num' });
        }
        this.buttons.push({ label: 'DEL', x: startX + 2*(btnW+gap), y: startY + (btnH+gap), w: btnW, h: btnH, type: 'del' });
        this.buttons.push({ label: 'GO', x: startX + 3*(btnW+gap), y: startY + (btnH+gap), w: btnW*2+gap, h: btnH, type: 'enter' });
        this.buttons.push({ label: '-', x: startX + 0*(btnW+gap), y: startY + (btnH+gap), w: btnW, h: btnH, type: 'neg' });

        // 2P buttons (right side of canvas)
        this._build2PButtons(ui.canvasW);
    },

    _build2PButtons(canvasW) {
        const btnW = 44, btnH = 38, gap = 5, cols = 5;
        const panelW = cols * btnW + (cols - 1) * gap;
        const startX = canvasW - panelW - 15;
        const startY = 370;
        this.p2Buttons = [];
        for (let i = 0; i <= 9; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            this.p2Buttons.push({ label: String(i), x: startX + col * (btnW + gap), y: startY + row * (btnH + gap), w: btnW, h: btnH, type: 'num' });
        }
        this.p2Buttons.push({ label: 'DEL', x: startX + 2*(btnW+gap), y: startY + (btnH+gap), w: btnW, h: btnH, type: 'del' });
        this.p2Buttons.push({ label: 'GO', x: startX + 3*(btnW+gap), y: startY + (btnH+gap), w: btnW*2+gap, h: btnH, type: 'enter' });
        this.p2Buttons.push({ label: '-', x: startX + 0*(btnW+gap), y: startY + (btnH+gap), w: btnW, h: btnH, type: 'neg' });
    },

    start() {
        if (this.ui.mode === '2p') { this.start2P(); return; }
        this.score = 0; this.lives = 3; this.gameOver = false; this.maxTime = 5000;
        this.feedback = null; this.input = '';
        this.ui.setScore(0); this.ui.hideGameOver();
        this.nextQuestion();
        this.loop();
    },

    nextQuestion() {
        const ops = ['+', '-', '\u00d7'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a, b;
        if (op === '\u00d7') { a = 2 + Math.floor(Math.random() * 10); b = 2 + Math.floor(Math.random() * 10); }
        else { a = 1 + Math.floor(Math.random() * 50); b = 1 + Math.floor(Math.random() * 50); }
        this.question = `${a} ${op} ${b}`;
        if (op === '+') this.answer = a + b;
        else if (op === '-') this.answer = a - b;
        else this.answer = a * b;
        this.input = '';
        this.startTime = performance.now();
        this.timeLeft = this.maxTime;
    },

    loop() {
        if (this.gameOver) return;
        if (this.ui.mode === '2p') {
            if (this.roundFeedback) {
                this.roundFeedback.timer--;
                if (this.roundFeedback.timer <= 0) this.roundFeedback = null;
            }
            this.render2P();
            this.animFrame = requestAnimationFrame(() => this.loop());
            return;
        }
        this.timeLeft = Math.max(0, this.maxTime - (performance.now() - this.startTime));
        if (this.timeLeft <= 0 && !this.feedback) {
            this.lives--; this.feedback = { type: 'wrong', timer: 30 };
            if (this.lives <= 0) { this.endGame(); return; }
            setTimeout(() => { this.feedback = null; this.nextQuestion(); }, 500);
        }
        if (this.feedback) { this.feedback.timer--; if (this.feedback.timer <= 0) this.feedback = null; }
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    submit() {
        if (this.gameOver || this.feedback) return;
        const val = parseInt(this.input);
        if (isNaN(val)) return;
        if (val === this.answer) {
            this.score++; this.ui.setScore(this.score);
            this.feedback = { type: 'correct', timer: 20 };
            if (this.maxTime > 2000) this.maxTime -= 100;
            setTimeout(() => { this.feedback = null; this.nextQuestion(); }, 400);
        } else {
            this.lives--; this.feedback = { type: 'wrong', timer: 20 };
            if (this.lives <= 0) { this.endGame(); return; }
            setTimeout(() => { this.feedback = null; this.nextQuestion(); }, 500);
        }
    },

    processClick(x, y) {
        if (this.ui.mode === '2p') { this._processClick2P(x, y); return; }
        if (this.gameOver) return;
        for (const b of this.buttons) {
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                if (b.type === 'num') this.input += b.label;
                else if (b.type === 'del') this.input = this.input.slice(0, -1);
                else if (b.type === 'enter') this.submit();
                else if (b.type === 'neg') { if (!this.input.startsWith('-')) this.input = '-' + this.input; else this.input = this.input.slice(1); }
                return;
            }
        }
    },

    handleClick(e) { const r = this.canvas.getBoundingClientRect(); this.processClick(e.clientX - r.left, e.clientY - r.top); },
    handleTouch(e) { e.preventDefault(); const r = this.canvas.getBoundingClientRect(); this.processClick(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top); },
    handleKey(e) {
        if (this.ui.mode === '2p') { this._handleKey2P(e); return; }
        if (this.gameOver) return;
        if (e.key >= '0' && e.key <= '9') this.input += e.key;
        else if (e.key === '-') { if (!this.input.startsWith('-')) this.input = '-' + this.input; else this.input = this.input.slice(1); }
        else if (e.key === 'Backspace') this.input = this.input.slice(0, -1);
        else if (e.key === 'Enter') this.submit();
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        if (this.feedback) {
            ctx.fillStyle = this.feedback.type === 'correct' ? 'rgba(0,230,118,0.08)' : 'rgba(255,45,123,0.08)';
            ctx.fillRect(0, 0, w, h);
        }

        // Lives & timer
        ctx.fillStyle = '#e8e8f0'; ctx.font = '16px Outfit, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('\u2764'.repeat(this.lives), 20, 35);
        const pct = this.timeLeft / this.maxTime;
        ctx.fillStyle = '#1a1a2e'; ctx.beginPath(); ctx.roundRect(20, 50, w-40, 8, 4); ctx.fill();
        ctx.fillStyle = pct > 0.5 ? '#00d4ff' : pct > 0.25 ? '#ffd60a' : '#ff2d7b';
        ctx.beginPath(); ctx.roundRect(20, 50, (w-40)*pct, 8, 4); ctx.fill();

        // Question
        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 48px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText(this.question + ' = ?', w/2, 160);

        // Input
        ctx.fillStyle = '#1a1a2e'; ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(w/2-80, 200, 160, 55, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 30px JetBrains Mono, monospace';
        ctx.fillText(this.input || '_', w/2, 237);

        // Buttons
        for (const b of this.buttons) {
            ctx.fillStyle = b.type === 'enter' ? '#00d4ff' : b.type === 'neg' ? '#ff2d7b' : '#1a1a2e';
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 8); ctx.fill();
            ctx.fillStyle = b.type === 'enter' ? '#000' : '#e8e8f0';
            ctx.font = b.type === 'num' ? 'bold 18px JetBrains Mono, monospace' : 'bold 14px Outfit, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(b.label, b.x + b.w/2, b.y + b.h/2);
        }
        ctx.textBaseline = 'alphabetic';
    },

    endGame() {
        this.gameOver = true; cancelAnimationFrame(this.animFrame);
        if (this.ui.mode === '2p') return;
        this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    // ========== 2P MODE ==========

    start2P() {
        this.p1Score = 0; this.p2Score = 0;
        this.input = ''; this.p2Input = '';
        this.gameOver = false; this.matchOver = false;
        this.roundFeedback = null;
        this.ui.setScore('P1: 0 | P2: 0');
        this.ui.hideGameOver();
        this.nextQuestion2P();
        this.loop();
    },

    nextQuestion2P() {
        const ops = ['+', '-', '\u00d7'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a, b;
        if (op === '\u00d7') { a = 2 + Math.floor(Math.random() * 10); b = 2 + Math.floor(Math.random() * 10); }
        else { a = 1 + Math.floor(Math.random() * 50); b = 1 + Math.floor(Math.random() * 50); }
        this.question = `${a} ${op} ${b}`;
        if (op === '+') this.answer = a + b;
        else if (op === '-') this.answer = a - b;
        else this.answer = a * b;
        this.input = '';
        this.p2Input = '';
    },

    _handleKey2P(e) {
        if (this.gameOver || this.matchOver || this.roundFeedback) return;
        // P1 uses number keys + Enter
        if (e.key >= '0' && e.key <= '9') this.input += e.key;
        else if (e.key === '-') { if (!this.input.startsWith('-')) this.input = '-' + this.input; else this.input = this.input.slice(1); }
        else if (e.key === 'Backspace') this.input = this.input.slice(0, -1);
        else if (e.key === 'Enter') this._submit2P(1);
    },

    _processClick2P(x, y) {
        if (this.gameOver || this.roundFeedback) return;
        if (this.matchOver) {
            this.start2P();
            return;
        }
        // Check P2 on-screen buttons
        for (const b of this.p2Buttons) {
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                if (b.type === 'num') this.p2Input += b.label;
                else if (b.type === 'del') this.p2Input = this.p2Input.slice(0, -1);
                else if (b.type === 'enter') this._submit2P(2);
                else if (b.type === 'neg') { if (!this.p2Input.startsWith('-')) this.p2Input = '-' + this.p2Input; else this.p2Input = this.p2Input.slice(1); }
                return;
            }
        }
    },

    _submit2P(player) {
        if (this.gameOver || this.matchOver || this.roundFeedback) return;
        const val = parseInt(player === 1 ? this.input : this.p2Input);
        if (isNaN(val)) return;

        if (val === this.answer) {
            // Correct: this player scores
            if (player === 1) this.p1Score++; else this.p2Score++;
            this.roundFeedback = { type: 'correct', player, timer: 30 };
        } else {
            // Wrong: other player scores
            if (player === 1) this.p2Score++; else this.p1Score++;
            this.roundFeedback = { type: 'wrong', player, timer: 30 };
        }
        this.ui.setScore(`P1: ${this.p1Score} | P2: ${this.p2Score}`);

        if (this.p1Score >= this.winScore || this.p2Score >= this.winScore) {
            setTimeout(() => {
                this.roundFeedback = null;
                this.matchOver = true;
            }, 600);
        } else {
            setTimeout(() => {
                this.roundFeedback = null;
                this.nextQuestion2P();
            }, 600);
        }
    },

    render2P() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        if (this.matchOver) {
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            let winner;
            if (this.p1Score >= this.winScore) winner = 'Player 1 Wins!';
            else winner = 'Player 2 Wins!';
            ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 36px Outfit, sans-serif';
            ctx.fillText(winner, w/2, h/2 - 40);
            ctx.fillStyle = '#ffd60a'; ctx.font = '22px JetBrains Mono, monospace';
            ctx.fillText(`P1: ${this.p1Score}  |  P2: ${this.p2Score}`, w/2, h/2 + 10);
            ctx.fillStyle = 'rgba(232,232,240,0.5)'; ctx.font = '16px Outfit, sans-serif';
            ctx.fillText('Click to play again', w/2, h/2 + 50);
            ctx.textBaseline = 'alphabetic';
            return;
        }

        // Feedback flash
        if (this.roundFeedback) {
            ctx.fillStyle = this.roundFeedback.type === 'correct' ? 'rgba(0,230,118,0.08)' : 'rgba(255,45,123,0.08)';
            ctx.fillRect(0, 0, w, h);
        }

        // Score
        ctx.fillStyle = '#ffd60a'; ctx.font = 'bold 18px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText(`P1: ${this.p1Score}  |  P2: ${this.p2Score}   (First to ${this.winScore})`, w/2, 30);

        // Question (centered, shared)
        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 40px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText(this.question + ' = ?', w/2, 100);

        // Feedback text
        if (this.roundFeedback) {
            const fb = this.roundFeedback;
            const msg = fb.type === 'correct'
                ? `P${fb.player} correct!`
                : `P${fb.player} wrong! Point to P${fb.player === 1 ? 2 : 1}`;
            ctx.fillStyle = fb.type === 'correct' ? '#00e676' : '#ff2d7b';
            ctx.font = 'bold 20px Outfit, sans-serif';
            ctx.fillText(msg, w/2, 140);
        }

        // P1 input area (left side)
        const leftCenter = w * 0.25;
        ctx.fillStyle = '#00d4ff'; ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.fillText('P1 (Keyboard)', leftCenter, 185);
        ctx.fillStyle = '#1a1a2e'; ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(leftCenter - 70, 200, 140, 50, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 26px JetBrains Mono, monospace';
        ctx.fillText(this.input || '_', leftCenter, 232);

        // P1 keyboard hint
        ctx.fillStyle = '#8888a0'; ctx.font = '12px Outfit, sans-serif';
        ctx.fillText('0-9, -, Backspace, Enter', leftCenter, 270);

        // P2 input area (right side)
        const rightCenter = w * 0.75;
        ctx.fillStyle = '#ff00c8'; ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.fillText('P2 (Buttons)', rightCenter, 185);
        ctx.fillStyle = '#1a1a2e'; ctx.strokeStyle = '#ff00c8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(rightCenter - 70, 200, 140, 50, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 26px JetBrains Mono, monospace';
        ctx.fillText(this.p2Input || '_', rightCenter, 232);

        // Divider
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(w/2, 165); ctx.lineTo(w/2, h); ctx.stroke();

        // P2 on-screen buttons
        for (const b of this.p2Buttons) {
            ctx.fillStyle = b.type === 'enter' ? '#ff00c8' : b.type === 'neg' ? '#ff2d7b' : '#1a1a2e';
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 6); ctx.fill();
            ctx.fillStyle = b.type === 'enter' ? '#000' : '#e8e8f0';
            ctx.font = b.type === 'num' ? 'bold 16px JetBrains Mono, monospace' : 'bold 12px Outfit, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(b.label, b.x + b.w/2, b.y + b.h/2);
        }
        ctx.textBaseline = 'alphabetic';
    },

    pause() {}, resume() {},
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKey); }
};
export default QuickMath;
