const Asteroids = {
    canvas: null, ctx: null, ui: null,
    ship: { x: 0, y: 0, angle: 0, vx: 0, vy: 0, thrust: false },
    bullets: [], rocks: [], particles: [],
    score: 0, lives: 3, gameOver: false, paused: false, animFrame: null,
    keys: {},

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.handleKeyDown = (e) => { if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); this.keys[e.key] = true; if (e.key === ' ') { this.shoot(); } if (e.key === 'p' || e.key === 'P') { this.paused = !this.paused; if (this.paused) ui.showPause(); else ui.hidePause(); } };
        this.handleKeyUp = (e) => { this.keys[e.key] = false; };
        this.handleTouch = this.handleTouch.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
    },

    start() {
        this.ship.x = this.ui.canvasW / 2; this.ship.y = this.ui.canvasH / 2;
        this.ship.angle = -Math.PI/2; this.ship.vx = 0; this.ship.vy = 0;
        this.bullets = []; this.rocks = []; this.particles = [];
        this.score = 0; this.lives = 3; this.gameOver = false; this.paused = false;
        this.ui.setScore(0); this.ui.hideGameOver(); this.ui.hidePause();
        for (let i = 0; i < 5; i++) this.spawnRock(null, 40);
        this.loop();
    },

    spawnRock(pos, size) {
        const w = this.ui.canvasW, h = this.ui.canvasH;
        const x = pos ? pos.x : Math.random() * w;
        const y = pos ? pos.y : Math.random() * h;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        this.rocks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size, sides: 6 + Math.floor(Math.random() * 4) });
    },

    shoot() {
        if (this.gameOver || this.paused) return;
        const s = this.ship;
        this.bullets.push({ x: s.x + Math.cos(s.angle) * 15, y: s.y + Math.sin(s.angle) * 15, vx: Math.cos(s.angle) * 6, vy: Math.sin(s.angle) * 6, life: 60 });
    },

    handleTouch(e) {
        e.preventDefault();
        const r = this.canvas.getBoundingClientRect();
        const tx = e.touches[0].clientX - r.left, ty = e.touches[0].clientY - r.top;
        const w = this.ui.canvasW;
        if (tx < w / 3) this.ship.angle -= 0.3;
        else if (tx > w * 2/3) this.ship.angle += 0.3;
        else this.shoot();
    },

    loop() {
        if (this.gameOver) return;
        if (!this.paused) this.update();
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        const s = this.ship, w = this.ui.canvasW, h = this.ui.canvasH;
        if (this.keys['ArrowLeft'] || this.keys['a']) s.angle -= 0.05;
        if (this.keys['ArrowRight'] || this.keys['d']) s.angle += 0.05;
        if (this.keys['ArrowUp'] || this.keys['w']) { s.vx += Math.cos(s.angle) * 0.1; s.vy += Math.sin(s.angle) * 0.1; s.thrust = true; } else s.thrust = false;
        s.vx *= 0.99; s.vy *= 0.99;
        s.x = (s.x + s.vx + w) % w; s.y = (s.y + s.vy + h) % h;

        // Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i]; b.x += b.vx; b.y += b.vy; b.life--;
            if (b.life <= 0 || b.x < 0 || b.x > w || b.y < 0 || b.y > h) { this.bullets.splice(i, 1); }
        }

        // Rock-bullet collision
        for (let i = this.rocks.length - 1; i >= 0; i--) {
            const r = this.rocks[i]; r.x = (r.x + r.vx + w) % w; r.y = (r.y + r.vy + h) % h;
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                if (Math.hypot(this.bullets[j].x - r.x, this.bullets[j].y - r.y) < r.size) {
                    this.bullets.splice(j, 1);
                    if (r.size > 15) { this.spawnRock(r, r.size * 0.6); this.spawnRock(r, r.size * 0.6); }
                    for (let k = 0; k < 5; k++) this.particles.push({ x: r.x, y: r.y, vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3, life: 20 });
                    this.rocks.splice(i, 1);
                    this.score += 10; this.ui.setScore(this.score);
                    break;
                }
            }
        }

        // Ship-rock collision
        for (const r of this.rocks) {
            if (Math.hypot(s.x - r.x, s.y - r.y) < r.size + 10) {
                this.lives--;
                if (this.lives <= 0) { this.endGame(); return; }
                s.x = w/2; s.y = h/2; s.vx = 0; s.vy = 0;
                break;
            }
        }

        // Respawn rocks
        if (this.rocks.length === 0) { for (let i = 0; i < 5 + Math.floor(this.score / 100); i++) this.spawnRock(null, 40); }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i]; p.x += p.vx; p.y += p.vy; p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    render() {
        const ctx = this.ctx, w = this.ui.canvasW, h = this.ui.canvasH;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#e8e8f0'; ctx.font = '12px Outfit, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('\u2764'.repeat(this.lives), 10, 20);

        // Ship
        const s = this.ship;
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle);
        ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, -10); ctx.lineTo(-6, 0); ctx.lineTo(-10, 10); ctx.closePath(); ctx.stroke();
        if (s.thrust) {
            ctx.fillStyle = '#ffd60a';
            ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-16 - Math.random()*6, 0); ctx.lineTo(-6, 4); ctx.fill();
        }
        ctx.restore();

        // Bullets
        ctx.fillStyle = '#ffd60a';
        for (const b of this.bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, Math.PI*2); ctx.fill(); }

        // Rocks
        ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5;
        for (const r of this.rocks) {
            ctx.beginPath();
            for (let i = 0; i < r.sides; i++) {
                const a = (i / r.sides) * Math.PI * 2;
                const rx = r.x + Math.cos(a) * r.size, ry = r.y + Math.sin(a) * r.size;
                if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
            }
            ctx.closePath(); ctx.stroke();
        }

        // Particles
        for (const p of this.particles) {
            ctx.fillStyle = `rgba(255,214,10,${p.life/20})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
        }
    },

    endGame() {
        this.gameOver = true; cancelAnimationFrame(this.animFrame);
        this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore());
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); },
    reset() { cancelAnimationFrame(this.animFrame); },
    destroy() { cancelAnimationFrame(this.animFrame); document.removeEventListener('keydown', this.handleKeyDown); document.removeEventListener('keyup', this.handleKeyUp); }
};
export default Asteroids;
