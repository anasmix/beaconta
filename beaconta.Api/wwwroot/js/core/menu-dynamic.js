// js/core/menu-dynamic.js
(async function () {
    'use strict';
    try {
        // 1) جلب القوائم المفلترة من السيرفر
        const res = await apiGet(API.base + '/menu/my');
        const data = Array.isArray(res) ? res : [];

        // 2) تحويلها إلى بنية MENU الداخلية
        const MENU = {};
        data.forEach(section => {
            MENU[section.sectionKey] = {
                title: section.title,
                icon: section.icon || 'bi-circle',
                groups: (section.groups || []).map(g => ({
                    title: g.title,
                    items: (g.items || []).map(it => ({
                        id: it.itemKey,
                        icon: it.icon || 'bi-dot',
                        title: it.title,
                        desc: it.desc || '',
                        url: it.url || '#'
                    }))
                }))
            };
        });

        // 3) إذا API ما رجع شيء → fallback
        window.MENU = Object.keys(MENU).length ? MENU : (window.MENU_FALLBACK || {});

        // 4) إعادة بناء الواجهة
        window.Nav?.refresh?.();

        console.log('✅ MENU loaded dynamically:', window.MENU);

    } catch (err) {
        console.error('❌ فشل تحميل القائمة:', err);

        // fallback في حالة الفشل
        window.MENU = window.MENU_FALLBACK || {};
        window.Nav?.refresh?.();

        (window.Utils?.toastError || window.toastr?.error || console.error)('تعذّر تحميل القوائم');
    }
})();
