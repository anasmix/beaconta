// /js/perms.js
// بدل ما يكون module → تعريف global
(function (w) {
    'use strict';

    // كل الصلاحيات معرفة هنا
    const _perms = {
        Users_View: { key: "Users_View", name: "عرض المستخدمين" },
        Users_Add: { key: "Users_Add", name: "إضافة مستخدم" },
        Users_Edit: { key: "Users_Edit", name: "تعديل مستخدم" },
        Users_Delete: { key: "Users_Delete", name: "حذف مستخدم" },

        Roles_View: { key: "Roles_View", name: "عرض الأدوار" },
        Roles_Add: { key: "Roles_Add", name: "إضافة دور" },
        Roles_Edit: { key: "Roles_Edit", name: "تعديل دور" },
        Roles_Delete: { key: "Roles_Delete", name: "حذف دور" },

        Perms_View: { key: "Perms_View", name: "عرض الصلاحيات" },
        Perms_Edit: { key: "Perms_Edit", name: "تعديل الصلاحيات" }
    };

    // مصفوفة مرتبة
    const list = Object.values(_perms);

    // دوال مساعدة
    function get(key) {
        return _perms[key] || null;
    }

    function all() {
        return list;
    }

    // كشف للواجهة العامة
    w.Perms = {
        get,
        all,
        list,
        keys: Object.keys(_perms)
    };

})(window);
