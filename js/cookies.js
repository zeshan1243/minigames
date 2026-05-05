(function () {
    const COOKIE_NAME = 'zehum_cookie_consent';
    const COOKIE_DAYS = 365;

    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
    }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) {
            try { return JSON.parse(decodeURIComponent(match[2])); } catch (e) { return null; }
        }
        return null;
    }

    function loadScript(src) {
        const s = document.createElement('script');
        s.async = true;
        s.src = src;
        document.head.appendChild(s);
        return s;
    }

    function activateAnalytics() {
        // Google Analytics
        loadScript('https://www.googletagmanager.com/gtag/js?id=G-ETLYRSMY4M');
        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-ETLYRSMY4M');
    }

    function activateAds() {
        // Google AdSense
        loadScript('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3366385543056829');
    }

    function activateFeedback() {
        // Hotjar
        (function (h, o, t, j, a, r) {
            h.hj = h.hj || function () { (h.hj.q = h.hj.q || []).push(arguments); };
            h._hjSettings = { hjid: 6537436, hjsv: 6 };
            a = o.getElementsByTagName('head')[0];
            r = o.createElement('script'); r.async = 1;
            r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
            a.appendChild(r);
        })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
    }

    function applyConsent(prefs) {
        if (prefs.analytics) activateAnalytics();
        if (prefs.ads) activateAds();
        if (prefs.feedback) activateFeedback();
    }

    // Check existing consent
    const existing = getCookie(COOKIE_NAME);
    if (existing) {
        applyConsent(existing);
        return;
    }

    // Show banner
    const banner = document.getElementById('cookieBanner');
    const modal = document.getElementById('cookieModal');
    if (!banner) return;

    banner.style.display = 'flex';

    // Accept All
    document.getElementById('cookieAccept').addEventListener('click', function () {
        const prefs = { analytics: true, ads: true, feedback: true };
        setCookie(COOKIE_NAME, prefs, COOKIE_DAYS);
        banner.style.display = 'none';
        applyConsent(prefs);
    });

    // Decline All
    document.getElementById('cookieDecline').addEventListener('click', function () {
        const prefs = { analytics: false, ads: false, feedback: false };
        setCookie(COOKIE_NAME, prefs, COOKIE_DAYS);
        banner.style.display = 'none';
    });

    // Open Settings
    document.getElementById('cookieSettings').addEventListener('click', function (e) {
        e.preventDefault();
        modal.style.display = 'flex';
    });

    // Close Settings
    document.getElementById('cookieModalClose').addEventListener('click', function () {
        modal.style.display = 'none';
    });

    // Save Settings
    document.getElementById('cookieSaveSettings').addEventListener('click', function () {
        const prefs = {
            analytics: document.getElementById('cookieAnalytics').checked,
            ads: document.getElementById('cookieAds').checked,
            feedback: document.getElementById('cookieFeedback').checked
        };
        setCookie(COOKIE_NAME, prefs, COOKIE_DAYS);
        modal.style.display = 'none';
        banner.style.display = 'none';
        applyConsent(prefs);
    });
})();
