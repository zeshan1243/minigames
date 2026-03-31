const Helicopter = {
    canvas: null, ctx: null, ui: null,
    heli: null, cave: null, speed: 0, score: 0,
    gameOver: false, paused: false, animFrame: null,
    holding: false, lastTime: 0, particles: [],
    caveSegments: [], segmentW: 4,
    gapMin: 140, gapShrink: 0.02, baseSpeed: 2,
    obstacles: [], obstacleTimer: 0, obstacleInterval: 120,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleDown = this.handleDown.bind(this);
        this.handleUp = this.handleUp.bind(this);
        this.handleKey = this.handleKey.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        canvas.addEventListener('mousedown', this.handleDown);
        canvas.addEventListener('mouseup', this.handleUp);
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleDown(); }, { passive: false });
        canvas.addEventListener('touchend', (e) => { e.preventDefault(); this.handleUp(); }, { passive: false });
        document.addEventListener('keydown', this.handleKey);
        document.addEventListener('keyup', this.handleKeyUp);
    },

    start() {
        this.ui.hideGameOver(); this.ui.hidePause();

        // Difficulty levels
        const level = (this.ui && this.ui.level) || 'medium';
        if (level === 'easy') {
            this.baseSpeed = 1.5; this.gapMin = 180; this.gapShrink = 0.01; this.obstacleInterval = 160;
        } else if (level === 'hard') {
            this.baseSpeed = 2.8; this.gapMin = 110; this.gapShrink = 0.03; this.obstacleInterval = 80;
        } else {
            this.baseSpeed = 2; this.gapMin = 140; this.gapShrink = 0.02; this.obstacleInterval = 120;
        }

        this.score = 0; this.gameOver = false; this.paused = false;
        this.holding = false; this.particles = [];
        this.speed = this.baseSpeed;
        this.obstacles = []; this.obstacleTimer = 0;
        this.scrollPos = 0; this._trimmedCount = 0;

        const w = this.ui.canvasW, h = this.ui.canvasH;
        this.heli = { x: w * 0.2, y: h / 2, vy: 0, w: 30, h: 14 };

        // Generate initial cave
        this.caveSegments = [];
        let caveTop = h * 0.1, caveBot = h * 0.9;
        const numSegs = Math.ceil(w / this.segmentW) + 100;
        for (let i = 0; i < numSegs; i++) {
            const gap = Math.max(this.gapMin, (caveBot - caveTop));
            caveTop += (Math.random() - 0.48) * 3;
            caveBot = caveTop + gap;
            caveTop = Math.max(10, Math.min(h * 0.4, caveTop));
            caveBot = Math.max(caveTop + this.gapMin, Math.min(h - 10, caveBot));
            this.caveSegments.push({ top: caveTop, bot: caveBot });
        }

        this.lastTime = performance.now();
        this.ui.setScore(0);
        this.loop();
    },

    handleDown() { if (!this.gameOver && !this.paused) this.holding = true; },
    handleUp() { this.holding = false; },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.paused = !this.paused;
            if (this.paused) { this.ui.showPause(); this.holding = false; }
            else { this.ui.hidePause(); this.lastTime = performance.now(); }
        }
        if (e.key === ' ' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!this.gameOver && !this.paused) this.holding = true;
        }
    },

    handleKeyUp(e) {
        if (e.key === ' ' || e.key === 'ArrowUp') this.holding = false;
    },

    loop() {
        if (this.gameOver) return;
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 16.67, 3); // normalize to ~60fps
        this.lastTime = now;
        if (!this.paused) this.update(dt);
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update(dt) {
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const heli = this.heli;

        // Physics
        if (this.holding) {
            heli.vy -= 0.35 * dt;
            if (Math.random() < 0.6) {
                this.particles.push({
                    x: heli.x - heli.w / 2, y: heli.y + heli.h / 2,
                    vx: -1.5 - Math.random() * 2, vy: 1 + Math.random() * 2,
                    life: 1, decay: 0.04 + Math.random() * 0.03
                });
            }
        } else {
            heli.vy += 0.25 * dt;
        }
        heli.vy = Math.max(-6, Math.min(6, heli.vy));
        heli.y += heli.vy * dt;

        // Boundary check — die if heli goes off screen
        if (heli.y - heli.h / 2 < 0 || heli.y + heli.h / 2 > h) {
            this.endGame(); return;
        }

        // Scroll speed increases
        this.speed = this.baseSpeed + this.score * 0.0008;
        this.score += this.speed * dt * 0.3;
        this.ui.setScore(Math.floor(this.score));

        // Track scroll position in segments
        if (!this.scrollPos) this.scrollPos = 0;
        this.scrollPos += this.speed * dt;

        // Generate more cave ahead and trim old segments
        const segsOnScreen = Math.ceil(w / this.segmentW) + 10;
        const currentSeg = Math.floor(this.scrollPos / this.segmentW);

        while (this.caveSegments.length < currentSeg + segsOnScreen + 50) {
            const prev = this.caveSegments[this.caveSegments.length - 1];
            let top = prev.top + (Math.random() - 0.48) * 4;
            const gap = Math.max(this.gapMin - this.score * this.gapShrink, 80);
            top = Math.max(10, Math.min(h * 0.45, top));
            let bot = top + gap;
            bot = Math.max(top + 80, Math.min(h - 10, bot));
            this.caveSegments.push({ top, bot });
        }

        // Trim old segments to prevent memory growth
        if (this.caveSegments.length > segsOnScreen + 200) {
            const trimCount = this.caveSegments.length - (segsOnScreen + 150);
            this.caveSegments.splice(0, trimCount);
            this._trimmedCount = (this._trimmedCount || 0) + trimCount;
        }

        // Spawn obstacles
        this.obstacleTimer += dt;
        if (this.obstacleTimer >= this.obstacleInterval) {
            this.obstacleTimer = 0;
            this.obstacleInterval = Math.max(50, 120 - this.score * 0.03);
            const segIdx2 = currentSeg + Math.floor(w / this.segmentW) - (this._trimmedCount || 0);
            const seg = this.caveSegments[Math.max(0, Math.min(segIdx2, this.caveSegments.length - 1))];
            if (seg) {
                const caveH = seg.bot - seg.top;
                const obstH = 20 + Math.random() * (caveH * 0.35);
                const fromTop = Math.random() < 0.5;
                this.obstacles.push({
                    x: w + 20,
                    y: fromTop ? seg.top : seg.bot - obstH,
                    w: 16 + Math.random() * 12,
                    h: obstH,
                    passed: false
                });
            }
        }

        // Move and collide obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const ob = this.obstacles[i];
            ob.x -= this.speed * dt;
            if (ob.x + ob.w < 0) { this.obstacles.splice(i, 1); continue; }
            if (heli.x + heli.w / 2 > ob.x && heli.x - heli.w / 2 < ob.x + ob.w &&
                heli.y + heli.h / 2 > ob.y && heli.y - heli.h / 2 < ob.y + ob.h) {
                this.endGame(); return;
            }
        }

        // Collision check (cave walls)
        const baseIdx = currentSeg - (this._trimmedCount || 0);
        const heliSegOff = Math.floor(heli.x / this.segmentW);
        for (let i = -2; i <= 2; i++) {
            const si = baseIdx + heliSegOff + i;
            if (si < 0 || si >= this.caveSegments.length) continue;
            const seg = this.caveSegments[si];
            if (heli.y - heli.h / 2 < seg.top || heli.y + heli.h / 2 > seg.bot) {
                this.endGame(); return;
            }
        }

        // Update particles (cap count)
        if (this.particles.length > 100) this.particles.splice(0, this.particles.length - 100);
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= p.decay * dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    endGame() {
        this.gameOver = true; this.holding = false;
        cancelAnimationFrame(this.animFrame);
        const finalScore = Math.floor(this.score);
        const best = this.ui.getHighScore() || 0;
        if (finalScore > best) this.ui.setHighScore(finalScore);
        this.ui.showGameOver(finalScore, 'Best: ' + Math.max(finalScore, best));
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        const currentSeg = Math.floor((this.scrollPos || 0) / this.segmentW);
        const startSeg = currentSeg - (this._trimmedCount || 0);

        // Draw cave
        ctx.fillStyle = '#111128';
        ctx.beginPath(); ctx.moveTo(0, 0);
        for (let px = 0; px <= w; px += this.segmentW) {
            const si = startSeg + Math.floor(px / this.segmentW);
            if (si >= 0 && si < this.caveSegments.length) {
                ctx.lineTo(px, this.caveSegments[si].top);
            }
        }
        ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();

        ctx.beginPath(); ctx.moveTo(0, h);
        for (let px = 0; px <= w; px += this.segmentW) {
            const si = startSeg + Math.floor(px / this.segmentW);
            if (si >= 0 && si < this.caveSegments.length) {
                ctx.lineTo(px, this.caveSegments[si].bot);
            }
        }
        ctx.lineTo(w, h); ctx.closePath(); ctx.fill();

        // Cave edge glow (top)
        const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.15);
        topGrad.addColorStop(0, 'rgba(0, 212, 255, 0.08)');
        topGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = topGrad;
        ctx.beginPath(); ctx.moveTo(0, 0);
        for (let px = 0; px <= w; px += this.segmentW) {
            const si = startSeg + Math.floor(px / this.segmentW);
            if (si >= 0 && si < this.caveSegments.length) ctx.lineTo(px, this.caveSegments[si].top);
        }
        ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();

        // Cave edge lines
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let px = 0; px <= w; px += this.segmentW) {
            const si = startSeg + Math.floor(px / this.segmentW);
            if (si >= 0 && si < this.caveSegments.length) {
                if (px === 0) ctx.moveTo(px, this.caveSegments[si].top);
                else ctx.lineTo(px, this.caveSegments[si].top);
            }
        }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 45, 123, 0.3)';
        ctx.beginPath();
        for (let px = 0; px <= w; px += this.segmentW) {
            const si = startSeg + Math.floor(px / this.segmentW);
            if (si >= 0 && si < this.caveSegments.length) {
                if (px === 0) ctx.moveTo(px, this.caveSegments[si].bot);
                else ctx.lineTo(px, this.caveSegments[si].bot);
            }
        }
        ctx.stroke();

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life * 0.7;
            ctx.fillStyle = '#ffd60a';
            ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Obstacles (hurdles)
        for (const ob of this.obstacles) {
            ctx.save();
            ctx.shadowColor = '#ff2d7b'; ctx.shadowBlur = 8;
            ctx.fillStyle = '#ff2d7b';
            ctx.beginPath(); ctx.roundRect(ob.x, ob.y, ob.w, ob.h, 3); ctx.fill();
            // Highlight stripe
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(ob.x + 2, ob.y + 2, ob.w - 4, 3);
            // Warning stripe pattern
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            for (let sy = ob.y + 8; sy < ob.y + ob.h - 4; sy += 10) {
                ctx.fillRect(ob.x + 3, sy, ob.w - 6, 3);
            }
            ctx.restore();
        }

        // Helicopter
        if (!this.gameOver) {
            const heli = this.heli;
            ctx.save();
            ctx.translate(heli.x, heli.y);

            // Body glow
            ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = this.holding ? 15 : 8;

            // Body
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.ellipse(0, 0, heli.w / 2, heli.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tail
            ctx.fillStyle = '#0090aa';
            ctx.beginPath();
            ctx.moveTo(-heli.w / 2, -2);
            ctx.lineTo(-heli.w / 2 - 12, -6);
            ctx.lineTo(-heli.w / 2 - 12, 6);
            ctx.lineTo(-heli.w / 2, 2);
            ctx.closePath();
            ctx.fill();

            // Rotor
            const rotorPhase = (performance.now() / 30) % (Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 2;
            const rotorLen = heli.w * 0.8 * Math.cos(rotorPhase);
            ctx.beginPath();
            ctx.moveTo(-rotorLen, -heli.h / 2 - 3);
            ctx.lineTo(rotorLen, -heli.h / 2 - 3);
            ctx.stroke();

            // Cockpit shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.ellipse(heli.w / 6, -2, 5, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    },

    pause() { this.paused = true; this.holding = false; this.ui.showPause(); },
    resume() { this.paused = false; this.lastTime = performance.now(); this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); this.holding = false; },
    destroy() {
        cancelAnimationFrame(this.animFrame);
        this.holding = false;
        document.removeEventListener('keydown', this.handleKey);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
};
export default Helicopter;
