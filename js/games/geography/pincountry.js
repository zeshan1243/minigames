const PinCountry = {
    canvas: null,
    ctx: null,
    ui: null,
    score: 0,
    gameOver: false,
    paused: false,
    animFrame: null,

    // Round state
    round: 0,
    totalRounds: 10,
    currentCountry: null,
    usedIndices: [],
    clickPos: null,
    showingResult: false,
    resultTimer: 0,
    roundScore: 0,

    // Timer
    timeLeft: 10,
    timerStart: 0,
    timerDuration: 10000,

    // Animations
    distanceLine: 0, // interpolation 0->1
    scorePopup: null,
    particles: [],

    // Country data: [name, x, y] on 800x620 equirectangular projection
    // x: 0=180W, 800=180E (400=0 lon)
    // y: 0=90N, 620=90S (310=equator)
    countries: [
        ['USA', 150, 210],
        ['Canada', 160, 160],
        ['Mexico', 130, 270],
        ['Cuba', 185, 280],
        ['Brazil', 270, 370],
        ['Argentina', 250, 440],
        ['Colombia', 215, 320],
        ['Peru', 225, 365],
        ['Chile', 235, 430],
        ['UK', 395, 155],
        ['Ireland', 385, 155],
        ['Iceland', 370, 115],
        ['France', 405, 185],
        ['Spain', 395, 200],
        ['Portugal', 385, 205],
        ['Germany', 415, 170],
        ['Italy', 420, 195],
        ['Greece', 435, 205],
        ['Poland', 430, 165],
        ['Sweden', 425, 125],
        ['Norway', 415, 120],
        ['Ukraine', 450, 170],
        ['Russia', 530, 145],
        ['Turkey', 455, 205],
        ['Saudi Arabia', 480, 260],
        ['Iran', 495, 225],
        ['Iraq', 475, 225],
        ['Egypt', 450, 250],
        ['Morocco', 390, 230],
        ['Nigeria', 410, 305],
        ['Kenya', 465, 340],
        ['Ethiopia', 470, 315],
        ['South Africa', 440, 420],
        ['India', 535, 270],
        ['Pakistan', 515, 240],
        ['China', 575, 220],
        ['Japan', 640, 210],
        ['South Korea', 625, 215],
        ['Thailand', 575, 290],
        ['Vietnam', 585, 285],
        ['Indonesia', 595, 340],
        ['Malaysia', 580, 320],
        ['Philippines', 615, 290],
        ['Australia', 640, 410],
        ['New Zealand', 685, 450],
        ['Mongolia', 570, 185],
        ['Kazakhstan', 510, 180],
        ['Afghanistan', 510, 225],
        ['Algeria', 405, 235],
        ['Libya', 425, 240],
    ],

    // Simplified continent polygons for the map
    continents: null,

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
        this._buildContinents();
    },

    _buildContinents() {
        // Simplified continent outlines as polygon arrays [x,y] on 800x620
        this.continents = [
            { name: 'North America', color: '#1a3a2a', points: [
                [90,120],[170,100],[200,110],[220,120],[230,135],[210,155],
                [215,170],[200,185],[190,200],[195,215],[185,230],[175,245],
                [160,260],[150,270],[130,275],[115,280],[105,275],[100,265],
                [90,258],[80,240],[75,225],[70,210],[75,195],[80,180],
                [85,165],[82,150],[85,135]
            ]},
            { name: 'Central America', color: '#1a3a2a', points: [
                [115,280],[130,275],[145,272],[155,275],[160,282],[165,290],
                [155,295],[145,298],[135,295],[125,290],[118,285]
            ]},
            { name: 'South America', color: '#1e3d2e', points: [
                [215,300],[230,290],[245,295],[260,305],[275,315],[285,330],
                [290,350],[288,370],[282,390],[275,410],[265,425],[255,440],
                [245,450],[238,458],[232,450],[225,435],[220,420],[215,400],
                [210,380],[205,360],[208,340],[210,320]
            ]},
            { name: 'Europe', color: '#1c3c2c', points: [
                [380,105],[395,100],[410,105],[425,110],[440,115],[450,120],
                [455,130],[460,140],[455,155],[450,165],[445,175],[440,185],
                [435,195],[430,205],[420,210],[410,205],[400,200],[390,205],
                [385,195],[390,185],[395,175],[400,165],[395,155],[388,145],
                [382,135],[378,125],[375,115]
            ]},
            { name: 'Africa', color: '#1e3d2e', points: [
                [385,215],[395,210],[410,215],[425,220],[440,225],[450,235],
                [455,245],[460,260],[465,280],[470,300],[475,320],[470,340],
                [465,360],[460,380],[455,400],[448,415],[440,425],[430,430],
                [420,425],[410,415],[405,400],[400,380],[395,360],[390,340],
                [388,320],[386,300],[385,280],[383,260],[382,240]
            ]},
            { name: 'Asia', color: '#1a3a2a', points: [
                [455,105],[475,100],[500,105],[530,110],[560,115],[590,120],
                [620,130],[640,145],[650,160],[648,180],[640,200],[635,215],
                [625,230],[615,245],[600,260],[590,275],[580,290],[570,305],
                [560,315],[545,320],[530,310],[520,295],[510,280],[505,265],
                [500,250],[495,235],[490,220],[480,210],[470,200],[465,185],
                [460,170],[458,155],[455,140],[452,125]
            ]},
            { name: 'Australia', color: '#1c3c2c', points: [
                [610,370],[625,365],[645,370],[660,378],[675,390],[685,405],
                [688,420],[682,435],[670,442],[655,445],[640,442],[625,435],
                [615,425],[610,410],[608,395],[607,380]
            ]},
        ];
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this._nextRound();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.score = 0;
        this.round = 0;
        this.usedIndices = [];
        this.clickPos = null;
        this.showingResult = false;
        this.resultTimer = 0;
        this.roundScore = 0;
        this.distanceLine = 0;
        this.scorePopup = null;
        this.particles = [];
        this.currentCountry = null;
        this.timeLeft = 10;
        this.ui.setScore(0);
    },

    pause() {
        this.paused = true;
        this.ui.showPause();
    },

    resume() {
        this.paused = false;
        this.ui.hidePause();
        this.timerStart = performance.now() - (this.timerDuration - this.timeLeft * 1000);
        this.loop();
    },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
        document.removeEventListener('keydown', this.handleKey);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            if (this.gameOver) return;
            if (this.paused) this.resume();
            else this.pause();
        }
    },

    handleTouch(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const x = (e.touches[0].clientX - rect.left) * scaleX;
        const y = (e.touches[0].clientY - rect.top) * scaleY;
        this._processClick(x, y);
    },

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        this._processClick(x, y);
    },

    _processClick(x, y) {
        if (this.gameOver || this.paused || this.showingResult) return;
        if (!this.currentCountry) return;

        this.clickPos = { x, y };
        const cx = this.currentCountry[1];
        const cy = this.currentCountry[2];
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

        // Max distance on map is ~800 diagonal. 0 dist = 1000 pts, 400+ dist = 0 pts
        const maxDist = 350;
        this.roundScore = Math.max(0, Math.round(1000 * (1 - dist / maxDist)));
        this.score += this.roundScore;
        this.ui.setScore(this.score);

        // Score popup
        this.scorePopup = {
            x: x, y: y - 10, alpha: 1, dy: -1, text: '+' + this.roundScore
        };

        // Particles at correct location
        this._spawnParticles(cx, cy);

        this.showingResult = true;
        this.distanceLine = 0;
        this.resultTimer = performance.now();
    },

    _spawnParticles(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const speed = 1 + Math.random() * 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: this.roundScore > 700 ? '#00e676' : this.roundScore > 400 ? '#ffd60a' : '#ff2d7b'
            });
        }
    },

    _nextRound() {
        this.round++;
        this.clickPos = null;
        this.showingResult = false;
        this.scorePopup = null;
        this.distanceLine = 0;

        if (this.round > this.totalRounds) {
            this._endGame();
            return;
        }

        // Pick a random unused country
        let idx;
        do {
            idx = Math.floor(Math.random() * this.countries.length);
        } while (this.usedIndices.includes(idx));
        this.usedIndices.push(idx);
        this.currentCountry = this.countries[idx];

        // Reset timer
        this.timerStart = performance.now();
        this.timeLeft = 10;
    },

    _endGame() {
        this.gameOver = true;
        const best = this.ui.getHighScore();
        this.ui.setHighScore(this.score);
        this.ui.showGameOver(this.score, Math.max(best, this.score));
    },

    loop() {
        if (this.gameOver) return;
        if (this.paused) return;
        this.animFrame = requestAnimationFrame(() => this.loop());
        this.update();
        this.render();
    },

    update() {
        const now = performance.now();

        // Update timer if not showing result
        if (!this.showingResult && this.currentCountry) {
            const elapsed = now - this.timerStart;
            this.timeLeft = Math.max(0, 10 - elapsed / 1000);
            if (this.timeLeft <= 0) {
                // Time's up - score 0 for this round
                this.roundScore = 0;
                this.clickPos = { x: -100, y: -100 }; // off-screen
                this.scorePopup = {
                    x: this.ui.canvasW / 2, y: this.ui.canvasH / 2,
                    alpha: 1, dy: -1, text: 'Time Up!'
                };
                this.showingResult = true;
                this.distanceLine = 0;
                this.resultTimer = now;
            }
        }

        // Animate result display
        if (this.showingResult) {
            const elapsed = now - this.resultTimer;
            this.distanceLine = Math.min(1, elapsed / 500);

            if (elapsed > 2000) {
                this._nextRound();
            }
        }

        // Update score popup
        if (this.scorePopup) {
            this.scorePopup.y += this.scorePopup.dy;
            this.scorePopup.alpha -= 0.008;
            if (this.scorePopup.alpha <= 0) this.scorePopup = null;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        // Ocean background
        ctx.fillStyle = '#0a1628';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        this._drawGrid(ctx, W, H);

        // Continents
        this._drawContinents(ctx);

        // Country dots (small subtle dots for all countries - not labeled)
        // Only draw after click to avoid giving away positions

        // Timer bar
        if (this.currentCountry && !this.showingResult) {
            this._drawTimer(ctx, W);
        }

        // Round counter
        this._drawRoundCounter(ctx, W);

        // Country name prompt
        if (this.currentCountry) {
            this._drawPrompt(ctx, W);
        }

        // Result: correct location + distance line
        if (this.showingResult && this.currentCountry) {
            this._drawResult(ctx);
        }

        // Click marker
        if (this.clickPos && this.clickPos.x >= 0) {
            this._drawClickMarker(ctx, this.clickPos.x, this.clickPos.y);
        }

        // Score popup
        if (this.scorePopup) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.scorePopup.alpha);
            ctx.font = 'bold 22px Outfit, sans-serif';
            ctx.fillStyle = this.roundScore > 700 ? '#00e676' : this.roundScore > 400 ? '#ffd60a' : '#ff2d7b';
            ctx.textAlign = 'center';
            ctx.fillText(this.scorePopup.text, this.scorePopup.x, this.scorePopup.y);
            ctx.restore();
        }

        // Particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },

    _drawGrid(ctx, W, H) {
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        // Vertical lines (longitude)
        for (let x = 0; x <= W; x += W / 12) {
            ctx.beginPath();
            ctx.moveTo(x, 50);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        // Horizontal lines (latitude)
        for (let y = 50; y <= H; y += (H - 50) / 8) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
        // Equator
        const eqY = 50 + (H - 50) * (90 / 180);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(0, eqY);
        ctx.lineTo(W, eqY);
        ctx.stroke();
    },

    _drawContinents(ctx) {
        if (!this.continents) return;
        for (const c of this.continents) {
            if (c.points.length < 3) continue;
            ctx.fillStyle = c.color;
            ctx.strokeStyle = '#2a5a3a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(c.points[0][0], c.points[0][1]);
            for (let i = 1; i < c.points.length; i++) {
                ctx.lineTo(c.points[i][0], c.points[i][1]);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    },

    _drawTimer(ctx, W) {
        const barW = W - 40;
        const barH = 6;
        const barX = 20;
        const barY = 44;
        const frac = this.timeLeft / 10;

        // Background
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 3);
        ctx.fill();

        // Foreground
        const color = frac > 0.5 ? '#00d4ff' : frac > 0.25 ? '#ffd60a' : '#ff2d7b';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * frac, barH, 3);
        ctx.fill();
    },

    _drawRoundCounter(ctx, W) {
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillStyle = '#8888a0';
        ctx.textAlign = 'right';
        ctx.fillText(
            'Round ' + Math.min(this.round, this.totalRounds) + ' / ' + this.totalRounds,
            W - 20, 30
        );
    },

    _drawPrompt(ctx, W) {
        // Background bar
        ctx.fillStyle = 'rgba(10,10,15,0.85)';
        ctx.fillRect(0, 0, W, 40);

        // Country name
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.fillStyle = '#e8e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Find: ' + this.currentCountry[0], W / 2, 20);
        ctx.textBaseline = 'alphabetic';
    },

    _drawResult(ctx) {
        const cx = this.currentCountry[1];
        const cy = this.currentCountry[2];

        // Correct location marker
        ctx.save();
        // Pulsing circle
        const pulse = 1 + 0.2 * Math.sin(performance.now() / 200);
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 10 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Filled dot
        ctx.fillStyle = '#00e676';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();

        // Country label
        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.fillStyle = '#00e676';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentCountry[0], cx, cy - 18);

        // Distance line (animated)
        if (this.clickPos && this.clickPos.x >= 0 && this.distanceLine > 0) {
            const lx = this.clickPos.x + (cx - this.clickPos.x) * this.distanceLine;
            const ly = this.clickPos.y + (cy - this.clickPos.y) * this.distanceLine;

            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.clickPos.x, this.clickPos.y);
            ctx.lineTo(lx, ly);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    },

    _drawClickMarker(ctx, x, y) {
        // Crosshair
        ctx.strokeStyle = '#ff2d7b';
        ctx.lineWidth = 2;
        const s = 8;
        ctx.beginPath();
        ctx.moveTo(x - s, y); ctx.lineTo(x + s, y);
        ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
        ctx.stroke();

        // Circle
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.stroke();
    },
};

export default PinCountry;
