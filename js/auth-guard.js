// Allow index.html to load directly and treat missing auth as guest access
(function () {
    function revealApp() {
        if (!document.body) return;
        document.body.style.display = 'block';
        document.body.style.opacity = '1';
        document.body.style.pointerEvents = 'auto';
    }

    function runGuard() {
        if (!window.auth) {
            revealApp();
            return;
        }

        auth.isAuthenticated().then(valid => {
            if (!valid) {
                // No active session; still allow the app to render as guest
                revealApp();
            } else {
                revealApp();
            }
        }).catch((e) => {
            console.error('Auth Exception:', e);
            revealApp();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runGuard, { once: true });
    } else {
        runGuard();
    }
})();
