// /js/utils.js
var Utils = {
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
        if (!d) return '—';
        const date = new Date(d);
        if (isNaN(date)) return '—';
        return date.toLocaleDateString('ar-EG') + ' ' +
            date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
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

        $("#statTotal, #statTotalUsers").text(total);
        $("#statActive, #statActiveUsers").text(active);
        $("#statInactive, #statInactiveUsers").text(inactive);
        $("#statLastDay").text(lastDay);
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
    toastInfo: (msg) => Swal.fire({ icon: 'info', title: msg, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false })
};

window.Utils = Utils;
