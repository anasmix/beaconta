// /js/login.js
// المتطلبات: jQuery + auth.js + api.js + utils.js

$(function () {
    // لا تعمل هذا الملف إلا داخل صفحة تسجيل الدخول فقط
    const onLoginPage =
        !!document.getElementById('loginForm') ||
        /\/login(\.html)?$/i.test(location.pathname);

    // لو نحن داخل الـ App Shell → تجاهل
    if (!onLoginPage || window.IS_APP_SHELL) return;

    // لو المستخدم مسجّل أصلاً، حوّله بعيدًا عن صفحة اللوجين
    try {
        if (typeof isAuthenticated === 'function' && isAuthenticated()) {
            if (/\/login(\.html)?$/i.test(location.pathname)) {
                safeRedirect(getReturnUrl() || '/index.html');
            }
            return;
        }
    } catch { /* ignore */ }

    // تبديل عرض كلمة المرور
    $('#togglePassword').on('click', function () {
        const $pass = $('#password');
        const isPwd = $pass.attr('type') === 'password';
        $pass.attr('type', isPwd ? 'text' : 'password').trigger('focus');
        $(this).find('i').toggleClass('bi-eye bi-eye-slash');
    });

    // إرسال فورم تسجيل الدخول
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        if (!this.checkValidity()) {
            this.classList.add('was-validated');
            return;
        }

        const $submit = $('#btnLogin').length ? $('#btnLogin') : $('button[type="submit"]');
        try { Utils.blockButton($submit, true, 'جاري الدخول...'); } catch { $submit.prop('disabled', true); }

        const payload = {
            username: $('#username').val().trim(),
            password: $('#password').val()
        };
        const remember = $('#rememberMe').is(':checked');

        const base = (API.base || '').replace(/\/+$/, '');
        const url = `${base}/Auth/login`;

        // السيرفر قد يعيد التوكن كنص → نطلبه كـ text
        apiPost(url, payload, { auth: false, timeout: 15000, dataType: 'text' })
            .done(function (res) {
                // يدعم: نص JWT مباشر أو JSON { token: '...' }
                let token = null;
                if (typeof res === 'string') token = res;
                else if (res && typeof res === 'object' && res.token) token = res.token;

                if (!token) throw new Error('الاستجابة لا تحتوي على Token صالح.');

                setToken(token, remember);

                $('#loginMessage')
                    .removeClass('d-none alert-danger')
                    .addClass('alert alert-success')
                    .text('تم تسجيل الدخول بنجاح، جاري التوجيه...');
                try { Utils.toastSuccess('تم تسجيل الدخول'); } catch { }

                const after = getReturnUrl();
                clearReturnUrl();
                setTimeout(() => safeRedirect(after || '/index.html'), 600);
            })
            .fail(function (xhr) {
                const msg =
                    (xhr?.responseJSON?.message) ||
                    (typeof xhr?.responseText === 'string' && xhr.responseText) ||
                    'فشل تسجيل الدخول: بيانات غير صحيحة';

                $('#loginMessage')
                    .removeClass('d-none alert-success')
                    .addClass('alert alert-danger')
                    .text(String(msg).substring(0, 500));
                try { Utils.handleApiError?.(xhr); } catch { }
            })
            .always(function () {
                try { Utils.blockButton($submit, false); } catch { $submit.prop('disabled', false); }
            });
    });

    // ===== أدوات محلية =====
    function getReturnUrl() {
        const q = new URLSearchParams(location.search);
        const fromQs = q.get('returnUrl') || q.get('return') || q.get('after');
        const fromStore = localStorage.getItem('redirectAfterLogin');
        return fromQs || fromStore || '';
    }
    function clearReturnUrl() { try { localStorage.removeItem('redirectAfterLogin'); } catch { } }

    function safeRedirect(target) {
        const fallback = '/index.html';
        try {
            if (!target) return location.assign(fallback);
            if (/^\/(?!\/)/.test(target) || !/^[a-z]+:/i.test(target)) {
                const url = new URL(target, location.origin);
                return location.assign(url.href);
            }
            const url = new URL(target);
            if (url.origin === location.origin) return location.assign(url.href);
            return location.assign(fallback);
        } catch { return location.assign(fallback); }
    }
});
