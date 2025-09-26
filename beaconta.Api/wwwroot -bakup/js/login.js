// /js/login.js
$(function () {
    const onLoginPage =
        !!document.getElementById('loginForm') ||
        /\/login(\.html)?$/i.test(location.pathname);

    if (!onLoginPage || window.IS_APP_SHELL) return;

    $('#togglePassword').on('click', function () {
        const $pass = $('#password');
        const isPwd = $pass.attr('type') === 'password';
        $pass.attr('type', isPwd ? 'text' : 'password').trigger('focus');
        $(this).find('i').toggleClass('bi-eye bi-eye-slash');
    });

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
        const url = API.auth + "/login";


        apiPost(url, payload, { auth: false, timeout: 15000, dataType: 'json' }) // ✅ json
            .done(function (res) {
                let token = res?.token || null;
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
