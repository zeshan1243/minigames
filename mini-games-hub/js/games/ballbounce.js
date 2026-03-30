const BallBounce = {
    canvas: null,
    ctx: null,
    ui: null,
    score: 0,
    gameOver: false,
    paused: false,
    animFrame: null,
    ball: null,
    paddle: null,
    particles: [],
    trail: [],
    bounceFlash: 0,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouse = this.handleMouse.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        document.addEventListener('keydown', this.handleKey);
        document.addEventListener('keyup', this.handleKeyUp);
        canvas.addEventListener('mousemove', this.handleMouse);
        canvas.addEventListener('touchmove', this.handleTouch, { passive: false });
        this.keys = {};
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.score = 0;
        this.ui.setScore(0);
        this.particles = [];
        this.trail = [];
        this.bounceFlash = 0;

        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        this.paddle = {
            x: w / 2 - 50,
            y: h - 40,
            w: 100,
            h: 12,
            speed: 7
        };

        this.ball = {
            x: w / 2,
            y: h / 2,
            vx: 3 * (Math.random() > 0.5 ? 1 : -1),
            vy: -2,
            r: 10,
            gravity: 0.15,
            baseSpeed: 3
        };
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused) {
            this.update();
        }
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const b = this.ball;
        const p = this.paddle;

        // Paddle movement via keys
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            p.x -= p.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            p.x += p.speed;
        }
        p.x = Math.max(0, Math.min(w - p.w, p.x));

        // Ball physics
        b.vy += b.gravity;
        b.x += b.vx;
        b.y += b.vy;

        // Trail
        this.trail.push({ x: b.x, y: b.y, alpha: 1 });
        if (this.trail.length > 15) this.trail.shift();
        for (const t of this.trail) t.alpha -= 0.07;

        // Wall bounces
        if (b.x - b.r <= 0) {
            b.x = b.r;
            b.vx = Math.abs(b.vx);
            this.addBounceEffect(b.x, b.y);
        }
        if (b.x + b.r >= w) {
            b.x = w - b.r;
            b.vx = -Math.abs(b.vx);
            this.addBounceEffect(b.x, b.y);
        }
        if (b.y - b.r <= 0) {
            b.y = b.r;
            b.vy = Math.abs(b.vy);
            this.addBounceEffect(b.x, b.y);
        }

        // Paddle collision
        if (b.vy > 0 &&
            b.y + b.r >= p.y &&
            b.y + b.r <= p.y + p.h + b.vy + 2 &&
            b.x >= p.x - b.r &&
            b.x <= p.x + p.w + b.r) {

            b.y = p.y - b.r;
            // Angle based on where ball hits paddle
            const hitPos = (b.x - p.x) / p.w; // 0 to 1
            const angle = (hitPos - 0.5) * Math.PI * 0.7; // -63 to +63 degrees
            const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            const newSpeed = Math.min(speed + 0.1, 12);
            b.vx = Math.sin(angle) * newSpeed;
            b.vy = -Math.cos(angle) * newSpeed;

            this.score++;
            this.ui.setScore(this.score);
            this.bounceFlash = 1;
            this.addBounceEffect(b.x, p.y);
            this.spawnParticles(b.x, p.y, '#00d4ff', 8);
        }

        // Ball fell below
        if (b.y - b.r > h) {
            this.endGame();
            return;
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.vy += 0.1;
            pt.life -= 0.03;
            if (pt.life <= 0) this.particles.splice(i, 1);
        }

        if (this.bounceFlash > 0) this.bounceFlash -= 0.05;
    },

    addBounceEffect(x, y) {
        this.spawnParticles(x, y, '#ffd60a', 4);
    },

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                color,
                size: 2 + Math.random() * 3
            });
        }
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const b = this.ball;
        const p = this.paddle;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Bounce flash
        if (this.bounceFlash > 0) {
            ctx.fillStyle = `rgba(0,212,255,${this.bounceFlash * 0.08})`;
            ctx.fillRect(0, 0, w, h);
        }

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Ball trail
        for (const t of this.trail) {
            if (t.alpha <= 0) continue;
            ctx.beginPath();
            ctx.arc(t.x, t.y, b.r * t.alpha * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,212,255,${t.alpha * 0.3})`;
            ctx.fill();
        }

        // Ball glow
        const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 3);
        grd.addColorStop(0, 'rgba(0,212,255,0.3)');
        grd.addColorStop(1, 'rgba(0,212,255,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(b.x - b.r * 3, b.y - b.r * 3, b.r * 6, b.r * 6);

        // Ball
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = '#00d4ff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();

        // Paddle glow
        const pgrd = ctx.createRadialGradient(p.x + p.w / 2, p.y, 0, p.x + p.w / 2, p.y, p.w * 0.6);
        pgrd.addColorStop(0, 'rgba(255,45,123,0.15)');
        pgrd.addColorStop(1, 'rgba(255,45,123,0)');
        ctx.fillStyle = pgrd;
        ctx.fillRect(p.x - 20, p.y - 30, p.w + 40, 60);

        // Paddle
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 6);
        ctx.fillStyle = '#ff2d7b';
        ctx.fill();
        // Paddle highlight
        ctx.beginPath();
        ctx.roundRect(p.x + 2, p.y + 2, p.w - 4, 4, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();

        // Particles
        for (const pt of this.particles) {
            ctx.globalAlpha = pt.life;
            ctx.fillStyle = pt.color;
            ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
        }
        ctx.globalAlpha = 1;

        // Danger zone line
        ctx.strokeStyle = 'rgba(255,45,123,0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(0, h - 15);
        ctx.lineTo(w, h - 15);
        ctx.stroke();
        ctx.setLineDash([]);
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(this.score, best);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }
        this.keys[e.key] = true;
    },

    handleKeyUp(e) {
        this.keys[e.key] = false;
    },

    handleMouse(e) {
        if (this.gameOver || this.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (this.ui.canvasW / rect.width);
        this.paddle.x = mx - this.paddle.w / 2;
        this.paddle.x = Math.max(0, Math.min(this.ui.canvasW - this.paddle.w, this.paddle.x));
    },

    handleTouch(e) {
        e.preventDefault();
        if (this.gameOver || this.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const tx = (e.touches[0].clientX - rect.left) * (this.ui.canvasW / rect.width);
        this.paddle.x = tx - this.paddle.w / 2;
        this.paddle.x = Math.max(0, Math.min(this.ui.canvasW - this.paddle.w, this.paddle.x));
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
        document.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('mousemove', this.handleMouse);
        this.canvas.removeEventListener('touchmove', this.handleTouch);
    }
};

export default BallBounce;
