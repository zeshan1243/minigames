const Dodger = {
    canvas: null,
    ctx: null,
    ui: null,
    animFrame: null,
    gameOver: false,
    paused: false,
    lastTime: 0,
    score: 0,
    elapsed: 0,

    // Player
    player: null,
    playerSpeed: 400,
    shielded: false,
    shieldTimer: 0,

    // Objects
    obstacles: [],
    powerups: [],
    particles: [],
    spawnTimer: 0,
    spawnInterval: 0.6,
    difficulty: 1,
    powerupTimer: 0,

    // Input
    keys: {},
    mouseX: -1,
    useMouseControl: false,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        document.addEventListener('keydown', this.handleKey);
        document.addEventListener('keyup', this.handleKeyUp);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
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
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        this.player = { x: W / 2, y: H - 50, r: 16 };
        this.score = 0;
        this.elapsed = 0;
        this.obstacles = [];
        this.powerups = [];
        this.particles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 0.6;
        this.difficulty = 1;
        this.powerupTimer = 0;
        this.shielded = false;
        this.shieldTimer = 0;
        this.keys = {};
        this.mouseX = -1;
        this.useMouseControl = false;
        this.ui.setScore(0);
    },

    loop() {
        if (this.gameOver) return;
        this.animFrame = requestAnimationFrame(() => this.loop());
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;
        if (this.paused) { this.render(); return; }
        this.update(dt);
        this.render();
    },

    update(dt) {
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const p = this.player;

        this.elapsed += dt;
        this.score = Math.floor(this.elapsed);
        this.ui.setScore(this.score);
        this.difficulty = 1 + this.elapsed * 0.08;

        // Movement
        if (this.useMouseControl && this.mouseX >= 0) {
            const target = this.mouseX;
            const diff = target - p.x;
            if (Math.abs(diff) > 2) {
                p.x += Math.sign(diff) * Math.min(Math.abs(diff), this.playerSpeed * dt);
            }
        } else {
            let dir = 0;
            if (this.keys['ArrowLeft'] || this.keys['a']) dir -= 1;
            if (this.keys['ArrowRight'] || this.keys['d']) dir += 1;
            p.x += dir * this.playerSpeed * dt;
        }
        p.x = Math.max(p.r, Math.min(W - p.r, p.x));

        // Shield
        if (this.shielded) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) this.shielded = false;
        }

        // Spawn obstacles
        this.spawnTimer += dt;
        const interval = Math.max(0.15, this.spawnInterval / this.difficulty);
        if (this.spawnTimer >= interval) {
            this.spawnTimer = 0;
            const r = 8 + Math.random() * 18;
            const speed = 120 + Math.random() * 100 + this.difficulty * 30;
            this.obstacles.push({
                x: r + Math.random() * (W - r * 2),
                y: -r,
                r,
                speed,
                color: `hsl(${Math.random() * 40 + 340}, 80%, 55%)`
            });
        }

        // Spawn powerups
        this.powerupTimer += dt;
        if (this.powerupTimer >= 6 + Math.random() * 4) {
            this.powerupTimer = 0;
            this.powerups.push({
                x: 20 + Math.random() * (W - 40),
                y: -12,
                r: 12,
                speed: 100
            });
        }

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const o = this.obstacles[i];
            o.y += o.speed * dt;
            if (o.y > H + o.r) {
                this.obstacles.splice(i, 1);
                continue;
            }
            // Collision
            const dx = p.x - o.x, dy = p.y - o.y;
            if (dx * dx + dy * dy < (p.r + o.r) * (p.r + o.r)) {
                if (this.shielded) {
                    this.spawnHitParticles(o.x, o.y, o.color);
                    this.obstacles.splice(i, 1);
                } else {
                    this.endGame();
                    return;
                }
            }
        }

        // Update powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pw = this.powerups[i];
            pw.y += pw.speed * dt;
            if (pw.y > H + pw.r) {
                this.powerups.splice(i, 1);
                continue;
            }
            const dx = p.x - pw.x, dy = p.y - pw.y;
            if (dx * dx + dy * dy < (p.r + pw.r) * (p.r + pw.r)) {
                this.shielded = true;
                this.shieldTimer = 3;
                this.spawnHitParticles(pw.x, pw.y, '#00e676');
                this.powerups.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.life -= dt;
            if (pt.life <= 0) this.particles.splice(i, 1);
        }
    },

    spawnHitParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 60 + Math.random() * 140;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                r: 2 + Math.random() * 3,
                color,
                life: 0.4 + Math.random() * 0.3
            });
        }
    },

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Grid lines for depth
        ctx.strokeStyle = 'rgba(0,212,255,0.04)';
        ctx.lineWidth = 1;
        for (let y = 0; y < H; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Obstacles
        for (const o of this.obstacles) {
            ctx.shadowColor = o.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = o.color;
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Powerups
        for (const pw of this.powerups) {
            ctx.shadowColor = '#00e676';
            ctx.shadowBlur = 14;
            ctx.fillStyle = '#00e676';
            ctx.beginPath();
            ctx.arc(pw.x, pw.y, pw.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0a0a0f';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('S', pw.x, pw.y + 1);
        }

        // Particles
        for (const pt of this.particles) {
            ctx.globalAlpha = Math.max(0, pt.life * 2);
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Player
        const p = this.player;
        if (this.shielded) {
            ctx.shadowColor = '#00e676';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = '#00e676';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Face
        ctx.fillStyle = '#0a0a0f';
        ctx.beginPath();
        ctx.arc(p.x - 5, p.y - 3, 3, 0, Math.PI * 2);
        ctx.arc(p.x + 5, p.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Timer display
        ctx.fillStyle = '#ffd60a';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Time: ${this.score}s`, 12, 30);
        if (this.shielded) {
            ctx.fillStyle = '#00e676';
            ctx.fillText(`Shield: ${Math.ceil(this.shieldTimer)}s`, 12, 50);
        }
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        this.render();
        this.ui.setHighScore(this.score);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(this.score, best);
    },

    getCanvasX(clientX) {
        const rect = this.canvas.getBoundingClientRect();
        return (clientX - rect.left) * (this.ui.canvasW / rect.width);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') { this.togglePause(); return; }
        if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
            e.preventDefault();
            this.keys[e.key] = true;
            this.useMouseControl = false;
        }
    },

    handleKeyUp(e) {
        this.keys[e.key] = false;
    },

    handleMouseMove(e) {
        this.useMouseControl = true;
        this.mouseX = this.getCanvasX(e.clientX);
    },

    handleTouchStart(e) {
        e.preventDefault();
        this.useMouseControl = true;
        this.mouseX = this.getCanvasX(e.touches[0].clientX);
    },

    handleTouchMove(e) {
        e.preventDefault();
        this.useMouseControl = true;
        this.mouseX = this.getCanvasX(e.touches[0].clientX);
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) this.ui.showPause();
        else this.ui.hidePause();
    },

    pause() { if (!this.paused) this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    }
};

export default Dodger;
