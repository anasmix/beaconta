// wwwroot/js/core/loader.js
(function () {
    const OVERLAY_ID = 'app-loader';
    let refCount = 0;
    let lastShowTs = 0;
    const MIN_VISIBLE_MS = 300; // لتجنّب الوميض

    function ensureOverlay() {
        if (document.getElementById(OVERLAY_ID)) return;
        const el = document.createElement('div');
        el.id = OVERLAY_ID;
        el.innerHTML = '<div class="spinner" aria-label="Loading"></div>';
        document.body.appendChild(el);
    }

    function show() {
        ensureOverlay();
        refCount++;
        if (refCount === 1) {
            lastShowTs = performance.now();
            document.body.classList.add('app-loading');
        }
    }
    function hide() {
        refCount = Math.max(0, refCount - 1);
        if (refCount === 0) {
            const elapsed = performance.now() - lastShowTs;
            const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
            setTimeout(() => document.body.classList.remove('app-loading'), wait);
        }
    }

    // API عام إن احتجت تستخدمه يدويًا
    window.AppLoader = {
        start: show,
        stop: hide,
        /** يشغّل اللودر حول دالة async واحدة */
        with: async (fn, opts = {}) => {
            if (opts.silent) return fn();
            show();
            try { return await fn(); }
            finally { hide(); }
        }
    };

    // ===== Hook: fetch =====
    const _fetch = window.fetch.bind(window);
    window.fetch = function (input, init = {}) {
        // خيار لتعطيل اللودر لهذا الطلب تحديدًا
        const noLoader = init.noLoader === true ||
            (typeof input === 'string' && input.includes('/swagger')) ||
            (init.headers && (init.headers['X-No-Loader'] || init.headers['x-no-loader']));
        if (noLoader) return _fetch(input, init);

        show();
        return _fetch(input, init)
            .catch(err => { throw err; })
            .finally(() => hide());
    };

    // ===== Hook: jQuery Ajax (إن وُجد) =====
    if (window.jQuery) {
        // عدّاد لكل طلب (ajaxStart/Stop يعملان تجميعيًا؛ نريد per-request)
        jQuery(document).on('ajaxSend', () => show());
        jQuery(document).on('ajaxComplete', () => hide());
    }

    // إظهار لودر عند مغادرة الصفحة/تنقّل
    window.addEventListener('beforeunload', () => show());
})();
