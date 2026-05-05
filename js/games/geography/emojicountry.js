// ─── Emoji Country: Rebus Puzzle Edition ───
// Guess the country from emoji/text wordplay clues
// 👋 + ☕ = HAI + TEA = HAITI

const COUNTRIES = [
    // ═══ EASY ═══
    { answer: 'TURKEY', parts: ['🦃'], sounds: ['Turkey'] },
    { answer: 'CHILE', parts: ['🌶️'], sounds: ['Chili'] },
    { answer: 'ICELAND', parts: ['🧊', '🏝️'], sounds: ['Ice', 'Land'] },
    { answer: 'IRAN', parts: ['👁️', '🏃'], sounds: ['I', 'Ran'] },
    { answer: 'HAITI', parts: ['👋', '☕'], sounds: ['Hai', 'Tea'] },
    { answer: 'GREECE', parts: ['⚙️'], sounds: ['Grease'] },
    { answer: 'HUNGARY', parts: ['🍽️', '😫'], sounds: ['Hung', 'Ry'] },
    { answer: 'IRELAND', parts: ['👁️', 'R', '🏝️'], sounds: ['I', 'R', 'Land'] },
    { answer: 'FINLAND', parts: ['🦈', '🏝️'], sounds: ['Fin', 'Land'] },
    { answer: 'THAILAND', parts: ['👔', '🏝️'], sounds: ['Tie', 'Land'] },
    { answer: 'TOGO', parts: ['2️⃣', '🏃'], sounds: ['To', 'Go'] },
    { answer: 'SPAIN', parts: ['S', '😣'], sounds: ['S', 'Pain'] },
    { answer: 'OMAN', parts: ['⭕', '👨'], sounds: ['O', 'Man'] },
    { answer: 'NEPAL', parts: ['🦵', '🤝'], sounds: ['Knee', 'Pal'] },
    { answer: 'CUBA', parts: ['🧊', 'B', '🅰️'], sounds: ['Cue', 'B', 'A'] },
    { answer: 'JORDAN', parts: ['🏀', '👨'], sounds: ['Jor', 'Dan'] },
    { answer: 'GUINEA', parts: ['🐹'], sounds: ['Guinea'] },
    { answer: 'CHAD', parts: ['👨‍💼'], sounds: ['Chad'] },

    // ═══ MEDIUM ═══
    { answer: 'NORWAY', parts: ['🚫', 'R', '↕️'], sounds: ['No', 'R', 'Way'] },
    { answer: 'IRAQ', parts: ['👁️', '🗄️'], sounds: ['I', 'Rack'] },
    { answer: 'UKRAINE', parts: ['🫵', '🏗️'], sounds: ['You', 'Crane'] },
    { answer: 'POLAND', parts: ['🏑', '🏝️'], sounds: ['Pole', 'Land'] },
    { answer: 'PANAMA', parts: ['🍳', '🅰️', '👩'], sounds: ['Pan', 'A', 'Ma'] },
    { answer: 'CANADA', parts: ['🥫', '🅰️', '🦌'], sounds: ['Can', 'A', 'Da'] },
    { answer: 'KENYA', parts: ['🔑', 'N', '🅰️'], sounds: ['Key', 'N', 'A'] },
    { answer: 'MALI', parts: ['🏬', '👁️'], sounds: ['Mall', 'I'] },
    { answer: 'BENIN', parts: ['🐝', '📥'], sounds: ['Be', 'In'] },
    { answer: 'GUYANA', parts: ['👨', '🅰️', 'N', '🅰️'], sounds: ['Guy', 'A', 'N', 'A'] },
    { answer: 'DENMARK', parts: ['🦷', '📝'], sounds: ['Den', 'Mark'] },
    { answer: 'PERU', parts: ['🅿️', '🦘'], sounds: ['P', 'Roo'] },
    { answer: 'ISRAEL', parts: ['📍', '✅'], sounds: ['Is', 'Real'] },
    { answer: 'QATAR', parts: ['🐱', '🅰️', 'R'], sounds: ['Cat', 'A', 'R'] },
    { answer: 'GERMANY', parts: ['💎', '🤼'], sounds: ['Gem', 'Many'] },
    { answer: 'SWEDEN', parts: ['🍬', '🏠'], sounds: ['Sweet', 'Den'] },
    { answer: 'MONACO', parts: ['💰', '🅰️', '🏢'], sounds: ['Mon', 'A', 'Co'] },
    { answer: 'MEXICO', parts: ['👨', '❌', '🏢'], sounds: ['Me', 'X', 'Co'] },
    { answer: 'JAPAN', parts: ['🫙', '🍳'], sounds: ['Jar', 'Pan'] },
    { answer: 'CHINA', parts: ['🍽️', '🅰️'], sounds: ['Chin', 'A'] },
    { answer: 'SUDAN', parts: ['👩‍⚖️', '👨'], sounds: ['Sue', 'Dan'] },
    { answer: 'TONGA', parts: ['👅', '🅰️'], sounds: ['Tong', 'A'] },

    // ═══ HARD ═══
    { answer: 'COLOMBIA', parts: ['🍺', '🐝', '🅰️'], sounds: ['Colum', 'B', 'A'] },
    { answer: 'ARGENTINA', parts: ['R', '🐑', '☕', '🅰️'], sounds: ['R', 'Gen', 'Tina', ''] },
    { answer: 'SINGAPORE', parts: ['🎤', '🅰️', '🐩'], sounds: ['Sing', 'A', 'Pore'] },
    { answer: 'PORTUGAL', parts: ['🚪', '2️⃣', '⚽'], sounds: ['Port', 'U', 'Gal'] },
    { answer: 'MALAWI', parts: ['🏬', '🅰️', '🌊'], sounds: ['Mal', 'A', 'Wi'] },
    { answer: 'BOTSWANA', parts: ['🤖', 'S', '🏊'], sounds: ['Bot', 'S', 'Wana'] },
    { answer: 'BAHRAIN', parts: ['🐻', '🌧️'], sounds: ['Ba', 'Rain'] },
    { answer: 'BELIZE', parts: ['🐝', '🧎'], sounds: ['Be', 'Lize'] },
    { answer: 'CAMEROON', parts: ['📷', '🦝'], sounds: ['Came', 'Roon'] },
    { answer: 'EGYPT', parts: ['🥚', '🐍'], sounds: ['E', 'Gypt'] },
    { answer: 'FIJI', parts: ['💰', '👖'], sounds: ['Fee', 'Jee'] },
    { answer: 'GHANA', parts: ['🔫', '🅰️'], sounds: ['Gon', 'A'] },
    { answer: 'INDIA', parts: ['📥', '🎲', '🅰️'], sounds: ['In', 'Di', 'A'] },
    { answer: 'ITALY', parts: ['👁️', 'T', '🅰️', 'L', 'Y'], sounds: ['I', 'T', 'A', 'L', 'Y'] },
    { answer: 'KUWAIT', parts: ['🐄', '⏳'], sounds: ['Ku', 'Wait'] },
    { answer: 'LEBANON', parts: ['🦵', '🐝', '🔛'], sounds: ['Le', 'Ba', 'Non'] },
    { answer: 'MOROCCO', parts: ['🐱', '🪨', '⭕'], sounds: ['Mo', 'Roc', 'Co'] },
    { answer: 'NIGERIA', parts: ['🦵', '🐑', '🅰️'], sounds: ['Ni', 'Geri', 'A'] },
    { answer: 'SAMOA', parts: ['🤲', '⭕', '🅰️'], sounds: ['Sa', 'Mo', 'A'] },
    { answer: 'UGANDA', parts: ['🫵', '🐑', '🦆'], sounds: ['U', 'Gan', 'Da'] },
    { answer: 'YEMEN', parts: ['🫵', '👨'], sounds: ['Ye', 'Men'] },
    { answer: 'FRANCE', parts: ['🍟', '💃'], sounds: ['Fran', 'Ce'] },
    { answer: 'RUSSIA', parts: ['🏃', 'S', '👁️', '🅰️'], sounds: ['Rush', '', 'I', 'A'] },
    { answer: 'BRAZIL', parts: ['👙', '🅰️', 'Z', 'I', 'L'], sounds: ['Bra', '', 'Z', 'I', 'L'] },
    { answer: 'CROATIA', parts: ['🐊', '👔', '🅰️'], sounds: ['Cro', 'A', 'Tia'] },
    { answer: 'MALTA', parts: ['🏬', '☕'], sounds: ['Mal', 'Ta'] },
    { answer: 'BURUNDI', parts: ['🍔', '🏃', 'D', '👁️'], sounds: ['Bur', 'Run', 'D', 'I'] },
    { answer: 'ANGOLA', parts: ['🅰️', '📐', '🅰️'], sounds: ['An', 'Gol', 'A'] },
    { answer: 'MONGOLIA', parts: ['💰', '⛳', '🅰️'], sounds: ['Mon', 'Gol', 'A'] },
    { answer: 'AUSTRIA', parts: ['🏖️', '🎺', '🅰️'], sounds: ['Aus', 'Tri', 'A'] },
    { answer: 'BELGIUM', parts: ['🔔', '🏋️'], sounds: ['Bel', 'Gium'] },
    { answer: 'BOLIVIA', parts: ['🎳', 'V', '👁️', '🅰️'], sounds: ['Bol', 'V', 'I', 'A'] },
    { answer: 'MYANMAR', parts: ['🪞', '🅰️', '⭐'], sounds: ['My', 'An', 'Mar'] },
    { answer: 'NAURU', parts: ['🚫', '🦘'], sounds: ['Na', 'Roo'] },
    { answer: 'ERITREA', parts: ['👂', '🍵', '🅰️'], sounds: ['Ear', 'Tre', 'A'] },
    { answer: 'GABON', parts: ['💨', '🦴'], sounds: ['Ga', 'Bon'] },
    { answer: 'LAOS', parts: ['🔈', 'S'], sounds: ['Lao', 'S'] },
    { answer: 'LIBYA', parts: ['🛋️', 'B', '🅰️'], sounds: ['Li', 'B', 'A'] },
    { answer: 'ZAMBIA', parts: ['Z', '🐑', '🐝', '🅰️'], sounds: ['Zam', '', 'B', 'A'] },
    { answer: 'ROMANIA', parts: ['🏛️', '🅰️', 'N', '👁️', '🅰️'], sounds: ['Ro', 'Ma', 'N', 'I', 'A'] },
    { answer: 'SENEGAL', parts: ['📧', '🦅'], sounds: ['Sene', 'Gal'] },
    { answer: 'TUNISIA', parts: ['🎶', '👁️', 'S', '🅰️'], sounds: ['Tun', 'I', 'S', 'A'] },
    { answer: 'TUVALU', parts: ['2️⃣', 'V', '🅰️', '💙'], sounds: ['Tu', 'V', 'A', 'Lu'] },
    { answer: 'BHUTAN', parts: ['🥾', '👨‍🔧'], sounds: ['Boo', 'Tan'] },
    { answer: 'NIGER', parts: ['🦵', '⚙️'], sounds: ['Knee', 'Ger'] },
    { answer: 'CYPRUS', parts: ['🌲', '🫵', 'S'], sounds: ['Cy', 'Prus', ''] },
    { answer: 'ALGERIA', parts: ['🅰️', 'L', '🐑', '🅰️'], sounds: ['Al', '', 'Geri', 'A'] },
    { answer: 'LATVIA', parts: ['😂', 'V', '👁️', '🅰️'], sounds: ['Lat', 'V', 'I', 'A'] },
    { answer: 'SOMALIA', parts: ['🤸', '🅰️', 'L', '👁️', '🅰️'], sounds: ['So', 'Ma', 'L', 'I', 'A'] },
];

// Difficulty tiers
const EASY = COUNTRIES.slice(0, 18);
const MEDIUM = COUNTRIES.slice(18, 40);
const HARD = COUNTRIES.slice(40);

const EmojiCountry = {
    canvas: null, ctx: null, ui: null, animFrame: null,
    W: 800, H: 620,
    screen: 'title',
    lastTime: 0,

    score: 0, lives: 3, streak: 0, bestStreak: 0,
    timer: 0, maxTimer: 12,
    currentQ: null, options: [], answered: false, answerIdx: -1, correctIdx: -1,
    feedbackTimer: 0, questionPool: [], questionIdx: 0,
    particles: [], hoverBtn: -1,

    _onClick: null, _onMouseMove: null,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.W = ui.canvasW; this.H = ui.canvasH;
        this._onKey = (e) => this.handleKey(e);
        this._onClick = (e) => this.handleClick(e);
        this._onMouseMove = (e) => this.handleMouseMove(e);
        this._onTouchStart = (e) => { e.preventDefault(); this.handleClick(e.changedTouches[0]); };
        document.addEventListener('keydown', this._onKey);
        canvas.addEventListener('click', this._onClick);
        canvas.addEventListener('mousemove', this._onMouseMove);
        canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    },

    start() { this.screen = 'title'; this.ui.hideGameOver(); this.ui.hidePause(); this.lastTime = performance.now(); this.loop(); },
    reset() { this.screen = 'title'; },
    pause() {}, resume() { this.lastTime = performance.now(); this.loop(); },

    destroy() {
        document.removeEventListener('keydown', this._onKey);
        this.canvas.removeEventListener('click', this._onClick);
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('touchstart', this._onTouchStart);
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    },

    // ─── Game Logic ───
    startGame() {
        this.score = 0; this.lives = 3; this.streak = 0; this.bestStreak = 0;
        this.particles = [];
        const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
        this.questionPool = [...shuffle([...EASY]), ...shuffle([...MEDIUM]), ...shuffle([...HARD])];
        this.questionIdx = 0;
        this.screen = 'play';
        this.nextQuestion();
    },

    nextQuestion() {
        if (this.questionIdx >= this.questionPool.length) {
            const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
            this.questionPool = shuffle([...COUNTRIES]);
            this.questionIdx = 0;
        }
        this.currentQ = this.questionPool[this.questionIdx++];
        this.answered = false; this.answerIdx = -1; this.feedbackTimer = 0;
        this.maxTimer = this.score < 5 ? 12 : this.score < 15 ? 10 : this.score < 25 ? 8 : 6;
        this.timer = this.maxTimer;
        const wrong = COUNTRIES.filter(c => c.answer !== this.currentQ.answer).sort(() => Math.random() - 0.5).slice(0, 3);
        this.options = [...wrong.map(c => c.answer), this.currentQ.answer];
        for (let i = this.options.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.options[i], this.options[j]] = [this.options[j], this.options[i]]; }
        this.correctIdx = this.options.indexOf(this.currentQ.answer);
        this.ui.setScore(`Score: ${this.score} | Streak: ${this.streak}`);
    },

    selectAnswer(idx) {
        if (this.answered || this.screen !== 'play') return;
        this.answered = true; this.answerIdx = idx; this.feedbackTimer = 1.2;
        if (idx === this.correctIdx) {
            this.score++; this.streak++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
            for (let i = 0; i < 20; i++) {
                const a = Math.random() * Math.PI * 2;
                this.particles.push({ x: this.W / 2, y: 200, vx: Math.cos(a) * (80 + Math.random() * 120), vy: Math.sin(a) * (80 + Math.random() * 120), life: 0.6 + Math.random() * 0.4, size: 3 + Math.random() * 4, color: ['#00e676', '#ffd60a', '#00d4ff'][Math.floor(Math.random() * 3)] });
            }
        } else { this.lives--; this.streak = 0; if (this.lives <= 0) this.feedbackTimer = 2; }
    },

    // ─── Input ───
    getCanvasPos(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (this.W / r.width), y: (e.clientY - r.top) * (this.H / r.height) }; },

    getBtnRects() {
        const W = this.W, bw = 320, bh = 54, gap = 14, startY = 410;
        return [
            { x: W / 2 - bw - gap / 2, y: startY, w: bw, h: bh },
            { x: W / 2 + gap / 2, y: startY, w: bw, h: bh },
            { x: W / 2 - bw - gap / 2, y: startY + bh + gap, w: bw, h: bh },
            { x: W / 2 + gap / 2, y: startY + bh + gap, w: bw, h: bh }
        ];
    },

    hitTestBtn(mx, my) {
        const rects = this.getBtnRects();
        for (let i = 0; i < rects.length; i++) { const r = rects[i]; if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i; }
        return -1;
    },

    handleClick(e) {
        const p = this.getCanvasPos(e);
        if (this.screen === 'title' || this.screen === 'gameover') { this.startGame(); return; }
        if (this.screen === 'play' && !this.answered) { const idx = this.hitTestBtn(p.x, p.y); if (idx >= 0) this.selectAnswer(idx); }
    },
    handleMouseMove(e) { this.hoverBtn = this.screen === 'play' ? this.hitTestBtn(this.getCanvasPos(e).x, this.getCanvasPos(e).y) : -1; },
    handleKey(e) {
        const k = e.key;
        if (this.screen === 'title' || this.screen === 'gameover') { if (k === ' ' || k === 'Enter') { e.preventDefault(); this.startGame(); } return; }
        if (k === '1') this.selectAnswer(0); if (k === '2') this.selectAnswer(1);
        if (k === '3') this.selectAnswer(2); if (k === '4') this.selectAnswer(3);
    },

    // ─── Update ───
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) { const p = this.particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt; if (p.life <= 0) this.particles.splice(i, 1); }
        if (this.screen !== 'play') return;
        if (this.answered) {
            this.feedbackTimer -= dt;
            if (this.feedbackTimer <= 0) {
                if (this.lives <= 0) { this.screen = 'gameover'; this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore()); }
                else this.nextQuestion();
            }
            return;
        }
        this.timer -= dt;
        if (this.timer <= 0) { this.timer = 0; this.answered = true; this.answerIdx = -1; this.feedbackTimer = 1.5; this.lives--; this.streak = 0; if (this.lives <= 0) this.feedbackTimer = 2; }
    },

    // ─── Render ───
    render() {
        const ctx = this.ctx, W = this.W, H = this.H;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,0.015)'; ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        for (const p of this.particles) { ctx.globalAlpha = Math.max(0, p.life / 0.6); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;

        if (this.screen === 'title') { this.renderTitle(ctx, W, H); return; }
        if (this.screen === 'gameover') { this.renderGameOver(ctx, W, H); return; }
        this.renderPlay(ctx, W, H);
    },

    renderTitle(ctx, W, H) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 42px Outfit, sans-serif';
        const grad = ctx.createLinearGradient(W/2 - 180, 0, W/2 + 180, 0);
        grad.addColorStop(0, '#ffd60a'); grad.addColorStop(1, '#00e676');
        ctx.fillStyle = grad; ctx.fillText('EMOJI COUNTRY', W / 2, 160);

        ctx.font = '17px Outfit, sans-serif'; ctx.fillStyle = '#8888a0';
        ctx.fillText('Decode the emoji clues to guess the country!', W / 2, 195);

        // Example 1
        ctx.font = '44px sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText('👋  +  ☕', W / 2, 280);
        ctx.font = 'bold 13px Outfit, sans-serif'; ctx.fillStyle = '#8888a0';
        ctx.fillText('HAI  +  TEA', W / 2, 305);
        ctx.font = 'bold 26px Outfit, sans-serif'; ctx.fillStyle = '#00e676';
        ctx.fillText('= HAITI', W / 2, 340);

        // Example 2
        ctx.font = '32px sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText('🚫  +  R  +  ↕️', W / 2, 400);
        ctx.font = 'bold 13px Outfit, sans-serif'; ctx.fillStyle = '#8888a0';
        ctx.fillText('NO  +  R  +  WAY', W / 2, 422);
        ctx.font = 'bold 22px Outfit, sans-serif'; ctx.fillStyle = '#00e676';
        ctx.fillText('= NORWAY', W / 2, 450);

        const pulse = 0.7 + Math.sin(performance.now() / 400) * 0.3;
        ctx.globalAlpha = pulse; ctx.font = 'bold 18px Outfit, sans-serif'; ctx.fillStyle = '#00d4ff';
        ctx.fillText('Click or press SPACE to start', W / 2, 520); ctx.globalAlpha = 1;

        const best = this.ui.getHighScore();
        if (best) { ctx.font = '14px JetBrains Mono, monospace'; ctx.fillStyle = '#ffd60a'; ctx.fillText(`Best: ${best}`, W / 2, 560); }
    },

    renderGameOver(ctx, W, H) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px Outfit, sans-serif'; ctx.fillStyle = '#ff2d7b'; ctx.fillText('GAME OVER', W / 2, 160);
        ctx.font = 'bold 64px JetBrains Mono, monospace'; ctx.fillStyle = '#e8e8f0'; ctx.fillText(this.score, W / 2, 260);
        ctx.font = '16px Outfit, sans-serif'; ctx.fillStyle = '#8888a0'; ctx.fillText('countries guessed', W / 2, 290);
        ctx.font = '14px JetBrains Mono, monospace'; ctx.fillStyle = '#ffd60a'; ctx.fillText(`Best streak: ${this.bestStreak}`, W / 2, 330);
        ctx.fillStyle = '#00e676'; ctx.fillText(`High score: ${this.ui.getHighScore()}`, W / 2, 360);
        if (this.currentQ) { ctx.font = '15px Outfit, sans-serif'; ctx.fillStyle = '#8888a0'; ctx.fillText(`The answer was: ${this.currentQ.answer}`, W / 2, 410); }
        const pulse = 0.7 + Math.sin(performance.now() / 400) * 0.3;
        ctx.globalAlpha = pulse; ctx.font = 'bold 18px Outfit, sans-serif'; ctx.fillStyle = '#00d4ff';
        ctx.fillText('Click or press SPACE to play again', W / 2, 500); ctx.globalAlpha = 1;
    },

    renderPlay(ctx, W, H) {
        const q = this.currentQ;
        if (!q) return;

        // HUD — Lives
        ctx.font = '22px sans-serif'; ctx.textAlign = 'left';
        let hearts = '';
        for (let i = 0; i < 3; i++) hearts += i < this.lives ? '❤️' : '🖤';
        ctx.fillText(hearts, 16, 32);

        // Score + streak
        ctx.font = 'bold 16px JetBrains Mono, monospace'; ctx.fillStyle = '#e8e8f0'; ctx.textAlign = 'right';
        ctx.fillText(`Score: ${this.score}`, W - 16, 28);
        if (this.streak >= 3) { ctx.fillStyle = '#ffd60a'; ctx.font = 'bold 14px JetBrains Mono, monospace'; ctx.fillText(`🔥 ${this.streak} streak!`, W - 16, 50); }
        ctx.fillStyle = '#8888a0'; ctx.font = '12px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`Question ${this.score + 1}`, W / 2, 28);

        // Timer bar
        const barW = 500, barH = 6, barX = (W - barW) / 2, barY = 50;
        const pct = Math.max(0, this.timer / this.maxTimer);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; this.rr(ctx, barX, barY, barW, barH, 3); ctx.fill();
        ctx.fillStyle = pct > 0.5 ? '#00e676' : pct > 0.25 ? '#ffd60a' : '#ff2d7b';
        if (barW * pct > 0) { this.rr(ctx, barX, barY, barW * pct, barH, 3); ctx.fill(); }

        // ─── Rebus Clue ───
        const parts = q.parts, sounds = q.sounds;
        ctx.font = '56px sans-serif';
        // Measure parts
        const partInfo = parts.map((p, i) => {
            const isEmoji = p.length <= 3 && /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(p);
            const w = isEmoji ? 70 : (() => { ctx.font = 'bold 44px Outfit, sans-serif'; return Math.max(50, ctx.measureText(p).width + 24); })();
            return { text: p, isEmoji, w, sound: sounds[i] || '' };
        });
        const plusW = 44;
        const totalW = partInfo.reduce((a, b) => a + b.w, 0) + (partInfo.length - 1) * plusW;
        let cx = (W - totalW) / 2;
        const cy = 170;

        for (let i = 0; i < partInfo.length; i++) {
            const pi = partInfo[i];

            // Card bg
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            this.rr(ctx, cx - 2, cy - 44, pi.w + 4, 88, 14); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
            this.rr(ctx, cx - 2, cy - 44, pi.w + 4, 88, 14); ctx.stroke();

            // Part
            if (pi.isEmoji) {
                ctx.font = '56px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
                ctx.fillText(pi.text, cx + pi.w / 2, cy + 20);
            } else {
                ctx.font = 'bold 42px Outfit, sans-serif'; ctx.textAlign = 'center';
                ctx.fillStyle = '#ff2d7b';
                ctx.fillText(pi.text, cx + pi.w / 2, cy + 16);
            }


            cx += pi.w;

            // Plus sign
            if (i < partInfo.length - 1) {
                ctx.font = 'bold 30px Outfit, sans-serif'; ctx.fillStyle = '#00d4ff'; ctx.textAlign = 'center';
                ctx.fillText('+', cx + plusW / 2, cy + 12);
                cx += plusW;
            }
        }

        // "What country is this?"
        ctx.font = '17px Outfit, sans-serif'; ctx.fillStyle = '#8888a0'; ctx.textAlign = 'center';
        ctx.fillText('What country is this?', W / 2, cy + 95);

        // ─── Answer Buttons ───
        const rects = this.getBtnRects();
        for (let i = 0; i < 4; i++) {
            const r = rects[i];
            let bg = 'rgba(255,255,255,0.04)', border = 'rgba(255,255,255,0.08)', tc = '#e8e8f0';

            if (this.answered) {
                if (i === this.correctIdx) { bg = 'rgba(0,230,118,0.2)'; border = '#00e676'; tc = '#00e676'; }
                else if (i === this.answerIdx && i !== this.correctIdx) { bg = 'rgba(255,45,123,0.2)'; border = '#ff2d7b'; tc = '#ff2d7b'; }
            } else if (this.hoverBtn === i) { bg = 'rgba(0,212,255,0.1)'; border = 'rgba(0,212,255,0.4)'; }

            ctx.fillStyle = bg; this.rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
            ctx.strokeStyle = border; ctx.lineWidth = 1.5; this.rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.stroke();

            // Number badge
            ctx.fillStyle = 'rgba(255,255,255,0.08)'; this.rr(ctx, r.x + 12, r.y + (r.h - 28) / 2, 28, 28, 7); ctx.fill();
            ctx.font = 'bold 14px JetBrains Mono, monospace'; ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.textAlign = 'center';
            ctx.fillText(String(i + 1), r.x + 26, r.y + r.h / 2 + 5);

            // Country name
            ctx.font = 'bold 17px Outfit, sans-serif'; ctx.fillStyle = tc; ctx.textAlign = 'center';
            ctx.fillText(this.options[i], r.x + r.w / 2 + 10, r.y + r.h / 2 + 6);
        }

        // Feedback
        if (this.answered) {
            ctx.textAlign = 'center';
            if (this.answerIdx === this.correctIdx) {
                ctx.font = 'bold 22px Outfit, sans-serif'; ctx.fillStyle = '#00e676';
                ctx.fillText('✅ Correct!', W / 2, 390);
            } else {
                ctx.font = 'bold 22px Outfit, sans-serif'; ctx.fillStyle = '#ff2d7b';
                ctx.fillText(`${this.answerIdx === -1 ? '⏰ Time\'s up!' : '❌ Wrong!'} Answer: ${q.answer}`, W / 2, 390);
            }
        }

        if ('ontouchstart' in window) { ctx.globalAlpha = 0.2; ctx.fillStyle = '#fff'; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Tap an answer', W / 2, H - 12); ctx.globalAlpha = 1; }
    },

    rr(ctx, x, y, w, h, r) {
        if (w <= 0) return;
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    },

    loop() {
        const now = performance.now();
        let dt = (now - this.lastTime) / 1000; this.lastTime = now;
        if (dt > 0.05) dt = 0.05;
        this.update(dt); this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    }
};

export default EmojiCountry;
