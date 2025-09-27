// js/core/permissions.js
(function () {
    'use strict';
    window.MENU = window.MENU || (window.MENU_FALLBACK || {});

    // USER_KEYS تأتي من السيرفر (إن وُجد endpoint) أو من localStorage("permissions")
    window.USER_KEYS = window.USER_KEYS || (function () {
        try { const s = localStorage.getItem('permissions'); return s ? JSON.parse(s) : null; } catch { return null; }
    })();

    window.Permissions = {
        can: function (key) {
            if (!key) return true;
            if (Array.isArray(window.USER_KEYS)) return window.USER_KEYS.includes(key);
            return true; // fallback: السماح للجميع في حال عدم تفعيل نظام المفاتيح بعد
        }
    };
})();