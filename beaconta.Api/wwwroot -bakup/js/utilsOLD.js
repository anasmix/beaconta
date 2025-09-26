// /js/utils.js
// جميع الأدوات (Helpers) مجمّعة في كائن واحد اسمه Utils
// الاستعمال: Utils.blockButton(...), Utils.toastSuccess(...)

window.Utils = (function () {
    'use strict';

    // =========================
    // Toast + Notifications
    // =========================
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-start',
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true
    });

    const toastSuccess = (m) => Toast.fire({ icon: 'success', title: m });
    const toastInfo = (m) => Toast.fire({ icon: 'info', title: m });
    const toastWarn = (m) => Toast.fire({ icon: 'warning', title: m });
    const toastError = (m) => Toast.fire({ icon: 'error', title: m });

    // =========================
    // Error Handler
    // =========================
    function handleApiError(xhr) {
        if (!xhr) {
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'غير معروف' });
            return;
        }
        if (xhr.status === 401) {
            Swal.fire({
                icon: 'warning',
                title: 'انتهت الجلسة',
                text: 'فضلاً قم بتسجيل الدخول'
            }).then(() => location.href = '/login.html');
            return;
        }
        const msg = (xhr.responseJSON?.message || xhr.responseText || 'حدث خطأ غير متوقع').toString();
        console.error(xhr);
        Swal.fire({ icon: 'error', title: 'خطأ', text: msg.substring(0, 500) });
    }

    // =========================
    // Button Helpers
    // =========================
    function blockButton($btn, state = true, text = "جاري المعالجة...") {
        if (!$btn || !$btn.length) return;
        if (state) {
            $btn.data("original-text", $btn.html());
            $btn.prop("disabled", true).html(
                `<span class="spinner-border spinner-border-sm"></span> ${text}`
            );
        } else {
            $btn.prop("disabled", false).html($btn.data("original-text") || "حفظ");
        }
    }

    // =========================
    // Formatters + Helpers
    // =========================
    const fmt = (s) => (!s ? '—' : s);
    const fmtDate = (s) => s ? new Date(s).toLocaleString('ar-JO') : '—';

    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function debounce(fn, wait = 300) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(null, args), wait);
        };
    }

    function saveState(key, obj) {
        localStorage.setItem(key, JSON.stringify(obj));
    }

    function loadState(key, def = {}) {
        try { return JSON.parse(localStorage.getItem(key)) || def; }
        catch { return def; }
    }

    function statusBadge(s) {
        return s === 'active'
            ? '<span class="badge bg-success-subtle text-success fw-bold">مفعل</span>'
            : '<span class="badge bg-danger-subtle text-danger fw-bold">معطل</span>';
    }

    function roleChip(name) {
        return `<span class="role-chip"><i class="bi bi-shield-lock me-1"></i>${escapeHtml(name || '—')}</span>`;
    }

    function loadingSkeleton(rows = 6) {
        return '<div class="placeholder-glow">' +
            Array.from({ length: rows })
                .map(() => '<div class="placeholder col-12 mb-2" style="height: 18px;"></div>')
                .join('') +
            '</div>';
    }

    function confirmDelete(text = 'هل تريد الحذف؟') {
        return Swal.fire({
            icon: 'warning',
            title: 'تأكيد',
            text,
            showCancelButton: true,
            confirmButtonText: 'حذف',
            cancelButtonText: 'إلغاء'
        });
    }

    function updateStats(users) {
        const last24 = Date.now() - 86400000;
        $('#statTotal').text(users.length);
        $('#statActive').text(users.filter(u => u.status === 'active').length);
        $('#statInactive').text(users.filter(u => u.status !== 'active').length);
        $('#statLastDay').text(users.filter(u =>
            u.lastLogin && new Date(u.lastLogin).getTime() > last24).length);
    }

    // =========================
    // Public API
    // =========================
    return {
        toastSuccess, toastInfo, toastWarn, toastError,
        handleApiError,
        blockButton,
        fmt, fmtDate, escapeHtml, debounce,
        saveState, loadState,
        statusBadge, roleChip, loadingSkeleton, confirmDelete, updateStats
    };
})();
