// /js/utils.js
window.Utils = (function () {
    'use strict';

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

    function handleApiError(xhr) {
        if (!xhr) {
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'غير معروف' });
            return;
        }
        if (xhr.status === 401) {
            logout('/login.html');
            return;
        }
        const msg = (xhr.responseJSON?.message || xhr.responseText || 'حدث خطأ غير متوقع').toString();
        console.error(xhr);
        Swal.fire({ icon: 'error', title: 'خطأ', text: msg.substring(0, 500) });
    }

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

    return {
        toastSuccess, toastInfo, toastWarn, toastError,
        handleApiError,
        blockButton
    };
})(); 
