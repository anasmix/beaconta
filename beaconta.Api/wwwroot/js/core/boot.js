// js/core/boot.js
(function () {
    'use strict';

    // 1) تفعيل BMD
    $(function () { $('body').bootstrapMaterialDesign(); });

    // 2) تحميل الحالة
    App.loadState();

    // 3) بناء أولي باستخدام fallback (قبل وصول API)
    window.MENU = window.MENU || (window.MENU_FALLBACK || {});
    window.Nav?.refresh?.();

    // 4) استعادة التبويبات أو فتح الرئيسية
    (state.tabs || []).forEach(t => Tabs.ensureFrame(t));
    if (!state.tabs || state.tabs.length === 0) {
        Tabs.openTab({ id: 'dashboard-overview', title: 'الرئيسية', url: 'pages/dashboard.html' });
    } else {
        Tabs.renderTabs();
    }

    // 5) أزرار الشريط العلوي
    document.getElementById('themeBtn')?.addEventListener('click', () => {
        const isDark = document.documentElement.dataset.theme === 'dark';
        document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
        state.theme = document.documentElement.dataset.theme; App.saveState(); App.syncThemeIcon();
    });
    App.syncThemeIcon();
    document.getElementById('reloadActive')?.addEventListener('click', () => Tabs.reloadActive());

    // 6) البحث العام (Placeholder)
    document.getElementById('globalSearch')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { App.toastInfo('ميزة البحث العام قيد التطوير'); }
    });

    // 7) اختصارات
    document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'w' || e.key === 'W')) { e.preventDefault(); const a = state.tabs.find(t => t.active); if (a) Tabs.tryClose(a.id); }
        if (e.altKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); Tabs.reloadActive(); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('globalSearch')?.focus(); }
    });

    // 8) جسور توافقية مع أي كود قديم يعتمد أسماء قديمة
    window.openTab = Tabs.openTab;          // كود قديم كان يستدعي openTab()
    window.drawerClose = Drawer.close;      // كود قديم كان يستدعي drawerClose()
})();