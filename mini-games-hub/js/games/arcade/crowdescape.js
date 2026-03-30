// Crowd Escape — Top-down survival game
// Escape the growing crowd of AI chasers as long as you can

const CrowdEscape = {
    canvas: null,
    ctx: null,
    ui: null,
    animFrameId: null,
    paused: false,
    gameOver: false,
    lastTime: 0,
    elapsedTime: 0,
    spawnTimer: 0,
    boostSpawnTimer: 0,

    // Player state
    player: null,
    // Trail particles behind player
    trail: [],
    // Crowd of chaser dots
    crowd: [],
    // Speed boost pickups
    boosts: [],
    // Death particles
    deathParticles: [],
    showingDeath: false,
    deathTimer: 0,

    // Input state
    keys: {},
    touchActive: false,
    touchX: 0,
    touchY: 0,

    // Constants
    PLAYER_RADIUS: 12,
    PLAYER_BASE_SPEED: 220,
    PLAYER_BOOST_SPEED: 400,
    CROWD_INITIAL: 10,
    CROWD_GROW_INTERVAL: 5, // seconds
    CROWD_GROW_AMOUNT: 2,
    CROWD_MIN_SPEED: 40,
    CROWD_MAX_SPEED: 110,
    CROWD_MIN_RADIUS: 4,
    CROWD_MAX_RADIUS: 9,
    BOOST_DURATION: 3,
    BOOST_RADIUS: 10,
    BOOST_SPAWN_INTERVAL_MIN: 4,
    BOOST_SPAWN_INTERVAL_MAX: 9,
    TRAIL_MAX: 25,
    DEATH_PARTICLE_COUNT: 60,

    // Bound handlers
    _onKeyDown: null,
    _onKeyUp: null,
    _onTouchStart: null,
    _onTouchMove: null,
    _onTouchEnd: null,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this._bindInputs();
    },

    start() {
        this.reset();
        this.gameOver = false;
        this.paused = false;
        this.showingDeath = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.lastTime = performance.now();
        this._loop(this.lastTime);
    },

    pause() {
        if (this.gameOver) return;
        this.paused = true;
        this.ui.showPause();
    },

    resume() {
        if (this.gameOver) return;
        this.paused = false;
        this.ui.hidePause();
        this.lastTime = performance.now();
        this._loop(this.lastTime);
    },

    reset() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        this.player = {
            x: w / 2,
            y: h / 2,
            radius: this.PLAYER_RADIUS,
            speed: this.PLAYER_BASE_SPEED,
            boosted: false,
            boostTimeLeft: 0
        };

        this.trail = [];
        this.crowd = [];
        this.boosts = [];
        this.deathParticles = [];
        this.elapsedTime = 0;
        this.spawnTimer = 0;
        this.boostSpawnTimer = this._randRange(this.BOOST_SPAWN_INTERVAL_MIN, this.BOOST_SPAWN_INTERVAL_MAX);
        this.keys = {};
        this.touchActive = false;
        this.showingDeath = false;
        this.deathTimer = 0;

        // Spawn initial crowd
        for (let i = 0; i < this.CROWD_INITIAL; i++) {
            this._spawnCrowdDot();
        }

        this.ui.setScore(0);
    },

    destroy() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        this._unbindInputs();
    },

    // --- Game Loop ---

    _loop(timestamp) {
        if (this.gameOver && !this.showingDeath) return;
        if (this.paused) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap dt
        this.lastTime = timestamp;

        if (this.showingDeath) {
            this._updateDeathParticles(dt);
            this._render();
            if (this.deathTimer <= 0) {
                this.showingDeath = false;
                const score = Math.floor(this.elapsedTime);
                const best = this.ui.getHighScore();
                if (score > best) this.ui.setHighScore(score);
                this.ui.showGameOver(score, Math.max(score, best));
                return;
            }
            this.animFrameId = requestAnimationFrame((t) => this._loop(t));
            return;
        }

        this._update(dt);
        this._render();

        this.animFrameId = requestAnimationFrame((t) => this._loop(t));
    },

    _update(dt) {
        this.elapsedTime += dt;
        this.ui.setScore(Math.floor(this.elapsedTime));

        // Grow crowd every N seconds
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.CROWD_GROW_INTERVAL) {
            this.spawnTimer -= this.CROWD_GROW_INTERVAL;
            for (let i = 0; i < this.CROWD_GROW_AMOUNT; i++) {
                this._spawnCrowdDot();
            }
        }

        // Boost spawn timer
        this.boostSpawnTimer -= dt;
        if (this.boostSpawnTimer <= 0) {
            this._spawnBoost();
            this.boostSpawnTimer = this._randRange(this.BOOST_SPAWN_INTERVAL_MIN, this.BOOST_SPAWN_INTERVAL_MAX);
        }

        // Update player boost
        if (this.player.boosted) {
            this.player.boostTimeLeft -= dt;
            if (this.player.boostTimeLeft <= 0) {
                this.player.boosted = false;
                this.player.speed = this.PLAYER_BASE_SPEED;
            }
        }

        // Move player
        this._movePlayer(dt);

        // Clamp player in bounds
        const p = this.player;
        p.x = Math.max(p.radius, Math.min(this.ui.canvasW - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(this.ui.canvasH - p.radius, p.y));

        // Trail
        this.trail.unshift({ x: p.x, y: p.y, alpha: 1 });
        if (this.trail.length > this.TRAIL_MAX) this.trail.pop();
        for (let t of this.trail) {
            t.alpha -= dt * 3;
        }
        this.trail = this.trail.filter(t => t.alpha > 0);

        // Move crowd toward player
        for (const dot of this.crowd) {
            const dx = p.x - dot.x;
            const dy = p.y - dot.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            dot.x += (dx / dist) * dot.speed * dt;
            dot.y += (dy / dist) * dot.speed * dt;

            // Check collision
            if (dist < p.radius + dot.radius) {
                this._triggerDeath();
                return;
            }
        }

        // Check boost pickup
        for (let i = this.boosts.length - 1; i >= 0; i--) {
            const b = this.boosts[i];
            b.age += dt;
            if (b.age > 8) {
                this.boosts.splice(i, 1);
                continue;
            }
            const dx = p.x - b.x;
            const dy = p.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < p.radius + this.BOOST_RADIUS) {
                this.player.boosted = true;
                this.player.boostTimeLeft = this.BOOST_DURATION;
                this.player.speed = this.PLAYER_BOOST_SPEED;
                this.boosts.splice(i, 1);
            }
        }
    },

    _movePlayer(dt) {
        const p = this.player;
        let mx = 0, my = 0;

        if (this.touchActive) {
            const dx = this.touchX - p.x;
            const dy = this.touchY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                mx = dx / dist;
                my = dy / dist;
            }
        } else {
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) mx -= 1;
            if (this.keys['ArrowRight'] || this.keys['KeyD']) mx += 1;
            if (this.keys['ArrowUp'] || this.keys['KeyW']) my -= 1;
            if (this.keys['ArrowDown'] || this.keys['KeyS']) my += 1;
            // Normalize diagonal
            const len = Math.sqrt(mx * mx + my * my);
            if (len > 0) { mx /= len; my /= len; }
        }

        p.x += mx * p.speed * dt;
        p.y += my * p.speed * dt;
    },

    _triggerDeath() {
        this.gameOver = true;
        this.showingDeath = true;
        this.deathTimer = 1.2; // seconds of death animation

        // Create death particles at player position
        this.deathParticles = [];
        for (let i = 0; i < this.DEATH_PARTICLE_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 250;
            this.deathParticles.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 4,
                alpha: 1,
                color: Math.random() < 0.5 ? '#00d4ff' : '#ff2d7b'
            });
        }
    },

    _updateDeathParticles(dt) {
        this.deathTimer -= dt;
        for (const dp of this.deathParticles) {
            dp.x += dp.vx * dt;
            dp.y += dp.vy * dt;
            dp.vx *= 0.97;
            dp.vy *= 0.97;
            dp.alpha -= dt * 1.2;
            if (dp.alpha < 0) dp.alpha = 0;
        }
    },

    // --- Rendering ---

    _render() {
        const ctx = this.ctx;
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Subtle grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x <= w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y <= h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Speed boosts
        for (const b of this.boosts) {
            const pulse = 0.8 + 0.2 * Math.sin(b.age * 6);
            ctx.save();
            ctx.globalAlpha = Math.min(1, (8 - b.age) * 2); // fade out near end
            ctx.shadowColor = '#ffd60a';
            ctx.shadowBlur = 18 * pulse;
            ctx.fillStyle = '#ffd60a';
            ctx.beginPath();
            ctx.arc(b.x, b.y, this.BOOST_RADIUS * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            ctx.save();
            ctx.globalAlpha = t.alpha * 0.4;
            ctx.fillStyle = this.player.boosted ? '#ffd60a' : '#00d4ff';
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.PLAYER_RADIUS * (0.3 + t.alpha * 0.5), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Crowd dots
        for (const dot of this.crowd) {
            ctx.save();
            ctx.shadowColor = dot.color;
            ctx.shadowBlur = 6;
            ctx.fillStyle = dot.color;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Player (if not in death anim)
        if (!this.showingDeath) {
            const p = this.player;
            ctx.save();
            ctx.shadowColor = p.boosted ? '#ffd60a' : '#00d4ff';
            ctx.shadowBlur = p.boosted ? 28 : 20;
            ctx.fillStyle = p.boosted ? '#ffd60a' : '#00d4ff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            // Inner bright core
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Death particles
        if (this.showingDeath) {
            for (const dp of this.deathParticles) {
                if (dp.alpha <= 0) continue;
                ctx.save();
                ctx.globalAlpha = dp.alpha;
                ctx.shadowColor = dp.color;
                ctx.shadowBlur = 8;
                ctx.fillStyle = dp.color;
                ctx.beginPath();
                ctx.arc(dp.x, dp.y, dp.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // HUD overlay — timer and crowd count
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this._roundRect(ctx, 10, 10, 150, 52, 8);
        ctx.fill();

        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.fillStyle = '#e8e8f0';
        ctx.textBaseline = 'top';
        ctx.fillText(`⏱ ${this._formatTime(this.elapsedTime)}`, 20, 18);
        ctx.font = '13px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(`Crowd: ${this.crowd.length}`, 20, 40);
        ctx.restore();

        // Boost indicator
        if (this.player.boosted && !this.showingDeath) {
            ctx.save();
            ctx.fillStyle = 'rgba(255,214,10,0.15)';
            this._roundRect(ctx, this.ui.canvasW - 130, 10, 120, 30, 8);
            ctx.fill();
            ctx.font = 'bold 13px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ffd60a';
            ctx.textBaseline = 'top';
            ctx.fillText(`⚡ ${this.player.boostTimeLeft.toFixed(1)}s`, this.ui.canvasW - 120, 18);
            ctx.restore();
        }
    },

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    _formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    },

    // --- Spawning ---

    _spawnCrowdDot() {
        const w = this.ui.canvasW;
        const h = this.ui.canvasH;
        const p = this.player;
        let x, y;

        // Spawn on a random edge, away from player
        const edge = Math.floor(Math.random() * 4);
        const margin = 10;
        switch (edge) {
            case 0: x = margin; y = Math.random() * h; break;             // left
            case 1: x = w - margin; y = Math.random() * h; break;        // right
            case 2: x = Math.random() * w; y = margin; break;             // top
            case 3: x = Math.random() * w; y = h - margin; break;        // bottom
        }

        // If too close to player, push to far edge
        if (p) {
            const dx = x - p.x;
            const dy = y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < 120) {
                x = w - x;
                y = h - y;
            }
        }

        const speed = this.CROWD_MIN_SPEED + Math.random() * (this.CROWD_MAX_SPEED - this.CROWD_MIN_SPEED);
        const radius = this.CROWD_MIN_RADIUS + Math.random() * (this.CROWD_MAX_RADIUS - this.CROWD_MIN_RADIUS);

        // Color: red to orange spectrum
        const hue = 0 + Math.random() * 35; // 0 (red) to 35 (orange)
        const color = `hsl(${hue}, 90%, ${50 + Math.random() * 15}%)`;

        this.crowd.push({ x, y, speed, radius, color });
    },

    _spawnBoost() {
        const margin = 40;
        const x = margin + Math.random() * (this.ui.canvasW - margin * 2);
        const y = margin + Math.random() * (this.ui.canvasH - margin * 2);
        this.boosts.push({ x, y, age: 0 });
    },

    // --- Input ---

    _bindInputs() {
        this._onKeyDown = (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;

            if (e.code === 'KeyP') {
                if (this.gameOver) return;
                if (this.paused) this.resume();
                else this.pause();
            }
        };

        this._onKeyUp = (e) => {
            this.keys[e.code] = false;
        };

        this._onTouchStart = (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.ui.canvasW / rect.width;
            const scaleY = this.ui.canvasH / rect.height;
            this.touchActive = true;
            this.touchX = (e.touches[0].clientX - rect.left) * scaleX;
            this.touchY = (e.touches[0].clientY - rect.top) * scaleY;
        };

        this._onTouchMove = (e) => {
            e.preventDefault();
            if (!this.touchActive) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.ui.canvasW / rect.width;
            const scaleY = this.ui.canvasH / rect.height;
            this.touchX = (e.touches[0].clientX - rect.left) * scaleX;
            this.touchY = (e.touches[0].clientY - rect.top) * scaleY;
        };

        this._onTouchEnd = (e) => {
            e.preventDefault();
            this.touchActive = false;
        };

        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
    },

    _unbindInputs() {
        if (this._onKeyDown) document.removeEventListener('keydown', this._onKeyDown);
        if (this._onKeyUp) document.removeEventListener('keyup', this._onKeyUp);
        if (this._onTouchStart) this.canvas.removeEventListener('touchstart', this._onTouchStart);
        if (this._onTouchMove) this.canvas.removeEventListener('touchmove', this._onTouchMove);
        if (this._onTouchEnd) this.canvas.removeEventListener('touchend', this._onTouchEnd);
    },

    // --- Utility ---

    _randRange(min, max) {
        return min + Math.random() * (max - min);
    }
};

export default CrowdEscape;
