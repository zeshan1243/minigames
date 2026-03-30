const SIMON_COLORS = [
    { name: 'green', fill: '#00e676', dim: '#004d25', x: 0, y: 0 },
    { name: 'red', fill: '#ff2d7b', dim: '#4d0022', x: 1, y: 0 },
    { name: 'yellow', fill: '#ffd60a', dim: '#4d4000', x: 0, y: 1 },
    { name: 'blue', fill: '#00d4ff', dim: '#003d4d', x: 1, y: 1 }
];

const Simon = {
    canvas: null, ctx: null, ui: null,
    sequence: [], playerIndex: 0, score: 0,
    gameOver: false, animFrame: null,
    phase: 'watch', // watch, play
    showIndex: 0, showTimer: 0, flashPad: -1, flashTimer: 0,
    pads: [],

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        const padSize = 150, gap = 16;
        const startX = (ui.canvasW - (2 * padSize + gap)) / 2;
        const startY = 140;
        this.pads = SIMON_COLORS.map((c, i) => ({
            ...c, bx: startX + c.x * (padSize + gap), by: startY + c.y * (padSize + gap), bw: padSize, bh: padSize
        }));
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
    },

    start() {
        this.sequence = []; this.playerIndex = 0; this.score = 0;
        this.gameOver = false; this.flashPad = -1;
        this.ui.setScore(0); this.ui.hideGameOver();
        this.addToSequence();
        this.loop();
    },

    addToSequence() {
        this.sequence.push(Math.floor(Math.random() * 4));
        this.phase = 'watch'; this.showIndex = 0; this.showTimer = 30;
    },

    loop() {
        if (this.gameOver) return;
        this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        if (this.flashTimer > 0) this.flashTimer--;
        else this.flashPad = -1;

        if (this.phase === 'watch') {
            this.showTimer--;
            if (this.showTimer <= 0) {
                if (this.showIndex < this.sequence.length) {
                    this.flashPad = this.sequence[this.showIndex];
                    this.flashTimer = 20;
                    this.showIndex++;
                    this.showTimer = 30;
                } else {
                    this.phase = 'play';
                    this.playerIndex = 0;
                }
            }
        }
    },

    processInput(x, y) {
        if (this.phase !== 'play' || this.gameOver) return;
        for (let i = 0; i < this.pads.length; i++) {
            const p = this.pads[i];
            if (x >= p.bx && x <= p.bx + p.bw && y >= p.by && y <= p.by + p.bh) {
                this.flashPad = i; this.flashTimer = 10;
                if (i === this.sequence[this.playerIndex]) {
                    this.playerIndex++;
                    if (this.playerIndex >= this.sequence.length) {
                        this.score++;
                        this.ui.setScore(this.score);
                        setTimeout(() => this.addToSequence(), 500);
                    }
                } else {
                    this.endGame();
                }
                return;
            }
        }
    },

    handleClick(e) { const r = this.canvas.getBoundingClientRect(); this.processInput(e.clientX - r.left, e.clientY - r.top); },
    handleTouch(e) { e.preventDefault(); const r = this.canvas.getBoundingClientRect(); this.processInput(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top); },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(this.phase === 'watch' ? 'Watch the pattern...' : 'Your turn!', w/2, 50);
        ctx.fillStyle = '#8888a0'; ctx.font = '14px Outfit, sans-serif';
        ctx.fillText(`Round: ${this.sequence.length}`, w/2, 80);

        for (let i = 0; i < this.pads.length; i++) {
            const p = this.pads[i];
            const lit = this.flashPad === i;
            ctx.fillStyle = lit ? p.fill : p.dim;
            ctx.beginPath(); ctx.roundRect(p.bx, p.by, p.bw, p.bh, 16); ctx.fill();
            if (lit) {
                ctx.save(); ctx.shadowColor = p.fill; ctx.shadowBlur = 20;
                ctx.fillStyle = p.fill;
                ctx.beginPath(); ctx.roundRect(p.bx, p.by, p.bw, p.bh, 16); ctx.fill();
                ctx.restore();
            }
        }
    },

    endGame() {
        this.gameOver = true; cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    pause() {}, resume() {},
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); }
};
export default Simon;
