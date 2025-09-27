(async function () {
    try {
        // 1️⃣ جلب القوائم من API
        const res = await apiGet(API.base + "/menu/my");
        const data = res || [];

        window.MENU = MENU;

        data.forEach(section => {
            MENU[section.sectionKey] = {
                title: section.title,
                icon: section.icon || "bi-circle",
                groups: section.groups.map(g => ({
                    title: g.title,
                    items: g.items.map(it => ({
                        id: it.itemKey,
                        icon: it.icon || "bi-dot",
                        title: it.title,
                        desc: it.desc || "",
                        url: it.url || "#"
                    }))
                }))
            };
        });

        // خزّن في window
        window.MENU = MENU;

        // 🟢 2️⃣ دالة التحقق من الصلاحيات
        function can(key) {
            // لو ما في نظام صلاحيات لسه، رجّع true
            if (!window.USER_KEYS) return true;
            return window.USER_KEYS.includes(key);
        }

        // 🟢 3️⃣ بناء nav bar ديناميكي (مع فلترة)
        function buildNav(containerId) {
            const root = document.getElementById(containerId);
            root.innerHTML = "";
            let firstKey = null;

            Object.entries(MENU).forEach(([key, sec]) => {
                // ✨ تحقق إن القسم يحتوي عناصر مسموحة
                const hasPerm = sec.groups.some(g =>
                    g.items.some(it => can(it.id))
                );
                if (!hasPerm) return;

                if (!firstKey) firstKey = key;
                const li = document.createElement("li");
                li.className = "nav-item";
                li.innerHTML = `
                    <a class="nav-link ${firstKey === key ? "active" : ""}" data-main="${key}" href="#">
                        <i class="bi ${sec.icon}"></i>
                        <span>${sec.title}</span>
                    </a>`;
                root.appendChild(li);
            });

            return firstKey;
        }

        const firstTab = buildNav("mainTabs");
        buildNav("mainTabsMobile");

        // menu-dynamic.js
        window.buildSidebar = function (container, mainKey) {
            container.innerHTML = ""; // 🟢 مهم لمسح القديم

            const sec = MENU[mainKey];
            if (!sec || !Array.isArray(sec.groups)) return;

            sec.groups.forEach((g, gi) => {
                const items = (g.items || []).filter(it => can(it.id));
                if (items.length === 0) return;

                const box = document.createElement("div");
                box.className = "group";
                box.innerHTML = `
          <div class="group-header" data-toggle="${gi}">
            <div class="group-title">${g.title}</div>
            <i class="bi bi-chevron-down"></i>
          </div>
          <div class="group-items"></div>`;
                const wrap = box.querySelector(".group-items");

                items.forEach(it => {
                    const row = document.createElement("div");
                    row.className = "side-item";
                    row.dataset.open = it.id;
                    row.dataset.url = it.url;
                    row.dataset.title = it.title;
                    row.innerHTML = `<i class="bi ${it.icon}"></i>
                             <div><div class="font-weight-bold">${it.title}</div>
                             <small class="text-muted">${it.desc}</small></div>`;
                    row.addEventListener("click", () => {
                        openTab({ id: it.id, title: it.title, url: it.url });
                        drawerClose();
                    });
                    wrap.appendChild(row);
                });

                container.appendChild(box);
            });
        };

        // 🟢 5️⃣ ربط الـ nav bar مع الـ sidebar
        function bindMainTabs(containerId, sidebarId) {
            const root = document.getElementById(containerId);
            root.addEventListener("click", e => {
                const a = e.target.closest(".nav-link");
                if (!a) return;
                e.preventDefault();
                root.querySelectorAll(".nav-link").forEach(x => x.classList.remove("active"));
                a.classList.add("active");
                const mainKey = a.dataset.main;
                buildSidebar(document.getElementById(sidebarId), mainKey);
            });
        }

        bindMainTabs("mainTabs", "sidebar");
        bindMainTabs("mainTabsMobile", "sidebarMobile");

        // 🟢 6️⃣ أول مرة: افتح أول تبويب مسموح
        if (firstTab) {
            buildSidebar(document.getElementById("sidebar"), firstTab);
            buildSidebar(document.getElementById("sidebarMobile"), firstTab);
        }

        console.log("✅ Dynamic MENU loaded with permissions:", MENU);

    } catch (err) {
        console.error("❌ فشل تحميل القائمة:", err);
        Utils.toastError?.("تعذّر تحميل القوائم");
    }
})();
