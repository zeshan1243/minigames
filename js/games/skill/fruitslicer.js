const FruitSlicer = {
    canvas: null,
    ctx: null,
    ui: null,
    animFrame: null,
    score: 0,
    lives: 3,
    maxMissed: 3,
    missed: 0,
    gameOver: false,
    paused: false,
    fruits: [],
    bombs: [],
    particles: [],
    sliceTrail: [],
    lastTime: 0,
    spawnTimer: 0,
    spawnInterval: 1.2,
    dragging: false,
    lastMouse: null,
    fruitTypes: [
        { name: 'Apple', color: '#00e676', r: 28 },
        { name: 'Orange', color: '#ffd60a', r: 26 },
        { name: 'Grape', color: '#b388ff', r: 22 },
        { name: 'Melon', color: '#00d4ff', r: 32 },
        { name: 'Berry', color: '#ff2d7b', r: 20 }
    ],

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.handleKey = this.handleKey.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        document.addEventListener('keydown', this.handleKey);
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
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
        this.score = 0;
        this.lives = 3;
        this.missed = 0;
        this.fruits = [];
        this.bombs = [];
        this.particles = [];
        this.sliceTrail = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.2;
        this.dragging = false;
        this.lastMouse = null;
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

        // Spawn
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(0.5, this.spawnInterval - 0.005);
            const count = Math.random() < 0.3 ? 2 : 1;
            for (let i = 0; i < count; i++) {
                if (Math.random() < 0.15) {
                    this.spawnBomb(W, H);
                } else {
                    this.spawnFruit(W, H);
                }
            }
        }

        // Update fruits
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const f = this.fruits[i];
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.vy += 500 * dt; // gravity
            f.rot += f.rotSpeed * dt;
            if (f.y > H + 60) {
                this.fruits.splice(i, 1);
                if (!f.sliced) {
                    this.missed++;
                    if (this.missed >= this.maxMissed) {
                        this.endGame();
                        return;
                    }
                }
            }
        }

        // Update bombs
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const b = this.bombs[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.vy += 500 * dt;
            b.rot += b.rotSpeed * dt;
            if (b.y > H + 60) {
                this.bombs.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 300 * dt;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Fade slice trail
        for (let i = this.sliceTrail.length - 1; i >= 0; i--) {
            this.sliceTrail[i].life -= dt * 4;
            if (this.sliceTrail[i].life <= 0) this.sliceTrail.splice(i, 1);
        }
    },

    spawnFruit(W, H) {
        const type = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
        const x = W * 0.15 + Math.random() * W * 0.7;
        this.fruits.push({
            x, y: H + 40,
            vx: (Math.random() - 0.5) * 160,
            vy: -(450 + Math.random() * 250),
            r: type.r, color: type.color, name: type.name,
            rot: 0, rotSpeed: (Math.random() - 0.5) * 6,
            sliced: false
        });
    },

    spawnBomb(W, H) {
        const x = W * 0.15 + Math.random() * W * 0.7;
        this.bombs.push({
            x, y: H + 40,
            vx: (Math.random() - 0.5) * 140,
            vy: -(450 + Math.random() * 200),
            r: 24, rot: 0, rotSpeed: (Math.random() - 0.5) * 4
        });
    },

    trySlice(x, y) {
        // Slice fruits
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const f = this.fruits[i];
            if (f.sliced) continue;
            const dx = x - f.x, dy = y - f.y;
            if (dx * dx + dy * dy < f.r * f.r * 1.5) {
                f.sliced = true;
                this.score++;
                this.ui.setScore(this.score);
                this.spawnJuice(f.x, f.y, f.color);
                this.fruits.splice(i, 1);
            }
        }
        // Slice bombs
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const b = this.bombs[i];
            const dx = x - b.x, dy = y - b.y;
            if (dx * dx + dy * dy < b.r * b.r * 1.5) {
                this.bombs.splice(i, 1);
                this.spawnJuice(b.x, b.y, '#ff2d2d');
                this.lives--;
                if (this.lives <= 0) {
                    this.endGame();
                    return;
                }
            }
        }
        // Trail
        this.sliceTrail.push({ x, y, life: 1 });
    },

    spawnJuice(x, y, color) {
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 250;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100,
                r: 2 + Math.random() * 5,
                color,
                life: 0.5 + Math.random() * 0.5
            });
        }
    },

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        ctx.clearRect(0, 0, W, H);

        // BG
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Slice trail
        for (const t of this.sliceTrail) {
            ctx.globalAlpha = t.life * 0.6;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Fruits
        for (const f of this.fruits) {
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.rot);
            // Shadow
            ctx.shadowColor = f.color;
            ctx.shadowBlur = 15;
            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.arc(0, 0, f.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Highlight
            const grad = ctx.createRadialGradient(-f.r * 0.3, -f.r * 0.3, 0, 0, 0, f.r);
            grad.addColorStop(0, 'rgba(255,255,255,0.35)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, f.r, 0, Math.PI * 2);
            ctx.fill();
            // Label
            ctx.fillStyle = '#0a0a0f';
            ctx.font = `bold ${Math.floor(f.r * 0.6)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(f.name.charAt(0), 0, 1);
            ctx.restore();
        }

        // Bombs
        for (const b of this.bombs) {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.rot);
            ctx.shadowColor = '#ff2d2d';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#cc0000';
            ctx.beginPath();
            ctx.arc(0, 0, b.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // X mark
            ctx.strokeStyle = '#ffd60a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-8, -8); ctx.lineTo(8, 8);
            ctx.moveTo(8, -8); ctx.lineTo(-8, 8);
            ctx.stroke();
            ctx.restore();
        }

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // HUD - Lives
        ctx.fillStyle = '#ff2d7b';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('❤'.repeat(this.lives), 12, 30);

        // Missed indicator
        ctx.fillStyle = '#666';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Missed: ${this.missed}/${this.maxMissed}`, 12, 52);
    },

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animFrame);
        this.render();
        this.ui.setHighScore(this.score);
        const best = this.ui.getHighScore();
        this.ui.showGameOver(this.score, best);
    },

    getCanvasPos(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (this.ui.canvasW / rect.width),
            y: (clientY - rect.top) * (this.ui.canvasH / rect.height)
        };
    },

    handleMouseDown(e) {
        this.dragging = true;
        const pos = this.getCanvasPos(e.clientX, e.clientY);
        this.lastMouse = pos;
        this.trySlice(pos.x, pos.y);
    },

    handleMouseMove(e) {
        if (!this.dragging || this.gameOver || this.paused) return;
        const pos = this.getCanvasPos(e.clientX, e.clientY);
        this.trySlice(pos.x, pos.y);
        this.lastMouse = pos;
    },

    handleMouseUp() {
        this.dragging = false;
        this.lastMouse = null;
    },

    handleTouchStart(e) {
        e.preventDefault();
        this.dragging = true;
        const t = e.touches[0];
        const pos = this.getCanvasPos(t.clientX, t.clientY);
        this.lastMouse = pos;
        this.trySlice(pos.x, pos.y);
    },

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.dragging || this.gameOver || this.paused) return;
        const t = e.touches[0];
        const pos = this.getCanvasPos(t.clientX, t.clientY);
        this.trySlice(pos.x, pos.y);
        this.lastMouse = pos;
    },

    handleTouchEnd(e) {
        e.preventDefault();
        this.dragging = false;
        this.lastMouse = null;
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
        }
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
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
};

export default FruitSlicer;
