const WordSearch = {
    canvas: null, ctx: null, ui: null,
    gridSize: 10, wordCount: 6, grid: [], words: [], foundWords: [],
    wordPlacements: [], cellSize: 0, offsetX: 0, offsetY: 0,
    selecting: false, selStart: null, selEnd: null, selCells: [],
    foundCells: [], score: 0, gameOver: false, paused: false, animFrame: null,
    hoverCell: null, foundAnims: [],

    wordBank: [
        'GAME', 'CODE', 'PLAY', 'HERO', 'JUMP', 'FAST', 'STAR',
        'FIRE', 'GOLD', 'MAZE', 'KING', 'DARK', 'COIN', 'LIFE',
        'BOSS', 'GEMS', 'FISH', 'WAVE', 'BIRD', 'MOON', 'DICE',
        'SHIP', 'WIND', 'ROCK', 'BOLT', 'IRON', 'FROG', 'RUBY',
        'LUCK', 'GLOW', 'EPIC', 'PALM', 'VOID', 'ZONE', 'DUSK'
    ],

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleDown = this.handleDown.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleUp = this.handleUp.bind(this);
        this.handleKey = this.handleKey.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        canvas.addEventListener('mousedown', this.handleDown);
        canvas.addEventListener('mousemove', this.handleMove);
        canvas.addEventListener('mouseup', this.handleUp);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        // Configure difficulty
        const level = this.ui.level || 'medium';
        if (level === 'easy') { this.gridSize = 8; this.wordCount = 4; }
        else if (level === 'hard' || level === 'expert') { this.gridSize = 14; this.wordCount = 10; }
        else { this.gridSize = 10; this.wordCount = 6; }

        this.reset();
        this.gameOver = false; this.paused = false;
        this.ui.hideGameOver(); this.ui.hidePause();
        this.generateGrid();
        this.computeLayout();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.grid = []; this.words = []; this.foundWords = [];
        this.wordPlacements = []; this.foundCells = [];
        this.selCells = []; this.foundAnims = [];
        this.selecting = false; this.score = 0;
        this.ui.setScore(0);
    },

    generateGrid() {
        // Init empty grid
        this.grid = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(''));

        // Shuffle and pick 6 words
        const shuffled = [...this.wordBank].sort(() => Math.random() - 0.5);
        this.words = [];
        this.wordPlacements = [];

        for (const word of shuffled) {
            if (this.words.length >= (this.wordCount || 6)) break;
            if (this.placeWord(word)) this.words.push(word);
        }

        // Fill remaining with random letters
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (!this.grid[r][c]) {
                    this.grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                }
            }
        }
        this.foundWords = Array(this.words.length).fill(false);
    },

    placeWord(word) {
        const dirs = [
            { dr: 0, dc: 1 },  // horizontal
            { dr: 1, dc: 0 },  // vertical
        ];
        const attempts = 50;
        for (let a = 0; a < attempts; a++) {
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const maxR = this.gridSize - (dir.dr * word.length);
            const maxC = this.gridSize - (dir.dc * word.length);
            if (maxR <= 0 || maxC <= 0) continue;
            const sr = Math.floor(Math.random() * maxR);
            const sc = Math.floor(Math.random() * maxC);

            let canPlace = true;
            for (let i = 0; i < word.length; i++) {
                const r = sr + dir.dr * i, c = sc + dir.dc * i;
                if (this.grid[r][c] && this.grid[r][c] !== word[i]) { canPlace = false; break; }
            }
            if (!canPlace) continue;

            const cells = [];
            for (let i = 0; i < word.length; i++) {
                const r = sr + dir.dr * i, c = sc + dir.dc * i;
                this.grid[r][c] = word[i];
                cells.push({ r, c });
            }
            this.wordPlacements.push(cells);
            return true;
        }
        return false;
    },

    computeLayout() {
        const w = this.ui.canvasW, h = this.ui.canvasH;
        const gridArea = Math.min(w - 20, h * 0.65);
        this.cellSize = Math.floor(gridArea / this.gridSize);
        const totalGrid = this.cellSize * this.gridSize;
        this.offsetX = (w - totalGrid) / 2;
        this.offsetY = 50;
    },

    getCellAt(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = clientX - rect.left, my = clientY - rect.top;
        const c = Math.floor((mx - this.offsetX) / this.cellSize);
        const r = Math.floor((my - this.offsetY) / this.cellSize);
        if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) return { r, c };
        return null;
    },

    getSelectionCells(start, end) {
        if (!start || !end) return [];
        const dr = end.r - start.r, dc = end.c - start.c;
        // Only allow horizontal or vertical
        if (dr !== 0 && dc !== 0) return [];
        const cells = [];
        const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
        const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
        let r = start.r, c = start.c;
        while (true) {
            cells.push({ r, c });
            if (r === end.r && c === end.c) break;
            r += stepR; c += stepC;
        }
        return cells;
    },

    handleTouchStart(e) {
        e.preventDefault();
        const t = e.touches[0];
        this.handleDown({ clientX: t.clientX, clientY: t.clientY });
    },
    handleTouchMove(e) {
        e.preventDefault();
        const t = e.touches[0];
        this.handleMove({ clientX: t.clientX, clientY: t.clientY });
    },
    handleTouchEnd(e) {
        e.preventDefault();
        this.handleUp({});
    },

    handleDown(e) {
        if (this.paused || this.gameOver) return;
        const cell = this.getCellAt(e.clientX, e.clientY);
        if (!cell) return;
        this.selecting = true;
        this.selStart = cell; this.selEnd = cell;
        this.selCells = [cell];
    },

    handleMove(e) {
        if (!this.selecting) {
            this.hoverCell = this.getCellAt(e.clientX, e.clientY);
            return;
        }
        const cell = this.getCellAt(e.clientX, e.clientY);
        if (!cell) return;
        this.selEnd = cell;
        this.selCells = this.getSelectionCells(this.selStart, this.selEnd);
    },

    handleUp(e) {
        if (!this.selecting) return;
        this.selecting = false;
        this.checkSelection();
        this.selCells = [];
    },

    checkSelection() {
        if (this.selCells.length < 2) return;
        const selStr = this.selCells.map(c => this.grid[c.r][c.c]).join('');
        const revStr = [...selStr].reverse().join('');

        for (let i = 0; i < this.words.length; i++) {
            if (this.foundWords[i]) continue;
            if (selStr === this.words[i] || revStr === this.words[i]) {
                this.foundWords[i] = true;
                this.foundCells.push(...this.selCells.map(c => `${c.r},${c.c}`));
                this.foundAnims.push({ cells: [...this.selCells], progress: 0 });
                this.score++;
                this.ui.setScore(this.score);
                if (this.score >= this.words.length) this.endGame();
                return;
            }
        }
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') this.togglePause();
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) this.ui.showPause(); else this.ui.hidePause();
    },

    endGame() {
        this.gameOver = true;
        const best = this.ui.getHighScore() || 0;
        if (this.score > best) this.ui.setHighScore(this.score);
        this.ui.showGameOver(this.score, Math.max(this.score, best));
    },

    loop() {
        this.animFrame = requestAnimationFrame(() => this.loop());
        // Update found anims
        for (const a of this.foundAnims) {
            if (a.progress < 1) a.progress += 0.03;
        }
        this.draw();
    },

    draw() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        const cs = this.cellSize;
        const foundSet = new Set(this.foundCells);
        const selSet = new Set(this.selCells.map(c => `${c.r},${c.c}`));

        // Title
        ctx.fillStyle = '#00d4ff';
        ctx.font = `bold ${Math.min(w * 0.045, 20)}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Find all hidden words!', w / 2, 30);

        // Grid
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const x = this.offsetX + c * cs;
                const y = this.offsetY + r * cs;
                const key = `${r},${c}`;
                const isFound = foundSet.has(key);
                const isSel = selSet.has(key);
                const isHover = this.hoverCell && this.hoverCell.r === r && this.hoverCell.c === c;

                // Cell bg
                if (isFound) {
                    ctx.fillStyle = '#00e67633';
                } else if (isSel) {
                    ctx.fillStyle = '#ffd60a33';
                } else if (isHover) {
                    ctx.fillStyle = '#ffffff11';
                } else {
                    ctx.fillStyle = '#12121f';
                }
                ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

                // Cell border
                ctx.strokeStyle = isFound ? '#00e67666' : isSel ? '#ffd60a66' : '#ffffff15';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2);

                // Letter
                ctx.fillStyle = isFound ? '#00e676' : isSel ? '#ffd60a' : '#ccc';
                ctx.font = `bold ${cs * 0.55}px 'Segoe UI', sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(this.grid[r][c], x + cs / 2, y + cs / 2);
            }
        }

        // Found highlight animations
        for (const anim of this.foundAnims) {
            if (anim.progress < 1) {
                ctx.globalAlpha = (1 - anim.progress) * 0.5;
                ctx.fillStyle = '#00e676';
                for (const cell of anim.cells) {
                    const x = this.offsetX + cell.c * cs;
                    const y = this.offsetY + cell.r * cs;
                    ctx.fillRect(x, y, cs, cs);
                }
                ctx.globalAlpha = 1;
            }
        }

        // Word list
        const listY = this.offsetY + this.gridSize * cs + 20;
        const listFontSize = Math.min(w * 0.04, 16);
        ctx.font = `bold ${listFontSize}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';

        const cols = 3;
        const colW = w / cols;
        for (let i = 0; i < this.words.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = colW * col + colW / 2;
            const y = listY + row * (listFontSize + 10);

            if (this.foundWords[i]) {
                ctx.fillStyle = '#00e676';
                ctx.globalAlpha = 0.5;
                ctx.fillText(this.words[i], x, y);
                // Strikethrough
                const tw = ctx.measureText(this.words[i]).width;
                ctx.strokeStyle = '#00e676';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x - tw / 2, y); ctx.lineTo(x + tw / 2, y);
                ctx.stroke();
                ctx.globalAlpha = 1;
            } else {
                ctx.fillStyle = '#ffd60a';
                ctx.fillText(this.words[i], x, y);
            }
        }
    },

    pause() { this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        this.canvas.removeEventListener('mousedown', this.handleDown);
        this.canvas.removeEventListener('mousemove', this.handleMove);
        this.canvas.removeEventListener('mouseup', this.handleUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default WordSearch;
