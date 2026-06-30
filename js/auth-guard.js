// Redirect to login if not authenticated
(function () {
    function revealApp() {
        if (!document.body) return;
        document.body.style.display = 'block';
        document.body.style.opacity = '1';
        document.body.style.pointerEvents = 'auto';
    }

    function runGuard() {
        if (!window.auth) {
            window.location.href = '/login.html';
            return;
        }

        auth.isAuthenticated().then(valid => {
            if (!valid) {
                window.location.href = '/login.html';
            } else {
                revealApp();
            }
        }).catch((e) => {
            console.error('Auth Exception:', e);
            window.location.href = '/login.html';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runGuard, { once: true });
    } else {
        runGuard();
    }
})();
