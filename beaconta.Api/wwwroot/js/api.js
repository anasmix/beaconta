// =========================
// API (with auth + helpers)
// =========================

// لو بدك تحدد API يدويًا (مثلاً: "https://localhost:7247/api")
// خليه فاضي "" عشان auto-detect يشتغل
const API_OVERRIDE = "";

// auto-detect للـ API base
const API = {
    get base() {
        if (API_OVERRIDE) return API_OVERRIDE.replace(/\/+$/, "");
        // auto: نفس origin + /api
        return `${location.origin}/api`;
    },

    // ---- الموارد الشائعة ----
    get users() { return this.base + "/Users"; },
    get roles() { return this.base + "/Roles"; },
    get auth() { return this.base + "/Auth"; },
    get menu() { return this.base + "/menu"; },
    get me() { return this.base + "/me"; }
};
window.API = API;

// =========================
// Token helpers
// =========================
const TOKEN_KEY = "token";
const LEGACY_TOKEN_KEY = "jwtToken";

function _readToken() {
    return (
        sessionStorage.getItem(TOKEN_KEY) ||
        localStorage.getItem(TOKEN_KEY) ||
        localStorage.getItem(LEGACY_TOKEN_KEY) ||
        ""
    );
}

function getToken() {
    if (typeof window.Auth?.getToken === "function") return window.Auth.getToken();
    return _readToken();
}

function _decodeBase64Url(str) {
    try {
        let s = str.replace(/-/g, "+").replace(/_/g, "/");
        const pad = s.length % 4;
        if (pad) s += "=".repeat(4 - pad);
        const bin = atob(s);
        const utf8 = decodeURIComponent(
            Array.prototype.map.call(bin, c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
        );
        return utf8;
    } catch { return ""; }
}

function _getJwtPayload(token) {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try { return JSON.parse(_decodeBase64Url(parts[1])); } catch { return null; }
}

function _hardLogout(redirectTo = "/login.html") {
    try { if (typeof logout === "function") return logout(redirectTo); } catch { }
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem("permissions");
    localStorage.removeItem("pv");
    window.location.href = redirectTo;
}

function isAuthenticated() {
    const t = getToken();
    if (!t) return false;
    const payload = _getJwtPayload(t);
    if (!payload) return false;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return false;
    return true;
}

function ensureAuth({ redirect = true } = {}) {
    if (!isAuthenticated()) {
        if (redirect) _hardLogout("/login.html");
        return false;
    }
    return true;
}

// =========================
// Core AJAX wrapper
// =========================
function apiRequest(method, url, data, opts = {}) {
    const needsAuth = opts.auth !== false;

    if (needsAuth && !ensureAuth({ redirect: opts.redirect !== false })) {
        return $.Deferred().reject({ status: 401, message: "Unauthorized" }).promise();
    }

    const headers = { ...(opts.headers || {}) };
    if (needsAuth) {
        const t = getToken();
        if (t) headers.Authorization = "Bearer " + t;
    }

    const isForm = (typeof FormData !== "undefined") && (data instanceof FormData);

    const ajaxOptions = {
        url,
        method,
        headers,
        dataType: opts.dataType || "json",
        contentType: isForm
            ? false
            : (opts.contentType || (data !== undefined && !opts.raw ? "application/json" : undefined)),
        data: data === undefined ? undefined : (opts.raw || isForm ? data : JSON.stringify(data)),
        processData: isForm ? false : (opts.processData ?? !opts.raw),
        timeout: opts.timeout || 15000,
        ...opts
    };

    return $.ajax(ajaxOptions);
}

// ====== Shorthands ======
const apiGet = (url, opts) => apiRequest("GET", url, undefined, opts);
const apiPost = (url, data, opts) => apiRequest("POST", url, data, opts);
const apiPut = (url, data, opts) => apiRequest("PUT", url, data, opts);
const apiDelete = (url, opts) => apiRequest("DELETE", url, undefined, opts);

// هندلة 401 عالميًا
$.ajaxSetup({
    statusCode: {
        401: function () { _hardLogout("/login.html"); }
    }
});

// =========================
// Wrapper موحّد لمسارات نسبية
// =========================
// مثال: Api.get('/schools') → http://host/api/schools
// لا تكتب /api/ بيدك
const Api = {
    get: (path, opts) => apiGet(API.base + path, opts),
    post: (path, data, opts) => apiPost(API.base + path, data, opts),
    put: (path, data, opts) => apiPut(API.base + path, data, opts),
    delete: (path, opts) => apiDelete(API.base + path, opts)
};

window.Api = Api;


//// =========================
//// API (with auth + helpers)
//// =========================

//// لو بدك تحدد API يدويًا (مثلاً: "https://localhost:7247/api")
//// خليه فاضي "" عشان auto-detect يشتغل
//const API_OVERRIDE = "";

//// auto-detect للـ API base
//const API = {
//    get base() {
//        if (API_OVERRIDE) return API_OVERRIDE.replace(/\/+$/, "");
//        // auto: نفس origin + /api
//        return `${location.origin}/api`;
//    },

//    // ---- موارد الـ API الشائعة ----
//    get users() { return this.base + "/Users"; },
//    get roles() { return this.base + "/Roles"; },
//    get auth() { return this.base + "/Auth"; },

//    // ✅ مهم: Menu & Me
//    get menu() { return this.base + "/menu"; },  // يتوافق مع [Route("api/menu")]
//    get me() { return this.base + "/me"; }   // يتوافق مع [Route("api/me")]
//};

//// اجعل API متاحًا عالميًا (لو احتجته بملفات أخرى)
//window.API = API;

//// ====== Token helpers (use Auth if present) ======
//const TOKEN_KEY = "token";
//const LEGACY_TOKEN_KEY = "jwtToken";

//function _readToken() {
//    return (
//        sessionStorage.getItem(TOKEN_KEY) ||
//        localStorage.getItem(TOKEN_KEY) ||
//        localStorage.getItem(LEGACY_TOKEN_KEY) ||
//        ""
//    );
//}

//function getToken() {
//    if (typeof window.Auth?.getToken === "function") return window.Auth.getToken();
//    return _readToken();
//}

//function _decodeBase64Url(str) {
//    try {
//        let s = str.replace(/-/g, "+").replace(/_/g, "/");
//        const pad = s.length % 4;
//        if (pad) s += "=".repeat(4 - pad);
//        const bin = atob(s);
//        const utf8 = decodeURIComponent(
//            Array.prototype.map.call(bin, c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
//        );
//        return utf8;
//    } catch { return ""; }
//}

//function _getJwtPayload(token) {
//    if (!token) return null;
//    const parts = token.split(".");
//    if (parts.length < 2) return null;
//    try { return JSON.parse(_decodeBase64Url(parts[1])); } catch { return null; }
//}

//function _hardLogout(redirectTo = "/login.html") {
//    try {
//        if (typeof logout === "function") return logout(redirectTo);
//    } catch { }
//    localStorage.removeItem(TOKEN_KEY);
//    sessionStorage.removeItem(TOKEN_KEY);
//    localStorage.removeItem(LEGACY_TOKEN_KEY);
//    localStorage.removeItem("permissions");
//    localStorage.removeItem("pv");
//    window.location.href = redirectTo;
//}

//function isAuthenticated() {
//    const t = getToken();
//    if (!t) return false;

//    const payload = _getJwtPayload(t);
//    if (!payload) return false;

//    // لو انتهت صلاحية التوكن (exp بالـ JWT)
//    const now = Math.floor(Date.now() / 1000);
//    if (payload.exp && payload.exp < now) return false;

//    return true;
//}

//function ensureAuth({ redirect = true } = {}) {
//    if (!isAuthenticated()) {
//        if (redirect) _hardLogout("/login.html");
//        return false;
//    }
//    return true;
//}

//// ====== Core AJAX wrapper ======
//function apiRequest(method, url, data, opts = {}) {
//    const needsAuth = opts.auth !== false;

//    if (needsAuth && !ensureAuth({ redirect: opts.redirect !== false })) {
//        return $.Deferred().reject({ status: 401, message: "Unauthorized" }).promise();
//    }

//    const headers = { ...(opts.headers || {}) };
//    if (needsAuth) {
//        const t = getToken();
//        if (t) headers.Authorization = "Bearer " + t;
//    }

//    const isForm = (typeof FormData !== "undefined") && (data instanceof FormData);

//    const ajaxOptions = {
//        url,
//        method,
//        headers,
//        dataType: opts.dataType || "json",
//        contentType: isForm
//            ? false
//            : (opts.contentType || (data !== undefined && !opts.raw ? "application/json" : undefined)),
//        data:
//            data === undefined
//                ? undefined
//                : (opts.raw || isForm ? data : JSON.stringify(data)),
//        processData: isForm ? false : (opts.processData ?? !opts.raw),
//        timeout: opts.timeout || 15000,
//        ...opts
//    };

//    return $.ajax(ajaxOptions);
//}

//// ====== Shorthands ======
//const apiGet = (url, opts) => apiRequest("GET", url, undefined, opts);
//const apiPost = (url, data, opts) => apiRequest("POST", url, data, opts);
//const apiPut = (url, data, opts) => apiRequest("PUT", url, data, opts);
//const apiDelete = (url, opts) => apiRequest("DELETE", url, undefined, opts);

//// هندلة 401 عالميًا
//$.ajaxSetup({
//    statusCode: {
//        401: function () { _hardLogout("/login.html"); }
//    }
//});

//// =========================
//// API Wrapper موحّد
////  تمرير مسارات نسبية تبدأ بـ "/" فقط
////  مثال صحيح: Api.get('/menu/my')
////  مثال خاطئ: Api.get('/api/menu/my') ← سيكرر "api"
//// =========================
//const Api = {
//    get: (path, opts) => apiGet(API.base + path, opts),
//    post: (path, data, opts) => apiPost(API.base + path, data, opts),
//    put: (path, data, opts) => apiPut(API.base + path, data, opts),
//    delete: (path, opts) => apiDelete(API.base + path, opts)
//};

//// ✅ توحيد التصدير (عشان يتوفر في window)
//window.Api = Api;
