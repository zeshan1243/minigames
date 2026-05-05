const Sudoku = {
    canvas: null, ctx: null, ui: null,
    grid: [], solution: [], fixed: [], selectedCell: null,
    gridN: 4, boxRows: 2, boxCols: 2,
    cellSize: 0, offsetX: 0, offsetY: 0, numPadY: 0,
    score: 0, startTime: 0, timerInterval: null,
    gameOver: false, paused: false, animFrame: null,
    conflicts: new Set(), hoverCell: null, hoverNum: -1,
    completionAnim: 0,

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
    },

    start() {
        this.reset();
        // Configure difficulty
        const level = this.ui.level || 'easy';
        if (level === 'medium') { this.gridN = 6; this.boxRows = 2; this.boxCols = 3; }
        else if (level === 'hard' || level === 'expert') { this.gridN = 9; this.boxRows = 3; this.boxCols = 3; }
        else { this.gridN = 4; this.boxRows = 2; this.boxCols = 2; }

        this.gameOver = false; this.paused = false;
        this.ui.hideGameOver(); this.ui.hidePause();
        this.generatePuzzle();
        this.computeLayout();
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (!this.paused && !this.gameOver) {
                const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
                this.ui.setScore(elapsed + 's');
            }
        }, 100);
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        clearInterval(this.timerInterval);
        this.grid = []; this.solution = []; this.fixed = [];
        this.selectedCell = null; this.conflicts = new Set();
        this.completionAnim = 0;
        this.ui.setScore(0);
    },

    generatePuzzle() {
        const N = this.gridN;
        const total = N * N;
        this.solution = Array.from({ length: N }, () => Array(N).fill(0));
        this.fillGrid(this.solution);
        this.grid = this.solution.map(r => [...r]);
        this.fixed = Array.from({ length: N }, () => Array(N).fill(false));

        // Determine how many cells to remove based on grid size
        let toRemove;
        if (N === 4) toRemove = 8 + Math.floor(Math.random() * 3);
        else if (N === 6) toRemove = 18 + Math.floor(Math.random() * 4);
        else toRemove = 45 + Math.floor(Math.random() * 10);

        const positions = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) positions.push({ r, c });
        positions.sort(() => Math.random() - 0.5);
        for (let i = 0; i < toRemove && i < positions.length; i++) {
            this.grid[positions[i].r][positions[i].c] = 0;
        }
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                this.fixed[r][c] = this.grid[r][c] !== 0;
            }
        }
    },

    fillGrid(grid, pos) {
        const N = this.gridN;
        if (pos === undefined) pos = 0;
        if (pos >= N * N) return true;
        const r = Math.floor(pos / N), c = pos % N;
        const nums = [];
        for (let i = 1; i <= N; i++) nums.push(i);
        nums.sort(() => Math.random() - 0.5);
        for (const n of nums) {
            if (this.isValidPlacement(grid, r, c, n)) {
                grid[r][c] = n;
                if (this.fillGrid(grid, pos + 1)) return true;
                grid[r][c] = 0;
            }
        }
        return false;
    },

    isValidPlacement(grid, row, col, num) {
        const N = this.gridN;
        // Check row
        for (let c = 0; c < N; c++) if (c !== col && grid[row][c] === num) return false;
        // Check col
        for (let r = 0; r < N; r++) if (r !== row && grid[r][col] === num) return false;
        // Check box
        const boxR = Math.floor(row / this.boxRows) * this.boxRows;
        const boxC = Math.floor(col / this.boxCols) * this.boxCols;
        for (let r = boxR; r < boxR + this.boxRows; r++)
            for (let c = boxC; c < boxC + this.boxCols; c++)
                if ((r !== row || c !== col) && grid[r][c] === num) return false;
        return true;
    },

    computeLayout() {
        const N = this.gridN;
        const w = this.ui.canvasW, h = this.ui.canvasH;
        this.cellSize = Math.min((w - 40) / N, (h - 180) / N, N <= 4 ? 90 : N <= 6 ? 70 : 50);
        const totalGrid = this.cellSize * N;
        this.offsetX = (w - totalGrid) / 2;
        this.offsetY = 60;
        this.numPadY = this.offsetY + totalGrid + 30;
    },

    getCellAt(mx, my) {
        const N = this.gridN;
        const c = Math.floor((mx - this.offsetX) / this.cellSize);
        const r = Math.floor((my - this.offsetY) / this.cellSize);
        if (r >= 0 && r < N && c >= 0 && c < N) return { r, c };
        return null;
    },

    getNumAt(mx, my) {
        const N = this.gridN;
        const btnW = this.cellSize;
        const numCols = N <= 6 ? N : 5;
        const gap = N <= 6 ? 12 : 8;
        const totalW = btnW * numCols + gap * (numCols - 1);
        const startX = (this.ui.canvasW - totalW) / 2;
        const numRows = Math.ceil(N / numCols);
        for (let i = 0; i < N; i++) {
            const col = i % numCols;
            const row = Math.floor(i / numCols);
            const x = startX + col * (btnW + gap);
            const y = this.numPadY + row * (btnW + gap);
            if (mx >= x && mx <= x + btnW && my >= y && my <= y + btnW) {
                return i + 1;
            }
        }
        return -1;
    },

    handleTouch(e) {
        e.preventDefault();
        const t = e.touches[0];
        this.handleClick({ clientX: t.clientX, clientY: t.clientY });
    },

    handleClick(e) {
        if (this.paused || this.gameOver) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;

        // Check grid click
        const cell = this.getCellAt(mx, my);
        if (cell && !this.fixed[cell.r][cell.c]) {
            this.selectedCell = cell;
            return;
        }

        // Check numpad click
        if (this.selectedCell) {
            const num = this.getNumAt(mx, my);
            if (num > 0) {
                this.grid[this.selectedCell.r][this.selectedCell.c] = num;
                this.updateConflicts();
                if (this.isComplete()) this.endGame();
            }
        }
    },

    handleMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        this.hoverCell = this.getCellAt(mx, my);
        this.hoverNum = this.getNumAt(mx, my);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') { this.togglePause(); return; }
        if (this.paused || this.gameOver) return;
        const maxKey = String(this.gridN);
        if (this.selectedCell && e.key >= '1' && e.key <= maxKey) {
            this.grid[this.selectedCell.r][this.selectedCell.c] = parseInt(e.key);
            this.updateConflicts();
            if (this.isComplete()) this.endGame();
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
            if (this.selectedCell && !this.fixed[this.selectedCell.r][this.selectedCell.c]) {
                this.grid[this.selectedCell.r][this.selectedCell.c] = 0;
                this.updateConflicts();
            }
        }
    },

    updateConflicts() {
        const N = this.gridN;
        this.conflicts = new Set();
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (this.grid[r][c] === 0) continue;
                if (!this.isValidPlacement(this.grid, r, c, this.grid[r][c])) {
                    this.conflicts.add(`${r},${c}`);
                }
            }
        }
    },

    isComplete() {
        const N = this.gridN;
        for (let r = 0; r < N; r++)
            for (let c = 0; c < N; c++)
                if (this.grid[r][c] === 0) return false;
        return this.conflicts.size === 0;
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) this.ui.showPause(); else this.ui.hidePause();
    },

    endGame() {
        this.gameOver = true;
        clearInterval(this.timerInterval);
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        this.score = parseFloat(elapsed);
        const best = this.ui.getHighScore() || 9999;
        if (this.score < best) this.ui.setHighScore(this.score);
        this.ui.showGameOver(this.score + 's', (Math.min(this.score, best)) + 's');
    },

    loop() {
        this.animFrame = requestAnimationFrame(() => this.loop());
        if (this.gameOver && this.completionAnim < 1) this.completionAnim += 0.02;
        this.draw();
    },

    draw() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        const cs = this.cellSize;

        const N = this.gridN;

        // Title
        ctx.fillStyle = '#00d4ff';
        ctx.font = `bold ${Math.min(w * 0.05, 22)}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`Sudoku ${N}x${N}`, w / 2, 35);

        // Draw grid
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const x = this.offsetX + c * cs;
                const y = this.offsetY + r * cs;
                const key = `${r},${c}`;
                const isSel = this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c;
                const isConflict = this.conflicts.has(key);
                const isFixed = this.fixed[r][c];
                const isHover = this.hoverCell && this.hoverCell.r === r && this.hoverCell.c === c;

                // Cell bg
                if (isSel) ctx.fillStyle = '#00d4ff22';
                else if (isConflict) ctx.fillStyle = '#ff2d7b18';
                else if (isHover && !isFixed) ctx.fillStyle = '#ffffff0a';
                else ctx.fillStyle = '#12121f';
                ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

                // Cell border
                ctx.strokeStyle = isSel ? '#00d4ff' : isConflict ? '#ff2d7b' : '#ffffff20';
                ctx.lineWidth = isSel ? 2.5 : 1;
                ctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2);

                // Number
                if (this.grid[r][c] !== 0) {
                    if (isConflict) ctx.fillStyle = '#ff2d7b';
                    else if (isFixed) ctx.fillStyle = '#ffffff';
                    else ctx.fillStyle = '#00d4ff';
                    ctx.font = `bold ${cs * 0.5}px 'Segoe UI', sans-serif`;
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(this.grid[r][c], x + cs / 2, y + cs / 2);
                }
            }
        }

        // Box borders
        ctx.strokeStyle = '#00d4ff66';
        ctx.lineWidth = 3;
        const boxRowCount = N / this.boxRows;
        const boxColCount = N / this.boxCols;
        for (let br = 0; br < boxRowCount; br++) {
            for (let bc = 0; bc < boxColCount; bc++) {
                ctx.strokeRect(
                    this.offsetX + bc * this.boxCols * cs,
                    this.offsetY + br * this.boxRows * cs,
                    cs * this.boxCols, cs * this.boxRows
                );
            }
        }

        // Number pad
        const btnW = cs;
        const numCols = N <= 6 ? N : 5;
        const gap = N <= 6 ? 12 : 8;
        const totalBtnW = btnW * numCols + gap * (numCols - 1);
        const startX = (w - totalBtnW) / 2;

        ctx.fillStyle = '#667';
        ctx.font = `${Math.min(w * 0.035, 15)}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Select a cell, then pick a number:', w / 2, this.numPadY - 10);

        for (let i = 0; i < N; i++) {
            const col = i % numCols;
            const row = Math.floor(i / numCols);
            const x = startX + col * (btnW + gap);
            const y = this.numPadY + row * (btnW + gap);
            const hover = this.hoverNum === i + 1;

            const grad = ctx.createLinearGradient(x, y, x, y + btnW);
            grad.addColorStop(0, hover ? '#1e3a5f' : '#1a1a2e');
            grad.addColorStop(1, hover ? '#162d4a' : '#16162a');
            ctx.fillStyle = grad;
            this.roundRect(ctx, x, y, btnW, btnW, 10);
            ctx.fill();
            ctx.strokeStyle = hover ? '#ffd60a' : '#ffd60a44';
            ctx.lineWidth = hover ? 2.5 : 1.5;
            this.roundRect(ctx, x, y, btnW, btnW, 10);
            ctx.stroke();

            ctx.fillStyle = '#ffd60a';
            ctx.font = `bold ${btnW * 0.5}px 'Segoe UI', sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(i + 1, x + btnW / 2, y + btnW / 2);
        }

        // Completion
        if (this.gameOver) {
            ctx.globalAlpha = this.completionAnim;
            ctx.fillStyle = '#00e676';
            ctx.font = `bold ${Math.min(w * 0.08, 36)}px 'Segoe UI', sans-serif`;
            ctx.textAlign = 'center';
            const numPadRows = Math.ceil(N / (N <= 6 ? N : 5));
            ctx.fillText('Complete!', w / 2, this.numPadY + numPadRows * (cs + (N <= 6 ? 12 : 8)) + 20);
            ctx.globalAlpha = 1;
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

    pause() { this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        clearInterval(this.timerInterval);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('mousemove', this.handleMove);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default Sudoku;
