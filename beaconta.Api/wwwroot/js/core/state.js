// js/core/state.js
(function () {
    'use strict';
    const KEY = 'school_shell_material_v2';

    window.state = {
        theme: document.documentElement.dataset.theme || 'light',
        main: 'dashboard',
        tabs: [] // {id,title,url,active,dirty}
    };

    window.App = window.App || {};

    App.saveState = function () { localStorage.setItem(KEY, JSON.stringify(state)); };
    App.loadState = function () {
        const raw = localStorage.getItem(KEY); if (!raw) return;
        try { Object.assign(state, JSON.parse(raw)); document.documentElement.dataset.theme = state.theme; }
        catch { /* ignore */ }
    };

    App.toastInfo = function (msg) {
        if (window.Utils?.toastInfo) return Utils.toastInfo(msg);
        if (window.toastr) return toastr.info(msg, 'معلومة', { timeOut: 1400, positionClass: 'toast-bottom-left' });
        alert(msg);
    };

    App.syncThemeIcon = function () {
        const dark = document.documentElement.dataset.theme === 'dark';
        const btn = document.getElementById('themeBtn');
        if (btn) btn.innerHTML = `<i class="bi ${dark ? 'bi-sun' : 'bi-moon-stars'}"></i>`;
    };
})();