const RPS = {
    canvas: null, ctx: null, ui: null,
    choices: ['rock', 'paper', 'scissors'],
    icons: { rock: '\u270a', paper: '\u270b', scissors: '\u2702\ufe0f' },
    playerChoice: null, aiChoice: null, roundResult: null,
    playerWins: 0, aiWins: 0, round: 0, maxRounds: 5,
    score: 0, totalGames: 0, totalWins: 0,
    gameOver: false, paused: false, animFrame: null,
    resultAnim: 0, resultPhase: 'idle', // idle, reveal, showing
    shakeAnim: 0, hoverIdx: -1, buttons: [],

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('mousemove', this.handleMove);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        document.addEventListener('keydown', this.handleKey);
        // Load stats
        try {
            const stats = JSON.parse(localStorage.getItem('rps_stats') || '{}');
            this.totalGames = stats.games || 0;
            this.totalWins = stats.wins || 0;
        } catch (e) {}
    },

    start() {
        this.playerWins = 0; this.aiWins = 0; this.round = 0; this.score = 0;
        this.gameOver = false; this.paused = false;
        this.ui.setScore(0); this.ui.hideGameOver(); this.ui.hidePause();
        this.resultPhase = 'idle'; this.playerChoice = null; this.aiChoice = null;
        this.computeButtons();
        this.loop();
    },

    computeButtons() {
        const w = this.ui.canvasW, h = this.ui.canvasH;
        const btnSize = Math.min(w * 0.22, 90);
        const gap = 20;
        const totalW = btnSize * 3 + gap * 2;
        const startX = (w - totalW) / 2;
        const btnY = h * 0.6;
        this.buttons = this.choices.map((c, i) => ({
            x: startX + i * (btnSize + gap), y: btnY,
            w: btnSize, h: btnSize, choice: c
        }));
    },

    getButtonAt(clientX, clientY) {
        const r = this.canvas.getBoundingClientRect();
        const mx = clientX - r.left, my = clientY - r.top;
        for (let i = 0; i < this.buttons.length; i++) {
            const b = this.buttons[i];
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) return i;
        }
        return -1;
    },

    handleMove(e) {
        this.hoverIdx = this.getButtonAt(e.clientX, e.clientY);
    },

    handleTouch(e) {
        e.preventDefault();
        const t = e.touches[0];
        this.handleClick({ clientX: t.clientX, clientY: t.clientY });
    },

    handleClick(e) {
        if (this.paused) return;
        if (this.gameOver) return;
        if (this.resultPhase !== 'idle') return;
        const idx = this.getButtonAt(e.clientX, e.clientY);
        if (idx < 0) return;
        this.makeChoice(idx);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') { this.togglePause(); return; }
        if (this.paused || this.gameOver || this.resultPhase !== 'idle') return;
        if (e.key === '1') this.makeChoice(0);
        else if (e.key === '2') this.makeChoice(1);
        else if (e.key === '3') this.makeChoice(2);
    },

    makeChoice(idx) {
        this.playerChoice = this.choices[idx];
        this.aiChoice = this.choices[Math.floor(Math.random() * 3)];
        this.resultPhase = 'reveal';
        this.shakeAnim = 0;
    },

    getResult(player, ai) {
        if (player === ai) return 'draw';
        if ((player === 'rock' && ai === 'scissors') ||
            (player === 'paper' && ai === 'rock') ||
            (player === 'scissors' && ai === 'paper')) return 'win';
        return 'lose';
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) this.ui.showPause(); else this.ui.hidePause();
    },

    loop() {
        this.animFrame = requestAnimationFrame(() => this.loop());
        this.update();
        this.draw();
    },

    update() {
        if (this.paused) return;
        if (this.resultPhase === 'reveal') {
            this.shakeAnim += 0.05;
            if (this.shakeAnim >= 1) {
                this.roundResult = this.getResult(this.playerChoice, this.aiChoice);
                this.round++;
                if (this.roundResult === 'win') this.playerWins++;
                else if (this.roundResult === 'lose') this.aiWins++;
                this.score = this.playerWins;
                this.ui.setScore(this.score);
                this.resultPhase = 'showing';
                this.resultAnim = 0;
            }
        } else if (this.resultPhase === 'showing') {
            this.resultAnim += 0.02;
            if (this.resultAnim >= 1) {
                if (this.round >= this.maxRounds || this.playerWins >= 3 || this.aiWins >= 3) {
                    this.endGame();
                } else {
                    this.resultPhase = 'idle';
                    this.playerChoice = null; this.aiChoice = null;
                }
            }
        }
    },

    endGame() {
        this.gameOver = true;
        this.totalGames++;
        if (this.playerWins > this.aiWins) this.totalWins++;
        try {
            localStorage.setItem('rps_stats', JSON.stringify({ games: this.totalGames, wins: this.totalWins }));
        } catch (e) {}
        const best = this.ui.getHighScore() || 0;
        if (this.score > best) this.ui.setHighScore(this.score);
        this.ui.showGameOver(this.score, Math.max(this.score, best));
    },

    draw() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Round info
        ctx.fillStyle = '#667';
        ctx.font = `bold ${Math.min(w * 0.04, 18)}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`Round ${Math.min(this.round + 1, this.maxRounds)} of ${this.maxRounds}`, w / 2, 30);

        // Score display
        ctx.fillStyle = '#00d4ff';
        ctx.font = `bold ${Math.min(w * 0.05, 22)}px 'Segoe UI', sans-serif`;
        ctx.fillText(`You ${this.playerWins} - ${this.aiWins} AI`, w / 2, 60);

        // Win rate
        if (this.totalGames > 0) {
            const rate = ((this.totalWins / this.totalGames) * 100).toFixed(0);
            ctx.fillStyle = '#667';
            ctx.font = `${Math.min(w * 0.03, 13)}px 'Segoe UI', sans-serif`;
            ctx.fillText(`Win rate: ${rate}% (${this.totalGames} games)`, w / 2, 82);
        }

        // Show result area
        if (this.resultPhase === 'reveal') {
            const shake = Math.sin(this.shakeAnim * 20) * 8 * (1 - this.shakeAnim);
            ctx.font = `${Math.min(w * 0.18, 80)}px 'Segoe UI', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('?', w * 0.3 + shake, h * 0.38);
            ctx.fillText('?', w * 0.7 + shake, h * 0.38);

            ctx.fillStyle = '#ffd60a';
            ctx.font = `bold ${Math.min(w * 0.05, 22)}px 'Segoe UI', sans-serif`;
            ctx.fillText('VS', w / 2, h * 0.35);
        } else if (this.resultPhase === 'showing') {
            const iconSize = Math.min(w * 0.18, 80);
            ctx.font = `${iconSize}px 'Segoe UI', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(this.icons[this.playerChoice], w * 0.3, h * 0.38);
            ctx.fillText(this.icons[this.aiChoice], w * 0.7, h * 0.38);

            // Labels
            ctx.font = `bold ${Math.min(w * 0.04, 16)}px 'Segoe UI', sans-serif`;
            ctx.fillStyle = '#aaa';
            ctx.fillText('YOU', w * 0.3, h * 0.42 + 15);
            ctx.fillText('AI', w * 0.7, h * 0.42 + 15);

            // Result text
            const resultColors = { win: '#00e676', lose: '#ff2d7b', draw: '#ffd60a' };
            const resultTexts = { win: 'You Win!', lose: 'You Lose!', draw: 'Draw!' };
            ctx.fillStyle = resultColors[this.roundResult];
            ctx.font = `bold ${Math.min(w * 0.07, 30)}px 'Segoe UI', sans-serif`;
            const scale = Math.min(1, this.resultAnim * 3);
            ctx.save();
            ctx.translate(w / 2, h * 0.5);
            ctx.scale(scale, scale);
            ctx.fillText(resultTexts[this.roundResult], 0, 0);
            ctx.restore();
        }

        // Choice buttons
        if (this.resultPhase === 'idle' && !this.gameOver) {
            for (let i = 0; i < this.buttons.length; i++) {
                const b = this.buttons[i];
                const hover = (i === this.hoverIdx);
                const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
                grad.addColorStop(0, hover ? '#1e3a5f' : '#1a1a2e');
                grad.addColorStop(1, hover ? '#162d4a' : '#16162a');
                ctx.fillStyle = grad;
                this.roundRect(ctx, b.x, b.y, b.w, b.h, 12);
                ctx.fill();
                ctx.strokeStyle = hover ? '#00d4ff' : '#00d4ff44';
                ctx.lineWidth = hover ? 2.5 : 1.5;
                this.roundRect(ctx, b.x, b.y, b.w, b.h, 12);
                ctx.stroke();

                ctx.font = `${b.w * 0.5}px 'Segoe UI', sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(this.icons[b.choice], b.x + b.w / 2, b.y + b.h * 0.45);

                ctx.fillStyle = '#aaa';
                ctx.font = `bold ${Math.min(b.w * 0.18, 14)}px 'Segoe UI', sans-serif`;
                ctx.fillText(`${i + 1}. ${b.choice.charAt(0).toUpperCase() + b.choice.slice(1)}`, b.x + b.w / 2, b.y + b.h * 0.85);
            }
        }
    },

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    reset() { cancelAnimationFrame(this.animFrame); },
    pause() { this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('mousemove', this.handleMove);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default RPS;
