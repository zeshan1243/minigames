// ─── Flag Guess Blitz ───────────────────────────────────────────────
// Guess the country from its flag. Timer-based with lives and streak bonus.

const FlagGuess = {
    canvas: null, ctx: null, ui: null,
    score: 0, lives: 3, streak: 0, correct: 0,
    timeLeft: 0, maxTime: 10000, timerStart: 0,
    gameOver: false, paused: false, animFrame: null,
    currentFlag: null, options: [], feedback: null,
    buttons: [], flags: [],

    // ── Flag Drawing Functions ──────────────────────────────────────
    _defineFlags() {
        const F = (name, drawFn) => ({ name, draw: drawFn });

        // Helper: horizontal stripes (top to bottom)
        const hStripes = (ctx, x, y, w, h, colors) => {
            const sh = h / colors.length;
            colors.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x, y + i * sh, w, sh); });
        };

        // Helper: vertical stripes (left to right)
        const vStripes = (ctx, x, y, w, h, colors) => {
            const sw = w / colors.length;
            colors.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + i * sw, y, sw, h); });
        };

        // Helper: Scandinavian cross
        const crossFlag = (ctx, x, y, w, h, bg, crossColor, innerColor) => {
            ctx.fillStyle = bg;
            ctx.fillRect(x, y, w, h);
            const cx = x + w * 0.36, cw = w * 0.14, cy = y, ch = h;
            const hy = y + h * 0.4, hh = h * 0.2;
            if (innerColor) {
                // double cross (e.g., Norway)
                ctx.fillStyle = innerColor;
                ctx.fillRect(cx - w * 0.03, cy, cw + w * 0.06, ch);
                ctx.fillRect(x, hy - h * 0.04, w, hh + h * 0.08);
            }
            ctx.fillStyle = crossColor;
            ctx.fillRect(cx, cy, cw, ch);
            ctx.fillRect(x, hy, w, hh);
        };

        // Helper: draw a 5-pointed star
        const star = (ctx, cx, cy, r, fill) => {
            ctx.fillStyle = fill;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                const outerX = cx + r * Math.cos(angle);
                const outerY = cy + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                const innerAngle = angle + Math.PI / 5;
                const ir = r * 0.38;
                ctx.lineTo(cx + ir * Math.cos(innerAngle), cy + ir * Math.sin(innerAngle));
            }
            ctx.closePath();
            ctx.fill();
        };

        this.flags = [
            // ── Vertical tricolors ──
            F('France', (ctx, x, y, w, h) => vStripes(ctx, x, y, w, h, ['#002395', '#FFFFFF', '#ED2939'])),
            F('Italy', (ctx, x, y, w, h) => vStripes(ctx, x, y, w, h, ['#009246', '#FFFFFF', '#CE2B37'])),
            F('Ireland', (ctx, x, y, w, h) => vStripes(ctx, x, y, w, h, ['#169B62', '#FFFFFF', '#FF883E'])),
            F('Belgium', (ctx, x, y, w, h) => vStripes(ctx, x, y, w, h, ['#000000', '#FAE042', '#ED2939'])),
            F('Romania', (ctx, x, y, w, h) => vStripes(ctx, x, y, w, h, ['#002B7F', '#FCD116', '#CE1126'])),
            F('Chad', (ctx, x, y, w, h) => vStripes(ctx, x, y, w, h, ['#002664', '#FECB00', '#ED1C24'])),
            F('Mali', (ctx, x, y, w, h) => vStripes(ctx, x, y, w, h, ['#14B53A', '#FCD116', '#CE1126'])),
            F('Guinea', (ctx, x, y, w, h) => vStripes(ctx, x, y, w, h, ['#CE1126', '#FCD116', '#009460'])),
            F('Ivory Coast', (ctx, x, y, w, h) => vStripes(ctx, x, y, w, h, ['#F77F00', '#FFFFFF', '#009E60'])),
            F('Nigeria', (ctx, x, y, w, h) => vStripes(ctx, x, y, w, h, ['#008751', '#FFFFFF', '#008751'])),

            // ── Horizontal tricolors ──
            F('Germany', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#000000', '#DD0000', '#FFCC00'])),
            F('Netherlands', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#AE1C28', '#FFFFFF', '#21468B'])),
            F('Russia', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#FFFFFF', '#0039A6', '#D52B1E'])),
            F('Hungary', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#CE2939', '#FFFFFF', '#477050'])),
            F('Bulgaria', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#FFFFFF', '#00966E', '#D62612'])),
            F('Armenia', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#D90012', '#0033A0', '#F2A800'])),
            F('Estonia', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#0072CE', '#000000', '#FFFFFF'])),
            F('Lithuania', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#FDB913', '#006A44', '#C1272D'])),
            F('Colombia', (ctx, x, y, w, h) => {
                ctx.fillStyle = '#FCD116'; ctx.fillRect(x, y, w, h * 0.5);
                ctx.fillStyle = '#003893'; ctx.fillRect(x, y + h * 0.5, w, h * 0.25);
                ctx.fillStyle = '#CE1126'; ctx.fillRect(x, y + h * 0.75, w, h * 0.25);
            }),

            // ── Horizontal bicolors ──
            F('Poland', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#FFFFFF', '#DC143C'])),
            F('Ukraine', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#005BBB', '#FFD500'])),
            F('Indonesia', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#FF0000', '#FFFFFF'])),
            F('Monaco', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#CE1126', '#FFFFFF'])),

            // ── Horizontal with 5 stripes ──
            F('Thailand', (ctx, x, y, w, h) => {
                const s = h / 6;
                const colors = ['#ED1C24', '#FFFFFF', '#241D4F', '#241D4F', '#FFFFFF', '#ED1C24'];
                colors.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x, y + i * s, w, s); });
            }),
            F('Austria', (ctx, x, y, w, h) => hStripes(ctx, x, y, w, h, ['#ED2939', '#FFFFFF', '#ED2939'])),

            // ── Bicolor horizontal special ──
            F('Latvia', (ctx, x, y, w, h) => {
                ctx.fillStyle = '#9E3039'; ctx.fillRect(x, y, w, h * 0.4);
                ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y + h * 0.4, w, h * 0.2);
                ctx.fillStyle = '#9E3039'; ctx.fillRect(x, y + h * 0.6, w, h * 0.4);
            }),

            // ── Circle flags ──
            F('Japan', (ctx, x, y, w, h) => {
                ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y, w, h);
                ctx.fillStyle = '#BC002D';
                ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.25, 0, Math.PI * 2); ctx.fill();
            }),
            F('Bangladesh', (ctx, x, y, w, h) => {
                ctx.fillStyle = '#006A4E'; ctx.fillRect(x, y, w, h);
                ctx.fillStyle = '#F42A41';
                ctx.beginPath(); ctx.arc(x + w * 0.45, y + h / 2, h * 0.25, 0, Math.PI * 2); ctx.fill();
            }),

            // ── Cross flags ──
            F('Sweden', (ctx, x, y, w, h) => crossFlag(ctx, x, y, w, h, '#006AA7', '#FECC00', null)),
            F('Finland', (ctx, x, y, w, h) => crossFlag(ctx, x, y, w, h, '#FFFFFF', '#003580', null)),
            F('Denmark', (ctx, x, y, w, h) => crossFlag(ctx, x, y, w, h, '#C8102E', '#FFFFFF', null)),
            F('Norway', (ctx, x, y, w, h) => crossFlag(ctx, x, y, w, h, '#EF2B2D', '#FFFFFF', '#002868')),

            // ── Switzerland ──
            F('Switzerland', (ctx, x, y, w, h) => {
                ctx.fillStyle = '#DA291C'; ctx.fillRect(x, y, w, h);
                const cx = x + w / 2, cy = y + h / 2;
                const armW = w * 0.08, armH = h * 0.35;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(cx - armW, cy - armH, armW * 2, armH * 2);
                ctx.fillRect(cx - armH * w / h, cy - armW, armH * 2 * w / h, armW * 2);
            }),

            // ── Qatar ──
            F('Qatar', (ctx, x, y, w, h) => {
                ctx.fillStyle = '#8A1538'; ctx.fillRect(x, y, w, h);
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath(); ctx.moveTo(x, y);
                const teeth = 9;
                for (let i = 0; i < teeth; i++) {
                    const ty = y + (h / teeth) * i;
                    const ty2 = y + (h / teeth) * (i + 0.5);
                    const ty3 = y + (h / teeth) * (i + 1);
                    ctx.lineTo(x + w * 0.33, ty2);
                    ctx.lineTo(x, ty3);
                }
                ctx.lineTo(x, y);
                ctx.fill();
            }),

            // ── Bahrain ──
            F('Bahrain', (ctx, x, y, w, h) => {
                ctx.fillStyle = '#CE1126'; ctx.fillRect(x, y, w, h);
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath(); ctx.moveTo(x, y);
                const teeth = 5;
                for (let i = 0; i < teeth; i++) {
                    const ty = y + (h / teeth) * i;
                    const ty2 = y + (h / teeth) * (i + 0.5);
                    const ty3 = y + (h / teeth) * (i + 1);
                    ctx.lineTo(x + w * 0.3, ty2);
                    ctx.lineTo(x, ty3);
                }
                ctx.lineTo(x, y);
                ctx.fill();
            }),

            // ── UAE ──
            F('UAE', (ctx, x, y, w, h) => {
                hStripes(ctx, x, y, w, h, ['#00732F', '#FFFFFF', '#000000']);
                ctx.fillStyle = '#FF0000'; ctx.fillRect(x, y, w * 0.25, h);
            }),

            // ── Kuwait ──
            F('Kuwait', (ctx, x, y, w, h) => {
                hStripes(ctx, x, y, w, h, ['#007A3D', '#FFFFFF', '#CE1126']);
                // black trapezoid on left
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + w * 0.25, y + h * 0.333);
                ctx.lineTo(x + w * 0.25, y + h * 0.667);
                ctx.lineTo(x, y + h);
                ctx.closePath();
                ctx.fill();
            }),

            // ── USA (simplified) ──
            F('USA', (ctx, x, y, w, h) => {
                const stripes = 13, sh = h / stripes;
                for (let i = 0; i < stripes; i++) {
                    ctx.fillStyle = i % 2 === 0 ? '#B31942' : '#FFFFFF';
                    ctx.fillRect(x, y + i * sh, w, sh);
                }
                // blue canton
                const cw = w * 0.4, ch = h * (7 / 13);
                ctx.fillStyle = '#0A3161';
                ctx.fillRect(x, y, cw, ch);
                // simplified stars: 3 rows of 3
                const rows = 3, cols = 3;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const sx = x + cw * (c + 0.5) / cols;
                        const sy = y + ch * (r + 0.5) / rows;
                        star(ctx, sx, sy, Math.min(cw, ch) * 0.07, '#FFFFFF');
                    }
                }
            }),

            // ── Libya (solid green pre-2011 for simplicity, actually now red/black/green) ──
            F('Libya', (ctx, x, y, w, h) => {
                const sh = h / 4;
                ctx.fillStyle = '#E70013'; ctx.fillRect(x, y, w, sh);
                ctx.fillStyle = '#000000'; ctx.fillRect(x, y + sh, w, sh * 2);
                ctx.fillStyle = '#239E46'; ctx.fillRect(x, y + sh * 3, w, sh);
                // white crescent and star on black
                const cx = x + w / 2, cy = y + h / 2;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath(); ctx.arc(cx, cy, h * 0.16, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000000';
                ctx.beginPath(); ctx.arc(cx + h * 0.05, cy, h * 0.13, 0, Math.PI * 2); ctx.fill();
                star(ctx, cx + h * 0.12, cy, h * 0.07, '#FFFFFF');
            }),
        ];
    },

    // ── Initialize ──────────────────────────────────────────────────
    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this._defineFlags();
        this._handleClick = this._onClick.bind(this);
        this._handleKey = this._onKey.bind(this);
        this._handleTouch = this._onTouch.bind(this);
        canvas.addEventListener('click', this._handleClick);
        canvas.addEventListener('touchstart', this._handleTouch, { passive: false });
        document.addEventListener('keydown', this._handleKey);
    },

    start() {
        this.score = 0;
        this.lives = 3;
        this.streak = 0;
        this.correct = 0;
        this.maxTime = 10000;
        this.gameOver = false;
        this.paused = false;
        this.feedback = null;
        this.ui.setScore(0);
        this.ui.hideGameOver();
        this._nextRound();
        this._loop();
    },

    pause() {
        this.paused = true;
        this.ui.showPause();
    },

    resume() {
        this.paused = false;
        this.ui.hidePause();
        this.timerStart = performance.now() - (this.maxTime - this.timeLeft);
        this._loop();
    },

    reset() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
    },

    destroy() {
        this.reset();
        this.canvas.removeEventListener('click', this._handleClick);
        this.canvas.removeEventListener('touchstart', this._handleTouch);
        document.removeEventListener('keydown', this._handleKey);
    },

    // ── Round Setup ─────────────────────────────────────────────────
    _nextRound() {
        // Pick a random flag
        const idx = Math.floor(Math.random() * this.flags.length);
        this.currentFlag = this.flags[idx];

        // Build 4 options: correct + 3 wrong
        const wrongPool = this.flags.filter((_, i) => i !== idx);
        this._shuffle(wrongPool);
        this.options = [this.currentFlag.name, wrongPool[0].name, wrongPool[1].name, wrongPool[2].name];
        this._shuffle(this.options);

        // Build button rects
        this._buildButtons();

        this.timeLeft = this.maxTime;
        this.timerStart = performance.now();
        this.feedback = null;
    },

    _buildButtons() {
        const cw = this.ui.canvasW, ch = this.ui.canvasH;
        const btnW = 340, btnH = 50, gap = 12;
        const totalH = 4 * btnH + 3 * gap;
        const startY = ch - totalH - 30;
        const startX = (cw - btnW) / 2;
        this.buttons = this.options.map((label, i) => ({
            label,
            x: startX,
            y: startY + i * (btnH + gap),
            w: btnW,
            h: btnH,
            idx: i,
        }));
    },

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    },

    // ── Game Loop ───────────────────────────────────────────────────
    _loop() {
        if (this.gameOver || this.paused) return;
        const now = performance.now();
        this.timeLeft = Math.max(0, this.maxTime - (now - this.timerStart));

        // Time ran out
        if (this.timeLeft <= 0 && !this.feedback) {
            this._wrongAnswer();
        }

        // Feedback timer
        if (this.feedback) {
            this.feedback.timer--;
            if (this.feedback.timer <= 0) {
                this.feedback = null;
                if (!this.gameOver) {
                    this._nextRound();
                }
            }
        }

        this._render();
        this.animFrame = requestAnimationFrame(() => this._loop());
    },

    // ── Input Handling ──────────────────────────────────────────────
    _onClick(e) {
        if (this.gameOver || this.paused || this.feedback) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        this._checkButtonHit(mx, my);
    },

    _onTouch(e) {
        e.preventDefault();
        if (this.gameOver || this.paused || this.feedback) return;
        const t = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const mx = (t.clientX - rect.left) * scaleX;
        const my = (t.clientY - rect.top) * scaleY;
        this._checkButtonHit(mx, my);
    },

    _onKey(e) {
        if (this.gameOver || this.paused || this.feedback) return;
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4) {
            e.preventDefault();
            this._selectAnswer(this.options[num - 1]);
        }
    },

    _checkButtonHit(mx, my) {
        for (const btn of this.buttons) {
            if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                this._selectAnswer(btn.label);
                return;
            }
        }
    },

    _selectAnswer(name) {
        if (name === this.currentFlag.name) {
            this._correctAnswer();
        } else {
            this._wrongAnswer();
        }
    },

    _correctAnswer() {
        this.streak++;
        this.correct++;
        // Streak bonus: 1 point base + 1 extra per 5 streak
        const bonus = 1 + Math.floor(this.streak / 5);
        this.score += bonus;
        this.ui.setScore(this.score);

        // Decrease timer every 5 correct answers
        if (this.correct % 5 === 0 && this.maxTime > 4000) {
            this.maxTime -= 500;
        }

        this.feedback = { type: 'correct', timer: 25, answer: this.currentFlag.name };
    },

    _wrongAnswer() {
        this.streak = 0;
        this.lives--;
        this.feedback = { type: 'wrong', timer: 40, answer: this.currentFlag.name };

        if (this.lives <= 0) {
            this.gameOver = true;
            const best = this.ui.getHighScore();
            this.ui.setHighScore(this.score);
            setTimeout(() => {
                this.ui.showGameOver(this.score, Math.max(this.score, best));
            }, 600);
        }
    },

    // ── Rendering ───────────────────────────────────────────────────
    _render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW, H = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Feedback flash
        if (this.feedback) {
            ctx.fillStyle = this.feedback.type === 'correct'
                ? 'rgba(0, 230, 118, 0.08)'
                : 'rgba(255, 45, 123, 0.08)';
            ctx.fillRect(0, 0, W, H);
        }

        // ── Timer bar ──
        const barY = 12, barH = 6, barPad = 40;
        const barW = W - barPad * 2;
        const pct = Math.max(0, this.timeLeft / this.maxTime);
        // Background track
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        this._roundRect(ctx, barPad, barY, barW, barH, 3);
        ctx.fill();
        // Fill
        const timerColor = pct > 0.5 ? '#00d4ff' : pct > 0.25 ? '#ffd60a' : '#ff2d7b';
        ctx.fillStyle = timerColor;
        this._roundRect(ctx, barPad, barY, barW * pct, barH, 3);
        ctx.fill();

        // ── Lives (hearts) ──
        const heartSize = 16;
        for (let i = 0; i < 3; i++) {
            const hx = W - 40 - i * 30, hy = 32;
            ctx.fillStyle = i < this.lives ? '#ff2d7b' : 'rgba(255,255,255,0.12)';
            this._drawHeart(ctx, hx, hy, heartSize);
        }

        // ── Streak ──
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Streak', 40, 40);
        ctx.fillStyle = this.streak >= 5 ? '#ffd60a' : '#e8e8f0';
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.fillText(String(this.streak), 40, 62);

        // ── Score ──
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Score', W / 2, 40);
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.fillText(String(this.score), W / 2, 64);

        // ── Flag ──
        const flagW = 300, flagH = 200;
        const flagX = (W - flagW) / 2, flagY = 90;

        // Flag shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this._roundRect(ctx, flagX + 4, flagY + 4, flagW, flagH, 8);
        ctx.fill();

        // Flag border
        ctx.fillStyle = '#1a1a2e';
        this._roundRect(ctx, flagX - 2, flagY - 2, flagW + 4, flagH + 4, 8);
        ctx.fill();

        // Clip flag to rounded rect
        ctx.save();
        this._roundRect(ctx, flagX, flagY, flagW, flagH, 6);
        ctx.clip();
        if (this.currentFlag) {
            this.currentFlag.draw(ctx, flagX, flagY, flagW, flagH);
        }
        ctx.restore();

        // ── Number hints (1-4) ──
        ctx.fillStyle = '#8888a0';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press 1-4 or click to answer', W / 2, this.buttons[0].y - 14);

        // ── Answer buttons ──
        for (let i = 0; i < this.buttons.length; i++) {
            const btn = this.buttons[i];
            const isCorrectAnswer = btn.label === (this.currentFlag ? this.currentFlag.name : '');
            let bgColor = '#1a1a2e';
            let borderColor = 'rgba(255,255,255,0.08)';
            let textColor = '#e8e8f0';

            if (this.feedback) {
                if (btn.label === this.feedback.answer) {
                    bgColor = 'rgba(0, 230, 118, 0.2)';
                    borderColor = '#00e676';
                    textColor = '#00e676';
                } else if (this.feedback.type === 'wrong' && !isCorrectAnswer) {
                    bgColor = '#1a1a2e';
                    textColor = '#555';
                }
            }

            // Button background
            ctx.fillStyle = bgColor;
            this._roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
            ctx.fill();

            // Button border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1.5;
            this._roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
            ctx.stroke();

            // Number badge
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.font = 'bold 13px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(String(i + 1), btn.x + 14, btn.y + btn.h / 2 + 5);

            // Button text
            ctx.fillStyle = textColor;
            ctx.font = '16px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
        }

        // ── Feedback overlay text ──
        if (this.feedback) {
            const fy = flagY + flagH / 2;
            ctx.textAlign = 'center';
            if (this.feedback.type === 'correct') {
                ctx.fillStyle = 'rgba(0, 230, 118, 0.9)';
                ctx.font = 'bold 28px "Outfit", sans-serif';
                ctx.fillText('✓ Correct!', W / 2, flagY + flagH + 30);
            } else {
                ctx.fillStyle = 'rgba(255, 45, 123, 0.9)';
                ctx.font = 'bold 28px "Outfit", sans-serif';
                ctx.fillText('✗ Wrong!', W / 2, flagY + flagH + 30);
                ctx.fillStyle = '#8888a0';
                ctx.font = '16px "Outfit", sans-serif';
                ctx.fillText('It was ' + this.feedback.answer, W / 2, flagY + flagH + 55);
            }
        }
    },

    // ── Helpers ──────────────────────────────────────────────────────
    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    _drawHeart(ctx, cx, cy, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy + s * 0.6);
        ctx.bezierCurveTo(cx - s * 1.2, cy - s * 0.4, cx - s * 0.6, cy - s * 1.2, cx, cy - s * 0.4);
        ctx.bezierCurveTo(cx + s * 0.6, cy - s * 1.2, cx + s * 1.2, cy - s * 0.4, cx, cy + s * 0.6);
        ctx.fill();
    },
};

export default FlagGuess;
