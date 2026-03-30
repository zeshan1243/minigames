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
        // Method 1: Create a bait ad element
        const bait = document.createElement('div');
        bait.className = 'ad-banner ad_banner adsbygoogle adsbox ad-placeholder';
        bait.setAttribute('id', 'ad-test-bait');
        bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px;';
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);

        setTimeout(function () {
            let blocked = false;

            // Check if bait element was hidden/removed by ad blocker
            if (!bait || bait.offsetParent === null || bait.offsetHeight === 0 ||
                bait.offsetWidth === 0 || bait.clientHeight === 0) {
                blocked = true;
            }

            const style = window.getComputedStyle ? window.getComputedStyle(bait) : null;
            if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) {
                blocked = true;
            }

            // Method 2: Try to fetch a known ad script pattern
            if (!blocked) {
                try {
                    const testScript = document.createElement('script');
                    testScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3366385543056829';
                    testScript.onerror = function () {
                        showAdBlockOverlay();
                    };
                    // If it loads fine, ad blocker is not active
                    testScript.onload = function () {
                        // Clean up
                        if (bait.parentNode) bait.parentNode.removeChild(bait);
                    };
                    document.head.appendChild(testScript);
                } catch (e) {
                    blocked = true;
                }
            }

            if (blocked) {
                showAdBlockOverlay();
            }

            // Clean up bait
            if (bait.parentNode) bait.parentNode.removeChild(bait);
        }, 200);
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
