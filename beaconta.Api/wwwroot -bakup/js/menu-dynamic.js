// js/menu-dynamic.js
(async function () {
    try {
        // ✅ جلب القائمة من API
        const res = await Api.get("/menu/my");
        const data = res || [];

        // ✅ تحويل API response إلى نفس الشكل اللي يستخدمه home.js
        const MENU = {};
        data.forEach(section => {
            MENU[section.sectionKey] = {
                title: section.title,
                groups: section.groups.map(g => ({
                    title: g.title,
                    items: g.items.map(it => ({
                        id: it.itemKey,
                        icon: it.icon || "bi-circle",
                        title: it.title,
                        desc: it.desc || "",
                        url: it.url || "#"
                    }))
                }))
            };
        });

        // ✅ خزنه في window عشان home.js يستخدمه
        window.MENU = MENU;

        // ✅ ابني الـ sidebar بعد تحميل القوائم
        if (typeof buildSidebar === "function") {
            buildSidebar(document.getElementById("sidebar"));
            buildSidebar(document.getElementById("sidebarMobile"));
        }

        console.log("✅ Dynamic MENU loaded:", MENU);

    } catch (err) {
        console.error("❌ فشل تحميل القائمة:", err);
        if (window.Utils?.toastError) {
            Utils.toastError("تعذّر تحميل القوائم، حاول لاحقاً");
        }
    }
})();
