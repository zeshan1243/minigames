// Country-Capital pairs with alternate accepted spellings
const COUNTRIES = [
    { country: 'USA', capital: 'Washington D.C.', alts: ['washington', 'washington dc', 'washington d.c.', 'washington d.c'] },
    { country: 'United Kingdom', capital: 'London', alts: ['london'] },
    { country: 'France', capital: 'Paris', alts: ['paris'] },
    { country: 'Germany', capital: 'Berlin', alts: ['berlin'] },
    { country: 'Italy', capital: 'Rome', alts: ['rome', 'roma'] },
    { country: 'Spain', capital: 'Madrid', alts: ['madrid'] },
    { country: 'Japan', capital: 'Tokyo', alts: ['tokyo'] },
    { country: 'China', capital: 'Beijing', alts: ['beijing', 'peking'] },
    { country: 'India', capital: 'New Delhi', alts: ['new delhi', 'delhi'] },
    { country: 'Russia', capital: 'Moscow', alts: ['moscow', 'moskva'] },
    { country: 'Brazil', capital: 'Brasilia', alts: ['brasilia', 'brasília'] },
    { country: 'Australia', capital: 'Canberra', alts: ['canberra'] },
    { country: 'Canada', capital: 'Ottawa', alts: ['ottawa'] },
    { country: 'Mexico', capital: 'Mexico City', alts: ['mexico city', 'ciudad de mexico', 'ciudad de méxico'] },
    { country: 'Egypt', capital: 'Cairo', alts: ['cairo'] },
    { country: 'South Africa', capital: 'Pretoria', alts: ['pretoria', 'cape town', 'bloemfontein'] },
    { country: 'Turkey', capital: 'Ankara', alts: ['ankara'] },
    { country: 'Argentina', capital: 'Buenos Aires', alts: ['buenos aires'] },
    { country: 'South Korea', capital: 'Seoul', alts: ['seoul'] },
    { country: 'Indonesia', capital: 'Jakarta', alts: ['jakarta', 'nusantara'] },
    { country: 'Thailand', capital: 'Bangkok', alts: ['bangkok', 'krung thep'] },
    { country: 'Vietnam', capital: 'Hanoi', alts: ['hanoi', 'ha noi'] },
    { country: 'Philippines', capital: 'Manila', alts: ['manila'] },
    { country: 'Malaysia', capital: 'Kuala Lumpur', alts: ['kuala lumpur', 'kl'] },
    { country: 'Singapore', capital: 'Singapore', alts: ['singapore'] },
    { country: 'Poland', capital: 'Warsaw', alts: ['warsaw', 'warszawa'] },
    { country: 'Netherlands', capital: 'Amsterdam', alts: ['amsterdam'] },
    { country: 'Belgium', capital: 'Brussels', alts: ['brussels', 'bruxelles', 'brussel'] },
    { country: 'Sweden', capital: 'Stockholm', alts: ['stockholm'] },
    { country: 'Norway', capital: 'Oslo', alts: ['oslo'] },
    { country: 'Denmark', capital: 'Copenhagen', alts: ['copenhagen', 'kobenhavn', 'københavn'] },
    { country: 'Finland', capital: 'Helsinki', alts: ['helsinki'] },
    { country: 'Portugal', capital: 'Lisbon', alts: ['lisbon', 'lisboa'] },
    { country: 'Greece', capital: 'Athens', alts: ['athens', 'athina'] },
    { country: 'Switzerland', capital: 'Bern', alts: ['bern', 'berne'] },
    { country: 'Austria', capital: 'Vienna', alts: ['vienna', 'wien'] },
    { country: 'Czech Republic', capital: 'Prague', alts: ['prague', 'praha'] },
    { country: 'Ireland', capital: 'Dublin', alts: ['dublin'] },
    { country: 'Romania', capital: 'Bucharest', alts: ['bucharest', 'bucuresti', 'bucurești'] },
    { country: 'Hungary', capital: 'Budapest', alts: ['budapest'] },
    { country: 'Ukraine', capital: 'Kyiv', alts: ['kyiv', 'kiev'] },
    { country: 'Colombia', capital: 'Bogota', alts: ['bogota', 'bogotá'] },
    { country: 'Peru', capital: 'Lima', alts: ['lima'] },
    { country: 'Chile', capital: 'Santiago', alts: ['santiago'] },
    { country: 'Venezuela', capital: 'Caracas', alts: ['caracas'] },
    { country: 'Cuba', capital: 'Havana', alts: ['havana', 'habana', 'la habana'] },
    { country: 'New Zealand', capital: 'Wellington', alts: ['wellington'] },
    { country: 'Nigeria', capital: 'Abuja', alts: ['abuja'] },
    { country: 'Kenya', capital: 'Nairobi', alts: ['nairobi'] },
    { country: 'Morocco', capital: 'Rabat', alts: ['rabat'] },
    { country: 'Saudi Arabia', capital: 'Riyadh', alts: ['riyadh'] },
    { country: 'Israel', capital: 'Jerusalem', alts: ['jerusalem', 'tel aviv'] },
    { country: 'Iran', capital: 'Tehran', alts: ['tehran', 'teheran'] },
    { country: 'Iraq', capital: 'Baghdad', alts: ['baghdad'] },
    { country: 'Pakistan', capital: 'Islamabad', alts: ['islamabad'] },
    { country: 'Bangladesh', capital: 'Dhaka', alts: ['dhaka', 'dacca'] },
    { country: 'Ethiopia', capital: 'Addis Ababa', alts: ['addis ababa'] },
    { country: 'Tanzania', capital: 'Dodoma', alts: ['dodoma'] },
    { country: 'Croatia', capital: 'Zagreb', alts: ['zagreb'] },
    { country: 'Serbia', capital: 'Belgrade', alts: ['belgrade', 'beograd'] },
    { country: 'Iceland', capital: 'Reykjavik', alts: ['reykjavik', 'reykjavík'] },
    { country: 'Jamaica', capital: 'Kingston', alts: ['kingston'] },
    { country: 'Nepal', capital: 'Kathmandu', alts: ['kathmandu', 'katmandu'] },
    { country: 'Mongolia', capital: 'Ulaanbaatar', alts: ['ulaanbaatar', 'ulan bator'] },
    { country: 'North Korea', capital: 'Pyongyang', alts: ['pyongyang'] },
];

const CapitalRush = {
    canvas: null, ctx: null, ui: null,
    score: 0, lives: 3, streak: 0, bestStreak: 0,
    input: '', gameOver: false, paused: false, animFrame: null,
    currentCountry: null, currentAnswer: '',
    timerMax: 15000, timerLeft: 0, timerStart: 0,
    feedback: null, feedbackTimer: 0,
    cursorBlink: 0, cursorVisible: true,
    usedIndices: [], questionsAnswered: 0,
    comboMultiplier: 1,
    particles: [],
    shakeTimer: 0, shakeIntensity: 0,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        this.score = 0; this.lives = 3; this.streak = 0; this.bestStreak = 0;
        this.input = ''; this.gameOver = false; this.paused = false;
        this.timerMax = 15000; this.questionsAnswered = 0;
        this.feedback = null; this.feedbackTimer = 0;
        this.usedIndices = []; this.comboMultiplier = 1;
        this.particles = []; this.shakeTimer = 0;
        this.ui.setScore(0); this.ui.hideGameOver();
        this.nextQuestion();
        this.lastTime = performance.now();
        this.loop();
    },

    getTimerForQuestion() {
        // Start at 15s, decrease by 0.5s every 3 questions, min 8s
        const reduction = Math.floor(this.questionsAnswered / 3) * 500;
        return Math.max(8000, 15000 - reduction);
    },

    nextQuestion() {
        if (this.usedIndices.length >= COUNTRIES.length) {
            this.usedIndices = [];
        }
        let idx;
        do {
            idx = Math.floor(Math.random() * COUNTRIES.length);
        } while (this.usedIndices.includes(idx));
        this.usedIndices.push(idx);

        this.currentCountry = COUNTRIES[idx];
        this.currentAnswer = '';
        this.input = '';
        this.timerMax = this.getTimerForQuestion();
        this.timerLeft = this.timerMax;
        this.timerStart = performance.now();
    },

    checkAnswer(typed) {
        const normalized = typed.trim().toLowerCase();
        if (!normalized) return false;
        return this.currentCountry.alts.some(alt => alt === normalized);
    },

    submitAnswer() {
        if (this.gameOver || this.paused || !this.currentCountry) return;

        const correct = this.checkAnswer(this.input);
        if (correct) {
            this.streak++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
            this.comboMultiplier = Math.min(5, 1 + Math.floor(this.streak / 3));
            const points = 10 * this.comboMultiplier;
            this.score += points;
            this.questionsAnswered++;
            this.ui.setScore(this.score);
            this.feedback = { correct: true, text: `+${points} pts!`, answer: this.currentCountry.capital, timer: 90 };
            this.spawnParticles(this.ui.canvasW / 2, 200, '#00e676', 12);
        } else {
            this.feedback = { correct: false, text: this.currentCountry.capital, answer: this.currentCountry.capital, timer: 120 };
            this.streak = 0;
            this.comboMultiplier = 1;
            this.lives--;
            this.shakeTimer = 15;
            this.shakeIntensity = 4;
            if (this.lives <= 0) {
                this.endGame();
                return;
            }
        }
        this.feedbackTimer = this.feedback.timer;
        this.nextQuestion();
    },

    handleTimeout() {
        if (this.gameOver || this.paused) return;
        this.feedback = { correct: false, text: this.currentCountry.capital, answer: this.currentCountry.capital, timer: 120, timeout: true };
        this.feedbackTimer = 120;
        this.streak = 0;
        this.comboMultiplier = 1;
        this.lives--;
        this.shakeTimer = 15;
        this.shakeIntensity = 4;
        if (this.lives <= 0) {
            this.endGame();
            return;
        }
        this.nextQuestion();
    },

    endGame() {
        this.gameOver = true;
        const best = this.ui.getHighScore();
        if (this.score > best) this.ui.setHighScore(this.score);
        this.ui.showGameOver(this.score, Math.max(this.score, best));
    },

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 40 + Math.random() * 20,
                maxLife: 60,
                color,
                size: 3 + Math.random() * 3
            });
        }
    },

    handleKey(e) {
        if (this.gameOver) return;

        if (e.key === 'p' || e.key === 'P') {
            if (this.paused) this.resume(); else this.pause();
            return;
        }
        if (this.paused) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            this.submitAnswer();
            return;
        }
        if (e.key === 'Backspace') {
            e.preventDefault();
            this.input = this.input.slice(0, -1);
            return;
        }
        // Only accept printable characters
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            this.input += e.key;
        }
    },

    loop() {
        if (this.gameOver) return;
        const now = performance.now();
        const dt = now - this.lastTime;
        this.lastTime = now;

        if (!this.paused) {
            this.update(dt, now);
        }
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update(dt, now) {
        // Update timer
        const elapsed = now - this.timerStart;
        this.timerLeft = Math.max(0, this.timerMax - elapsed);
        if (this.timerLeft <= 0) {
            this.handleTimeout();
        }

        // Cursor blink
        this.cursorBlink += dt;
        if (this.cursorBlink > 530) {
            this.cursorBlink = 0;
            this.cursorVisible = !this.cursorVisible;
        }

        // Feedback timer
        if (this.feedbackTimer > 0) this.feedbackTimer--;

        // Shake
        if (this.shakeTimer > 0) this.shakeTimer--;

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        ctx.save();

        // Screen shake
        if (this.shakeTimer > 0) {
            const sx = (Math.random() - 0.5) * this.shakeIntensity;
            const sy = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(sx, sy);
        }

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Subtle gradient overlay
        const grad = ctx.createRadialGradient(W / 2, 100, 50, W / 2, 100, 400);
        grad.addColorStop(0, 'rgba(0, 212, 255, 0.03)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        if (this.paused) {
            this.renderPaused(ctx, W, H);
            ctx.restore();
            return;
        }

        // Timer bar
        this.renderTimerBar(ctx, W);

        // Lives
        this.renderLives(ctx, W);

        // Streak and combo
        this.renderStreak(ctx, W);

        // Country name
        this.renderCountry(ctx, W);

        // Input field
        this.renderInput(ctx, W, H);

        // Feedback
        if (this.feedbackTimer > 0 && this.feedback) {
            this.renderFeedback(ctx, W);
        }

        // Score display
        this.renderScore(ctx, W);

        // Particles
        this.renderParticles(ctx);

        // Instructions
        ctx.fillStyle = 'rgba(136, 136, 160, 0.5)';
        ctx.font = '13px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Type the capital city and press Enter  |  P to pause', W / 2, H - 20);

        ctx.restore();
    },

    renderTimerBar(ctx, W) {
        const barY = 22;
        const barW = W - 80;
        const barH = 8;
        const barX = 40;
        const ratio = this.timerLeft / this.timerMax;

        // Background bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.fill();

        // Timer fill
        let color;
        if (ratio > 0.5) color = '#00e676';
        else if (ratio > 0.25) color = '#ffd60a';
        else color = '#ff2d7b';

        if (ratio > 0) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW * ratio, barH, 4);
            ctx.fill();

            // Glow
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW * ratio, barH, 4);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Timer text
        ctx.fillStyle = '#8888a0';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(this.timerLeft / 1000) + 's', W / 2, barY - 4);
    },

    renderLives(ctx, W) {
        ctx.font = '20px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        let hearts = '';
        for (let i = 0; i < 3; i++) {
            hearts += i < this.lives ? '\u2764\ufe0f' : '\ud83e\udda9';
        }
        // Use simple text for lives
        ctx.fillStyle = '#e8e8f0';
        ctx.font = '16px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Lives: ', 40, 60);
        for (let i = 0; i < 3; i++) {
            if (i < this.lives) {
                ctx.fillStyle = '#ff2d7b';
                ctx.beginPath();
                const hx = 95 + i * 28;
                const hy = 53;
                // Draw a heart shape
                ctx.moveTo(hx, hy + 5);
                ctx.bezierCurveTo(hx, hy, hx - 8, hy - 2, hx - 8, hy + 5);
                ctx.bezierCurveTo(hx - 8, hy + 11, hx, hy + 16, hx, hy + 18);
                ctx.bezierCurveTo(hx, hy + 16, hx + 8, hy + 11, hx + 8, hy + 5);
                ctx.bezierCurveTo(hx + 8, hy - 2, hx, hy, hx, hy + 5);
                ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                ctx.beginPath();
                const hx = 95 + i * 28;
                const hy = 53;
                ctx.moveTo(hx, hy + 5);
                ctx.bezierCurveTo(hx, hy, hx - 8, hy - 2, hx - 8, hy + 5);
                ctx.bezierCurveTo(hx - 8, hy + 11, hx, hy + 16, hx, hy + 18);
                ctx.bezierCurveTo(hx, hy + 16, hx + 8, hy + 11, hx + 8, hy + 5);
                ctx.bezierCurveTo(hx + 8, hy - 2, hx, hy, hx, hy + 5);
                ctx.fill();
            }
        }
    },

    renderStreak(ctx, W) {
        ctx.textAlign = 'right';
        if (this.streak > 0) {
            let streakText = `Streak: ${this.streak}`;
            if (this.streak >= 10) streakText += ' \ud83d\udd25\ud83d\udd25\ud83d\udd25';
            else if (this.streak >= 5) streakText += ' \ud83d\udd25\ud83d\udd25';
            else if (this.streak >= 3) streakText += ' \ud83d\udd25';

            ctx.fillStyle = '#ffd60a';
            ctx.font = 'bold 16px "Outfit", sans-serif';
            ctx.fillText(streakText, W - 40, 55);
        }

        // Combo multiplier
        if (this.comboMultiplier > 1) {
            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 14px "JetBrains Mono", monospace';
            ctx.fillText(`x${this.comboMultiplier} COMBO`, W - 40, 75);
        }
    },

    renderCountry(ctx, W) {
        if (!this.currentCountry) return;

        // Label
        ctx.fillStyle = '#8888a0';
        ctx.font = '16px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('What is the capital of...', W / 2, 130);

        // Country name - large and prominent
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 38px "Outfit", sans-serif';
        ctx.textAlign = 'center';

        // Glow effect
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 15;
        ctx.fillText(this.currentCountry.country, W / 2, 185);
        ctx.shadowBlur = 0;

        // Question number
        ctx.fillStyle = '#8888a0';
        ctx.font = '13px "JetBrains Mono", monospace';
        ctx.fillText(`Question #${this.questionsAnswered + 1}`, W / 2, 215);
    },

    renderInput(ctx, W, H) {
        const inputX = W / 2;
        const inputY = 290;
        const inputW = 380;
        const inputH = 50;

        // Input box background
        ctx.fillStyle = '#12121a';
        ctx.strokeStyle = this.input.length > 0 ? '#00d4ff' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(inputX - inputW / 2, inputY - inputH / 2, inputW, inputH, 12);
        ctx.fill();
        ctx.stroke();

        // Input glow when typing
        if (this.input.length > 0) {
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#00d4ff';
            ctx.beginPath();
            ctx.roundRect(inputX - inputW / 2, inputY - inputH / 2, inputW, inputH, 12);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Typed text
        ctx.fillStyle = '#e8e8f0';
        ctx.font = '22px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        const textX = inputX - inputW / 2 + 18;
        const displayText = this.input;
        ctx.fillText(displayText, textX, inputY + 7);

        // Blinking cursor
        if (this.cursorVisible) {
            const textWidth = ctx.measureText(displayText).width;
            ctx.fillStyle = '#00d4ff';
            ctx.fillRect(textX + textWidth + 2, inputY - 14, 2, 28);
        }

        // Placeholder text
        if (this.input.length === 0) {
            ctx.fillStyle = 'rgba(136, 136, 160, 0.4)';
            ctx.font = '18px "Outfit", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Type the capital city...', textX, inputY + 6);
        }

        // Enter hint
        ctx.fillStyle = 'rgba(136, 136, 160, 0.4)';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('ENTER \u23ce', inputX + inputW / 2 - 14, inputY + 6);
    },

    renderFeedback(ctx, W) {
        const fb = this.feedback;
        const alpha = Math.min(1, this.feedbackTimer / 30);
        const y = 370;

        if (fb.correct) {
            ctx.fillStyle = `rgba(0, 230, 118, ${alpha})`;
            ctx.font = 'bold 22px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('\u2713 Correct! ' + fb.text, W / 2, y);
        } else {
            ctx.fillStyle = `rgba(255, 45, 123, ${alpha})`;
            ctx.font = 'bold 18px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            const label = fb.timeout ? '\u23f0 Time\'s up!' : '\u2717 Wrong!';
            ctx.fillText(label, W / 2, y);

            ctx.fillStyle = `rgba(232, 232, 240, ${alpha})`;
            ctx.font = '16px "Outfit", sans-serif';
            ctx.fillText('Answer: ' + fb.answer, W / 2, y + 28);
        }
    },

    renderScore(ctx, W) {
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Score: ${this.score}`, W / 2, 470);

        const best = this.ui.getHighScore();
        if (best > 0) {
            ctx.fillStyle = '#8888a0';
            ctx.font = '14px "JetBrains Mono", monospace';
            ctx.fillText(`Best: ${best}`, W / 2, 495);
        }

        // Best streak display
        if (this.bestStreak > 0) {
            ctx.fillStyle = '#ffd60a';
            ctx.font = '13px "Outfit", sans-serif';
            ctx.fillText(`Best Streak: ${this.bestStreak}`, W / 2, 520);
        }
    },

    renderParticles(ctx) {
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    renderPaused(ctx, W, H) {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 36px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', W / 2, H / 2 - 10);

        ctx.fillStyle = '#8888a0';
        ctx.font = '16px "Outfit", sans-serif';
        ctx.fillText('Press P to resume', W / 2, H / 2 + 25);
    },

    pause() {
        this.paused = true;
        this.pauseTimeElapsed = this.timerMax - this.timerLeft;
        this.ui.showPause();
    },

    resume() {
        this.paused = false;
        // Restore timer from where it was paused
        this.timerStart = performance.now() - this.pauseTimeElapsed;
        this.lastTime = performance.now();
        this.ui.hidePause();
    },

    reset() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
        this.gameOver = false;
        this.paused = false;
    },

    destroy() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default CapitalRush;
