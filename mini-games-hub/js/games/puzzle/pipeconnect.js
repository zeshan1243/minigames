const PipeConnect = {
    canvas: null, ctx: null, ui: null,
    grid: null, size: 6, cellSize: 0, offsetX: 0, offsetY: 0,
    gameOver: false, paused: false, animFrame: null,
    startTime: 0, elapsed: 0, connected: null,
    sourceR: 0, sourceC: 0, drainR: 0, drainC: 0,
    flowAnim: 0,

    // Animation state
    rotating: false,         // true while any pipe is animating rotation
    rotatingR: -1,           // row of rotating pipe
    rotatingC: -1,           // col of rotating pipe
    rotAngle: 0,             // current rotation angle in radians
    rotTarget: Math.PI / 2,  // target rotation (always 90 deg)
    rotProgress: 0,          // frame counter
    rotFrames: 10,           // total frames for rotation
    rotOldOpenings: null,    // openings before rotation (for rendering during anim)
    flowGlowPhase: 0,       // global phase for flow glow pulsing

    // Pipe types: openings are [top, right, bottom, left] booleans
    TYPES: {
        straight: [[1,0,1,0],[0,1,0,1]],
        corner: [[1,1,0,0],[0,1,1,0],[0,0,1,1],[1,0,0,1]],
        tee: [[1,1,1,0],[0,1,1,1],[1,0,1,1],[1,1,0,1]],
        cross: [[1,1,1,1]]
    },

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this.handleClick({ clientX: t.clientX, clientY: t.clientY });
        }, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        // Configure difficulty
        const level = this.ui.level || 'medium';
        if (level === 'easy') { this.size = 4; }
        else if (level === 'hard' || level === 'expert') { this.size = 8; }
        else { this.size = 6; }

        this.ui.hideGameOver(); this.ui.hidePause();
        this.generatePuzzle();
        this.startTime = performance.now(); this.elapsed = 0;
        this.loop();
    },

    generatePuzzle() {
        this.gameOver = false; this.flowAnim = 0;
        this.rotating = false;
        this.rotatingR = -1; this.rotatingC = -1;
        this.rotProgress = 0; this.flowGlowPhase = 0;
        const S = this.size;
        this.sourceR = 0; this.sourceC = 0;
        this.drainR = S - 1; this.drainC = S - 1;

        // Build a path from source to drain
        const path = this.buildPath();
        this.grid = Array.from({ length: S }, () => Array(S).fill(null));

        // Place pipe pieces along the path with correct connections
        for (let i = 0; i < path.length; i++) {
            const [r, c] = path[i];
            const openings = [false, false, false, false]; // top, right, bottom, left
            if (i > 0) {
                const [pr, pc] = path[i - 1];
                if (pr < r) openings[0] = true; // from top
                if (pr > r) openings[2] = true; // from bottom
                if (pc < c) openings[3] = true; // from left
                if (pc > c) openings[1] = true; // from right
            } else {
                // source: needs opening towards next
                openings[3] = true; // extra opening for source marker
            }
            if (i < path.length - 1) {
                const [nr, nc] = path[i + 1];
                if (nr < r) openings[0] = true;
                if (nr > r) openings[2] = true;
                if (nc < c) openings[3] = true;
                if (nc > c) openings[1] = true;
            } else {
                openings[1] = true; // extra opening for drain marker
            }
            this.grid[r][c] = { openings: openings.slice(), type: this.classifyPipe(openings) };
        }

        // Fill remaining cells with random pipes
        for (let r = 0; r < S; r++) {
            for (let c = 0; c < S; c++) {
                if (this.grid[r][c]) continue;
                const types = ['straight', 'corner', 'tee', 'cross'];
                const type = types[Math.floor(Math.random() * types.length)];
                const variants = this.TYPES[type];
                const openings = variants[Math.floor(Math.random() * variants.length)].slice();
                this.grid[r][c] = { openings, type };
            }
        }

        // Scramble all pipes by rotating randomly
        for (let r = 0; r < S; r++) {
            for (let c = 0; c < S; c++) {
                const rotations = Math.floor(Math.random() * 4);
                for (let k = 0; k < rotations; k++) this.rotatePipe(r, c);
            }
        }

        this.connected = Array.from({ length: S }, () => Array(S).fill(false));
        this.checkConnections();

        const w = this.ui.canvasW, h = this.ui.canvasH;
        this.cellSize = Math.min((w - 20) / S, (h - 80) / S);
        this.offsetX = (w - this.cellSize * S) / 2;
        this.offsetY = (h - this.cellSize * S) / 2;
    },

    buildPath() {
        const S = this.size;
        const visited = Array.from({ length: S }, () => Array(S).fill(false));
        const path = [[0, 0]];
        visited[0][0] = true;
        let r = 0, c = 0;
        while (r !== S - 1 || c !== S - 1) {
            const moves = [];
            if (r > 0 && !visited[r-1][c]) moves.push([r-1, c]);
            if (r < S-1 && !visited[r+1][c]) moves.push([r+1, c]);
            if (c > 0 && !visited[r][c-1]) moves.push([r, c-1]);
            if (c < S-1 && !visited[r][c+1]) moves.push([r, c+1]);

            // Bias towards drain
            const biased = moves.filter(([mr, mc]) => mr >= r || mc >= c);
            const choices = biased.length > 0 ? biased : moves;
            if (choices.length === 0) break;

            const [nr, nc] = choices[Math.floor(Math.random() * choices.length)];
            visited[nr][nc] = true;
            path.push([nr, nc]);
            r = nr; c = nc;
        }
        return path;
    },

    classifyPipe(openings) {
        const count = openings.filter(v => v).length;
        if (count === 4) return 'cross';
        if (count === 3) return 'tee';
        if (count === 2) {
            if ((openings[0] && openings[2]) || (openings[1] && openings[3])) return 'straight';
            return 'corner';
        }
        return 'straight';
    },

    rotatePipe(r, c) {
        const o = this.grid[r][c].openings;
        this.grid[r][c].openings = [o[3], o[0], o[1], o[2]];
    },

    getCell(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = clientX - rect.left, my = clientY - rect.top;
        const col = Math.floor((mx - this.offsetX) / this.cellSize);
        const row = Math.floor((my - this.offsetY) / this.cellSize);
        if (col >= 0 && col < this.size && row >= 0 && row < this.size) return [row, col];
        return null;
    },

    // EaseOut for smooth rotation deceleration
    easeOut(t) {
        return 1 - (1 - t) * (1 - t);
    },

    handleClick(e) {
        if (this.paused) return;
        if (this.rotating) return; // Block clicks during rotation animation
        if (this.gameOver) { this.generatePuzzle(); this.startTime = performance.now(); return; }
        const cell = this.getCell(e.clientX, e.clientY);
        if (!cell) return;

        // Start rotation animation instead of instant rotate
        this.rotatingR = cell[0];
        this.rotatingC = cell[1];
        this.rotOldOpenings = this.grid[cell[0]][cell[1]].openings.slice();
        this.rotProgress = 0;
        this.rotating = true;

        // Apply the actual rotation to the data immediately (for connection check after anim)
        this.rotatePipe(cell[0], cell[1]);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.paused = !this.paused;
            if (this.paused) this.ui.showPause(); else this.ui.hidePause();
        }
    },

    checkConnections() {
        const S = this.size;
        this.connected = Array.from({ length: S }, () => Array(S).fill(false));
        const queue = [[this.sourceR, this.sourceC]];
        this.connected[this.sourceR][this.sourceC] = true;
        const opp = [2, 3, 0, 1]; // opposite direction
        const dr = [-1, 0, 1, 0], dc = [0, 1, 0, -1];

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            const o = this.grid[r][c].openings;
            for (let d = 0; d < 4; d++) {
                if (!o[d]) continue;
                const nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= S || nc < 0 || nc >= S) continue;
                if (this.connected[nr][nc]) continue;
                if (!this.grid[nr][nc].openings[opp[d]]) continue;
                this.connected[nr][nc] = true;
                queue.push([nr, nc]);
            }
        }
    },

    loop() {
        if (!this.paused && !this.gameOver) {
            this.elapsed = Math.floor((performance.now() - this.startTime) / 1000);
            this.ui.setScore(`Time: ${this.elapsed}s`);
        }

        // Update rotation animation
        if (this.rotating) {
            this.rotProgress++;
            if (this.rotProgress >= this.rotFrames) {
                // Animation complete
                this.rotating = false;
                this.rotatingR = -1;
                this.rotatingC = -1;
                this.rotOldOpenings = null;
                this.rotProgress = 0;

                // Now check connections after rotation completes
                this.checkConnections();

                if (this.connected[this.drainR][this.drainC]) {
                    this.gameOver = true;
                    this.elapsed = Math.floor((performance.now() - this.startTime) / 1000);
                    const score = Math.max(1, 300 - this.elapsed);
                    this.ui.setScore(score);
                    const best = this.ui.getHighScore() || 0;
                    if (score > best) this.ui.setHighScore(score);
                    this.ui.showGameOver(score, 'Best: ' + Math.max(score, best));
                }
            }
        }

        // Update flow glow phase
        this.flowGlowPhase += 0.08;

        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    // Draw a pipe's arms from center to edges based on openings
    drawPipeArms(ctx, cx, cy, cs, gap, pw, openings, color, glowColor, isConnected) {
        ctx.strokeStyle = color; ctx.lineWidth = pw; ctx.lineCap = 'round';
        if (isConnected) { ctx.shadowColor = glowColor; ctx.shadowBlur = 8; }

        const halfCs = cs / 2;
        if (openings[0]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -(halfCs - gap)); ctx.stroke(); }
        if (openings[1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(halfCs - gap, 0); ctx.stroke(); }
        if (openings[2]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, halfCs - gap); ctx.stroke(); }
        if (openings[3]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-(halfCs - gap), 0); ctx.stroke(); }

        // Center dot
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(0, 0, pw * 0.4, 0, Math.PI * 2); ctx.fill();
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        const cs = this.cellSize, ox = this.offsetX, oy = this.offsetY;
        const S = this.size;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        if (this.gameOver) this.flowAnim += 0.05;

        for (let r = 0; r < S; r++) {
            for (let c = 0; c < S; c++) {
                const x = ox + c * cs, y = oy + r * cs;
                const pipe = this.grid[r][c];
                const conn = this.connected[r][c];
                const gap = 2;

                // Cell background
                ctx.fillStyle = conn ? '#0a1a2a' : '#0e0e18';
                ctx.beginPath(); ctx.roundRect(x + gap, y + gap, cs - gap * 2, cs - gap * 2, 4); ctx.fill();

                // Draw pipe
                const cx = x + cs / 2, cy = y + cs / 2;
                const pw = cs * 0.22; // pipe width
                const color = conn ? '#00d4ff' : '#333';
                const glowColor = conn ? '#00d4ff' : 'transparent';

                const isRotating = this.rotating && r === this.rotatingR && c === this.rotatingC;

                ctx.save();

                if (isRotating) {
                    // Smooth rotation animation: use old openings and rotate the canvas
                    const t = this.easeOut(this.rotProgress / this.rotFrames);
                    const angle = t * (Math.PI / 2); // 0 to 90 degrees

                    ctx.translate(cx, cy);
                    ctx.rotate(angle);

                    // Draw using old openings (pre-rotation) so the visual rotates smoothly
                    this.drawPipeArms(ctx, cx, cy, cs, gap, pw, this.rotOldOpenings, color, glowColor, conn);
                } else {
                    ctx.translate(cx, cy);

                    // Flow glow pulsing for connected pipes
                    if (conn && !this.gameOver) {
                        const pulse = Math.sin(this.flowGlowPhase - r * 0.5 - c * 0.5) * 0.5 + 0.5;
                        ctx.shadowColor = `rgba(0, 212, 255, ${0.3 + pulse * 0.5})`;
                        ctx.shadowBlur = 6 + pulse * 10;
                    }

                    this.drawPipeArms(ctx, cx, cy, cs, gap, pw, pipe.openings, color, glowColor, conn);

                    // Extra flow glow overlay for connected pipes
                    if (conn && !this.gameOver) {
                        const pulse = Math.sin(this.flowGlowPhase - r * 0.5 - c * 0.5) * 0.5 + 0.5;
                        const glowAlpha = pulse * 0.3;
                        ctx.strokeStyle = `rgba(100, 230, 255, ${glowAlpha})`;
                        ctx.lineWidth = pw * 0.6;
                        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
                        const o = pipe.openings;
                        const halfCs = cs / 2;
                        if (o[0]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -(halfCs - gap)); ctx.stroke(); }
                        if (o[1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(halfCs - gap, 0); ctx.stroke(); }
                        if (o[2]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, halfCs - gap); ctx.stroke(); }
                        if (o[3]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-(halfCs - gap), 0); ctx.stroke(); }
                    }
                }

                ctx.restore();

                // Source / Drain markers
                if (r === this.sourceR && c === this.sourceC) {
                    ctx.fillStyle = '#00e676'; ctx.font = 'bold 12px JetBrains Mono'; ctx.textAlign = 'center';
                    ctx.fillText('S', cx, cy + 4);
                }
                if (r === this.drainR && c === this.drainC) {
                    ctx.fillStyle = '#ff2d7b'; ctx.font = 'bold 12px JetBrains Mono'; ctx.textAlign = 'center';
                    ctx.fillText('D', cx, cy + 4);
                }
            }
        }

        // Instructions
        ctx.fillStyle = '#555'; ctx.font = '13px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText('Click pipes to rotate \u2022 Connect S to D', w / 2, oy - 15);

        if (this.gameOver) {
            ctx.fillStyle = '#00e676'; ctx.font = 'bold 22px JetBrains Mono, monospace';
            ctx.fillText('Connected!', w / 2, oy + cs * S + 35);
            ctx.fillStyle = '#555'; ctx.font = '14px JetBrains Mono, monospace';
            ctx.fillText('Click for new puzzle', w / 2, oy + cs * S + 60);
        }
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.startTime = performance.now() - this.elapsed * 1000; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKey); }
};
export default PipeConnect;
