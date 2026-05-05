const WORDS = ['code','game','play','fast','type','speed','quick','flash','pixel','logic','stack','score','level','power','boost','chain','combo','debug','array','class','loop','hack','byte','data','mode','fire','jump','dash','spin','wave','rocket','planet','galaxy','castle','dragon','shield','knight','spirit','shadow','hunter','breeze','frozen','temple','savage','mystic','legend','strike','throne','cosmic','blazer','cipher','matrix','oracle','turbo','scroll','plasma','vortex','wonder','system','silver','golden','pirate','escape','flight','harbor','jungle','stream','voyage','bridge','carbon','magnet','button','screen','design','render','shader','export','import','cursor','toggle','syntax','module','socket','binary','vector','encode','decode','script','server','method','object','global','string','search','filter','signal','puzzle','captain','phoenix','crystal','harvest','journey','kingdom','crimson','diamond','explore','founder','gravity','imagine','network','program','project','quantum','reactor','sparked','terrain','unicorn','winning'];

const Typing = {
    canvas: null, ctx: null, ui: null,
    words: [], score: 0, input: '', gameOver: false, animFrame: null,
    spawnTimer: null, speed: 0.5, lives: 3,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        this.words = []; this.score = 0; this.input = ''; this.gameOver = false;
        this.speed = 0.5; this.lives = 3;
        this.ui.setScore(0); this.ui.hideGameOver();
        this.spawnTimer = setInterval(() => {
            if (!this.gameOver) this.spawnWord();
        }, 2000);
        this.spawnWord();
        this.loop();
    },

    spawnWord() {
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        this.words.push({
            text: word,
            x: 30 + Math.random() * (this.ui.canvasW - 100),
            y: -20,
            speed: this.speed + Math.random() * 0.3
        });
    },

    loop() {
        if (this.gameOver) return;
        this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        for (let i = this.words.length - 1; i >= 0; i--) {
            this.words[i].y += this.words[i].speed;
            if (this.words[i].y > this.ui.canvasH) {
                this.words.splice(i, 1);
                this.lives--;
                if (this.lives <= 0) { this.endGame(); return; }
            }
        }
        this.speed = 0.5 + this.score * 0.02;
    },

    handleKey(e) {
        if (this.gameOver) return;
        if (e.key === 'Backspace') { this.input = this.input.slice(0, -1); return; }
        if (e.key.length !== 1) return;
        this.input += e.key.toLowerCase();

        const idx = this.words.findIndex(w => w.text === this.input);
        if (idx !== -1) {
            this.words.splice(idx, 1);
            this.score++;
            this.ui.setScore(this.score);
            this.input = '';
        }
        // Auto-clear if no word starts with input
        if (!this.words.some(w => w.text.startsWith(this.input))) {
            this.input = '';
        }
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        // Lives
        ctx.fillStyle = '#e8e8f0'; ctx.font = '14px Outfit, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('\u2764'.repeat(this.lives), 20, 30);

        // Danger zone
        ctx.fillStyle = 'rgba(255,45,123,0.05)';
        ctx.fillRect(0, h - 60, w, 60);
        ctx.strokeStyle = 'rgba(255,45,123,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, h - 60); ctx.lineTo(w, h - 60); ctx.stroke();

        // Words
        for (const word of this.words) {
            const match = word.text.startsWith(this.input) && this.input.length > 0;
            ctx.font = 'bold 20px JetBrains Mono, monospace'; ctx.textAlign = 'left';
            if (match) {
                ctx.fillStyle = '#00e676';
                ctx.fillText(this.input, word.x, word.y);
                ctx.fillStyle = '#e8e8f0';
                ctx.fillText(word.text.slice(this.input.length), word.x + ctx.measureText(this.input).width, word.y);
            } else {
                ctx.fillStyle = '#e8e8f0';
                ctx.fillText(word.text, word.x, word.y);
            }
        }

        // Input display
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, h - 50, w, 50);
        ctx.fillStyle = '#00d4ff'; ctx.font = 'bold 22px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.input || 'type a word...', w/2, h - 18);
    },

    endGame() {
        this.gameOver = true; clearInterval(this.spawnTimer); cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    pause() {}, resume() {},
    reset() { clearInterval(this.spawnTimer); cancelAnimationFrame(this.animFrame); },
    destroy() { clearInterval(this.spawnTimer); cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKey); }
};
export default Typing;
