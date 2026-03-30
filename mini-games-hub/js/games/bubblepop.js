const BubblePop = {
    canvas: null, ctx: null, ui: null,
    bubbles: [], score: 0, escaped: 0, maxEscaped: 5,
    gameOver: false, paused: false, animFrame: null,
    spawnTimer: 0, lastTime: 0, particles: [],
    colors: ['#00d4ff', '#ff2d7b', '#ffd60a', '#00e676', '#a855f7'],
    popAnims: [],

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        this.reset();
        this.gameOver = false; this.paused = false;
        this.ui.hideGameOver(); this.ui.hidePause();
        this.lastTime = performance.now();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.bubbles = []; this.particles = []; this.popAnims = [];
        this.score = 0; this.escaped = 0; this.spawnTimer = 0;
        this.ui.setScore(0);
    },

    spawnBubble() {
        const w = this.ui.canvasW;
        const r = 18 + Math.random() * 16;
        this.bubbles.push({
            x: r + Math.random() * (w - r * 2),
            y: this.ui.canvasH + r,
            r,
            speed: 30 + Math.random() * 40,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 1 + Math.random() * 2,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            alpha: 1
        });
    },

    handleTouch(e) {
        e.preventDefault();
        const t = e.touches[0];
        this.popAt(t.clientX, t.clientY);
    },

    handleClick(e) {
        this.popAt(e.clientX, e.clientY);
    },

    popAt(clientX, clientY) {
        if (this.paused || this.gameOver) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = clientX - rect.left, my = clientY - rect.top;

        // Find clicked bubble
        let hitIdx = -1;
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            const dist = Math.sqrt((mx - b.x) ** 2 + (my - b.y) ** 2);
            if (dist <= b.r) { hitIdx = i; break; }
        }
        if (hitIdx < 0) return;

        const hitBubble = this.bubbles[hitIdx];
        // Find group of same color touching
        const group = this.findGroup(hitIdx);
        if (group.length >= 3) {
            // Group pop
            group.forEach(idx => this.createPopEffect(this.bubbles[idx]));
            const sorted = [...group].sort((a, b) => b - a);
            sorted.forEach(idx => this.bubbles.splice(idx, 1));
            this.score += group.length * 5;
        } else {
            this.createPopEffect(hitBubble);
            this.bubbles.splice(hitIdx, 1);
            this.score += 1;
        }
        this.ui.setScore(this.score);
    },

    findGroup(startIdx) {
        const target = this.bubbles[startIdx].color;
        const visited = new Set();
        const queue = [startIdx];
        visited.add(startIdx);
        while (queue.length > 0) {
            const cur = queue.shift();
            const a = this.bubbles[cur];
            for (let i = 0; i < this.bubbles.length; i++) {
                if (visited.has(i)) continue;
                const b = this.bubbles[i];
                if (b.color !== target) continue;
                const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
                if (dist <= a.r + b.r + 4) {
                    visited.add(i);
                    queue.push(i);
                }
            }
        }
        return [...visited];
    },

    createPopEffect(b) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.particles.push({
                x: b.x, y: b.y,
                vx: Math.cos(angle) * (60 + Math.random() * 40),
                vy: Math.sin(angle) * (60 + Math.random() * 40),
                r: 3 + Math.random() * 3,
                color: b.color,
                life: 1
            });
        }
        this.popAnims.push({ x: b.x, y: b.y, r: b.r, maxR: b.r * 2.5, color: b.color, progress: 0 });
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') this.togglePause();
    },

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) { this.ui.showPause(); }
        else { this.ui.hidePause(); this.lastTime = performance.now(); }
    },

    loop() {
        this.animFrame = requestAnimationFrame(() => this.loop());
        if (this.paused || this.gameOver) { this.draw(); return; }

        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        // Spawn
        this.spawnTimer += dt;
        const spawnRate = Math.max(0.4, 1.2 - this.score * 0.005);
        if (this.spawnTimer >= spawnRate) {
            this.spawnBubble();
            this.spawnTimer = 0;
        }

        // Update bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.y -= b.speed * dt;
            b.wobble += b.wobbleSpeed * dt;
            b.x += Math.sin(b.wobble) * 0.5;
            if (b.y + b.r < 0) {
                this.bubbles.splice(i, 1);
                this.escaped++;
                if (this.escaped >= this.maxEscaped) this.endGame();
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= dt * 2.5;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Update pop anims
        for (let i = this.popAnims.length - 1; i >= 0; i--) {
            this.popAnims[i].progress += dt * 4;
            if (this.popAnims[i].progress >= 1) this.popAnims.splice(i, 1);
        }

        this.draw();
    },

    endGame() {
        this.gameOver = true;
        const best = this.ui.getHighScore() || 0;
        if (this.score > best) this.ui.setHighScore(this.score);
        this.ui.showGameOver(this.score, Math.max(this.score, best));
    },

    draw() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Danger zone at top
        const dangerH = 30;
        const dangerGrad = ctx.createLinearGradient(0, 0, 0, dangerH);
        dangerGrad.addColorStop(0, 'rgba(255,45,123,0.3)');
        dangerGrad.addColorStop(1, 'rgba(255,45,123,0)');
        ctx.fillStyle = dangerGrad;
        ctx.fillRect(0, 0, w, dangerH);

        // Escaped indicator
        ctx.fillStyle = '#ff2d7b';
        ctx.font = `bold 14px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(`Escaped: ${this.escaped}/${this.maxEscaped}`, w - 12, 20);

        // Pop ring anims
        for (const pa of this.popAnims) {
            const r = pa.r + (pa.maxR - pa.r) * pa.progress;
            ctx.beginPath();
            ctx.arc(pa.x, pa.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = pa.color;
            ctx.globalAlpha = 1 - pa.progress;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Bubbles
        for (const b of this.bubbles) {
            ctx.save();
            ctx.globalAlpha = b.alpha;
            // Outer glow
            const glow = ctx.createRadialGradient(b.x, b.y, b.r * 0.2, b.x, b.y, b.r);
            glow.addColorStop(0, b.color + 'cc');
            glow.addColorStop(0.7, b.color + '66');
            glow.addColorStop(1, b.color + '00');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();

            // Solid bubble
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r * 0.85, 0, Math.PI * 2);
            ctx.fillStyle = b.color + 'aa';
            ctx.fill();
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Highlight
            ctx.beginPath();
            ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fill();
            ctx.restore();
        }

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    pause() { this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
        document.removeEventListener('keydown', this.handleKey);
    }
};

export default BubblePop;
