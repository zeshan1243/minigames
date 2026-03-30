const ConnectFour = {
    canvas: null, ctx: null, ui: null,
    board: null, turn: 'R', gameOver: false, paused: false,
    animFrame: null, score: 0, winCells: null,
    cols: 7, rows: 6, cellSize: 0, offsetX: 0, offsetY: 0,
    hoverCol: -1, winPulse: 0,
    // Drop animation
    dropping: false,
    dropDisc: null, // { col, targetRow, player, y, vy }

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('mousemove', this.handleMove);
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this.handleClick({ clientX: t.clientX, clientY: t.clientY });
        }, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        this.score = 0; this.ui.setScore(0); this.ui.hideGameOver(); this.ui.hidePause();
        this.newRound();
        this.loop();
    },

    newRound() {
        this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
        this.turn = 'R'; this.gameOver = false; this.winCells = null; this.winPulse = 0;
        this.dropping = false; this.dropDisc = null; this.hoverCol = -1;
        const w = this.ui.canvasW, h = this.ui.canvasH;
        this.cellSize = Math.min(w / (this.cols + 1), h / (this.rows + 2));
        this.offsetX = (w - this.cellSize * this.cols) / 2;
        this.offsetY = (h - this.cellSize * this.rows) / 2 + this.cellSize * 0.3;
    },

    getCol(clientX) {
        const r = this.canvas.getBoundingClientRect();
        const mx = clientX - r.left;
        const col = Math.floor((mx - this.offsetX) / this.cellSize);
        return (col >= 0 && col < this.cols) ? col : -1;
    },

    handleClick(e) {
        if (this.paused || this.dropping) return;
        if (this.gameOver) { this.newRound(); return; }
        if (this.ui.mode === '2p') {
            const col = this.getCol(e.clientX);
            if (col < 0 || this.board[0][col]) return;
            this.startDrop(col, this.turn);
        } else {
            if (this.turn !== 'R') return;
            const col = this.getCol(e.clientX);
            if (col < 0 || this.board[0][col]) return;
            this.startDrop(col, 'R');
        }
    },

    handleMove(e) {
        const canHover = this.ui.mode === '2p' ? true : this.turn === 'R';
        this.hoverCol = (!this.gameOver && canHover && !this.dropping) ? this.getCol(e.clientX) : -1;
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.paused = !this.paused;
            if (this.paused) this.ui.showPause(); else this.ui.hidePause();
        }
    },

    startDrop(col, player) {
        let row = -1;
        for (let r = this.rows - 1; r >= 0; r--) {
            if (!this.board[r][col]) { row = r; break; }
        }
        if (row < 0) return;

        // Start the disc above the board, animate it falling
        this.dropping = true;
        this.dropDisc = {
            col, targetRow: row, player,
            y: this.offsetY - this.cellSize * 0.5,       // start above board
            targetY: this.offsetY + row * this.cellSize + this.cellSize / 2,
            vy: 0,
            gravity: 0.6,
            bounces: 0,
            settled: false
        };
    },

    updateDrop() {
        if (!this.dropDisc) return;
        const d = this.dropDisc;

        d.vy += d.gravity;
        d.y += d.vy;

        // Hit target
        if (d.y >= d.targetY) {
            d.y = d.targetY;
            if (d.bounces < 2) {
                d.vy = -d.vy * 0.3; // bounce back up
                d.bounces++;
            } else {
                // Settled
                d.settled = true;
                this.dropping = false;
                this.board[d.targetRow][d.col] = d.player;
                this.dropDisc = null;
                this.afterDrop(d.col, d.player);
            }
        }
    },

    afterDrop(col, player) {
        const win = this.checkWin(player);
        if (win) {
            this.winCells = win;
            this.gameOver = true;
            if (player === 'R') {
                this.score++;
                this.ui.setScore(this.score);
                const best = this.ui.getHighScore() || 0;
                if (this.score > best) this.ui.setHighScore(this.score);
            }
            return;
        }
        if (this.board[0].every((_, c) => this.board[0][c])) {
            this.gameOver = true; return;
        }
        this.turn = player === 'R' ? 'Y' : 'R';
        if (this.turn === 'Y' && this.ui.mode !== '2p') {
            setTimeout(() => { if (!this.paused && !this.gameOver) this.aiMove(); }, 400);
        }
    },

    aiMove() {
        // Try to win
        for (let c = 0; c < this.cols; c++) {
            const r = this.findRow(c);
            if (r < 0) continue;
            this.board[r][c] = 'Y';
            if (this.checkWin('Y')) { this.board[r][c] = null; this.startDrop(c, 'Y'); return; }
            this.board[r][c] = null;
        }
        // Try to block
        for (let c = 0; c < this.cols; c++) {
            const r = this.findRow(c);
            if (r < 0) continue;
            this.board[r][c] = 'R';
            if (this.checkWin('R')) { this.board[r][c] = null; this.startDrop(c, 'Y'); return; }
            this.board[r][c] = null;
        }
        // Prefer center, then random
        const avail = [];
        for (let c = 0; c < this.cols; c++) if (this.findRow(c) >= 0) avail.push(c);
        if (avail.includes(3)) { this.startDrop(3, 'Y'); return; }
        this.startDrop(avail[Math.floor(Math.random() * avail.length)], 'Y');
    },

    findRow(col) {
        for (let r = this.rows - 1; r >= 0; r--) {
            if (!this.board[r][col]) return r;
        }
        return -1;
    },

    checkWin(p) {
        const b = this.board, R = this.rows, C = this.cols;
        const dirs = [[0,1],[1,0],[1,1],[1,-1]];
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                if (b[r][c] !== p) continue;
                for (const [dr, dc] of dirs) {
                    const cells = [];
                    for (let k = 0; k < 4; k++) {
                        const nr = r + dr * k, nc = c + dc * k;
                        if (nr < 0 || nr >= R || nc < 0 || nc >= C || b[nr][nc] !== p) break;
                        cells.push([nr, nc]);
                    }
                    if (cells.length === 4) return cells;
                }
            }
        }
        return null;
    },

    loop() {
        if (!this.paused) this.updateDrop();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        const cs = this.cellSize, ox = this.offsetX, oy = this.offsetY;
        const radius = cs * 0.38;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        if (this.winCells) this.winPulse += 0.05;

        // Board background
        ctx.fillStyle = '#0d1b3e';
        ctx.beginPath(); ctx.roundRect(ox - 6, oy - 6, cs * this.cols + 12, cs * this.rows + 12, 10); ctx.fill();

        // Hover indicator
        if (this.hoverCol >= 0 && !this.gameOver && !this.dropping) {
            const hx = ox + this.hoverCol * cs + cs / 2;
            const hoverColor = (this.ui.mode === '2p' && this.turn === 'Y') ? 'rgba(255, 214, 10, 0.6)' : 'rgba(255, 45, 123, 0.6)';
            ctx.fillStyle = hoverColor;
            ctx.beginPath(); ctx.arc(hx, oy - cs * 0.4, radius * 0.5, 0, Math.PI * 2); ctx.fill();
        }

        // Cells
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cx = ox + c * cs + cs / 2, cy = oy + r * cs + cs / 2;
                const isWin = this.winCells && this.winCells.some(([wr, wc]) => wr === r && wc === c);

                ctx.save();
                if (isWin) {
                    ctx.shadowColor = this.board[r][c] === 'R' ? '#ff2d7b' : '#ffd60a';
                    ctx.shadowBlur = 12 + Math.sin(this.winPulse) * 6;
                }

                if (!this.board[r][c]) {
                    ctx.fillStyle = '#060612';
                } else if (this.board[r][c] === 'R') {
                    ctx.fillStyle = '#ff2d7b';
                } else {
                    ctx.fillStyle = '#ffd60a';
                }
                ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        // Dropping disc (drawn on top of the board)
        if (this.dropDisc) {
            const d = this.dropDisc;
            const cx = ox + d.col * cs + cs / 2;
            ctx.save();
            ctx.shadowColor = d.player === 'R' ? '#ff2d7b' : '#ffd60a';
            ctx.shadowBlur = 15;
            ctx.fillStyle = d.player === 'R' ? '#ff2d7b' : '#ffd60a';
            ctx.beginPath(); ctx.arc(cx, d.y, radius, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Win highlight line
        if (this.winCells) {
            const [r1, c1] = this.winCells[0], [r2, c2] = this.winCells[3];
            const x1 = ox + c1 * cs + cs / 2, y1 = oy + r1 * cs + cs / 2;
            const x2 = ox + c2 * cs + cs / 2, y2 = oy + r2 * cs + cs / 2;
            ctx.save();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
            ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
            ctx.globalAlpha = 0.5 + Math.sin(this.winPulse) * 0.3;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.restore();
        }

        // Status
        ctx.fillStyle = '#888'; ctx.font = '16px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        if (this.gameOver) {
            let winner;
            if (this.ui.mode === '2p') {
                winner = this.winCells ? (this.board[this.winCells[0][0]][this.winCells[0][1]] === 'R' ? 'Player 1 Wins!' : 'Player 2 Wins!') : 'Draw!';
            } else {
                winner = this.winCells ? (this.board[this.winCells[0][0]][this.winCells[0][1]] === 'R' ? 'You Win!' : 'AI Wins!') : 'Draw!';
            }
            ctx.fillStyle = this.winCells && this.board[this.winCells[0][0]][this.winCells[0][1]] === 'R' ? '#00e676' : '#ff2d7b';
            if (!this.winCells) ctx.fillStyle = '#ffd60a';
            ctx.font = 'bold 22px JetBrains Mono, monospace';
            ctx.fillText(winner, w / 2, oy + cs * this.rows + 40);
            ctx.fillStyle = '#555'; ctx.font = '14px JetBrains Mono, monospace';
            ctx.fillText('Click to play again', w / 2, oy + cs * this.rows + 65);
        } else {
            if (this.ui.mode === '2p') {
                ctx.fillText(this.turn === 'R' ? "Player 1's turn (Red)" : "Player 2's turn (Yellow)", w / 2, oy - cs * 0.8);
            } else {
                ctx.fillText(this.turn === 'R' ? 'Your turn (Red)' : 'AI thinking...', w / 2, oy - cs * 0.8);
            }
        }
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKey); }
};
export default ConnectFour;
