const Runner = {
    canvas: null,
    ctx: null,
    ui: null,
    // Player
    player: { x: 60, y: 0, w: 30, h: 40, vy: 0, grounded: true, frame: 0 },
    // World
    groundY: 0,
    gravity: 0.6,
    jumpForce: -12,
    gameSpeed: 4,
    maxSpeed: 12,
    score: 0,
    obstacles: [],
    groundTiles: [],
    clouds: [],
    // State
    gameOver: false,
    paused: false,
    animFrame: null,
    lastTime: 0,
    spawnTimer: 0,
    spawnInterval: 90,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.groundY = ui.canvasH - 80;
        this.handleKey = this.handleKey.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.lastTime = performance.now();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.player.y = this.groundY - this.player.h;
        this.player.vy = 0;
        this.player.grounded = true;
        this.player.frame = 0;
        this.gameSpeed = 4;
        this.score = 0;
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 90;
        this.ui.setScore(0);

        // Init clouds
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.ui.canvasW,
                y: 30 + Math.random() * 100,
                w: 40 + Math.random() * 60,
                speed: 0.2 + Math.random() * 0.3
            });
        }

        // Init ground tiles
        this.groundTiles = [];
        for (let x = 0; x < this.ui.canvasW + 40; x += 20) {
            this.groundTiles.push(x);
        }
    },

    loop() {
        if (this.gameOver) return;
        const now = performance.now();
        if (!this.paused) {
            this.update();
        }
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        const p = this.player;

        // Gravity
        p.vy += this.gravity;
        p.y += p.vy;

        // Ground
        if (p.y >= this.groundY - p.h) {
            p.y = this.groundY - p.h;
            p.vy = 0;
            p.grounded = true;
        }

        // Running animation
        p.frame += 0.15;

        // Score
        this.score += this.gameSpeed * 0.1;
        this.ui.setScore(Math.floor(this.score));

        // Speed increase
        this.gameSpeed = Math.min(this.maxSpeed, 4 + this.score * 0.002);

        // Obstacles
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(40, 90 - this.score * 0.05);
            const h = 20 + Math.random() * 30;
            this.obstacles.push({
                x: this.ui.canvasW,
                y: this.groundY - h,
                w: 20 + Math.random() * 15,
                h: h
            });
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const o = this.obstacles[i];
            o.x -= this.gameSpeed;
            if (o.x + o.w < 0) {
                this.obstacles.splice(i, 1);
                continue;
            }
            // Collision (with some padding for fairness)
            if (
                p.x + 4 < o.x + o.w &&
                p.x + p.w - 4 > o.x &&
                p.y + 4 < o.y + o.h &&
                p.y + p.h > o.y
            ) {
                this.endGame();
                return;
            }
        }

        // Clouds
        for (const c of this.clouds) {
            c.x -= c.speed * this.gameSpeed * 0.3;
            if (c.x + c.w < 0) {
                c.x = this.ui.canvasW + 20;
                c.y = 30 + Math.random() * 100;
            }
        }

        // Ground scroll
        for (let i = 0; i < this.groundTiles.length; i++) {
            this.groundTiles[i] -= this.gameSpeed;
            if (this.groundTiles[i] < -20) {
                this.groundTiles[i] += this.groundTiles.length * 20;
            }
        }
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        skyGrad.addColorStop(0, '#0a0a1a');
        skyGrad.addColorStop(1, '#12122a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Clouds
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        for (const c of this.clouds) {
            ctx.beginPath();
            ctx.ellipse(c.x + c.w / 2, c.y, c.w / 2, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ground
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, this.groundY, w, h - this.groundY);
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(w, this.groundY);
        ctx.stroke();

        // Ground detail
        ctx.fillStyle = 'rgba(0,212,255,0.1)';
        for (const tx of this.groundTiles) {
            if (Math.floor(tx / 20) % 3 === 0) {
                ctx.fillRect(tx, this.groundY + 5, 10, 2);
            }
        }

        // Obstacles
        for (const o of this.obstacles) {
            ctx.fillStyle = '#ff2d7b';
            ctx.beginPath();
            ctx.roundRect(o.x, o.y, o.w, o.h, 3);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,45,123,0.3)';
            ctx.fillRect(o.x + 2, o.y + 2, o.w - 4, 4);
        }

        // Player
        const p = this.player;
        const legOffset = p.grounded ? Math.sin(p.frame * 2) * 5 : 3;

        // Body
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h - 10, 6);
        ctx.fill();

        // Head
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y - 2, 10, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#0a0a0f';
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2 + 4, p.y - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        // Left leg
        ctx.beginPath();
        ctx.moveTo(p.x + 8, p.y + p.h - 10);
        ctx.lineTo(p.x + 8 - legOffset, p.y + p.h);
        ctx.stroke();
        // Right leg
        ctx.beginPath();
        ctx.moveTo(p.x + p.w - 8, p.y + p.h - 10);
        ctx.lineTo(p.x + p.w - 8 + legOffset, p.y + p.h);
        ctx.stroke();
    },

    jump() {
        if (this.player.grounded && !this.gameOver && !this.paused) {
            this.player.vy = this.jumpForce;
            this.player.grounded = false;
        }
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        const finalScore = Math.floor(this.score);
        this.ui.setHighScore(finalScore);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(finalScore, best);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }
        if (e.key === ' ' || e.key === 'ArrowUp') {
            e.preventDefault();
            this.jump();
        }
    },

    handleTouch(e) {
        e.preventDefault();
        this.jump();
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

    pause() { if (!this.paused) this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default Runner;
