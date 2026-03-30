const OneButton = {
    canvas: null, ctx: null, ui: null,
    player: null, obstacles: [], particles: [], trailParticles: [],
    speedLines: [], deathParticles: [],
    score: 0, gameOver: false, paused: false, animFrame: null,
    holding: false, lastTime: 0, started: false,
    baseSpeed: 2.5, speed: 2.5, elapsed: 0,
    obstacleTimer: 0, obstacleInterval: 90,
    gravity: 0.22, liftForce: -0.38,
    patternIndex: 0,

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
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
        document.addEventListener('keydown', this.handleKey);
        document.addEventListener('keyup', this.handleKeyUp);
    },

    start() {
        this.ui.hideGameOver(); this.ui.hidePause();
        this.score = 0; this.gameOver = false; this.paused = false;
        this.holding = false; this.started = false;
        this.particles = []; this.trailParticles = []; this.speedLines = [];
        this.deathParticles = []; this.obstacles = [];
        this.speed = this.baseSpeed; this.elapsed = 0;
        this.obstacleTimer = 0; this.obstacleInterval = 90;
        this.patternIndex = 0;

        const w = this.ui.canvasW, h = this.ui.canvasH;
        this.player = { x: w * 0.15, y: h / 2, vy: 0, r: 12 };

        this.lastTime = performance.now();
        this.ui.setScore(0);
        this.loop();
    },

    handleDown() {
        if (this.gameOver) return;
        if (!this.started) this.started = true;
        if (!this.paused) this.holding = true;
    },
    handleUp() { this.holding = false; },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            if (this.gameOver || !this.started) return;
            this.paused = !this.paused;
            if (this.paused) { this.ui.showPause(); this.holding = false; }
            else { this.ui.hidePause(); this.lastTime = performance.now(); }
        }
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.gameOver) return;
            if (!this.started) this.started = true;
            if (!this.paused) this.holding = true;
        }
    },

    handleKeyUp(e) {
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            this.holding = false;
        }
    },

    loop() {
        if (this.gameOver) return;
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 16.67, 3);
        this.lastTime = now;
        if (!this.paused && this.started) this.update(dt);
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update(dt) {
        const w = this.ui.canvasW, h = this.ui.canvasH;
        const p = this.player;

        // Elapsed time for difficulty scaling
        this.elapsed += dt;
        const seconds = this.elapsed / 60; // roughly seconds at 60fps

        // Difficulty ramp every 10 seconds
        const diffLevel = Math.floor(seconds / 10);
        this.speed = this.baseSpeed + diffLevel * 0.35;
        this.obstacleInterval = Math.max(40, 90 - diffLevel * 5);

        // Physics
        if (this.holding) {
            p.vy += this.liftForce * dt;
            // Thrust particles
            if (Math.random() < 0.7) {
                this.trailParticles.push({
                    x: p.x - p.r, y: p.y + (Math.random() - 0.5) * 6,
                    vx: -1.5 - Math.random() * 2, vy: 0.5 + Math.random(),
                    life: 1, decay: 0.03 + Math.random() * 0.02,
                    r: 2 + Math.random() * 3, color: 'cyan'
                });
            }
        } else {
            p.vy += this.gravity * dt;
        }
        p.vy = Math.max(-5.5, Math.min(5.5, p.vy));
        p.y += p.vy * dt;

        // Trail particles (always emit a faint trail)
        if (Math.random() < 0.4) {
            this.trailParticles.push({
                x: p.x - p.r - 2, y: p.y + (Math.random() - 0.5) * 4,
                vx: -0.8 - Math.random(), vy: (Math.random() - 0.5) * 0.5,
                life: 0.6, decay: 0.02 + Math.random() * 0.015,
                r: 1.5 + Math.random() * 2, color: 'trail'
            });
        }

        // Boundary check
        if (p.y - p.r < 0) { p.y = p.r; p.vy = 0.5; }
        if (p.y + p.r > h) { p.y = h - p.r; p.vy = -0.5; }

        // Score
        this.score += this.speed * dt * 0.1;
        this.ui.setScore(Math.floor(this.score));

        // Spawn obstacles
        this.obstacleTimer += dt;
        if (this.obstacleTimer >= this.obstacleInterval) {
            this.obstacleTimer = 0;
            this.spawnObstacle(diffLevel);
        }

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const ob = this.obstacles[i];
            ob.x -= this.speed * dt;
            if (ob.moving) {
                ob.y += ob.moveDir * ob.moveSpeed * dt;
                if (ob.y < ob.moveMin || ob.y > ob.moveMax) ob.moveDir *= -1;
            }
            if (ob.x + ob.w < -20) { this.obstacles.splice(i, 1); continue; }

            // Collision (circle vs rect)
            if (this.checkCollision(p, ob)) { this.endGame(); return; }
        }

        // Speed lines
        if (Math.random() < 0.15 + this.speed * 0.03) {
            this.speedLines.push({
                x: w, y: Math.random() * h,
                len: 20 + Math.random() * 40,
                speed: this.speed * (2 + Math.random() * 2),
                alpha: 0.1 + Math.random() * 0.15
            });
        }
        for (let i = this.speedLines.length - 1; i >= 0; i--) {
            this.speedLines[i].x -= this.speedLines[i].speed * dt;
            if (this.speedLines[i].x + this.speedLines[i].len < 0) this.speedLines.splice(i, 1);
        }

        // Update trail particles
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const tp = this.trailParticles[i];
            tp.x += tp.vx * dt; tp.y += tp.vy * dt;
            tp.life -= tp.decay * dt;
            if (tp.life <= 0) this.trailParticles.splice(i, 1);
        }

        // Update death particles (still update during death animation render)
        for (let i = this.deathParticles.length - 1; i >= 0; i--) {
            const dp = this.deathParticles[i];
            dp.x += dp.vx * dt; dp.y += dp.vy * dt;
            dp.vy += 0.08 * dt;
            dp.life -= dp.decay * dt;
            if (dp.life <= 0) this.deathParticles.splice(i, 1);
        }
    },

    spawnObstacle(diffLevel) {
        const w = this.ui.canvasW, h = this.ui.canvasH;
        const patterns = this.getPatterns(diffLevel, w, h);
        const pattern = patterns[this.patternIndex % patterns.length];
        this.patternIndex++;

        for (const ob of pattern) {
            this.obstacles.push(ob);
        }
    },

    getPatterns(diff, w, h) {
        const margin = 30;
        const gapSize = Math.max(110, 180 - diff * 8);
        const obstW = 40 + Math.min(diff * 2, 20);
        const neonColors = ['#ff2d7b', '#ffd60a', '#00e676', '#ff6f00', '#e040fb', '#00d4ff'];
        const pickColor = () => neonColors[Math.floor(Math.random() * neonColors.length)];

        const patterns = [];

        // Pattern 1: Gap in vertical wall (classic)
        const gapY1 = margin + Math.random() * (h - gapSize - margin * 2);
        patterns.push([
            { x: w, y: 0, w: obstW, h: gapY1, color: pickColor(), moving: false },
            { x: w, y: gapY1 + gapSize, w: obstW, h: h - gapY1 - gapSize, color: pickColor(), moving: false }
        ]);

        // Pattern 2: Single floating block
        const blockH = 60 + Math.random() * 80;
        const blockY = margin + Math.random() * (h - blockH - margin * 2);
        const isMoving = diff >= 2 && Math.random() < 0.5;
        patterns.push([{
            x: w, y: blockY, w: obstW * 1.5, h: blockH, color: pickColor(),
            moving: isMoving,
            moveDir: Math.random() < 0.5 ? 1 : -1,
            moveSpeed: 0.8 + diff * 0.15,
            moveMin: margin, moveMax: h - blockH - margin
        }]);

        // Pattern 3: Two blocks with narrow passage
        if (diff >= 1) {
            const passageY = margin + Math.random() * (h - gapSize - margin * 2);
            const gap2 = Math.max(100, gapSize - 10);
            patterns.push([
                { x: w, y: 0, w: obstW, h: passageY, color: pickColor(), moving: false },
                { x: w, y: passageY + gap2, w: obstW, h: h - passageY - gap2, color: pickColor(), moving: false }
            ]);
        }

        // Pattern 4: Staggered double wall
        if (diff >= 2) {
            const g1y = Math.random() * (h * 0.3) + margin;
            const g2y = h * 0.5 + Math.random() * (h * 0.2);
            const gap3 = Math.max(100, gapSize - 5);
            patterns.push([
                { x: w, y: 0, w: obstW * 0.7, h: g1y, color: pickColor(), moving: false },
                { x: w, y: g1y + gap3, w: obstW * 0.7, h: g2y - g1y - gap3, color: pickColor(), moving: false },
                { x: w, y: g2y + gap3, w: obstW * 0.7, h: h - g2y - gap3, color: pickColor(), moving: false }
            ]);
        }

        // Pattern 5: Moving wall
        if (diff >= 3) {
            const mGapY = h * 0.3 + Math.random() * (h * 0.2);
            const mGap = Math.max(105, gapSize);
            const topBlock = {
                x: w, y: 0, w: obstW, h: mGapY, color: pickColor(),
                moving: true, moveDir: 1, moveSpeed: 1 + diff * 0.12,
                moveMin: -mGapY + 40, moveMax: 40,
                linkedGap: mGap
            };
            const botBlock = {
                x: w, y: mGapY + mGap, w: obstW, h: h - mGapY - mGap, color: pickColor(),
                moving: true, moveDir: 1, moveSpeed: 1 + diff * 0.12,
                moveMin: mGapY + mGap - 40, moveMax: h - 40,
                linkedGap: mGap
            };
            patterns.push([topBlock, botBlock]);
        }

        return patterns;
    },

    checkCollision(player, rect) {
        // Circle vs rectangle collision
        const cx = Math.max(rect.x, Math.min(player.x, rect.x + rect.w));
        const cy = Math.max(rect.y, Math.min(player.y, rect.y + rect.h));
        const dx = player.x - cx;
        const dy = player.y - cy;
        return (dx * dx + dy * dy) < (player.r * player.r);
    },

    endGame() {
        this.gameOver = true; this.holding = false;
        cancelAnimationFrame(this.animFrame);

        // Death particles explosion
        const p = this.player;
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 1.5 + Math.random() * 4;
            this.deathParticles.push({
                x: p.x, y: p.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 1,
                life: 1, decay: 0.015 + Math.random() * 0.015,
                r: 2 + Math.random() * 4,
                color: Math.random() < 0.5 ? '#00d4ff' : '#fff'
            });
        }

        // Render death frame then show game over
        this.renderDeath();

        const finalScore = Math.floor(this.score);
        const best = this.ui.getHighScore() || 0;
        if (finalScore > best) this.ui.setHighScore(finalScore);
        this.ui.showGameOver(finalScore, 'Best: ' + Math.max(finalScore, best));
    },

    renderDeath() {
        // Animate death particles for a brief moment
        let frames = 0;
        const deathLoop = () => {
            if (frames > 60) return;
            frames++;
            for (const dp of this.deathParticles) {
                dp.x += dp.vx; dp.y += dp.vy;
                dp.vy += 0.06;
                dp.life -= dp.decay;
            }
            this.render();
            requestAnimationFrame(deathLoop);
        };
        deathLoop();
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Subtle grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        const gridOffset = (this.score * 2) % gridSize;
        for (let gx = -gridOffset; gx < w; gx += gridSize) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
        }
        for (let gy = 0; gy < h; gy += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
        }

        // Speed lines
        for (const sl of this.speedLines) {
            ctx.globalAlpha = sl.alpha;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sl.x, sl.y);
            ctx.lineTo(sl.x + sl.len, sl.y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Obstacles
        for (const ob of this.obstacles) {
            ctx.save();
            ctx.shadowColor = ob.color; ctx.shadowBlur = 12;
            ctx.fillStyle = ob.color;
            ctx.beginPath();
            ctx.roundRect(ob.x, ob.y, ob.w, ob.h, 4);
            ctx.fill();

            // Inner highlight
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(ob.x + 3, ob.y + 3, ob.w - 6, Math.min(6, ob.h - 6));

            // Edge glow line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.strokeRect(ob.x + 1, ob.y + 1, ob.w - 2, ob.h - 2);
            ctx.restore();
        }

        // Trail particles
        for (const tp of this.trailParticles) {
            ctx.globalAlpha = tp.life * 0.6;
            if (tp.color === 'cyan') {
                ctx.fillStyle = '#00d4ff';
            } else {
                ctx.fillStyle = 'rgba(0, 180, 220, 0.5)';
            }
            ctx.beginPath(); ctx.arc(tp.x, tp.y, tp.r * tp.life, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Death particles
        for (const dp of this.deathParticles) {
            if (dp.life <= 0) continue;
            ctx.globalAlpha = dp.life;
            ctx.fillStyle = dp.color;
            ctx.beginPath(); ctx.arc(dp.x, dp.y, dp.r * dp.life, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Player (glowing cyan circle)
        if (!this.gameOver) {
            const p = this.player;
            ctx.save();

            // Outer glow
            const glowR = p.r + (this.holding ? 10 : 6);
            const glow = ctx.createRadialGradient(p.x, p.y, p.r * 0.5, p.x, p.y, glowR);
            glow.addColorStop(0, 'rgba(0, 212, 255, 0.4)');
            glow.addColorStop(0.6, 'rgba(0, 212, 255, 0.1)');
            glow.addColorStop(1, 'rgba(0, 212, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2); ctx.fill();

            // Main circle
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = this.holding ? 20 : 10;
            const bodyGrad = ctx.createRadialGradient(p.x - 3, p.y - 3, 1, p.x, p.y, p.r);
            bodyGrad.addColorStop(0, '#88f0ff');
            bodyGrad.addColorStop(0.7, '#00d4ff');
            bodyGrad.addColorStop(1, '#0090aa');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();

            // Inner shine
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath(); ctx.arc(p.x - 3, p.y - 3, p.r * 0.35, 0, Math.PI * 2); ctx.fill();

            ctx.restore();
        }

        // "Tap to start" prompt
        if (!this.started && !this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#e8e8f0';
            ctx.font = 'bold 24px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('TAP or SPACE to fly', w / 2, h / 2 - 30);
            ctx.font = '16px "Outfit", sans-serif';
            ctx.fillStyle = '#8888a0';
            ctx.fillText('Hold to rise, release to fall', w / 2, h / 2 + 5);
            ctx.fillText('P to pause', w / 2, h / 2 + 30);
            ctx.textAlign = 'start';
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
export default OneButton;
