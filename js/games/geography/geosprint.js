const GeoSprint = {
    canvas: null, ctx: null, ui: null,
    score: 0, lives: 3, streak: 0, bestStreak: 0,
    questionNum: 0, correctCount: 0,
    timeLeft: 0, maxTime: 10000,
    question: null, gameOver: false, paused: false,
    animFrame: null, startTime: 0,
    buttons: [], feedback: null, speedBonus: 0,
    particles: [],
    usedQuestions: [],

    // ── Country Data (50+ countries) ──────────────────────────────
    countries: [
        { name: "France", capital: "Paris", continent: "Europe", neighbors: ["Spain", "Germany", "Italy"], area: 41 },
        { name: "Germany", capital: "Berlin", continent: "Europe", neighbors: ["France", "Poland", "Austria"], area: 36 },
        { name: "Spain", capital: "Madrid", continent: "Europe", neighbors: ["France", "Portugal"], area: 30 },
        { name: "Italy", capital: "Rome", continent: "Europe", neighbors: ["France", "Switzerland", "Austria"], area: 43 },
        { name: "United Kingdom", capital: "London", continent: "Europe", neighbors: ["Ireland"], area: 50 },
        { name: "Portugal", capital: "Lisbon", continent: "Europe", neighbors: ["Spain"], area: 72 },
        { name: "Poland", capital: "Warsaw", continent: "Europe", neighbors: ["Germany", "Czech Republic", "Ukraine"], area: 38 },
        { name: "Austria", capital: "Vienna", continent: "Europe", neighbors: ["Germany", "Italy", "Switzerland"], area: 73 },
        { name: "Switzerland", capital: "Bern", continent: "Europe", neighbors: ["Germany", "France", "Italy", "Austria"], area: 99 },
        { name: "Netherlands", capital: "Amsterdam", continent: "Europe", neighbors: ["Germany", "Belgium"], area: 100 },
        { name: "Belgium", capital: "Brussels", continent: "Europe", neighbors: ["France", "Germany", "Netherlands"], area: 107 },
        { name: "Sweden", capital: "Stockholm", continent: "Europe", neighbors: ["Norway", "Finland"], area: 32 },
        { name: "Norway", capital: "Oslo", continent: "Europe", neighbors: ["Sweden", "Finland", "Russia"], area: 37 },
        { name: "Finland", capital: "Helsinki", continent: "Europe", neighbors: ["Sweden", "Norway", "Russia"], area: 35 },
        { name: "Greece", capital: "Athens", continent: "Europe", neighbors: ["Turkey", "Bulgaria", "Albania"], area: 60 },
        { name: "Czech Republic", capital: "Prague", continent: "Europe", neighbors: ["Germany", "Poland", "Austria"], area: 74 },
        { name: "Romania", capital: "Bucharest", continent: "Europe", neighbors: ["Hungary", "Ukraine", "Bulgaria"], area: 51 },
        { name: "Hungary", capital: "Budapest", continent: "Europe", neighbors: ["Austria", "Romania", "Slovakia"], area: 70 },
        { name: "Ireland", capital: "Dublin", continent: "Europe", neighbors: ["United Kingdom"], area: 82 },
        { name: "Denmark", capital: "Copenhagen", continent: "Europe", neighbors: ["Germany"], area: 97 },

        { name: "Russia", capital: "Moscow", continent: "Europe", neighbors: ["Finland", "China", "Mongolia"], area: 1 },
        { name: "China", capital: "Beijing", continent: "Asia", neighbors: ["Russia", "India", "Mongolia"], area: 3 },
        { name: "India", capital: "New Delhi", continent: "Asia", neighbors: ["China", "Pakistan", "Nepal"], area: 7 },
        { name: "Japan", capital: "Tokyo", continent: "Asia", neighbors: ["South Korea"], area: 36 },
        { name: "South Korea", capital: "Seoul", continent: "Asia", neighbors: ["North Korea"], area: 69 },
        { name: "Thailand", capital: "Bangkok", continent: "Asia", neighbors: ["Myanmar", "Laos", "Cambodia"], area: 29 },
        { name: "Vietnam", capital: "Hanoi", continent: "Asia", neighbors: ["China", "Laos", "Cambodia"], area: 34 },
        { name: "Indonesia", capital: "Jakarta", continent: "Asia", neighbors: ["Malaysia", "Papua New Guinea"], area: 8 },
        { name: "Philippines", capital: "Manila", continent: "Asia", neighbors: ["Indonesia"], area: 42 },
        { name: "Pakistan", capital: "Islamabad", continent: "Asia", neighbors: ["India", "China", "Iran"], area: 22 },
        { name: "Turkey", capital: "Ankara", continent: "Asia", neighbors: ["Greece", "Syria", "Iran"], area: 20 },
        { name: "Saudi Arabia", capital: "Riyadh", continent: "Asia", neighbors: ["Iraq", "Jordan", "Yemen"], area: 6 },
        { name: "Iran", capital: "Tehran", continent: "Asia", neighbors: ["Turkey", "Iraq", "Pakistan"], area: 11 },
        { name: "Iraq", capital: "Baghdad", continent: "Asia", neighbors: ["Iran", "Turkey", "Saudi Arabia"], area: 33 },
        { name: "Israel", capital: "Jerusalem", continent: "Asia", neighbors: ["Egypt", "Jordan", "Lebanon"], area: 109 },
        { name: "Mongolia", capital: "Ulaanbaatar", continent: "Asia", neighbors: ["Russia", "China"], area: 10 },

        { name: "United States", capital: "Washington D.C.", continent: "North America", neighbors: ["Canada", "Mexico"], area: 4 },
        { name: "Canada", capital: "Ottawa", continent: "North America", neighbors: ["United States"], area: 2 },
        { name: "Mexico", capital: "Mexico City", continent: "North America", neighbors: ["United States", "Guatemala"], area: 9 },
        { name: "Cuba", capital: "Havana", continent: "North America", neighbors: ["Jamaica", "Haiti"], area: 65 },

        { name: "Brazil", capital: "Brasilia", continent: "South America", neighbors: ["Argentina", "Colombia", "Peru"], area: 5 },
        { name: "Argentina", capital: "Buenos Aires", continent: "South America", neighbors: ["Brazil", "Chile", "Uruguay"], area: 13 },
        { name: "Colombia", capital: "Bogota", continent: "South America", neighbors: ["Brazil", "Peru", "Venezuela"], area: 16 },
        { name: "Peru", capital: "Lima", continent: "South America", neighbors: ["Brazil", "Colombia", "Chile"], area: 14 },
        { name: "Chile", capital: "Santiago", continent: "South America", neighbors: ["Argentina", "Peru", "Bolivia"], area: 21 },
        { name: "Venezuela", capital: "Caracas", continent: "South America", neighbors: ["Colombia", "Brazil", "Guyana"], area: 24 },

        { name: "Egypt", capital: "Cairo", continent: "Africa", neighbors: ["Libya", "Sudan", "Israel"], area: 17 },
        { name: "South Africa", capital: "Pretoria", continent: "Africa", neighbors: ["Namibia", "Botswana", "Mozambique"], area: 15 },
        { name: "Nigeria", capital: "Abuja", continent: "Africa", neighbors: ["Cameroon", "Niger", "Benin"], area: 19 },
        { name: "Kenya", capital: "Nairobi", continent: "Africa", neighbors: ["Tanzania", "Uganda", "Ethiopia"], area: 28 },
        { name: "Ethiopia", capital: "Addis Ababa", continent: "Africa", neighbors: ["Kenya", "Sudan", "Somalia"], area: 18 },
        { name: "Morocco", capital: "Rabat", continent: "Africa", neighbors: ["Algeria", "Mauritania"], area: 31 },
        { name: "Tanzania", capital: "Dodoma", continent: "Africa", neighbors: ["Kenya", "Uganda", "Mozambique"], area: 23 },
        { name: "Algeria", capital: "Algiers", continent: "Africa", neighbors: ["Morocco", "Tunisia", "Libya"], area: 12 },
        { name: "Ghana", capital: "Accra", continent: "Africa", neighbors: ["Ivory Coast", "Togo", "Burkina Faso"], area: 47 },

        { name: "Australia", capital: "Canberra", continent: "Oceania", neighbors: ["Papua New Guinea", "Indonesia"], area: 6 },
        { name: "New Zealand", capital: "Wellington", continent: "Oceania", neighbors: ["Australia"], area: 46 },
    ],

    continents: ["Europe", "Asia", "North America", "South America", "Africa", "Oceania"],

    questionTypes: [
        { id: "capital_of", label: "CAPITAL CITY", color: "#00d4ff" },
        { id: "continent_of", label: "CONTINENT", color: "#ff2d7b" },
        { id: "country_of_capital", label: "COUNTRY ID", color: "#ffd60a" },
        { id: "borders", label: "BORDERS", color: "#00e676" },
        { id: "larger_area", label: "AREA COMPARE", color: "#b388ff" },
    ],

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
    },

    start() {
        this.score = 0;
        this.lives = 3;
        this.streak = 0;
        this.bestStreak = 0;
        this.questionNum = 0;
        this.correctCount = 0;
        this.maxTime = 10000;
        this.gameOver = false;
        this.paused = false;
        this.feedback = null;
        this.particles = [];
        this.usedQuestions = [];
        this.ui.setScore(0);
        this.ui.hideGameOver();
        this.nextQuestion();
        this.loop();
    },

    // ── Question Generation ──────────────────────────────────────

    _pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    },

    _getDistractors(correct, pool, count) {
        const filtered = pool.filter(x => x !== correct);
        return this._shuffle(filtered).slice(0, count);
    },

    nextQuestion() {
        this.questionNum++;
        const typeIdx = Math.floor(Math.random() * this.questionTypes.length);
        const type = this.questionTypes[typeIdx];
        let q = null;
        let attempts = 0;

        while (!q && attempts < 50) {
            attempts++;
            q = this._generateQuestion(type);
        }

        if (!q) {
            // Fallback to capital_of
            q = this._generateQuestion(this.questionTypes[0]);
        }

        this.question = q;
        this.startTime = performance.now();
        this.timeLeft = this.maxTime;
        this.buttons = this._buildButtons(q.choices);
        this.speedBonus = 0;
    },

    _generateQuestion(type) {
        const c = this._pick(this.countries);

        switch (type.id) {
            case "capital_of": {
                const distractors = this._getDistractors(
                    c.capital,
                    this.countries.map(x => x.capital),
                    3
                );
                const choices = this._shuffle([c.capital, ...distractors]);
                return {
                    type,
                    text: `What is the capital of ${c.name}?`,
                    choices,
                    answer: c.capital,
                };
            }
            case "continent_of": {
                const distractors = this._getDistractors(c.continent, this.continents, 3);
                const choices = this._shuffle([c.continent, ...distractors]);
                return {
                    type,
                    text: `Which continent is ${c.name} in?`,
                    choices,
                    answer: c.continent,
                };
            }
            case "country_of_capital": {
                const distractors = this._getDistractors(
                    c.name,
                    this.countries.map(x => x.name),
                    3
                );
                const choices = this._shuffle([c.name, ...distractors]);
                return {
                    type,
                    text: `${c.capital} is the capital of?`,
                    choices,
                    answer: c.name,
                };
            }
            case "borders": {
                if (!c.neighbors || c.neighbors.length === 0) return null;
                const correctNeighbor = this._pick(c.neighbors);
                const allNames = this.countries.map(x => x.name);
                const distractors = this._getDistractors(
                    correctNeighbor,
                    allNames.filter(n => !c.neighbors.includes(n) && n !== c.name),
                    3
                );
                if (distractors.length < 3) return null;
                const choices = this._shuffle([correctNeighbor, ...distractors]);
                return {
                    type,
                    text: `Which country borders ${c.name}?`,
                    choices,
                    answer: correctNeighbor,
                };
            }
            case "larger_area": {
                let other = this._pick(this.countries);
                let tries = 0;
                while (other.name === c.name && tries < 20) {
                    other = this._pick(this.countries);
                    tries++;
                }
                if (other.name === c.name) return null;
                // Lower area rank = larger country
                const larger = c.area < other.area ? c : other;
                const choices = this._shuffle([c.name, other.name]);
                return {
                    type,
                    text: `Which is larger by area?`,
                    choices,
                    answer: larger.name,
                };
            }
        }
        return null;
    },

    _buildButtons(choices) {
        const W = this.ui.canvasW;
        const count = choices.length;
        const btnH = 52;
        const gap = 12;

        if (count === 2) {
            const btnW = 300;
            const startY = 400;
            return choices.map((label, i) => ({
                label,
                x: W / 2 - btnW / 2,
                y: startY + i * (btnH + gap),
                w: btnW,
                h: btnH,
                hover: false,
            }));
        }

        // 4 choices: 2x2 grid
        const btnW = 340;
        const cols = 1;
        const startX = (W - btnW) / 2;
        const startY = 340;
        return choices.map((label, i) => ({
            label,
            x: startX,
            y: startY + i * (btnH + gap),
            w: btnW,
            h: btnH,
            hover: false,
        }));
    },

    // ── Input Handling ───────────────────────────────────────────

    handleKey(e) {
        if (this.gameOver) return;
        if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            if (this.paused) this.resume();
            else this.pause();
            return;
        }
        if (this.paused || this.feedback) return;

        const num = parseInt(e.key);
        if (num >= 1 && num <= this.buttons.length) {
            e.preventDefault();
            this._selectAnswer(this.buttons[num - 1].label);
        }
    },

    handleClick(e) {
        if (this.gameOver || this.paused || this.feedback) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        this._checkButtonHit(x, y);
    },

    handleTouch(e) {
        e.preventDefault();
        if (this.gameOver || this.paused || this.feedback) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const t = e.touches[0];
        const x = (t.clientX - rect.left) * scaleX;
        const y = (t.clientY - rect.top) * scaleY;
        this._checkButtonHit(x, y);
    },

    _checkButtonHit(x, y) {
        for (const btn of this.buttons) {
            if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                this._selectAnswer(btn.label);
                return;
            }
        }
    },

    _selectAnswer(choice) {
        if (!this.question || this.feedback) return;

        const elapsed = performance.now() - this.startTime;
        const correct = choice === this.question.answer;

        if (correct) {
            // Speed bonus: faster = more points (max ~5 bonus for very fast)
            const timeRatio = 1 - (elapsed / this.maxTime);
            this.speedBonus = Math.max(0, Math.floor(timeRatio * 5));
            const basePoints = 1;
            const streakBonus = Math.floor(this.streak / 5);
            const points = basePoints + this.speedBonus + streakBonus;
            this.score += points;
            this.streak++;
            this.correctCount++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
            this.ui.setScore(this.score);

            // Decrease timer every 5 correct
            if (this.correctCount % 5 === 0 && this.maxTime > 4000) {
                this.maxTime -= 300;
            }

            this._spawnParticles(this.ui.canvasW / 2, 280, this.question.type.color);
            this.feedback = { correct: true, timer: 40, points, choice };
        } else {
            this.lives--;
            this.streak = 0;
            this.feedback = { correct: false, timer: 60, correctAnswer: this.question.answer, choice };

            if (this.lives <= 0) {
                this.gameOver = true;
                const best = this.ui.getHighScore();
                if (this.score > best) this.ui.setHighScore(this.score);
                this.ui.showGameOver(this.score, Math.max(this.score, best));
            }
        }
    },

    // ── Particles ────────────────────────────────────────────────

    _spawnParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 20,
                maxLife: 50,
                color,
                size: 3 + Math.random() * 3,
            });
        }
    },

    _updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    // ── Game Loop ────────────────────────────────────────────────

    loop() {
        if (this.gameOver && !this.feedback) {
            this.render();
            return;
        }
        this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        if (this.paused) return;

        this._updateParticles();

        if (this.feedback) {
            this.feedback.timer--;
            if (this.feedback.timer <= 0) {
                if (this.gameOver) {
                    this.feedback = null;
                    this.render();
                    return;
                }
                this.feedback = null;
                this.nextQuestion();
            }
            return;
        }

        const elapsed = performance.now() - this.startTime;
        this.timeLeft = Math.max(0, this.maxTime - elapsed);

        if (this.timeLeft <= 0) {
            // Time ran out - counts as wrong
            this.lives--;
            this.streak = 0;
            this.feedback = { correct: false, timer: 60, correctAnswer: this.question.answer, choice: null };

            if (this.lives <= 0) {
                this.gameOver = true;
                const best = this.ui.getHighScore();
                if (this.score > best) this.ui.setHighScore(this.score);
                this.ui.showGameOver(this.score, Math.max(this.score, best));
            }
        }
    },

    // ── Rendering ────────────────────────────────────────────────

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Subtle grid pattern
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        if (this.paused) {
            this._renderPauseOverlay(ctx, W, H);
            return;
        }

        if (!this.question) return;

        // ── Top bar: Lives, Score, Streak, Question # ──
        this._renderTopBar(ctx, W);

        // ── Timer bar ──
        this._renderTimerBar(ctx, W);

        // ── Question type badge ──
        this._renderBadge(ctx, W);

        // ── Question text ──
        this._renderQuestion(ctx, W);

        // ── Answer buttons ──
        this._renderButtons(ctx);

        // ── Speed bonus indicator ──
        if (this.feedback && this.feedback.correct && this.speedBonus > 0) {
            ctx.save();
            ctx.font = 'bold 18px "Outfit", sans-serif';
            ctx.fillStyle = '#ffd60a';
            ctx.textAlign = 'center';
            const alpha = Math.min(1, this.feedback.timer / 20);
            ctx.globalAlpha = alpha;
            ctx.fillText(`SPEED +${this.speedBonus}`, W / 2, 310);
            ctx.restore();
        }

        // ── Feedback overlay ──
        if (this.feedback) {
            this._renderFeedback(ctx, W, H);
        }

        // ── Particles ──
        this._renderParticles(ctx);

        // ── Key hints ──
        ctx.save();
        ctx.font = '12px "Outfit", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.textAlign = 'center';
        const hintY = H - 12;
        const keyCount = this.question.choices.length;
        const keys = keyCount === 2 ? "Keys: 1-2" : "Keys: 1-4";
        ctx.fillText(`${keys}  |  P to pause`, W / 2, hintY);
        ctx.restore();
    },

    _renderTopBar(ctx, W) {
        const y = 20;

        // Lives (hearts)
        ctx.save();
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'left';
        let heartsStr = '';
        for (let i = 0; i < 3; i++) {
            heartsStr += i < this.lives ? '\u2764' : '\u2661';
        }
        ctx.fillStyle = this.lives <= 1 ? '#ff2d7b' : '#e8e8f0';
        ctx.fillText(heartsStr, 20, y + 6);
        ctx.restore();

        // Question counter
        ctx.save();
        ctx.font = '14px "Outfit", sans-serif';
        ctx.fillStyle = '#8888a0';
        ctx.textAlign = 'center';
        ctx.fillText(`Q${this.questionNum}`, W / 2, y + 4);
        ctx.restore();

        // Streak
        ctx.save();
        ctx.textAlign = 'right';
        if (this.streak > 0) {
            ctx.font = 'bold 18px "Outfit", sans-serif';
            const glow = this.streak >= 10 ? '#ffd60a' : this.streak >= 5 ? '#ff6b35' : '#ff9500';
            ctx.fillStyle = glow;
            ctx.fillText(`\uD83D\uDD25 ${this.streak}`, W - 20, y + 6);
        }
        ctx.restore();
    },

    _renderTimerBar(ctx, W) {
        const barY = 42;
        const barH = 6;
        const barW = W - 40;
        const ratio = this.timeLeft / this.maxTime;

        // Background
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        this._roundRect(ctx, 20, barY, barW, barH, 3);
        ctx.fill();

        // Fill
        const color = ratio > 0.5 ? '#00e676' : ratio > 0.25 ? '#ffd60a' : '#ff2d7b';
        ctx.fillStyle = color;
        this._roundRect(ctx, 20, barY, barW * ratio, barH, 3);
        ctx.fill();

        // Time text
        ctx.save();
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillStyle = '#8888a0';
        ctx.textAlign = 'right';
        ctx.fillText(`${(this.timeLeft / 1000).toFixed(1)}s`, W - 20, barY + barH + 16);
        ctx.restore();
    },

    _renderBadge(ctx, W) {
        if (!this.question) return;
        const type = this.question.type;
        const text = type.label;
        ctx.save();
        ctx.font = 'bold 11px "Outfit", sans-serif';
        const textW = ctx.measureText(text).width;
        const badgeW = textW + 20;
        const badgeH = 24;
        const bx = W / 2 - badgeW / 2;
        const by = 78;

        ctx.fillStyle = type.color + '22';
        this._roundRect(ctx, bx, by, badgeW, badgeH, 12);
        ctx.fill();
        ctx.strokeStyle = type.color + '66';
        ctx.lineWidth = 1;
        this._roundRect(ctx, bx, by, badgeW, badgeH, 12);
        ctx.stroke();

        ctx.fillStyle = type.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, W / 2, by + badgeH / 2);
        ctx.restore();
    },

    _renderQuestion(ctx, W) {
        if (!this.question) return;
        ctx.save();
        ctx.font = 'bold 22px "Outfit", sans-serif';
        ctx.fillStyle = '#e8e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Word wrap
        const maxW = W - 60;
        const text = this.question.text;
        const words = text.split(' ');
        let lines = [];
        let line = '';
        for (const word of words) {
            const test = line ? line + ' ' + word : word;
            if (ctx.measureText(test).width > maxW) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        }
        lines.push(line);

        const lineH = 30;
        const startY = 140 - ((lines.length - 1) * lineH) / 2;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], W / 2, startY + i * lineH);
        }
        ctx.restore();
    },

    _renderButtons(ctx) {
        if (!this.question) return;

        for (let i = 0; i < this.buttons.length; i++) {
            const btn = this.buttons[i];
            const isCorrectFeedback = this.feedback && btn.label === this.question.answer;
            const isWrongFeedback = this.feedback && !this.feedback.correct && btn.label === this.feedback.choice;

            // Button background
            if (isCorrectFeedback) {
                ctx.fillStyle = 'rgba(0,230,118,0.25)';
                ctx.strokeStyle = '#00e676';
            } else if (isWrongFeedback) {
                ctx.fillStyle = 'rgba(255,45,123,0.25)';
                ctx.strokeStyle = '#ff2d7b';
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            }

            ctx.lineWidth = 1.5;
            this._roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
            ctx.fill();
            this._roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
            ctx.stroke();

            // Number key hint
            ctx.save();
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${i + 1}`, btn.x + 12, btn.y + btn.h / 2);
            ctx.restore();

            // Label
            ctx.save();
            ctx.font = '16px "Outfit", sans-serif';
            if (isCorrectFeedback) ctx.fillStyle = '#00e676';
            else if (isWrongFeedback) ctx.fillStyle = '#ff2d7b';
            else ctx.fillStyle = '#e8e8f0';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
            ctx.restore();
        }
    },

    _renderFeedback(ctx, W, H) {
        if (!this.feedback) return;
        ctx.save();

        if (this.feedback.correct) {
            // Flash green border
            const alpha = Math.min(0.3, this.feedback.timer / 40 * 0.3);
            ctx.strokeStyle = `rgba(0,230,118,${alpha})`;
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, W - 4, H - 4);

            ctx.font = 'bold 28px "Outfit", sans-serif';
            ctx.fillStyle = '#00e676';
            ctx.textAlign = 'center';
            const floatY = 200 - (40 - this.feedback.timer) * 0.5;
            ctx.globalAlpha = Math.min(1, this.feedback.timer / 15);
            ctx.fillText(`+${this.feedback.points}`, W / 2, floatY);
        } else {
            // Flash red border
            const alpha = Math.min(0.3, this.feedback.timer / 60 * 0.3);
            ctx.strokeStyle = `rgba(255,45,123,${alpha})`;
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, W - 4, H - 4);

            if (this.feedback.choice === null) {
                ctx.font = 'bold 22px "Outfit", sans-serif';
                ctx.fillStyle = '#ff2d7b';
                ctx.textAlign = 'center';
                ctx.fillText("TIME'S UP!", W / 2, 210);
            }

            // Show correct answer
            ctx.font = '15px "Outfit", sans-serif';
            ctx.fillStyle = '#8888a0';
            ctx.textAlign = 'center';
            ctx.fillText(`Correct: ${this.feedback.correctAnswer}`, W / 2, 240);
        }

        ctx.restore();
    },

    _renderParticles(ctx) {
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },

    _renderPauseOverlay(ctx, W, H) {
        ctx.fillStyle = 'rgba(10,10,15,0.85)';
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.font = 'bold 36px "Outfit", sans-serif';
        ctx.fillStyle = '#e8e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', W / 2, H / 2 - 20);

        ctx.font = '16px "Outfit", sans-serif';
        ctx.fillStyle = '#8888a0';
        ctx.fillText('Press P to resume', W / 2, H / 2 + 20);
        ctx.restore();
    },

    // ── Utility ──────────────────────────────────────────────────

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

    // ── Lifecycle ────────────────────────────────────────────────

    pause() {
        this.paused = true;
        // Adjust startTime so timer doesn't run during pause
        this._pauseTime = performance.now();
        this.ui.showPause();
        this.render();
    },

    resume() {
        if (this._pauseTime) {
            const pauseDuration = performance.now() - this._pauseTime;
            this.startTime += pauseDuration;
        }
        this.paused = false;
        this.ui.hidePause();
    },

    reset() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
        this.start();
    },

    destroy() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
        document.removeEventListener('keydown', this.handleKey);
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.handleClick);
            this.canvas.removeEventListener('touchstart', this.handleTouch);
        }
    },
};

export default GeoSprint;
