const Neighbors = {
    canvas: null,
    ctx: null,
    ui: null,

    // Game state
    score: 0,
    lives: 3,
    round: 0,
    totalRounds: 10,
    paused: false,
    gameOver: false,
    timerRunning: false,

    // Timer
    timeLimit: 15000,
    timeRemaining: 15000,
    lastTimestamp: 0,
    animFrameId: null,

    // Round state
    currentCountry: null,
    currentNeighbors: [],
    options: [],
    selected: [],       // indices the player clicked
    flashIndex: -1,     // index flashing red on wrong click
    flashTimer: 0,
    roundComplete: false,
    roundResultTimer: 0,
    showingResults: false,

    // Button layout
    buttons: [],
    cols: 3,
    rows: 4,

    // Bound handlers
    _onClick: null,
    _onKey: null,
    _onTouch: null,

    // Country data: name -> list of neighbors
    countryData: {
        'France': ['Spain', 'Germany', 'Italy', 'Belgium', 'Switzerland', 'Luxembourg', 'Andorra', 'Monaco'],
        'Germany': ['France', 'Netherlands', 'Belgium', 'Luxembourg', 'Switzerland', 'Austria', 'Czech Republic', 'Poland', 'Denmark'],
        'Spain': ['France', 'Portugal', 'Andorra', 'Morocco', 'Gibraltar'],
        'Italy': ['France', 'Switzerland', 'Austria', 'Slovenia', 'San Marino', 'Vatican City'],
        'United Kingdom': ['Ireland'],
        'USA': ['Canada', 'Mexico'],
        'Canada': ['USA'],
        'Mexico': ['USA', 'Guatemala', 'Belize'],
        'China': ['Russia', 'Mongolia', 'North Korea', 'Vietnam', 'Laos', 'Myanmar', 'India', 'Nepal', 'Bhutan', 'Pakistan', 'Afghanistan', 'Tajikistan', 'Kyrgyzstan', 'Kazakhstan'],
        'India': ['Pakistan', 'China', 'Nepal', 'Bhutan', 'Bangladesh', 'Myanmar', 'Sri Lanka'],
        'Brazil': ['Argentina', 'Uruguay', 'Paraguay', 'Bolivia', 'Peru', 'Colombia', 'Venezuela', 'Guyana', 'Suriname', 'French Guiana'],
        'Russia': ['Norway', 'Finland', 'Estonia', 'Latvia', 'Lithuania', 'Poland', 'Belarus', 'Ukraine', 'Georgia', 'Azerbaijan', 'Kazakhstan', 'China', 'Mongolia', 'North Korea'],
        'Japan': ['Russia', 'South Korea', 'China'],
        'Australia': ['Papua New Guinea', 'Indonesia', 'East Timor'],
        'South Korea': ['North Korea'],
        'North Korea': ['South Korea', 'China', 'Russia'],
        'Turkey': ['Greece', 'Bulgaria', 'Georgia', 'Armenia', 'Iran', 'Iraq', 'Syria'],
        'Egypt': ['Libya', 'Sudan', 'Israel', 'Palestine'],
        'South Africa': ['Namibia', 'Botswana', 'Zimbabwe', 'Mozambique', 'Eswatini', 'Lesotho'],
        'Argentina': ['Chile', 'Bolivia', 'Paraguay', 'Brazil', 'Uruguay'],
        'Poland': ['Germany', 'Czech Republic', 'Slovakia', 'Ukraine', 'Belarus', 'Lithuania', 'Russia'],
        'Ukraine': ['Poland', 'Slovakia', 'Hungary', 'Romania', 'Moldova', 'Belarus', 'Russia'],
        'Thailand': ['Myanmar', 'Laos', 'Cambodia', 'Malaysia'],
        'Vietnam': ['China', 'Laos', 'Cambodia'],
        'Iran': ['Iraq', 'Turkey', 'Armenia', 'Azerbaijan', 'Turkmenistan', 'Afghanistan', 'Pakistan'],
        'Saudi Arabia': ['Jordan', 'Iraq', 'Kuwait', 'Qatar', 'UAE', 'Oman', 'Yemen'],
        'Pakistan': ['India', 'China', 'Afghanistan', 'Iran'],
        'Afghanistan': ['Pakistan', 'Iran', 'Turkmenistan', 'Uzbekistan', 'Tajikistan', 'China'],
        'Kenya': ['Ethiopia', 'Somalia', 'South Sudan', 'Uganda', 'Tanzania'],
        'Nigeria': ['Benin', 'Niger', 'Chad', 'Cameroon'],
        'Ethiopia': ['Eritrea', 'Djibouti', 'Somalia', 'Kenya', 'South Sudan', 'Sudan'],
        'Peru': ['Ecuador', 'Colombia', 'Brazil', 'Bolivia', 'Chile'],
        'Colombia': ['Venezuela', 'Brazil', 'Peru', 'Ecuador', 'Panama'],
        'Sweden': ['Norway', 'Finland', 'Denmark'],
        'Norway': ['Sweden', 'Finland', 'Russia'],
        'Austria': ['Germany', 'Czech Republic', 'Slovakia', 'Hungary', 'Slovenia', 'Italy', 'Switzerland', 'Liechtenstein'],
        'Switzerland': ['Germany', 'France', 'Italy', 'Austria', 'Liechtenstein'],
        'Greece': ['Albania', 'North Macedonia', 'Bulgaria', 'Turkey'],
        'Romania': ['Hungary', 'Serbia', 'Bulgaria', 'Ukraine', 'Moldova'],
        'Hungary': ['Austria', 'Slovakia', 'Ukraine', 'Romania', 'Serbia', 'Croatia', 'Slovenia'],
        'Czech Republic': ['Germany', 'Poland', 'Slovakia', 'Austria'],
        'Portugal': ['Spain'],
        'Mongolia': ['Russia', 'China'],
        'Tanzania': ['Kenya', 'Uganda', 'Rwanda', 'Burundi', 'Congo', 'Zambia', 'Malawi', 'Mozambique'],
        'Indonesia': ['Malaysia', 'Papua New Guinea', 'East Timor'],
    },

    // Pool of all country names for distractors
    allCountries: [],

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;

        // Build allCountries list
        const countrySet = new Set();
        for (const c of Object.keys(this.countryData)) {
            countrySet.add(c);
            for (const n of this.countryData[c]) {
                countrySet.add(n);
            }
        }
        this.allCountries = Array.from(countrySet);

        this._onClick = this._handleClick.bind(this);
        this._onKey = this._handleKey.bind(this);
        this._onTouch = this._handleTouch.bind(this);

        canvas.addEventListener('click', this._onClick);
        document.addEventListener('keydown', this._onKey);
        canvas.addEventListener('touchstart', this._onTouch, { passive: false });
    },

    start() {
        this.score = 0;
        this.lives = 3;
        this.round = 0;
        this.paused = false;
        this.gameOver = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.ui.setScore(0);
        this._nextRound();
    },

    _nextRound() {
        if (this.round >= this.totalRounds || this.lives <= 0) {
            this._endGame();
            return;
        }
        this.round++;
        this.roundComplete = false;
        this.showingResults = false;
        this.selected = [];
        this.flashIndex = -1;
        this.flashTimer = 0;
        this.timeRemaining = this.timeLimit;
        this.timerRunning = true;

        // Pick a random country
        const countries = Object.keys(this.countryData);
        this.currentCountry = countries[Math.floor(Math.random() * countries.length)];
        this.currentNeighbors = this.countryData[this.currentCountry].slice();

        // Build options: pick some actual neighbors (up to what fits) and fill rest with distractors
        const neighborsToShow = this.currentNeighbors.slice();
        this._shuffle(neighborsToShow);
        // Show at most 8 neighbors so there's room for distractors
        const maxNeighbors = Math.min(neighborsToShow.length, 8);
        const shownNeighbors = neighborsToShow.slice(0, maxNeighbors);

        // Get distractors
        const distractorCount = 12 - shownNeighbors.length;
        const distractors = this.allCountries.filter(c =>
            c !== this.currentCountry && !this.currentNeighbors.includes(c)
        );
        this._shuffle(distractors);
        const chosenDistractors = distractors.slice(0, distractorCount);

        this.options = [...shownNeighbors, ...chosenDistractors];
        this._shuffle(this.options);

        // Compute button positions
        this._computeButtons();

        this.lastTimestamp = performance.now();
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this._loop(performance.now());
    },

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    },

    _computeButtons() {
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const topMargin = 130;
        const bottomMargin = 60;
        const sideMargin = 30;
        const gap = 10;
        const gridW = W - sideMargin * 2;
        const gridH = H - topMargin - bottomMargin;
        const btnW = (gridW - gap * (this.cols - 1)) / this.cols;
        const btnH = (gridH - gap * (this.rows - 1)) / this.rows;

        this.buttons = [];
        for (let i = 0; i < 12; i++) {
            const col = i % this.cols;
            const row = Math.floor(i / this.cols);
            this.buttons.push({
                x: sideMargin + col * (btnW + gap),
                y: topMargin + row * (btnH + gap),
                w: btnW,
                h: btnH,
                label: this.options[i] || '',
            });
        }
    },

    _loop(timestamp) {
        if (this.gameOver) return;

        const dt = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        if (!this.paused) {
            this._update(dt);
        }
        this._render();

        this.animFrameId = requestAnimationFrame(this._loop.bind(this));
    },

    _update(dt) {
        // Flash timer
        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
            if (this.flashTimer <= 0) {
                this.flashIndex = -1;
            }
        }

        // Results display timer
        if (this.showingResults) {
            this.roundResultTimer -= dt;
            if (this.roundResultTimer <= 0) {
                this._nextRound();
            }
            return;
        }

        if (!this.timerRunning || this.roundComplete) return;

        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this._finishRound();
        }

        // Check if all neighbors in the grid have been selected
        const neighborsInGrid = this.options.filter(o => this.currentNeighbors.includes(o));
        const allFound = neighborsInGrid.every(n => this.selected.includes(this.options.indexOf(n)));
        if (allFound) {
            this._finishRound();
        }
    },

    _finishRound() {
        this.timerRunning = false;
        this.roundComplete = true;
        this.showingResults = true;
        this.roundResultTimer = 2000;
    },

    _handleClick(e) {
        if (this.gameOver || this.paused || this.showingResults) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        this._processClick(mx, my);
    },

    _handleTouch(e) {
        e.preventDefault();
        if (this.gameOver || this.paused || this.showingResults) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const touch = e.touches[0];
        const mx = (touch.clientX - rect.left) * scaleX;
        const my = (touch.clientY - rect.top) * scaleY;
        this._processClick(mx, my);
    },

    _processClick(mx, my) {
        if (!this.timerRunning || this.roundComplete) return;

        for (let i = 0; i < this.buttons.length; i++) {
            const b = this.buttons[i];
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                if (this.selected.includes(i)) return; // already clicked

                const country = this.options[i];
                if (this.currentNeighbors.includes(country)) {
                    // Correct
                    this.selected.push(i);
                    this.score += 10;
                    this.ui.setScore(this.score);
                } else {
                    // Wrong
                    this.selected.push(i);
                    this.score = Math.max(0, this.score - 5);
                    this.lives--;
                    this.ui.setScore(this.score);
                    this.flashIndex = i;
                    this.flashTimer = 400;

                    if (this.lives <= 0) {
                        this._endGame();
                        return;
                    }
                }
                break;
            }
        }
    },

    _handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            if (this.gameOver) return;
            if (this.paused) {
                this.resume();
            } else {
                this.pause();
            }
        }
    },

    pause() {
        if (this.gameOver || this.paused) return;
        this.paused = true;
        this.ui.showPause();
    },

    resume() {
        if (!this.paused) return;
        this.paused = false;
        this.lastTimestamp = performance.now();
        this.ui.hidePause();
    },

    _endGame() {
        this.gameOver = true;
        this.timerRunning = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        this._render(); // final render
        const best = this.ui.getHighScore();
        this.ui.setHighScore(this.score);
        const newBest = Math.max(best, this.score);
        this.ui.showGameOver(this.score, newBest);
    },

    reset() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        this.gameOver = false;
        this.paused = false;
        this.timerRunning = false;
        this.showingResults = false;
        this.ui.hidePause();
    },

    destroy() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        this.canvas.removeEventListener('click', this._onClick);
        document.removeEventListener('keydown', this._onKey);
        this.canvas.removeEventListener('touchstart', this._onTouch);
    },

    _render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Top bar: round counter, lives, timer
        this._renderTopBar(ctx, W);

        // Country name
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 32px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.currentCountry || '', W / 2, 60);

        // Instruction
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillText('Click all neighboring countries!', W / 2, 88);

        // Timer bar
        const barY = 102;
        const barH = 8;
        const barMargin = 30;
        const barW = W - barMargin * 2;
        const pct = Math.max(0, this.timeRemaining / this.timeLimit);
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.roundRect(barMargin, barY, barW, barH, 4);
        ctx.fill();
        const timerColor = pct > 0.3 ? '#00d4ff' : pct > 0.15 ? '#ffd60a' : '#ff2d7b';
        ctx.fillStyle = timerColor;
        ctx.beginPath();
        ctx.roundRect(barMargin, barY, barW * pct, barH, 4);
        ctx.fill();

        // Buttons
        for (let i = 0; i < this.buttons.length; i++) {
            this._renderButton(ctx, i);
        }

        // Round result overlay
        if (this.showingResults) {
            this._renderRoundResult(ctx, W, H);
        }
    },

    _renderTopBar(ctx, W) {
        // Round
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Round ${this.round}/${this.totalRounds}`, 15, 12);

        // Lives
        ctx.textAlign = 'right';
        let livesStr = '';
        for (let i = 0; i < 3; i++) {
            livesStr += i < this.lives ? '❤️' : '🖤';
        }
        ctx.font = '18px sans-serif';
        ctx.fillText(livesStr, W - 15, 10);

        // Score
        ctx.fillStyle = '#ffd60a';
        ctx.font = 'bold 16px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Score: ${this.score}`, W / 2, 12);
    },

    _renderButton(ctx, i) {
        const b = this.buttons[i];
        if (!b || !b.label) return;

        const isSelected = this.selected.includes(i);
        const isNeighbor = this.currentNeighbors.includes(this.options[i]);
        const isFlashing = this.flashIndex === i && this.flashTimer > 0;

        let bgColor = '#1a1a2e';
        let textColor = '#e8e8f0';
        let borderColor = 'rgba(255,255,255,0.06)';

        if (isSelected && isNeighbor) {
            bgColor = '#004d2a';
            borderColor = '#00e676';
            textColor = '#00e676';
        } else if (isSelected && !isNeighbor) {
            bgColor = '#4d0015';
            borderColor = '#ff2d7b';
            textColor = '#ff2d7b';
        }

        if (isFlashing) {
            bgColor = '#ff2d7b';
            textColor = '#ffffff';
            borderColor = '#ff2d7b';
        }

        // Show missed neighbors in results phase
        if (this.showingResults && !isSelected && isNeighbor) {
            bgColor = '#1a3a1a';
            borderColor = '#00e67666';
            textColor = '#00e676aa';
        }

        // Draw button
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 10);
        ctx.fill();
        ctx.stroke();

        // Label - auto-size text
        const maxFontSize = 16;
        const minFontSize = 10;
        let fontSize = maxFontSize;
        ctx.font = `bold ${fontSize}px Outfit, sans-serif`;
        while (ctx.measureText(b.label).width > b.w - 16 && fontSize > minFontSize) {
            fontSize--;
            ctx.font = `bold ${fontSize}px Outfit, sans-serif`;
        }
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2);
    },

    _renderRoundResult(ctx, W, H) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(10, 10, 15, 0.6)';
        ctx.fillRect(0, 0, W, H);

        // Count how many neighbors were in the grid
        const neighborsInGrid = this.options.filter(o => this.currentNeighbors.includes(o));
        const found = neighborsInGrid.filter(n => {
            const idx = this.options.indexOf(n);
            return this.selected.includes(idx);
        });

        const text = `Found ${found.length} / ${neighborsInGrid.length} neighbors`;
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 24px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, W / 2, H / 2 - 10);

        ctx.fillStyle = '#8888a0';
        ctx.font = '16px Outfit, sans-serif';
        ctx.fillText('Next round...', W / 2, H / 2 + 25);
    },
};

export default Neighbors;
