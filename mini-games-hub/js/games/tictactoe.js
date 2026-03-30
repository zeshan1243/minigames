const TicTacToe = {
    canvas: null, ctx: null, ui: null,
    board: null, turn: 'X', gameOver: false, paused: false,
    animFrame: null, score: 0, winLine: null, cellSize: 0,
    offsetX: 0, offsetY: 0, hoverCell: null, winPulse: 0,

    // Animation state
    markAnims: {},       // { cellIndex: { type:'X'|'O', frame:0, maxFrames:15, scale:1 } }
    winLineProgress: 0,  // 0..1 how much of the win line is drawn
    winLineDrawing: false,

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
        this.board = Array(9).fill(null);
        this.turn = 'X'; this.gameOver = false; this.winLine = null; this.winPulse = 0;
        this.hoverCell = null;
        this.markAnims = {};
        this.winLineProgress = 0;
        this.winLineDrawing = false;
        const w = this.ui.canvasW, h = this.ui.canvasH;
        this.cellSize = Math.min(w, h) * 0.22;
        this.offsetX = (w - this.cellSize * 3) / 2;
        this.offsetY = (h - this.cellSize * 3) / 2;
    },

    getCell(clientX, clientY) {
        const r = this.canvas.getBoundingClientRect();
        const mx = clientX - r.left, my = clientY - r.top;
        const col = Math.floor((mx - this.offsetX) / this.cellSize);
        const row = Math.floor((my - this.offsetY) / this.cellSize);
        if (col >= 0 && col < 3 && row >= 0 && row < 3) return row * 3 + col;
        return -1;
    },

    placeMark(idx, mark) {
        this.board[idx] = mark;
        this.markAnims[idx] = { type: mark, frame: 0, maxFrames: 15, scale: 1.3 };
    },

    handleClick(e) {
        if (this.paused) return;
        if (this.gameOver) { this.newRound(); return; }
        if (this.ui.mode === '2p') {
            const idx = this.getCell(e.clientX, e.clientY);
            if (idx < 0 || this.board[idx]) return;
            this.placeMark(idx, this.turn);
            if (this.checkWin(this.turn)) { this.endRound(this.turn); return; }
            if (this.board.every(c => c)) { this.endRound(null); return; }
            this.turn = this.turn === 'X' ? 'O' : 'X';
        } else {
            if (this.turn !== 'X') return;
            const idx = this.getCell(e.clientX, e.clientY);
            if (idx < 0 || this.board[idx]) return;
            this.placeMark(idx, 'X');
            if (this.checkWin('X')) { this.endRound('X'); return; }
            if (this.board.every(c => c)) { this.endRound(null); return; }
            this.turn = 'O';
            setTimeout(() => { if (!this.paused) this.aiMove(); }, 300);
        }
    },

    handleMove(e) {
        const idx = this.getCell(e.clientX, e.clientY);
        const canHover = this.ui.mode === '2p' ? true : this.turn === 'X';
        this.hoverCell = (idx >= 0 && !this.board[idx] && canHover && !this.gameOver) ? idx : null;
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.paused = !this.paused;
            if (this.paused) this.ui.showPause(); else this.ui.hidePause();
        }
    },

    aiMove() {
        if (this.gameOver || this.paused) return;
        const move = this.minimax(this.board.slice(), 'O', 0);
        if (move.idx !== -1) this.placeMark(move.idx, 'O');
        if (this.checkWin('O')) { this.endRound('O'); return; }
        if (this.board.every(c => c)) { this.endRound(null); return; }
        this.turn = 'X';
    },

    minimax(board, player, depth) {
        const empty = board.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
        if (this.checkWinBoard(board, 'O')) return { score: 10 - depth };
        if (this.checkWinBoard(board, 'X')) return { score: depth - 10 };
        if (empty.length === 0) return { score: 0 };

        let best = { idx: -1, score: player === 'O' ? -Infinity : Infinity };
        for (const i of empty) {
            board[i] = player;
            const result = this.minimax(board, player === 'O' ? 'X' : 'O', depth + 1);
            board[i] = null;
            if (player === 'O') {
                if (result.score > best.score) best = { idx: i, score: result.score };
            } else {
                if (result.score < best.score) best = { idx: i, score: result.score };
            }
        }
        return best;
    },

    lines: [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]],

    checkWinBoard(board, p) {
        return this.lines.some(l => l.every(i => board[i] === p));
    },

    checkWin(p) {
        const wl = this.lines.find(l => l.every(i => this.board[i] === p));
        if (wl) { this.winLine = wl; this.winLineDrawing = true; this.winLineProgress = 0; return true; }
        return false;
    },

    endRound(winner) {
        this.gameOver = true;
        if (winner === 'X') {
            this.score++;
            this.ui.setScore(this.score);
            const best = this.ui.getHighScore() || 0;
            if (this.score > best) this.ui.setHighScore(this.score);
        }
    },

    loop() {
        this.updateAnims();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    updateAnims() {
        // Update mark drawing animations and bounce scale
        for (const idx in this.markAnims) {
            const a = this.markAnims[idx];
            if (a.frame < a.maxFrames) a.frame++;
            // Bounce: scale goes from 1.3 back to 1.0 with ease-out
            if (a.scale > 1.0) {
                a.scale = 1.0 + (1.3 - 1.0) * Math.max(0, 1 - (a.frame / a.maxFrames) * 2);
                if (a.scale < 1.0) a.scale = 1.0;
            }
        }
        // Update win line drawing progress
        if (this.winLineDrawing && this.winLineProgress < 1) {
            this.winLineProgress += 1 / 20; // draw over ~20 frames
            if (this.winLineProgress >= 1) {
                this.winLineProgress = 1;
                this.winLineDrawing = false;
            }
        }
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        const cs = this.cellSize, ox = this.offsetX, oy = this.offsetY;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        if (this.winLine) this.winPulse += 0.05;

        // Grid lines
        ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 3;
        for (let i = 1; i < 3; i++) {
            ctx.beginPath(); ctx.moveTo(ox + cs * i, oy); ctx.lineTo(ox + cs * i, oy + cs * 3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ox, oy + cs * i); ctx.lineTo(ox + cs * 3, oy + cs * i); ctx.stroke();
        }

        // Hover
        if (this.hoverCell !== null && !this.gameOver) {
            const hc = this.hoverCell % 3, hr = Math.floor(this.hoverCell / 3);
            const hoverColor = (this.ui.mode === '2p' && this.turn === 'O') ? 'rgba(255, 45, 123, 0.06)' : 'rgba(0, 212, 255, 0.06)';
            ctx.fillStyle = hoverColor;
            ctx.fillRect(ox + hc * cs, oy + hr * cs, cs, cs);
        }

        // Pieces
        for (let i = 0; i < 9; i++) {
            if (!this.board[i]) continue;
            const col = i % 3, row = Math.floor(i / 3);
            const cx = ox + col * cs + cs / 2, cy = oy + row * cs + cs / 2;
            const r = cs * 0.3;
            const isWinCell = this.winLine && this.winLine.includes(i);
            const glow = isWinCell ? 12 + Math.sin(this.winPulse) * 6 : 0;

            const anim = this.markAnims[i];
            const drawProgress = anim ? Math.min(anim.frame / anim.maxFrames, 1) : 1;
            const bounceScale = anim ? anim.scale : 1.0;

            ctx.save();
            if (glow) { ctx.shadowBlur = glow; ctx.shadowColor = this.board[i] === 'X' ? '#00d4ff' : '#ff2d7b'; }
            ctx.lineWidth = 4; ctx.lineCap = 'round';

            // Apply bounce scale around cell center
            ctx.translate(cx, cy);
            ctx.scale(bounceScale, bounceScale);
            ctx.translate(-cx, -cy);

            if (this.board[i] === 'X') {
                ctx.strokeStyle = '#00d4ff';
                // Animate X drawing with stroke-dashoffset technique
                const lineLen = Math.sqrt((2 * r) * (2 * r) + (2 * r) * (2 * r));
                // First stroke: draw from 0..0.5 of progress
                const p1 = Math.min(drawProgress * 2, 1);
                // Second stroke: draw from 0.5..1.0 of progress
                const p2 = Math.max(0, (drawProgress - 0.5) * 2);

                if (p1 > 0) {
                    ctx.save();
                    ctx.setLineDash([lineLen]);
                    ctx.lineDashOffset = lineLen * (1 - p1);
                    ctx.beginPath();
                    ctx.moveTo(cx - r, cy - r);
                    ctx.lineTo(cx + r, cy + r);
                    ctx.stroke();
                    ctx.restore();
                }
                if (p2 > 0) {
                    ctx.save();
                    ctx.setLineDash([lineLen]);
                    ctx.lineDashOffset = lineLen * (1 - p2);
                    ctx.beginPath();
                    ctx.moveTo(cx + r, cy - r);
                    ctx.lineTo(cx - r, cy + r);
                    ctx.stroke();
                    ctx.restore();
                }
            } else {
                ctx.strokeStyle = '#ff2d7b';
                // Animate O drawing with progressive arc
                const endAngle = -Math.PI / 2 + Math.PI * 2 * drawProgress;
                ctx.beginPath();
                ctx.arc(cx, cy, r, -Math.PI / 2, endAngle);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Win line with animated drawing and glow
        if (this.winLine) {
            const [a, , c] = this.winLine;
            const ax = ox + (a % 3) * cs + cs / 2, ay = oy + Math.floor(a / 3) * cs + cs / 2;
            const cx2 = ox + (c % 3) * cs + cs / 2, cy2 = oy + Math.floor(c / 3) * cs + cs / 2;

            // Compute the partial endpoint based on winLineProgress
            const ex = ax + (cx2 - ax) * this.winLineProgress;
            const ey = ay + (cy2 - ay) * this.winLineProgress;

            ctx.save();
            ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
            const glowAmount = 10 + Math.sin(this.winPulse) * 5;
            ctx.shadowColor = '#ffd60a'; ctx.shadowBlur = glowAmount;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.stroke();
            // Second pass for extra glow intensity
            ctx.shadowBlur = glowAmount * 1.5;
            ctx.globalAlpha = 0.4;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.restore();
        }

        // Status text
        ctx.fillStyle = '#888'; ctx.font = '16px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        if (this.gameOver) {
            let winner;
            if (this.ui.mode === '2p') {
                winner = this.winLine ? (this.board[this.winLine[0]] === 'X' ? 'Player 1 Wins!' : 'Player 2 Wins!') : 'Draw!';
            } else {
                winner = this.winLine ? (this.board[this.winLine[0]] === 'X' ? 'You Win!' : 'AI Wins!') : 'Draw!';
            }
            ctx.fillStyle = this.winLine && this.board[this.winLine[0]] === 'X' ? '#00e676' : '#ff2d7b';
            if (!this.winLine) ctx.fillStyle = '#ffd60a';
            ctx.font = 'bold 22px JetBrains Mono, monospace';
            ctx.fillText(winner, w / 2, oy + cs * 3 + 40);
            ctx.fillStyle = '#555'; ctx.font = '14px JetBrains Mono, monospace';
            ctx.fillText('Click to play again', w / 2, oy + cs * 3 + 65);
        } else {
            if (this.ui.mode === '2p') {
                ctx.fillText(this.turn === 'X' ? "Player 1's turn (X)" : "Player 2's turn (O)", w / 2, oy - 15);
            } else {
                ctx.fillText(this.turn === 'X' ? 'Your turn (X)' : 'AI thinking...', w / 2, oy - 15);
            }
        }
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKey); }
};
export default TicTacToe;
