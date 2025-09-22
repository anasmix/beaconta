// perms.js
import { apiGet } from "./api.js";
import { getJwtPayload } from "./auth.js";

export function getPermissionsCache() {
    try { return JSON.parse(localStorage.getItem("permissions") || "[]"); } catch { return []; }
}
export function setPermissionsCache(keys) {
    localStorage.setItem("permissions", JSON.stringify(keys || []));
}
export function hasPermission(key) {
    const perms = getPermissionsCache();
    return perms.includes(key);
}

export async function fetchMyPermissions() {
    const keys = await apiGet("/api/auth/my-permissions");
    setPermissionsCache(keys || []);
    return keys || [];
}

export function getPVCache() {
    const pv = localStorage.getItem("pv");
    return pv ? parseInt(pv, 10) : null;
}
export function setPVCache(pv) {
    localStorage.setItem("pv", String(pv));
}

// حمّل PV من الـ JWT أولًا إن وُجد
export function initPVFromJwt() {
    const payload = getJwtPayload();
    if (payload && payload.PV) setPVCache(parseInt(payload.PV, 10) || 1);
}

// فحص دوري/عند فتح الصفحة: لو تغيّر PV → أعد تحميل الصلاحيات
export async function ensurePermissionsFresh() {
    try {
        const serverPv = await apiGet("/api/auth/pv"); // رقم صحيح
        const cachedPv = getPVCache();
        if (cachedPv == null || serverPv !== cachedPv) {
            await fetchMyPermissions();
            setPVCache(serverPv);
        } else if (!getPermissionsCache().length) {
            // لا توجد صلاحيات مخزنة رغم PV مطابق
            await fetchMyPermissions();
        }
    } catch {
        // تجاهل بهدوء؛ api.js سيتولى 401/403
    }
}

// حارس العناصر بالـ data-attributes
export function applyPermissionGuards(root = document) {
    // data-perm="a.b"
    root.querySelectorAll("[data-perm]").forEach(el => {
        const key = el.getAttribute("data-perm");
        if (key && !hasPermission(key)) el.style.display = "none";
    });
    // data-perm-any="a.b,c.d"
    root.querySelectorAll("[data-perm-any]").forEach(el => {
        const list = (el.getAttribute("data-perm-any") || "")
            .split(",").map(s => s.trim()).filter(Boolean);
        if (!list.some(hasPermission)) el.style.display = "none";
    });
    // data-perm-all="a.b,c.d"
    root.querySelectorAll("[data-perm-all]").forEach(el => {
        const list = (el.getAttribute("data-perm-all") || "")
            .split(",").map(s => s.trim()).filter(Boolean);
        if (!list.every(hasPermission)) el.style.display = "none";
    });
}

// حارس صفحة كاملة (تحقق سريع قبل جلب بيانات الصفحة)
export function requirePagePermission(...keys) {
    if (!keys || !keys.length) return;
    const ok = keys.every(hasPermission);
    if (!ok) window.location.href = "/403.html";
}
