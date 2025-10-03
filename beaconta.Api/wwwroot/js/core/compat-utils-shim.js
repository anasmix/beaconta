
/* === compat-utils-shim.js === */
    (function () {
        'use strict';
    // اجمع أي نسخة متاحة
    const U = window.utils || window.Utils || { };

  // تسمية موحّدة
  if (!U.escape) U.escape = U.escapeHtml || (s => (s ?? '').toString()
    .replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#039;"));

if (!U.formatDateTime) U.formatDateTime = U.fmtDate || (d => {
    if (!d) return '—';
    const x = new Date(d); if (isNaN(x)) return '—';
    return x.toLocaleDateString('ar-EG') + ' ' + x.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
});

if (!U.toInt) U.toInt = v => { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; };

if (!U.apiMessage) U.apiMessage = (err, fallback = 'حدث خطأ') => {
    try {
        return err?.responseJSON?.message || err?.message || err?.statusText || fallback;
    } catch { return fallback; }
};

if (!U.apiFieldErrors) U.apiFieldErrors = (err) => {
    // يدعم ModelState: { errors: { field: ["msg"] } }
    return err?.responseJSON?.errors || null;
};

if (!U.toastSuccess) U.toastSuccess = (m) => Swal.fire({ icon: 'success', title: m, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
if (!U.toastError) U.toastError = (m) => Swal.fire({ icon: 'error', title: m, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
if (!U.toastInfo) U.toastInfo = (m) => Swal.fire({ icon: 'info', title: m, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });

if (!U.debounce) U.debounce = (fn, delay = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), delay); } };

if (!U.confirm) U.confirm = async (title = 'تأكيد', text = 'هل أنت متأكد؟', ok = 'تأكيد', cancel = 'إلغاء', icon = 'question') => {
    const r = await Swal.fire({ title, text, icon, showCancelButton: true, confirmButtonText: ok, cancelButtonText: cancel });
    return r.isConfirmed;
};

if (!U.select2) U.select2 = function ($el, data, options = {}) {
    if (window.jQuery?.fn?.select2) {
        const base = { data, theme: 'bootstrap-5', width: '100%' };
        return $el.select2(Object.assign(base, options));
    } else {
        // fallback بسيط
        $el.empty();
        if (options.allowClear) $el.append(new Option('', ''));
        (data || []).forEach(o => $el.append(new Option(o.text, o.id)));
    }
};

// اختصارات لوحة المفاتيح المستخدمة فقط في هذه الشاشة
if (!U.hotkey) U.hotkey = function (combo, handler) {
    combo = combo.toLowerCase();
    document.addEventListener('keydown', (e) => {
        const needCtrl = combo.includes('ctrl+');
        const needShift = combo.includes('shift+');
        const key = combo.split('+').pop();
        if ((needCtrl ? e.ctrlKey : !e.ctrlKey) &&
            (needShift ? e.shiftKey : !e.shiftKey)) {
            // ctrl+/ أو ctrl+shift+n
            if (key === '/' && e.key === '/') { e.preventDefault(); handler(); }
            if (key === 'n' && e.key.toLowerCase() === 'n') { e.preventDefault(); handler(); }
        }
    });
};

// علّق النسختين لتجنّب أخطاء الاسم
window.utils = U;
window.Utils = U;
}) ();