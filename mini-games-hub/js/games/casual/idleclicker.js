const IdleClicker = {
    canvas: null, ctx: null, ui: null,
    money: 0, totalEarned: 0, bestMoney: 0,
    clickValue: 1, clickMultiplier: 1,
    perSecond: 0, prestigeCount: 0, prestigeMultiplier: 1,
    paused: false, animFrame: null, lastTime: 0,
    floatingTexts: [], particles: [],
    coinPulse: 0, coinGlow: 0,
    prestigeGlow: 0, prestigeAvailable: false,

    upgrades: [
        { id: 'auto',    name: 'Auto-Clicker',  baseCost: 50,    pps: 1,    mult: 0, owned: 0, desc: '+1/sec' },
        { id: 'golden',  name: 'Golden Cursor',  baseCost: 200,   pps: 0,    mult: 2, owned: 0, desc: 'x2 click' },
        { id: 'printer', name: 'Money Printer',  baseCost: 1000,  pps: 10,   mult: 0, owned: 0, desc: '+10/sec' },
        { id: 'alien',   name: 'Alien Tech',     baseCost: 5000,  pps: 100,  mult: 0, owned: 0, desc: '+100/sec' },
        { id: 'time',    name: 'Time Machine',   baseCost: 25000, pps: 1000, mult: 0, owned: 0, desc: '+1000/sec' },
    ],

    // Layout constants
    coinX: 0, coinY: 0, coinR: 70,
    sidebarX: 0, sidebarW: 240,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.coinX = (ui.canvasW - 240) / 2;
        this.coinY = ui.canvasH * 0.45;
        this.sidebarX = ui.canvasW - 250;
        this.sidebarW = 240;

        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        document.addEventListener('keydown', this.handleKey);
    },

    start() {
        this.reset();
        this.paused = false;
        this.ui.hideGameOver(); this.ui.hidePause();
        this.lastTime = performance.now();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.money = 0; this.totalEarned = 0;
        this.clickValue = 1; this.clickMultiplier = 1;
        this.perSecond = 0; this.prestigeCount = 0; this.prestigeMultiplier = 1;
        this.floatingTexts = []; this.particles = [];
        this.coinPulse = 0; this.coinGlow = 0;
        this.prestigeGlow = 0; this.prestigeAvailable = false;
        this.upgrades.forEach(u => { u.owned = 0; });
        this.recalcStats();
        this.ui.setScore(0);
    },

    pause() { this.paused = true; this.ui.showPause(); },
    resume() { this.paused = false; this.ui.hidePause(); this.lastTime = performance.now(); this.loop(); },

    destroy() {
        cancelAnimationFrame(this.animFrame);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
        document.removeEventListener('keydown', this.handleKey);
    },

    // --- Number formatting ---
    formatMoney(n) {
        if (n < 0) return '-' + this.formatMoney(-n);
        if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
        if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
        if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
        return '$' + Math.floor(n);
    },

    getUpgradeCost(u) {
        return Math.floor(u.baseCost * Math.pow(1.15, u.owned));
    },

    recalcStats() {
        let pps = 0;
        let clickMult = 1;
        this.upgrades.forEach(u => {
            if (u.pps > 0) pps += u.pps * u.owned;
            if (u.mult > 0 && u.owned > 0) clickMult *= Math.pow(u.mult, u.owned);
        });
        this.perSecond = pps * this.prestigeMultiplier;
        this.clickMultiplier = clickMult;
        this.clickValue = Math.floor(1 * this.clickMultiplier * this.prestigeMultiplier);
        if (this.clickValue < 1) this.clickValue = 1;
    },

    doClick(x, y) {
        if (this.paused) return;
        const earned = this.clickValue;
        this.money += earned;
        this.totalEarned += earned;
        this.coinPulse = 1;

        // Floating text
        const fx = x || this.coinX;
        const fy = y || (this.coinY - this.coinR - 10);
        this.floatingTexts.push({
            x: fx + (Math.random() - 0.5) * 30,
            y: fy,
            text: '+' + this.formatMoney(earned).slice(1),
            alpha: 1, vy: -60, life: 1.2
        });

        // Particles
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 100;
            this.particles.push({
                x: fx, y: fy + 30,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: 2 + Math.random() * 3,
                alpha: 1, life: 0.6 + Math.random() * 0.4,
                color: ['#ffd60a', '#ffaa00', '#ff8800'][Math.floor(Math.random() * 3)]
            });
        }

        this.updateScore();
    },

    buyUpgrade(index) {
        if (this.paused) return;
        const u = this.upgrades[index];
        const cost = this.getUpgradeCost(u);
        if (this.money >= cost) {
            this.money -= cost;
            u.owned++;
            this.recalcStats();
            this.updateScore();
        }
    },

    doPrestige() {
        if (this.paused || this.totalEarned < 100000) return;
        this.prestigeCount++;
        this.prestigeMultiplier = 1 + this.prestigeCount * 0.5; // 1.5x, 2x, 2.5x...
        this.money = 0;
        this.totalEarned = 0;
        this.upgrades.forEach(u => { u.owned = 0; });
        this.recalcStats();
        this.floatingTexts = [];
        this.particles = [];

        // Big particle burst for prestige
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 200;
            this.particles.push({
                x: this.coinX, y: this.coinY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: 3 + Math.random() * 4,
                alpha: 1, life: 1 + Math.random() * 0.5,
                color: ['#a855f7', '#c084fc', '#e879f9'][Math.floor(Math.random() * 3)]
            });
        }
        this.updateScore();
    },

    updateScore() {
        const score = Math.floor(Math.max(this.money, this.totalEarned));
        this.ui.setScore(score);
        if (score > (this.bestMoney || 0)) {
            this.bestMoney = score;
            this.ui.setHighScore(score);
        }
    },

    // --- Input handling ---
    handleKey(e) {
        if (e.code === 'KeyP') {
            if (this.paused) this.resume(); else this.pause();
            return;
        }
        if (e.code === 'Space') {
            e.preventDefault();
            this.doClick(this.coinX, this.coinY - this.coinR);
        }
    },

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        this.processClick(mx, my);
    },

    handleTouch(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const t = e.touches[0];
        const mx = t.clientX - rect.left;
        const my = t.clientY - rect.top;
        this.processClick(mx, my);
    },

    processClick(mx, my) {
        if (this.paused) return;

        // Check prestige button
        const pBtnY = this.ui.canvasH - 60;
        const pBtnX = this.coinX - 80;
        if (this.totalEarned >= 100000 && mx >= pBtnX && mx <= pBtnX + 160 && my >= pBtnY - 18 && my <= pBtnY + 18) {
            this.doPrestige();
            return;
        }

        // Check upgrade buttons
        const sx = this.sidebarX;
        for (let i = 0; i < this.upgrades.length; i++) {
            const by = 100 + i * 90;
            if (mx >= sx && mx <= sx + this.sidebarW && my >= by && my <= by + 75) {
                this.buyUpgrade(i);
                return;
            }
        }

        // Check coin click
        const dx = mx - this.coinX;
        const dy = my - this.coinY;
        if (dx * dx + dy * dy <= (this.coinR + 20) * (this.coinR + 20)) {
            this.doClick(mx, my - 20);
            return;
        }
    },

    // --- Game loop ---
    loop() {
        if (this.paused) return;
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        this.update(dt);
        this.render();

        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update(dt) {
        // Auto income
        if (this.perSecond > 0) {
            const earned = this.perSecond * dt;
            this.money += earned;
            this.totalEarned += earned;
            this.updateScore();
        }

        // Prestige availability
        this.prestigeAvailable = this.totalEarned >= 100000;
        if (this.prestigeAvailable) {
            this.prestigeGlow += dt * 3;
        }

        // Coin pulse decay
        this.coinPulse = Math.max(0, this.coinPulse - dt * 4);
        this.coinGlow += dt * 2;

        // Floating texts
        this.floatingTexts.forEach(ft => {
            ft.y += ft.vy * dt;
            ft.life -= dt;
            ft.alpha = Math.max(0, ft.life / 1.2);
        });
        this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

        // Particles
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 120 * dt; // gravity
            p.life -= dt;
            p.alpha = Math.max(0, p.life);
        });
        this.particles = this.particles.filter(p => p.life > 0);
    },

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Subtle background glow
        const grad = ctx.createRadialGradient(this.coinX, this.coinY, 0, this.coinX, this.coinY, 250);
        grad.addColorStop(0, 'rgba(255, 214, 10, 0.04)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // --- Money display ---
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 48px JetBrains Mono, monospace';
        ctx.fillStyle = '#ffd60a';
        ctx.shadowColor = 'rgba(255, 214, 10, 0.5)';
        ctx.shadowBlur = 20;
        ctx.fillText(this.formatMoney(this.money), this.coinX, 50);
        ctx.shadowBlur = 0;

        // Per second
        ctx.font = '16px JetBrains Mono, monospace';
        ctx.fillStyle = '#8888a0';
        ctx.fillText(this.formatMoney(this.perSecond) + '/sec', this.coinX, 80);

        // Prestige info
        if (this.prestigeCount > 0) {
            ctx.font = '14px JetBrains Mono, monospace';
            ctx.fillStyle = '#a855f7';
            ctx.fillText('Prestige x' + this.prestigeMultiplier.toFixed(1), this.coinX, 105);
        }

        // --- Coin button ---
        const pulse = this.coinPulse * 8;
        const glowIntensity = 0.3 + Math.sin(this.coinGlow) * 0.15;

        // Outer glow
        const coinGrad = ctx.createRadialGradient(
            this.coinX, this.coinY, this.coinR - 10,
            this.coinX, this.coinY, this.coinR + 30 + pulse
        );
        coinGrad.addColorStop(0, `rgba(255, 214, 10, ${glowIntensity})`);
        coinGrad.addColorStop(1, 'rgba(255, 214, 10, 0)');
        ctx.fillStyle = coinGrad;
        ctx.beginPath();
        ctx.arc(this.coinX, this.coinY, this.coinR + 30 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Coin body
        const bodyGrad = ctx.createRadialGradient(
            this.coinX - 15, this.coinY - 15, 5,
            this.coinX, this.coinY, this.coinR
        );
        bodyGrad.addColorStop(0, '#ffe566');
        bodyGrad.addColorStop(0.5, '#ffd60a');
        bodyGrad.addColorStop(1, '#cc9a00');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(this.coinX, this.coinY, this.coinR + pulse * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Coin border
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.coinX, this.coinY, this.coinR - 5 + pulse * 0.3, 0, Math.PI * 2);
        ctx.stroke();

        // Dollar sign
        ctx.font = 'bold 50px JetBrains Mono, monospace';
        ctx.fillStyle = '#cc9a00';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', this.coinX + 1, this.coinY + 1);
        ctx.fillStyle = '#fff8e0';
        ctx.fillText('$', this.coinX, this.coinY);

        // Click value below coin
        ctx.font = '14px JetBrains Mono, monospace';
        ctx.fillStyle = '#8888a0';
        ctx.fillText(this.formatMoney(this.clickValue) + '/click', this.coinX, this.coinY + this.coinR + 25);

        // --- Prestige button ---
        if (this.prestigeAvailable) {
            const pBtnY = H - 60;
            const pGlow = 0.4 + Math.sin(this.prestigeGlow) * 0.3;
            const nextMult = (1 + (this.prestigeCount + 1) * 0.5).toFixed(1);

            ctx.shadowColor = `rgba(168, 85, 247, ${pGlow})`;
            ctx.shadowBlur = 20;
            this.drawRoundRect(this.coinX - 80, pBtnY - 18, 160, 36, 8);
            ctx.fillStyle = '#2d1a4e';
            ctx.fill();
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.font = 'bold 14px JetBrains Mono, monospace';
            ctx.fillStyle = '#e879f9';
            ctx.textAlign = 'center';
            ctx.fillText('PRESTIGE → ' + nextMult + 'x', this.coinX, pBtnY);
        }

        // --- Floating texts ---
        this.floatingTexts.forEach(ft => {
            ctx.globalAlpha = ft.alpha;
            ctx.font = 'bold 20px JetBrains Mono, monospace';
            ctx.fillStyle = '#ffd60a';
            ctx.textAlign = 'center';
            ctx.fillText('+$' + ft.text, ft.x, ft.y);
        });
        ctx.globalAlpha = 1;

        // --- Particles ---
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // --- Sidebar upgrades ---
        this.renderSidebar();
    },

    renderSidebar() {
        const ctx = this.ctx;
        const sx = this.sidebarX;
        const sw = this.sidebarW;

        // Sidebar header
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px Outfit, sans-serif';
        ctx.fillStyle = '#e8e8f0';
        ctx.fillText('UPGRADES', sx + sw / 2, 75);

        for (let i = 0; i < this.upgrades.length; i++) {
            const u = this.upgrades[i];
            const by = 100 + i * 90;
            const cost = this.getUpgradeCost(u);
            const canAfford = this.money >= cost;

            // Card background
            this.drawRoundRect(sx, by, sw, 75, 10);
            ctx.fillStyle = canAfford ? '#1a1a2e' : '#111118';
            ctx.fill();
            ctx.strokeStyle = canAfford ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Name
            ctx.textAlign = 'left';
            ctx.font = 'bold 14px Outfit, sans-serif';
            ctx.fillStyle = canAfford ? '#e8e8f0' : '#555568';
            ctx.fillText(u.name, sx + 12, by + 20);

            // Owned count
            ctx.textAlign = 'right';
            ctx.font = '12px JetBrains Mono, monospace';
            ctx.fillStyle = '#00d4ff';
            ctx.fillText('x' + u.owned, sx + sw - 12, by + 20);

            // Description
            ctx.textAlign = 'left';
            ctx.font = '12px JetBrains Mono, monospace';
            ctx.fillStyle = '#8888a0';
            ctx.fillText(u.desc, sx + 12, by + 40);

            // Cost
            ctx.font = 'bold 13px JetBrains Mono, monospace';
            ctx.fillStyle = canAfford ? '#00e676' : '#ff2d7b';
            ctx.fillText(this.formatMoney(cost), sx + 12, by + 60);

            // Buy indicator
            if (canAfford) {
                ctx.textAlign = 'right';
                ctx.font = 'bold 12px Outfit, sans-serif';
                ctx.fillStyle = '#00e676';
                ctx.fillText('BUY', sx + sw - 12, by + 60);
            }
        }
    },

    drawRoundRect(x, y, w, h, r) {
        const ctx = this.ctx;
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
    }
};

export default IdleClicker;
