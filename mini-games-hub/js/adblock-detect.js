(function () {
    // Only check if user accepted ads in cookie consent
    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) { try { return JSON.parse(decodeURIComponent(match[2])); } catch (e) { return null; } }
        return null;
    }

    // Force test mode: add ?adblock=test to URL to simulate ad blocker
    const forceTest = window.location.search.includes('adblock=test');

    const consent = getCookie('zehum_cookie_consent');
    // If user hasn't consented yet or declined ads, don't check (unless force testing)
    if (!forceTest && (!consent || !consent.ads)) return;

    if (forceTest) {
        window.addEventListener('load', function () { setTimeout(showAdBlockOverlay, 500); });
        return;
    }

    // Wait for page to load before detecting
    window.addEventListener('load', function () {
        setTimeout(detectAdBlocker, 1500);
    });

    function detectAdBlocker() {
        // Method 1: Create a bait ad element that ad blockers will hide
        const bait = document.createElement('div');
        bait.className = 'ad-banner ad_banner adsbox ad-placeholder';
        bait.setAttribute('id', 'ad-test-bait');
        // Position on-screen but invisible to user, with real dimensions so we can detect changes
        bait.style.cssText = 'width:300px;height:250px;position:fixed;left:-400px;top:0;background:transparent;pointer-events:none;z-index:-1;';
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);

        setTimeout(function () {
            let baitBlocked = false;

            // Check if bait element was removed from DOM
            if (!document.getElementById('ad-test-bait')) {
                baitBlocked = true;
            } else {
                // Check if ad blocker set display:none, visibility:hidden, or height to 0
                const style = window.getComputedStyle(bait);
                if (style.display === 'none' || style.visibility === 'hidden' ||
                    style.opacity === '0' || parseInt(style.height) === 0) {
                    baitBlocked = true;
                }
            }

            // Clean up bait
            if (bait.parentNode) bait.parentNode.removeChild(bait);

            if (baitBlocked) {
                showAdBlockOverlay();
                return;
            }

            // Method 2: Try to fetch a known ad script URL
            fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3366385543056829', {
                method: 'HEAD',
                mode: 'no-cors'
            }).then(function () {
                // Request went through — no ad blocker
            }).catch(function () {
                // Blocked by ad blocker
                showAdBlockOverlay();
            });
        }, 300);
    }

    function showAdBlockOverlay() {
        // Don't show twice
        if (document.getElementById('adblockOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'adblockOverlay';
        overlay.innerHTML = `
            <div class="adblock-card">
                <div class="adblock-icon">🛡️</div>
                <h2>Ad Blocker Detected</h2>
                <p>It looks like you're using an ad blocker. We rely on ads to keep <strong>Zehum Mini Games</strong> free for everyone.</p>
                <p class="adblock-steps">
                    <strong>How to disable your ad blocker:</strong><br>
                    1. Click the ad blocker icon in your browser toolbar<br>
                    2. Select "Disable on this site" or "Pause"<br>
                    3. Refresh the page
                </p>
                <div class="adblock-actions">
                    <button class="btn btn-primary" id="adblockRefresh">I've Disabled It — Refresh</button>
                    <button class="btn btn-secondary" id="adblockContinue">Continue Anyway</button>
                </div>
                <p class="adblock-note">We promise: no intrusive pop-ups, no autoplay videos. Just simple banner ads.</p>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('adblockRefresh').addEventListener('click', function () {
            window.location.reload();
        });

        document.getElementById('adblockContinue').addEventListener('click', function () {
            overlay.style.animation = 'adblockFadeOut 0.3s ease forwards';
            setTimeout(function () {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 300);
        });
    }
})();
