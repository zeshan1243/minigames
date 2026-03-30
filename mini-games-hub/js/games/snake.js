const Snake = {
    canvas: null,
    ctx: null,
    ui: null,
    gridSize: 20,
    cellSize: 0,
    snake: [],
    food: null,
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    speed: 150,
    gameOver: false,
    paused: false,
    tickTimer: null,
    animFrame: null,
    touchStartX: 0,
    touchStartY: 0,

    // Animation state
    prevSnake: [],         // snapshot of snake positions from the previous tick
    lastTickTime: 0,       // timestamp of last tick
    tickProgress: 0,       // 0..1 interpolation between ticks
    foodScale: 1,          // current food scale for pop effect
    foodSpawnTime: 0,      // when food was last spawned
    particles: [],         // eat particles [{x, y, vx, vy, life, maxLife, color}]

    // 2P state
    snake2: [],
    prevSnake2: [],
    direction2: 'left',
    nextDirection2: 'left',
    score2: 0,
    snake1Dead: false,
    snake2Dead: false,

    is2P() {
        return this.ui && this.ui.mode === '2p';
    },

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.cellSize = ui.canvasW / this.gridSize;
        this.handleKey = this.handleKey.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    },

    start() {
        // Configure difficulty
        const level = (this.ui && this.ui.level) || 'medium';
        if (level === 'easy') {
            this._baseSpeed = 180; this._wallCount = 0;
        } else if (level === 'hard') {
            this._baseSpeed = 120; this._wallCount = 12;
        } else {
            this._baseSpeed = 150; this._wallCount = 5;
        }

        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.lastTickTime = performance.now();
        this.tick();
        this.renderLoop();
    },

    reset() {
        clearTimeout(this.tickTimer);
        cancelAnimationFrame(this.animFrame);
        const mid = Math.floor(this.gridSize / 2);

        if (this.is2P()) {
            // Player 1 starts left of center, facing right
            this.snake = [
                { x: mid - 3, y: mid },
                { x: mid - 4, y: mid },
                { x: mid - 5, y: mid }
            ];
            this.prevSnake = this.snake.map(s => ({ ...s }));
            this.direction = 'right';
            this.nextDirection = 'right';
            this.score = 0;

            // Player 2 starts right of center, facing left
            this.snake2 = [
                { x: mid + 3, y: mid },
                { x: mid + 4, y: mid },
                { x: mid + 5, y: mid }
            ];
            this.prevSnake2 = this.snake2.map(s => ({ ...s }));
            this.direction2 = 'left';
            this.nextDirection2 = 'left';
            this.score2 = 0;

            this.snake1Dead = false;
            this.snake2Dead = false;

            this.ui.setScore('P1: 0 | P2: 0');
        } else {
            this.snake = [
                { x: mid, y: mid },
                { x: mid - 1, y: mid },
                { x: mid - 2, y: mid }
            ];
            this.prevSnake = this.snake.map(s => ({ ...s }));
            this.direction = 'right';
            this.nextDirection = 'right';
            this.score = 0;
            this.ui.setScore(0);
        }

        this.speed = this._baseSpeed || 150;
        this.particles = [];
        this.tickProgress = 0;
        this.placeWalls();
        this.spawnFood();
    },

    placeWalls() {
        this.walls = [];
        const count = this._wallCount || 0;
        if (count === 0) return;
        // Collect occupied positions (snake start positions)
        const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`));
        if (this.is2P()) {
            this.snake2.forEach(s => occupied.add(`${s.x},${s.y}`));
        }
        let placed = 0;
        let attempts = 0;
        while (placed < count && attempts < 500) {
            attempts++;
            const wx = Math.floor(Math.random() * this.gridSize);
            const wy = Math.floor(Math.random() * this.gridSize);
            const key = `${wx},${wy}`;
            if (!occupied.has(key)) {
                this.walls.push({ x: wx, y: wy });
                occupied.add(key);
                placed++;
            }
        }
    },

    spawnFood() {
        const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`));
        if (this.is2P()) {
            this.snake2.forEach(s => occupied.add(`${s.x},${s.y}`));
        }
        // Also avoid walls
        if (this.walls) {
            this.walls.forEach(w => occupied.add(`${w.x},${w.y}`));
        }
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (occupied.has(`${pos.x},${pos.y}`));
        this.food = pos;
        this.foodSpawnTime = performance.now();
        this.foodScale = 0.01; // start tiny for pop-in
    },

    tick() {
        if (this.gameOver) return;
        if (!this.paused) {
            if (this.is2P()) {
                this.tick2P();
            } else {
                this.tick1P();
            }
        }
        this.tickTimer = setTimeout(() => this.tick(), this.speed);
    },

    tick1P() {
        // Save previous positions for interpolation
        this.prevSnake = this.snake.map(s => ({ ...s }));
        this.lastTickTime = performance.now();
        this.tickProgress = 0;

        this.direction = this.nextDirection;
        const head = { ...this.snake[0] };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Wall collision
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            this.endGame();
            return;
        }

        // Wall block collision
        if (this.walls && this.walls.some(w => w.x === head.x && w.y === head.y)) {
            this.endGame();
            return;
        }

        // Self collision
        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.endGame();
            return;
        }

        this.snake.unshift(head);

        // Food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.ui.setScore(this.score);

            // Spawn eat particles
            this.spawnEatParticles(this.food.x, this.food.y, '#ff2d7b');

            this.spawnFood();
            // Speed up
            if (this.score % 50 === 0 && this.speed > 80) {
                this.speed -= 10;
            }
            // When growing, duplicate the last prev segment so interpolation works
            this.prevSnake.push({ ...this.prevSnake[this.prevSnake.length - 1] });
        } else {
            this.snake.pop();
        }
    },

    tick2P() {
        // Save previous positions for interpolation
        this.prevSnake = this.snake.map(s => ({ ...s }));
        this.prevSnake2 = this.snake2.map(s => ({ ...s }));
        this.lastTickTime = performance.now();
        this.tickProgress = 0;

        // Compute new heads
        this.direction = this.nextDirection;
        this.direction2 = this.nextDirection2;

        const head1 = { ...this.snake[0] };
        switch (this.direction) {
            case 'up': head1.y--; break;
            case 'down': head1.y++; break;
            case 'left': head1.x--; break;
            case 'right': head1.x++; break;
        }

        const head2 = { ...this.snake2[0] };
        switch (this.direction2) {
            case 'up': head2.y--; break;
            case 'down': head2.y++; break;
            case 'left': head2.x--; break;
            case 'right': head2.x++; break;
        }

        // Check deaths
        let p1Dies = false;
        let p2Dies = false;

        // Wall collision
        if (head1.x < 0 || head1.x >= this.gridSize || head1.y < 0 || head1.y >= this.gridSize) {
            p1Dies = true;
        }
        if (head2.x < 0 || head2.x >= this.gridSize || head2.y < 0 || head2.y >= this.gridSize) {
            p2Dies = true;
        }

        // Wall block collision
        if (this.walls) {
            if (!p1Dies && this.walls.some(w => w.x === head1.x && w.y === head1.y)) p1Dies = true;
            if (!p2Dies && this.walls.some(w => w.x === head2.x && w.y === head2.y)) p2Dies = true;
        }

        // Self collision
        if (!p1Dies && this.snake.some(s => s.x === head1.x && s.y === head1.y)) {
            p1Dies = true;
        }
        if (!p2Dies && this.snake2.some(s => s.x === head2.x && s.y === head2.y)) {
            p2Dies = true;
        }

        // Cross collision: P1 head into P2 body
        if (!p1Dies && this.snake2.some(s => s.x === head1.x && s.y === head1.y)) {
            p1Dies = true;
        }
        // Cross collision: P2 head into P1 body
        if (!p2Dies && this.snake.some(s => s.x === head2.x && s.y === head2.y)) {
            p2Dies = true;
        }

        // Head-on collision (both heads same cell)
        if (!p1Dies && !p2Dies && head1.x === head2.x && head1.y === head2.y) {
            p1Dies = true;
            p2Dies = true;
        }

        if (p1Dies || p2Dies) {
            this.snake1Dead = p1Dies;
            this.snake2Dead = p2Dies;
            this.endGame();
            return;
        }

        // Move snakes
        this.snake.unshift(head1);
        this.snake2.unshift(head2);

        // Food - check who ate it
        let p1Ate = (head1.x === this.food.x && head1.y === this.food.y);
        let p2Ate = (head2.x === this.food.x && head2.y === this.food.y);

        if (p1Ate || p2Ate) {
            if (p1Ate) {
                this.score += 10;
                this.prevSnake.push({ ...this.prevSnake[this.prevSnake.length - 1] });
            } else {
                this.snake.pop();
            }
            if (p2Ate) {
                this.score2 += 10;
                this.prevSnake2.push({ ...this.prevSnake2[this.prevSnake2.length - 1] });
            } else {
                this.snake2.pop();
            }

            this.spawnEatParticles(this.food.x, this.food.y, '#ff2d7b');
            this.ui.setScore(`P1: ${this.score} | P2: ${this.score2}`);
            this.spawnFood();

            // Speed up based on combined score
            const totalScore = this.score + this.score2;
            if (totalScore % 50 === 0 && this.speed > 80) {
                this.speed -= 10;
            }
        } else {
            this.snake.pop();
            this.snake2.pop();
        }
    },

    spawnEatParticles(fx, fy, color) {
        const cs = this.cellSize;
        const px = fx * cs + cs / 2;
        const py = fy * cs + cs / 2;
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 3;
            this.particles.push({
                x: px, y: py,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                maxLife: 15 + Math.random() * 15,
                color: color
            });
        }
    },

    renderLoop() {
        if (this.gameOver) return;
        this.render();
        this.animFrame = requestAnimationFrame(() => this.renderLoop());
    },

    // Lerp helper
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const cs = this.cellSize;
        const now = performance.now();

        // Compute interpolation progress
        const elapsed = now - this.lastTickTime;
        this.tickProgress = Math.min(elapsed / this.speed, 1);
        const t = this.tickProgress;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cs, 0);
            ctx.lineTo(i * cs, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cs);
            ctx.lineTo(w, i * cs);
            ctx.stroke();
        }

        // Wall blocks (gray squares)
        if (this.walls) {
            ctx.fillStyle = '#666';
            for (const wall of this.walls) {
                ctx.fillRect(wall.x * cs + 1, wall.y * cs + 1, cs - 2, cs - 2);
            }
        }

        // Food with glow and pop effect
        const foodAge = now - this.foodSpawnTime;
        if (this.foodScale < 1) {
            // Elastic pop: overshoot then settle
            const popDuration = 300; // ms
            const pt = Math.min(foodAge / popDuration, 1);
            // Elastic ease-out
            this.foodScale = pt === 1 ? 1 : 1 - Math.pow(2, -10 * pt) * Math.cos((pt * 10 - 0.75) * (2 * Math.PI / 3));
            if (this.foodScale < 0.01) this.foodScale = 0.01;
        }

        ctx.save();
        ctx.shadowColor = '#ff2d7b';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ff2d7b';
        ctx.beginPath();
        ctx.arc(this.food.x * cs + cs / 2, this.food.y * cs + cs / 2, (cs / 2.5) * this.foodScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Render Player 1 snake (green)
        this.renderSnake(ctx, this.snake, this.prevSnake, this.direction, t, cs, '#00e676', 145);

        // Render Player 2 snake (cyan) in 2P mode
        if (this.is2P()) {
            this.renderSnake(ctx, this.snake2, this.prevSnake2, this.direction2, t, cs, '#00d4ff', 190);
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life++;
            const alpha = 1 - p.life / p.maxLife;
            const size = 3 * alpha;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
            }
        }
        ctx.globalAlpha = 1;
    },

    renderSnake(ctx, snake, prevSnake, direction, t, cs, headColor, hue) {
        // Snake body with interpolation
        for (let i = snake.length - 1; i >= 0; i--) {
            const seg = snake[i];
            const prev = prevSnake[i] || seg;
            const isHead = i === 0;
            const r = cs * 0.42;

            // Interpolate position
            const ix = this.lerp(prev.x, seg.x, t);
            const iy = this.lerp(prev.y, seg.y, t);

            ctx.fillStyle = isHead ? headColor : `hsl(${hue}, 80%, ${50 - i * 0.5}%)`;
            ctx.beginPath();
            ctx.roundRect(ix * cs + (cs - r * 2) / 2, iy * cs + (cs - r * 2) / 2, r * 2, r * 2, 4);
            ctx.fill();
        }

        // Eyes on head (interpolated)
        const headSeg = snake[0];
        const headPrev = prevSnake[0] || headSeg;
        const hx = this.lerp(headPrev.x, headSeg.x, t);
        const hy = this.lerp(headPrev.y, headSeg.y, t);
        ctx.fillStyle = '#000';
        const eyeSize = 2.5;
        let ex1, ey1, ex2, ey2;
        const cx = hx * cs + cs / 2;
        const cy = hy * cs + cs / 2;
        switch (direction) {
            case 'right': ex1 = cx + 4; ey1 = cy - 4; ex2 = cx + 4; ey2 = cy + 4; break;
            case 'left':  ex1 = cx - 4; ey1 = cy - 4; ex2 = cx - 4; ey2 = cy + 4; break;
            case 'up':    ex1 = cx - 4; ey1 = cy - 4; ex2 = cx + 4; ey2 = cy - 4; break;
            case 'down':  ex1 = cx - 4; ey1 = cy + 4; ex2 = cx + 4; ey2 = cy + 4; break;
        }
        ctx.beginPath(); ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2); ctx.fill();
    },

    endGame() {
        this.gameOver = true;
        clearTimeout(this.tickTimer);
        cancelAnimationFrame(this.animFrame);
        this.render();

        if (this.is2P()) {
            let result;
            if (this.snake1Dead && this.snake2Dead) {
                result = 'Draw!';
            } else if (this.snake1Dead) {
                result = 'Player 2 wins!';
            } else {
                result = 'Player 1 wins!';
            }
            const summaryScore = `P1: ${this.score} | P2: ${this.score2}`;
            this.ui.showGameOver(summaryScore, result);
        } else {
            this.ui.setHighScore(this.score);
            const best = this.ui.getHighScore();
            this.ui.showGameOver(this.score, best);
        }
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }

        if (this.is2P()) {
            // Player 1: WASD
            const map1 = { w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
            // Player 2: Arrow keys
            const map2 = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
            const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };

            const dir1 = map1[e.key];
            if (dir1) {
                e.preventDefault();
                if (dir1 !== opposites[this.direction]) {
                    this.nextDirection = dir1;
                }
                return;
            }
            const dir2 = map2[e.key];
            if (dir2) {
                e.preventDefault();
                if (dir2 !== opposites[this.direction2]) {
                    this.nextDirection2 = dir2;
                }
                return;
            }
        } else {
            // 1P: both WASD and arrows control the single snake
            const map = {
                ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                w: 'up', s: 'down', a: 'left', d: 'right'
            };
            const dir = map[e.key];
            if (!dir) return;
            e.preventDefault();
            const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
            if (dir !== opposites[this.direction]) {
                this.nextDirection = dir;
            }
        }
    },

    handleTouchStart(e) {
        e.preventDefault();
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    },

    handleTouchEnd(e) {
        e.preventDefault();
        const dx = e.changedTouches[0].clientX - this.touchStartX;
        const dy = e.changedTouches[0].clientY - this.touchStartY;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        let dir;
        if (Math.abs(dx) > Math.abs(dy)) {
            dir = dx > 0 ? 'right' : 'left';
        } else {
            dir = dy > 0 ? 'down' : 'up';
        }
        if (dir !== opposites[this.direction]) {
            this.nextDirection = dir;
        }
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) {
            this.ui.showPause();
        } else {
            this.ui.hidePause();
        }
    },

    pause() { this.togglePause(); },
    resume() {
        if (this.paused) this.togglePause();
    },

    destroy() {
        clearTimeout(this.tickTimer);
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default Snake;
