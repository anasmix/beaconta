// /js/auth.js  (non-module, exposes globals)
(function (w) {
    'use strict';

    const TOKEN_KEY = 'token';
    const LEGACY_TOKEN_KEY = 'jwtToken'; // دعم رجعي

    function decodeBase64Url(str) {
        try {
            let s = str.replace(/-/g, '+').replace(/_/g, '/');
            const pad = s.length % 4;
            if (pad) s += '='.repeat(4 - pad);
            const bin = atob(s);
            const utf8 = decodeURIComponent(
                Array.prototype.map.call(bin, c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
            );
            return utf8;
        } catch {
            try { return atob(str); } catch { return ''; }
        }
    }

    function setToken(token, remember = true) {
        clearToken();
        if (remember) localStorage.setItem(TOKEN_KEY, token);
        else sessionStorage.setItem(TOKEN_KEY, token);
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY) ||
            sessionStorage.getItem(TOKEN_KEY) ||
            localStorage.getItem(LEGACY_TOKEN_KEY) ||
            '';
    }

    function clearToken() {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
    }

    function getJwtPayload() {
        const t = getToken();
        if (!t) return null;
        const parts = t.split('.');
        if (parts.length < 2) return null;
        try { return JSON.parse(decodeBase64Url(parts[1])); } catch { return null; }
    }

    function isAuthenticated(clockSkewSec = 30) {
        const p = getJwtPayload();
        if (!p) { clearToken(); return false; }
        const now = Math.floor(Date.now() / 1000);
        const exp = Number(p.exp || 0);
        if (!exp || exp <= (now - clockSkewSec)) {
            clearToken();
            return false;
        }
        return true;
    }

    function logout(redirectTo = '/login.html') {
        clearToken();
        localStorage.removeItem('permissions');
        localStorage.removeItem('pv');
        w.location.href = redirectTo;
    }

    function requireAuth(redirectTo = '/login.html') {
        if (!isAuthenticated()) logout(redirectTo);
    }

    w.Auth = { setToken, getToken, clearToken, getJwtPayload, isAuthenticated, logout, requireAuth };
    w.setToken = setToken;
    w.getToken = getToken;
    w.clearToken = clearToken;
    w.getJwtPayload = getJwtPayload;
    w.isAuthenticated = isAuthenticated;
    w.logout = logout;
    w.requireAuth = requireAuth;

})(window);
