// =========================
// API (with auth + helpers)
// =========================
const API = {
    base: "/api",
    users: "/api/Users",
    roles: "/api/Roles"
};

function getToken() {
    return localStorage.getItem("jwtToken");
}
function ensureAuth() {
    const t = getToken();
    if (!t) { window.location.href = "/auth/login.html"; return false; }
    return true;
}

function apiRequest(method, url, data, opts = {}) {
    if (!ensureAuth()) return $.Deferred().reject().promise();
    return $.ajax({
        url,
        method,
        headers: { Authorization: "Bearer " + getToken() },
        contentType: opts.contentType || (data !== undefined ? "application/json" : undefined),
        data: data !== undefined ? (opts.raw ? data : JSON.stringify(data)) : undefined,
        processData: opts.processData ?? true
    });
}

const apiGet = (url) => apiRequest("GET", url);
const apiPost = (url, data, opts) => apiRequest("POST", url, data, opts);
const apiPut = (url, data, opts) => apiRequest("PUT", url, data, opts);
const apiDelete = (url) => apiRequest("DELETE", url);
