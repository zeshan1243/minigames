const RhythmTap = {
    canvas: null,
    ctx: null,
    ui: null,
    score: 0,
    gameOver: false,
    paused: false,
    animFrame: null,
    notes: [],
    hitZoneY: 0,
    bpm: 120,
    beatInterval: 0,
    lastBeat: 0,
    lives: 5,
    maxLives: 5,
    combo: 0,
    maxCombo: 0,
    particles: [],
    hitTexts: [],
    pulseAlpha: 0,
    laneCount: 4,
    laneWidth: 0,
    laneKeys: ['d', 'f', 'j', 'k'],
    laneColors: ['#00d4ff', '#ff2d7b', '#ffd60a', '#00e676'],
    time: 0,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
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
        this.lives = this.maxLives;
        this.combo = 0;
        this.maxCombo = 0;
        this.notes = [];
        this.particles = [];
        this.hitTexts = [];
        this.pulseAlpha = 0;
        this.time = 0;
        this.ui.setScore(0);

        const h = this.ui.canvasH;
        const w = this.ui.canvasW;
        this.hitZoneY = h - 80;
        this.laneWidth = w / this.laneCount;
        this.beatInterval = 60000 / this.bpm;
        this.lastBeat = 0;
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
        this.time += 16.67;

        // Spawn notes on beat
        if (this.time - this.lastBeat >= this.beatInterval) {
            this.lastBeat = this.time;
            // Random lane, sometimes spawn on multiple lanes
            const lane = Math.floor(Math.random() * this.laneCount);
            this.notes.push({
                lane,
                y: -20,
                speed: 3 + this.score * 0.01,
                r: 18,
                hit: false
            });
            // Occasionally double notes
            if (Math.random() < 0.2 + this.score * 0.002) {
                let lane2 = (lane + 1 + Math.floor(Math.random() * (this.laneCount - 1))) % this.laneCount;
                this.notes.push({
                    lane: lane2,
                    y: -20,
                    speed: 3 + this.score * 0.01,
                    r: 18,
                    hit: false
                });
            }
        }

        // Move notes
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            if (n.hit) continue;
            n.y += n.speed;

            // Missed - went past hit zone
            if (n.y > this.hitZoneY + 50) {
                this.notes.splice(i, 1);
                this.lives--;
                this.combo = 0;
                this.addHitText(n.lane, 'MISS', '#ff2d7b');
                if (this.lives <= 0) {
                    this.endGame();
                    return;
                }
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.04;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Hit texts
        for (let i = this.hitTexts.length - 1; i >= 0; i--) {
            const ht = this.hitTexts[i];
            ht.y -= 1.5;
            ht.life -= 0.03;
            if (ht.life <= 0) this.hitTexts.splice(i, 1);
        }

        if (this.pulseAlpha > 0) this.pulseAlpha -= 0.05;
    },

    tapLane(lane) {
        if (this.gameOver || this.paused) return;
        if (lane < 0 || lane >= this.laneCount) return;

        // Find closest note in this lane near hit zone
        let closest = null;
        let closestDist = Infinity;
        for (const n of this.notes) {
            if (n.hit || n.lane !== lane) continue;
            const dist = Math.abs(n.y - this.hitZoneY);
            if (dist < closestDist) {
                closestDist = dist;
                closest = n;
            }
        }

        if (!closest || closestDist > 60) {
            // No note nearby - don't penalize, just flash
            return;
        }

        closest.hit = true;
        const idx = this.notes.indexOf(closest);
        if (idx !== -1) this.notes.splice(idx, 1);

        let points, text, color;
        if (closestDist < 15) {
            points = 100;
            text = 'PERFECT';
            color = '#ffd60a';
        } else if (closestDist < 35) {
            points = 50;
            text = 'GOOD';
            color = '#00e676';
        } else {
            points = 20;
            text = 'OK';
            color = '#00d4ff';
        }

        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        const comboBonus = Math.floor(this.combo / 10);
        points += comboBonus * 10;

        this.score += points;
        this.ui.setScore(this.score);
        this.pulseAlpha = 0.5;

        this.addHitText(lane, text, color);
        const lx = lane * this.laneWidth + this.laneWidth / 2;
        this.spawnParticles(lx, this.hitZoneY, this.laneColors[lane], 8);
    },

    addHitText(lane, text, color) {
        const lx = lane * this.laneWidth + this.laneWidth / 2;
        this.hitTexts.push({ x: lx, y: this.hitZoneY - 30, text, color, life: 1 });
    },

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1, color,
                size: 2 + Math.random() * 4
            });
        }
    },

    render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Lane separators
        for (let i = 1; i < this.laneCount; i++) {
            const lx = i * this.laneWidth;
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lx, 0);
            ctx.lineTo(lx, h);
            ctx.stroke();
        }

        // Hit zone
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, this.hitZoneY - 25, w, 50);

        // Hit zone line
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, this.hitZoneY);
        ctx.lineTo(w, this.hitZoneY);
        ctx.stroke();

        // Hit zone lane indicators
        for (let i = 0; i < this.laneCount; i++) {
            const lx = i * this.laneWidth + this.laneWidth / 2;
            ctx.beginPath();
            ctx.arc(lx, this.hitZoneY, 20, 0, Math.PI * 2);
            ctx.strokeStyle = this.laneColors[i] + '40';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Key label
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '14px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.laneKeys[i].toUpperCase(), lx, this.hitZoneY + 40);
        }

        // Pulse on hit zone
        if (this.pulseAlpha > 0) {
            ctx.fillStyle = `rgba(0,212,255,${this.pulseAlpha * 0.1})`;
            ctx.fillRect(0, this.hitZoneY - 30, w, 60);
        }

        // Notes
        for (const n of this.notes) {
            if (n.hit) continue;
            const lx = n.lane * this.laneWidth + this.laneWidth / 2;
            const color = this.laneColors[n.lane];

            // Glow
            const grd = ctx.createRadialGradient(lx, n.y, 0, lx, n.y, n.r * 2);
            grd.addColorStop(0, color + '30');
            grd.addColorStop(1, color + '00');
            ctx.fillStyle = grd;
            ctx.fillRect(lx - n.r * 2, n.y - n.r * 2, n.r * 4, n.r * 4);

            // Note circle
            ctx.beginPath();
            ctx.arc(lx, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Inner highlight
            ctx.beginPath();
            ctx.arc(lx, n.y, n.r * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fill();

            // Proximity glow on hit zone
            const dist = Math.abs(n.y - this.hitZoneY);
            if (dist < 60) {
                const alpha = (1 - dist / 60) * 0.3;
                ctx.beginPath();
                ctx.arc(lx, this.hitZoneY, 22, 0, Math.PI * 2);
                ctx.strokeStyle = color.slice(0, 7) + Math.round(alpha * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }

        // Hit texts
        for (const ht of this.hitTexts) {
            ctx.globalAlpha = ht.life;
            ctx.fillStyle = ht.color;
            ctx.font = 'bold 16px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(ht.text, ht.x, ht.y);
        }
        ctx.globalAlpha = 1;

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Lives
        for (let i = 0; i < this.maxLives; i++) {
            const hx = 15 + i * 22;
            const hy = 20;
            ctx.fillStyle = i < this.lives ? '#ff2d7b' : 'rgba(255,255,255,0.1)';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('\u2665', hx, hy);
        }

        // Combo
        if (this.combo > 1) {
            ctx.fillStyle = '#ffd60a';
            ctx.font = 'bold 18px Outfit, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${this.combo}x COMBO`, w - 15, 22);
        }
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
        const laneIdx = this.laneKeys.indexOf(e.key.toLowerCase());
        if (laneIdx !== -1) {
            e.preventDefault();
            this.tapLane(laneIdx);
        }
        // Also support space for single-lane tap (hits any lane with closest note)
        if (e.key === ' ') {
            e.preventDefault();
            let bestLane = -1;
            let bestDist = Infinity;
            for (const n of this.notes) {
                if (n.hit) continue;
                const dist = Math.abs(n.y - this.hitZoneY);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestLane = n.lane;
                }
            }
            if (bestLane >= 0) this.tapLane(bestLane);
        }
    },

    handleTouch(e) {
        e.preventDefault();
        if (this.gameOver || this.paused) return;
        for (const touch of e.changedTouches) {
            const rect = this.canvas.getBoundingClientRect();
            const tx = (touch.clientX - rect.left) * (this.ui.canvasW / rect.width);
            const lane = Math.floor(tx / this.laneWidth);
            this.tapLane(Math.max(0, Math.min(this.laneCount - 1, lane)));
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

    pause() { if (!this.paused) this.togglePause(); },
    resume() { if (this.paused) this.togglePause(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        document.removeEventListener('keydown', this.handleKey);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
    }
};

export default RhythmTap;
