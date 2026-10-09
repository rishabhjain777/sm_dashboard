/* ════════════════════════════════════════════════════════════════════════════
   NSE F&O Dashboard — Theme Engine
   Supports: 'light' | 'dark' | 'system'
   • Persists preference in localStorage
   • Reacts to OS-level prefers-color-scheme changes when in 'system' mode
   • Applies theme before first paint (no flash of wrong theme)
   ════════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const STORAGE_KEY  = 'nse_fo_theme';
    const ROOT         = document.documentElement;
    const THEMES       = ['light', 'system', 'dark'];

    /* ── 1. Read saved preference (defaults to 'system') ── */
    function getSavedTheme() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (THEMES.includes(saved)) return saved;
            if (saved !== null) localStorage.setItem(STORAGE_KEY, 'system');
            return 'system';
        }
        catch { return 'system'; }
    }

    /* ── 2. Resolve 'system' → actual 'light'|'dark' using OS preference ── */
    function resolveTheme(pref) {
        if (pref === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return pref;
    }

    /* ── 3. Apply theme to <html> element ── */
    function applyTheme(pref) {
        const resolved = resolveTheme(pref);

        // Set data-theme attribute for CSS selectors
        ROOT.setAttribute('data-theme', resolved);

        // Also set class for broad compatibility
        ROOT.classList.remove('theme-light', 'theme-dark');
        ROOT.classList.add('theme-' + resolved);

        // Keep legacy body class in sync (for any inline dark-mode checks)
        if (document.body) {
            document.body.classList.toggle('dark-theme', resolved === 'dark');
        }

        // Update toggle button states
        updateToggleUI(pref);
    }

    /* ── 4. Update the toggle button active state ── */
    function updateToggleUI(pref) {
        THEMES.forEach(function (t) {
            const btn = document.getElementById('themeBtn-' + t);
            if (btn) {
                btn.classList.toggle('active', t === pref);
                btn.setAttribute('aria-pressed', t === pref ? 'true' : 'false');
            }
        });
    }

    /* ── 5. Public API — called by onclick handlers in index.html ── */
    window.setTheme = function (pref) {
        if (!THEMES.includes(pref)) return;
        try { localStorage.setItem(STORAGE_KEY, pref); } catch {}
        applyTheme(pref);
    };

    window.getTheme = function () {
        return getSavedTheme();
    };

    /* ── 6. Apply on page load immediately (before DOM renders) ── */
    applyTheme(getSavedTheme());

    /* ── 7. Re-run updateToggleUI after DOM is ready (buttons may not exist yet) ── */
    document.addEventListener('DOMContentLoaded', function () {
        applyTheme(getSavedTheme());
    });

    /* ── 8. Watch OS preference changes while in 'system' mode ── */
    try {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', function () {
            if (getSavedTheme() === 'system') {
                applyTheme('system');
            }
        });
    } catch {}

})();
