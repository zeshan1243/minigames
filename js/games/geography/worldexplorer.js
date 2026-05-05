const WorldExplorer = {
    canvas: null, ctx: null, ui: null,
    paused: false, animFrame: null, lastTime: 0,
    score: 0, discoveryPoints: 0, landmarkBonus: 0,

    // Map dimensions within canvas
    mapX: 0, mapY: 60, mapW: 800, mapH: 500,

    // Fog grid (each cell: 0 = fogged, 1 = revealed)
    gridCols: 160, gridRows: 100,
    grid: null,
    revealRadius: 3, // cells revealed per click

    // Reveal animations
    reveals: [], // { cx, cy, r, maxR, alpha }
    particles: [], // { x, y, vx, vy, life, maxLife, color, size }

    // Continents: name, approximate bounding box in grid coords, discovered cell count, threshold
    continents: [],
    continentDefs: [
        { name: 'North America', gx: 10, gy: 15, gw: 40, gh: 35, color: '#00e676' },
        { name: 'South America', gx: 30, gy: 50, gw: 20, gh: 40, color: '#ffd60a' },
        { name: 'Europe',        gx: 72, gy: 12, gw: 20, gh: 20, color: '#00d4ff' },
        { name: 'Africa',        gx: 70, gy: 35, gw: 25, gh: 40, color: '#ff2d7b' },
        { name: 'Asia',          gx: 90, gy: 10, gw: 45, gh: 40, color: '#ff6d00' },
        { name: 'Oceania',       gx: 120, gy: 55, gw: 30, gh: 25, color: '#aa66ff' },
        { name: 'Antarctica',    gx: 40, gy: 88, gw: 80, gh: 12, color: '#b0e0ff' },
    ],

    // Landmarks: name, grid x, grid y, discovered
    landmarks: [],
    landmarkDefs: [
        { name: 'Eiffel Tower',         gx: 76, gy: 20, icon: '\u2605' },
        { name: 'Statue of Liberty',     gx: 28, gy: 25, icon: '\u2605' },
        { name: 'Great Wall',            gx: 115, gy: 22, icon: '\u2605' },
        { name: 'Pyramids',              gx: 80, gy: 40, icon: '\u2605' },
        { name: 'Taj Mahal',             gx: 105, gy: 32, icon: '\u2605' },
        { name: 'Big Ben',               gx: 74, gy: 17, icon: '\u2605' },
        { name: 'Colosseum',             gx: 78, gy: 24, icon: '\u2605' },
        { name: 'Christ the Redeemer',   gx: 38, gy: 62, icon: '\u2605' },
        { name: 'Sydney Opera House',    gx: 138, gy: 68, icon: '\u2605' },
        { name: 'Machu Picchu',          gx: 30, gy: 58, icon: '\u2605' },
        { name: 'Mount Fuji',            gx: 130, gy: 22, icon: '\u2605' },
        { name: 'Petra',                 gx: 84, gy: 34, icon: '\u2605' },
        { name: 'Angkor Wat',            gx: 116, gy: 40, icon: '\u2605' },
        { name: 'Stonehenge',            gx: 73, gy: 16, icon: '\u2605' },
        { name: 'Burj Khalifa',          gx: 90, gy: 36, icon: '\u2605' },
        { name: 'Golden Gate Bridge',    gx: 13, gy: 24, icon: '\u2605' },
        { name: 'Easter Island',         gx: 22, gy: 65, icon: '\u2605' },
        { name: 'Northern Lights',       gx: 68, gy: 6,  icon: '\u2605' },
        { name: 'Amazon Rainforest',     gx: 35, gy: 55, icon: '\u2605' },
        { name: 'Sahara Desert',         gx: 75, gy: 38, icon: '\u2605' },
        { name: 'Great Barrier Reef',    gx: 140, gy: 60, icon: '\u2605' },
        { name: 'Victoria Falls',        gx: 82, gy: 60, icon: '\u2605' },
        { name: 'Mount Everest',         gx: 108, gy: 28, icon: '\u2605' },
        { name: 'Niagara Falls',         gx: 25, gy: 24, icon: '\u2605' },
        { name: 'Grand Canyon',          gx: 17, gy: 26, icon: '\u2605' },
        { name: 'Kilimanjaro',           gx: 84, gy: 55, icon: '\u2605' },
        { name: 'Galapagos Islands',     gx: 24, gy: 50, icon: '\u2605' },
        { name: 'Santorini',             gx: 80, gy: 24, icon: '\u2605' },
        { name: 'Maldives',              gx: 100, gy: 48, icon: '\u2605' },
        { name: 'Antarctica',            gx: 80, gy: 92, icon: '\u2605' },
    ],

    // Continent shapes as polygon outlines (grid coords)
    continentShapes: null,

    // Notification
    notification: null, // { text, alpha, y }

    // Stats
    totalCells: 0,
    revealedCells: 0,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this.mapW = ui.canvasW;
        this.mapH = ui.canvasH - 60;

        this.handleClick = this.handleClick.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        this.handleKey = this.handleKey.bind(this);
        canvas.addEventListener('click', this.handleClick);
        canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        document.addEventListener('keydown', this.handleKey);

        this._buildContinentShapes();
    },

    start() {
        this.reset();
        this.paused = false;
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.lastTime = performance.now();
        this.loop();
    },

    reset() {
        cancelAnimationFrame(this.animFrame);
        this.grid = new Uint8Array(this.gridCols * this.gridRows);
        this.revealedCells = 0;
        this.score = 0;
        this.discoveryPoints = 0;
        this.landmarkBonus = 0;
        this.reveals = [];
        this.particles = [];
        this.notification = null;

        // Count land cells
        this.totalCells = 0;
        for (let gy = 0; gy < this.gridRows; gy++) {
            for (let gx = 0; gx < this.gridCols; gx++) {
                if (this._isLand(gx, gy)) this.totalCells++;
            }
        }

        // Reset continents
        this.continents = this.continentDefs.map(c => ({
            ...c,
            discovered: 0,
            unlocked: false,
            totalCells: this._countContinentCells(c),
        }));

        // Reset landmarks
        this.landmarks = this.landmarkDefs.map(l => ({
            ...l,
            discovered: false,
        }));

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

    // --- Continent shape data (simplified polygons in grid coords) ---
    _buildContinentShapes() {
        // Simplified continent outlines as polygons in grid coordinates
        this.continentShapes = {
            'North America': [
                [15,15],[20,12],[28,12],[35,10],[42,12],[48,14],[50,18],
                [48,22],[45,25],[42,28],[38,32],[35,35],[30,40],[28,45],
                [22,48],[18,45],[15,42],[12,38],[10,34],[12,28],[14,22],[15,15]
            ],
            'South America': [
                [32,50],[36,48],[40,50],[42,52],[44,55],[45,58],[44,62],
                [42,66],[40,70],[38,74],[36,78],[34,82],[32,85],[30,88],
                [28,84],[27,78],[28,72],[29,66],[30,60],[31,55],[32,50]
            ],
            'Europe': [
                [70,10],[74,8],[78,10],[82,12],[88,14],[90,16],[88,18],
                [86,20],[84,22],[82,25],[80,28],[76,30],[73,28],[71,25],
                [70,22],[68,18],[69,14],[70,10]
            ],
            'Africa': [
                [72,32],[76,30],[80,32],[84,34],[88,36],[92,38],[94,42],
                [93,48],[92,54],[90,58],[88,62],[86,66],[84,70],[80,72],
                [76,70],[74,66],[72,60],[70,54],[70,48],[70,42],[72,36],[72,32]
            ],
            'Asia': [
                [88,10],[95,8],[102,10],[110,12],[118,14],[126,16],[134,18],
                [138,22],[140,26],[138,30],[136,34],[132,38],[128,42],[124,44],
                [118,46],[112,44],[106,42],[100,40],[96,38],[92,34],[90,28],
                [88,22],[86,16],[88,10]
            ],
            'Oceania': [
                [120,56],[126,54],[132,56],[138,58],[144,60],[148,62],
                [148,66],[146,70],[142,74],[138,76],[132,76],[126,74],
                [122,70],[120,66],[118,62],[120,56]
            ],
            'Antarctica': [
                [40,90],[50,88],[60,87],[70,86],[80,86],[90,86],[100,87],
                [110,88],[120,90],[118,94],[110,96],[100,97],[90,98],
                [80,98],[70,97],[60,96],[50,94],[42,92],[40,90]
            ],
        };
    },

    _isInsidePolygon(px, py, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    },

    _isLand(gx, gy) {
        for (const name in this.continentShapes) {
            if (this._isInsidePolygon(gx, gy, this.continentShapes[name])) return true;
        }
        return false;
    },

    _getContinentAt(gx, gy) {
        for (const name in this.continentShapes) {
            if (this._isInsidePolygon(gx, gy, this.continentShapes[name])) return name;
        }
        return null;
    },

    _countContinentCells(cDef) {
        const shape = this.continentShapes[cDef.name];
        if (!shape) return 1;
        let count = 0;
        for (let gy = 0; gy < this.gridRows; gy++) {
            for (let gx = 0; gx < this.gridCols; gx++) {
                if (this._isInsidePolygon(gx, gy, shape)) count++;
            }
        }
        return Math.max(count, 1);
    },

    // --- Grid <-> Canvas coordinate conversion ---
    _gridToCanvas(gx, gy) {
        return {
            x: this.mapX + (gx / this.gridCols) * this.mapW,
            y: this.mapY + (gy / this.gridRows) * this.mapH,
        };
    },

    _canvasToGrid(cx, cy) {
        return {
            gx: Math.floor(((cx - this.mapX) / this.mapW) * this.gridCols),
            gy: Math.floor(((cy - this.mapY) / this.mapH) * this.gridRows),
        };
    },

    // --- Click handling ---
    handleClick(e) {
        if (this.paused) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const cx = (e.clientX - rect.left) * scaleX;
        const cy = (e.clientY - rect.top) * scaleY;
        this._explore(cx, cy);
    },

    handleTouch(e) {
        e.preventDefault();
        if (this.paused) return;
        const t = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const cx = (t.clientX - rect.left) * scaleX;
        const cy = (t.clientY - rect.top) * scaleY;
        this._explore(cx, cy);
    },

    handleKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            if (this.paused) this.resume(); else this.pause();
        }
    },

    _explore(cx, cy) {
        const { gx, gy } = this._canvasToGrid(cx, cy);
        if (gx < 0 || gx >= this.gridCols || gy < 0 || gy >= this.gridRows) return;

        let newCells = 0;
        const r = this.revealRadius;
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy > r * r) continue;
                const nx = gx + dx;
                const ny = gy + dy;
                if (nx < 0 || nx >= this.gridCols || ny < 0 || ny >= this.gridRows) continue;
                const idx = ny * this.gridCols + nx;
                if (!this.grid[idx] && this._isLand(nx, ny)) {
                    this.grid[idx] = 1;
                    this.revealedCells++;
                    newCells++;

                    // Credit to continent
                    const cName = this._getContinentAt(nx, ny);
                    if (cName) {
                        const cont = this.continents.find(c => c.name === cName);
                        if (cont) cont.discovered++;
                    }
                }
                // Mark non-land too for fog clearing visual
                if (nx >= 0 && nx < this.gridCols && ny >= 0 && ny < this.gridRows) {
                    this.grid[ny * this.gridCols + nx] = 1;
                }
            }
        }

        // Discovery points
        if (newCells > 0) {
            this.discoveryPoints += newCells * 5;
            this._updateScore();
        }

        // Reveal animation
        const canvasPos = this._gridToCanvas(gx, gy);
        const cellW = this.mapW / this.gridCols;
        this.reveals.push({
            x: canvasPos.x, y: canvasPos.y,
            r: 0, maxR: cellW * r * 2,
            alpha: 0.6,
        });

        // Check landmarks
        this._checkLandmarks(gx, gy);

        // Check continent unlocks
        this._checkContinents();
    },

    _checkLandmarks(gx, gy) {
        const discoveryRadius = 4;
        for (const lm of this.landmarks) {
            if (lm.discovered) continue;
            const dx = gx - lm.gx;
            const dy = gy - lm.gy;
            if (dx * dx + dy * dy <= discoveryRadius * discoveryRadius) {
                lm.discovered = true;
                this.landmarkBonus += 100;
                this._updateScore();
                this._showNotification('Discovered: ' + lm.name + '! +100');
                this._spawnLandmarkParticles(lm);
            }
        }
    },

    _checkContinents() {
        for (const cont of this.continents) {
            if (cont.unlocked) continue;
            const pct = cont.discovered / cont.totalCells;
            if (pct >= 0.6) {
                cont.unlocked = true;
                this.discoveryPoints += 500;
                this._updateScore();
                this._showNotification(cont.name + ' unlocked! +500');
            }
        }
    },

    _updateScore() {
        this.score = this.discoveryPoints + this.landmarkBonus;
        this.ui.setScore(this.score);
        const best = this.ui.getHighScore();
        if (this.score > best) {
            this.ui.setHighScore(this.score);
        }
    },

    _showNotification(text) {
        this.notification = { text, alpha: 1, y: this.ui.canvasH / 2 };
    },

    _spawnLandmarkParticles(lm) {
        const pos = this._gridToCanvas(lm.gx, lm.gy);
        const colors = ['#ffd60a', '#ff2d7b', '#00d4ff', '#00e676', '#ff6d00', '#aa66ff'];
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x: pos.x, y: pos.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, maxLife: 60 + Math.random() * 30,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 2 + Math.random() * 3,
            });
        }
    },

    // --- Game Loop ---
    loop() {
        if (this.paused) return;
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        this.update(dt);
        this.render();

        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update(dt) {
        // Update reveal animations
        for (let i = this.reveals.length - 1; i >= 0; i--) {
            const rev = this.reveals[i];
            rev.r += dt * 200;
            rev.alpha -= dt * 1.5;
            if (rev.alpha <= 0) this.reveals.splice(i, 1);
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // gravity
            p.life -= 1 / p.maxLife;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Update notification
        if (this.notification) {
            this.notification.y -= dt * 20;
            this.notification.alpha -= dt * 0.5;
            if (this.notification.alpha <= 0) this.notification = null;
        }
    },

    render() {
        const ctx = this.ctx;
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const cellW = this.mapW / this.gridCols;
        const cellH = this.mapH / this.gridRows;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Draw ocean (dark blue)
        ctx.fillStyle = '#0a1628';
        ctx.fillRect(this.mapX, this.mapY, this.mapW, this.mapH);

        // Draw ocean grid lines (subtle)
        ctx.strokeStyle = 'rgba(0,100,180,0.08)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= this.gridCols; x += 10) {
            const px = this.mapX + x * cellW;
            ctx.beginPath(); ctx.moveTo(px, this.mapY); ctx.lineTo(px, this.mapY + this.mapH); ctx.stroke();
        }
        for (let y = 0; y <= this.gridRows; y += 10) {
            const py = this.mapY + y * cellH;
            ctx.beginPath(); ctx.moveTo(this.mapX, py); ctx.lineTo(this.mapX + this.mapW, py); ctx.stroke();
        }

        // Draw continent land (revealed and fogged)
        this._renderContinents(ctx, cellW, cellH);

        // Draw fog over unrevealed land
        this._renderFog(ctx, cellW, cellH);

        // Draw landmarks
        this._renderLandmarks(ctx);

        // Reveal animations
        for (const rev of this.reveals) {
            ctx.save();
            ctx.globalAlpha = rev.alpha;
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(rev.x, rev.y, rev.r, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0,212,255,0.1)';
            ctx.beginPath();
            ctx.arc(rev.x, rev.y, rev.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // UI: continent badges at top
        this._renderContinentBadges(ctx, W);

        // UI: progress bar
        this._renderProgressBar(ctx, W, H);

        // Stats
        this._renderStats(ctx, W);

        // Notification
        if (this.notification) {
            ctx.save();
            ctx.globalAlpha = this.notification.alpha;
            ctx.fillStyle = '#ffd60a';
            ctx.font = 'bold 22px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ffd60a';
            ctx.shadowBlur = 15;
            ctx.fillText(this.notification.text, W / 2, this.notification.y);
            ctx.restore();
        }
    },

    _renderContinents(ctx, cellW, cellH) {
        // Draw revealed land cells
        for (let gy = 0; gy < this.gridRows; gy++) {
            for (let gx = 0; gx < this.gridCols; gx++) {
                if (!this._isLand(gx, gy)) continue;
                const idx = gy * this.gridCols + gx;
                const revealed = this.grid && this.grid[idx];

                const px = this.mapX + gx * cellW;
                const py = this.mapY + gy * cellH;

                if (revealed) {
                    // Find continent color
                    const cName = this._getContinentAt(gx, gy);
                    const cont = this.continents.find(c => c.name === cName);
                    ctx.fillStyle = cont ? cont.color : '#2a6e4a';
                    ctx.globalAlpha = 0.7;
                    ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5);
                    ctx.globalAlpha = 1;
                } else {
                    // Fogged land - dark shape hint
                    ctx.fillStyle = '#151525';
                    ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5);
                }
            }
        }
    },

    _renderFog(ctx, cellW, cellH) {
        // Soft fog edges around revealed areas
        // Skip detailed fog for performance, the dark cells are enough
    },

    _renderLandmarks(ctx) {
        for (const lm of this.landmarks) {
            if (!lm.discovered) continue;
            const pos = this._gridToCanvas(lm.gx, lm.gy);

            // Glow
            ctx.save();
            ctx.shadowColor = '#ffd60a';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ffd60a';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('\u2605', pos.x, pos.y);
            ctx.restore();

            // Tooltip on hover-ish: just show name small
            ctx.fillStyle = 'rgba(255,214,10,0.8)';
            ctx.font = '8px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(lm.name, pos.x, pos.y - 12);
        }
    },

    _renderContinentBadges(ctx, W) {
        const badgeY = 8;
        const badgeH = 22;
        const totalW = this.continents.length * 108;
        let startX = (W - totalW) / 2;

        for (const cont of this.continents) {
            const bw = 100;

            // Badge background
            ctx.fillStyle = cont.unlocked ? cont.color : '#1a1a2e';
            ctx.globalAlpha = cont.unlocked ? 0.9 : 0.5;
            this._roundRect(ctx, startX, badgeY, bw, badgeH, 6);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Border
            ctx.strokeStyle = cont.unlocked ? cont.color : '#333';
            ctx.lineWidth = 1;
            this._roundRect(ctx, startX, badgeY, bw, badgeH, 6);
            ctx.stroke();

            // Text
            ctx.fillStyle = cont.unlocked ? '#000' : '#666';
            ctx.font = 'bold 10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const pct = Math.min(100, Math.floor((cont.discovered / cont.totalCells) * 100));
            const label = cont.unlocked ? cont.name : cont.name.substring(0, 8) + ' ' + pct + '%';
            ctx.fillText(label, startX + bw / 2, badgeY + badgeH / 2);

            startX += 108;
        }
    },

    _renderProgressBar(ctx, W, H) {
        const barX = 20;
        const barY = this.mapY + this.mapH + 8;
        const barW = W - 40;
        const barH = 14;

        const pct = this.totalCells > 0 ? this.revealedCells / this.totalCells : 0;

        // Background
        ctx.fillStyle = '#1a1a2e';
        this._roundRect(ctx, barX, barY, barW, barH, 4);
        ctx.fill();

        // Fill
        const grad = ctx.createLinearGradient(barX, 0, barX + barW * pct, 0);
        grad.addColorStop(0, '#00d4ff');
        grad.addColorStop(1, '#00e676');
        ctx.fillStyle = grad;
        this._roundRect(ctx, barX, barY, barW * pct, barH, 4);
        ctx.fill();

        // Text
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.floor(pct * 100) + '% Explored', W / 2, barY + barH / 2);
    },

    _renderStats(ctx, W) {
        const y = this.mapY + this.mapH + 30;
        ctx.fillStyle = '#8888a0';
        ctx.font = '12px Outfit, sans-serif';
        ctx.textAlign = 'left';

        const landmarksFound = this.landmarks.filter(l => l.discovered).length;
        ctx.fillText('Landmarks: ' + landmarksFound + '/' + this.landmarks.length, 20, y);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 14px JetBrains Mono, monospace';
        ctx.fillText('Score: ' + this.score, W / 2, y);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#8888a0';
        ctx.font = '12px Outfit, sans-serif';
        const unlockedCount = this.continents.filter(c => c.unlocked).length;
        ctx.fillText('Continents: ' + unlockedCount + '/7', W - 20, y);
    },

    _roundRect(ctx, x, y, w, h, r) {
        if (w < 0) w = 0;
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
};

export default WorldExplorer;
