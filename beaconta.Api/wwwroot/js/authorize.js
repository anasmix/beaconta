// /js/authorize.js
// وحدة خفيفة للتعامل مع صلاحيات الواجهة
window.Authorize = (function () {
    let perms = new Set();

    async function load() {
        try {
            // غيّر المسار لو عندك Endpoint آخر يرجّع مصفوفة مفاتيح الصلاحيات
            const keys = await apiGet(API.base + '/me/perms');
            perms = new Set((keys || []).map(String));
        } catch (e) {
            console.warn('Authorize.load: fallback (لم تُحمّل الصلاحيات من API)', e);
            // لا نفترض السماح الكلي، نخلي المجموعة كما هي (فارغة)
        }
        return perms;
    }

    function has(key) {
        if (!key) return true;
        return perms.has(String(key));
    }

    function applyWithin(root = document) {
        root.querySelectorAll('[data-perm]').forEach(el => {
            const req = el.getAttribute('data-perm');
            if (!req) return;
            if (!has(req)) {
                // سياسة الواجهة: إخفاء العنصر
                el.classList.add('d-none');
                // أو بدلاً من ذلك: تعطيل فقط
                // el.setAttribute('disabled', 'disabled'); el.classList.add('disabled');
            }
        });
    }

    return { load, has, applyWithin };
})();
