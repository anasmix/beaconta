// /js/utils.js (merged, backward-compatible + API client)
(function (w) {
    'use strict';

    // --- إعدادات قابلة للتفعيل لكل صفحة ---
    const config = {
        latinDigits: false,           // افتراضي: لا يفرض الأرقام اللاتينية
        numberLocaleLatin: 'en-US',   // للعرض اللاتيني
        numberLocaleArabic: 'ar-EG'   // للاستخدام القديم إن لزم
    };

    // محوّل أرقام عربي/فارسي -> لاتيني (يُستخدم عند تفعيل latinDigits)
    function toLatinDigits(s) {
        if (s == null) return '';
        return String(s)
            .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
            .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    }

    // تنسيق أرقام مع مراعاة إعداد اللاتيني
    function formatNumber(n, opts) {
        const num = Number(n) || 0;
        const locale = config.latinDigits ? config.numberLocaleLatin : (opts?.locale || config.numberLocaleArabic);
        const text = num.toLocaleString(locale, opts);
        return config.latinDigits ? toLatinDigits(text) : text;
    }

    // ----------- دوالك الأصلية (بدون كسر سلوك) -----------
    const Utils = {
        // 🔹 نفس الدوال القديمة كما هي
        escapeHtml: function (unsafe) {
            if (!unsafe) return '';
            return String(unsafe)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        },

        fmtDate: function (d) {
            // الحفاظ على السلوك السابق مع خيار اللاتيني عند التفعيل
            if (!d) return '—';
            const date = new Date(d);
            if (isNaN(date)) return '—';
            const loc = config.latinDigits ? 'en-US' : 'ar-EG';
            const part1 = date.toLocaleDateString(loc);
            const part2 = date.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
            const out = part1 + ' ' + part2;
            return config.latinDigits ? toLatinDigits(out) : out;
        },

        statusBadge: function (status) {
            if (status === 'active') return `<span class="badge bg-success">نشط</span>`;
            if (status === 'inactive') return `<span class="badge bg-danger">موقوف</span>`;
            return `<span class="badge bg-secondary">${status}</span>`;
        },

        roleChip: function (role) {
            if (!role) return '—';
            return `<span class="badge bg-primary-subtle text-primary">${role}</span>`;
        },

        debounce: function (fn, delay = 300) {
            let timer;
            return function (...args) {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        },

        updateStats: function (input) {
            if (!input) return;

            let total, active, inactive, lastDay;
            if (Array.isArray(input)) {
                const users = input;
                total = users.length;
                active = users.filter(u => u.status === 'active').length;
                inactive = users.filter(u => u.status === 'inactive').length;
                const since = Date.now() - 24 * 3600 * 1000;
                lastDay = users.filter(u => new Date(u.createdAt).getTime() >= since).length;
            } else {
                total = input.totalUsers ?? 0;
                active = input.activeUsers ?? 0;
                inactive = input.inactiveUsers ?? 0;
                lastDay = input.lastDay ?? 0;
            }

            // الحفاظ على نفس المعرّفات، مع احترام اللاتيني عند التفعيل
            const T = v => config.latinDigits ? toLatinDigits(String(v)) : v;
            $("#statTotal, #statTotalUsers").text(T(total));
            $("#statActive, #statActiveUsers").text(T(active));
            $("#statInactive, #statInactiveUsers").text(T(inactive));
            $("#statLastDay").text(T(lastDay));
        },

        confirmDelete: async function (msg = "هل أنت متأكد من الحذف؟") {
            return await Swal.fire({
                title: msg,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "نعم، احذف",
                cancelButtonText: "إلغاء",
                confirmButtonColor: "#d33"
            });
        },

        toastSuccess: (msg) => Swal.fire({ icon: 'success', title: msg, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false }),
        toastError: (msg) => Swal.fire({ icon: 'error', title: msg, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false }),
        toastInfo: (msg) => Swal.fire({ icon: 'info', title: msg, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false }),

        // ----------- إضافات جديدة (غير مكسِرة) -----------
        // تشغيل/إيقاف اللاتيني للصفحة الحالية فقط
        useLatinDigits: function (on = true) { config.latinDigits = !!on; },

        // أرقام/عملات
        money: function (n, digits = 2) {
            return formatNumber(n, { minimumFractionDigits: digits, maximumFractionDigits: digits });
        },
        int: function (n) {
            return formatNumber(n);
        },
        toLatinDigits, // متاح للاستخدام اليدوي عند الحاجة

        // LocalStorage helpers
        lsGet: function (key, def = null) { try { return JSON.parse(localStorage.getItem(key)); } catch { return def; } },
        lsSet: function (key, val) { localStorage.setItem(key, JSON.stringify(val)); },

        // UI helpers
        setProgress: function (pct, txt) {
            const bar = document.getElementById('progressBar');
            const t = document.getElementById('progressText');
            if (bar) bar.style.width = (pct || 0) + '%';
            if (t && typeof txt === 'string') t.textContent = txt;
        },

        // تنزيل ملفات
        download: function (filename, blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
        },
        toCSV: function (rows) {
            const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
            const csv = rows.map(r => r.map(esc).join(',')).join('\r\n');
            return config.latinDigits ? toLatinDigits(csv) : csv;
        },

        // DataTables Arabic locale (كما هو)
        dtArabic: function () { return { url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/ar.json' }; },

        // معرفات
        uid: function (prefix = 'L') { return `${prefix}-${Math.random().toString(36).slice(2, 8)}`; },

        // إتاحة القراءة للتهيئة الحالية عند الحاجة
        config
    };

    w.Utils = Utils;
})(window);

// =============== API Client ===============
(function (w) {
    'use strict';

    // عميل HTTP بسيط مع دعم التوكن
    const API = {
        // يمكنك ضبطه عالمياً قبل تحميل هذا الملف: window.APP_API_BASE = 'https://your-host/api'
        baseUrl: w.APP_API_BASE || '/api',

        // مكان حفظ التوكن (JWT). غيّره إذا لزم.
        token() {
            // توافقي: جرّب auth.token ثم token
            return localStorage.getItem('auth.token') || localStorage.getItem('token');
        },

        headers(extra) {
            const h = { 'Content-Type': 'application/json', ...extra };
            const t = this.token();
            if (t) h['Authorization'] = `Bearer ${t}`;
            return h;
        },

        async _fetch(method, url, body, params, extraHeaders) {
            const q = params ? '?' + new URLSearchParams(params) : '';
            const res = await fetch(this.baseUrl + url + q, {
                method,
                headers: this.headers(extraHeaders),
                body: body != null ? JSON.stringify(body) : undefined
            });

            if (!res.ok) {
                let payload = null;
                const ct = res.headers.get('content-type') || '';
                try { payload = ct.includes('application/json') ? await res.json() : await res.text(); } catch { }
                const err = new Error(`${method} ${url} -> ${res.status}`);
                err.status = res.status;
                err.payload = payload;
                throw err;
            }

            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) return await res.json();
            if (ct.includes('text/')) return await res.text();
            return null; // ملفات أو 204
        },

        get(url, params, h) { return this._fetch('GET', url, null, params, h); },
        post(url, body, h) { return this._fetch('POST', url, body, null, h); },
        put(url, body, h) { return this._fetch('PUT', url, body, null, h); },
        patch(url, body, h) { return this._fetch('PATCH', url, body, null, h); },
        del(url, h) { return this._fetch('DELETE', url, null, null, h); }
    };

    w.API = API;
})(window);


//// /js/utils.js
//var Utils = {
//    escapeHtml: function (unsafe) {
//        if (!unsafe) return '';
//        return String(unsafe)
//            .replace(/&/g, "&amp;")
//            .replace(/</g, "&lt;")
//            .replace(/>/g, "&gt;")
//            .replace(/"/g, "&quot;")
//            .replace(/'/g, "&#039;");
//    },

//    fmtDate: function (d) {
//        if (!d) return '—';
//        const date = new Date(d);
//        if (isNaN(date)) return '—';
//        return date.toLocaleDateString('ar-EG') + ' ' +
//            date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
//    },

//    statusBadge: function (status) {
//        if (status === 'active') return `<span class="badge bg-success">نشط</span>`;
//        if (status === 'inactive') return `<span class="badge bg-danger">موقوف</span>`;
//        return `<span class="badge bg-secondary">${status}</span>`;
//    },

//    roleChip: function (role) {
//        if (!role) return '—';
//        return `<span class="badge bg-primary-subtle text-primary">${role}</span>`;
//    },

//    debounce: function (fn, delay = 300) {
//        let timer;
//        return function (...args) {
//            clearTimeout(timer);
//            timer = setTimeout(() => fn.apply(this, args), delay);
//        };
//    },

//    updateStats: function (input) {
//        if (!input) return;

//        let total, active, inactive, lastDay;
//        if (Array.isArray(input)) {
//            const users = input;
//            total = users.length;
//            active = users.filter(u => u.status === 'active').length;
//            inactive = users.filter(u => u.status === 'inactive').length;
//            const since = Date.now() - 24 * 3600 * 1000;
//            lastDay = users.filter(u => new Date(u.createdAt).getTime() >= since).length;
//        } else {
//            total = input.totalUsers ?? 0;
//            active = input.activeUsers ?? 0;
//            inactive = input.inactiveUsers ?? 0;
//            lastDay = input.lastDay ?? 0;
//        }

//        $("#statTotal, #statTotalUsers").text(total);
//        $("#statActive, #statActiveUsers").text(active);
//        $("#statInactive, #statInactiveUsers").text(inactive);
//        $("#statLastDay").text(lastDay);
//    },

//    confirmDelete: async function (msg = "هل أنت متأكد من الحذف؟") {
//        return await Swal.fire({
//            title: msg,
//            icon: "warning",
//            showCancelButton: true,
//            confirmButtonText: "نعم، احذف",
//            cancelButtonText: "إلغاء",
//            confirmButtonColor: "#d33"
//        });
//    },

//    toastSuccess: (msg) => Swal.fire({ icon: 'success', title: msg, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false }),
//    toastError: (msg) => Swal.fire({ icon: 'error', title: msg, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false }),
//    toastInfo: (msg) => Swal.fire({ icon: 'info', title: msg, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false })
//};

//window.Utils = Utils;
