(function () {
    var t = window.location.search.indexOf('adblock=test') > -1;
    if (t) { window.addEventListener('load', function () { setTimeout(m, 500); }); return; }

    window.addEventListener('load', function () { setTimeout(c, 2500); });

    function c() {
        var d = false;

        // Test 1: create element with targeted classnames
        var a = document.createElement('div');
        a.innerHTML = '&nbsp;';
        a.className = 'adsbox';
        a.style.cssText = 'position:absolute;top:-10px;left:-10px;width:1px;height:1px;';
        document.body.appendChild(a);

        var b = document.createElement('div');
        b.innerHTML = '&nbsp;';
        b.setAttribute('class', 'ad-slot');
        b.style.cssText = 'position:absolute;top:-10px;left:-10px;width:1px;height:1px;';
        document.body.appendChild(b);

        // Test 2: create an ins element like adsense uses
        var g = document.createElement('ins');
        g.className = 'adsbygoogle';
        g.style.cssText = 'display:block;width:1px;height:1px;position:absolute;top:-10px;left:-10px;';
        document.body.appendChild(g);

        setTimeout(function () {
            // Check if elements were removed or hidden
            if (!document.body.contains(a)) d = true;
            if (!document.body.contains(b)) d = true;
            if (!document.body.contains(g)) d = true;

            if (!d && a.offsetHeight === 0) d = true;
            if (!d && b.offsetHeight === 0) d = true;
            if (!d && g.offsetHeight === 0) d = true;

            if (!d) {
                try {
                    var s1 = window.getComputedStyle(a);
                    if (s1 && (s1.display === 'none' || s1.visibility === 'hidden')) d = true;
                } catch(e) { d = true; }
            }

            if (!d) {
                try {
                    var s2 = window.getComputedStyle(g);
                    if (s2 && (s2.display === 'none' || s2.visibility === 'hidden')) d = true;
                } catch(e) { d = true; }
            }

            // Cleanup
            try { document.body.removeChild(a); } catch(e) {}
            try { document.body.removeChild(b); } catch(e) {}
            try { document.body.removeChild(g); } catch(e) {}

            if (d) { m(); return; }

            // Test 3: check if adsense loaded at all
            if (typeof window.adsbygoogle === 'undefined') { m(); return; }

            // Test 4: try fetching ad domain resource
            var x = new XMLHttpRequest();
            x.open('HEAD', 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?t=' + Math.random(), true);
            x.onreadystatechange = function () {
                if (x.readyState === 4 && x.status === 0) { m(); }
            };
            try { x.send(); } catch(e) { m(); }
        }, 800);
    }

    function m() {
        if (document.getElementById('zShieldOverlay')) return;
        var o = document.createElement('div');
        o.id = 'zShieldOverlay';
        o.setAttribute('style', 'position:fixed;inset:0;z-index:99999;background:rgba(5,5,10,0.95);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;animation:overlayFadeIn 0.4s ease;');
        o.innerHTML = '<div style="background:#12121a;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:40px;max-width:480px;width:90%;text-align:center;">'
            + '<div style="font-size:3rem;margin-bottom:16px;">\uD83D\uDEE1\uFE0F</div>'
            + '<h2 style="font-size:1.6rem;color:#ffd60a;margin-bottom:12px;font-family:Outfit,sans-serif;">Ad Blocker Detected</h2>'
            + '<p style="color:#8888a0;font-size:0.9rem;line-height:1.6;margin-bottom:12px;font-family:Outfit,sans-serif;">It looks like you\'re using an ad blocker. We rely on ads to keep <strong style="color:#e8e8f0;">Zehum Mini Games</strong> free for everyone.</p>'
            + '<p style="background:rgba(255,255,255,0.03);padding:14px 18px;border-radius:10px;text-align:left;font-size:0.85rem;line-height:1.8;color:#8888a0;font-family:Outfit,sans-serif;margin-bottom:12px;">'
            + '<strong style="color:#e8e8f0;">How to disable your ad blocker:</strong><br>'
            + '1. Click the ad blocker icon in your browser toolbar<br>'
            + '2. Select "Disable on this site" or "Pause"<br>'
            + '3. Refresh the page</p>'
            + '<div style="display:flex;gap:10px;justify-content:center;margin:20px 0 16px;flex-wrap:wrap;">'
            + '<button id="zShieldRefresh" style="display:inline-flex;align-items:center;justify-content:center;padding:10px 24px;border-radius:10px;font-family:Outfit,sans-serif;font-weight:600;font-size:0.95rem;border:none;cursor:pointer;background:#00d4ff;color:#000;">I\'ve Disabled It \u2014 Refresh</button>'
            + '<button id="zShieldContinue" style="display:inline-flex;align-items:center;justify-content:center;padding:10px 24px;border-radius:10px;font-family:Outfit,sans-serif;font-weight:600;font-size:0.95rem;border:1px solid rgba(255,255,255,0.06);cursor:pointer;background:#1a1a2e;color:#e8e8f0;">Continue Anyway</button>'
            + '</div>'
            + '<p style="font-size:0.75rem;color:#555;font-style:italic;font-family:Outfit,sans-serif;">We promise: no intrusive pop-ups, no autoplay videos. Just simple banner ads.</p>'
            + '</div>';
        document.body.appendChild(o);

        document.getElementById('zShieldRefresh').addEventListener('click', function () {
            window.location.reload();
        });
        document.getElementById('zShieldContinue').addEventListener('click', function () {
            o.style.transition = 'opacity 0.3s';
            o.style.opacity = '0';
            setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 300);
        });
    }
})();
