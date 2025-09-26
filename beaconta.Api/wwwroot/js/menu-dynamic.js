(async function () {
    try {
        // 1️⃣ جلب القوائم من API
        const res = await apiGet(API.base + "/menu/my");
        const data = res || [];

        const MENU = {};
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

        // 2️⃣ بناء nav bar ديناميكي
        function buildNav(containerId) {
            const root = document.getElementById(containerId);
            root.innerHTML = "";
            let firstKey = null;

            Object.entries(MENU).forEach(([key, sec], idx) => {
                if (idx === 0) firstKey = key;
                const li = document.createElement("li");
                li.className = "nav-item";
                li.innerHTML = `
                    <a class="nav-link ${idx === 0 ? "active" : ""}" data-main="${key}" href="#">
                        <i class="bi ${sec.icon}"></i>
                        <span>${sec.title}</span>
                    </a>`;
                root.appendChild(li);
            });

            return firstKey;
        }

        const firstTab = buildNav("mainTabs");
        buildNav("mainTabsMobile");

        // 3️⃣ بناء sidebar عند اختيار تبويب
        function buildSidebar(container, mainKey) {
            container.innerHTML = "";
            const sec = MENU[mainKey];
            if (!sec) return;

            sec.groups.forEach((g, gi) => {
                const box = document.createElement("div");
                box.className = "group";
                box.innerHTML = `
                    <div class="group-header" data-toggle="${gi}">
                        <div class="group-title">${g.title}</div>
                        <i class="bi bi-chevron-down"></i>
                    </div>
                    <div class="group-items"></div>`;
                const wrap = box.querySelector(".group-items");

                g.items.forEach(it => {
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
        }

        // 4️⃣ اربط الـ nav bar بالـ sidebar
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

        // 5️⃣ أول مرة: حمل أول تبويب
        if (firstTab) {
            buildSidebar(document.getElementById("sidebar"), firstTab);
            buildSidebar(document.getElementById("sidebarMobile"), firstTab);
        }

        console.log("✅ Dynamic MENU loaded:", MENU);

    } catch (err) {
        console.error("❌ فشل تحميل القائمة:", err);
        Utils.toastError?.("تعذّر تحميل القوائم");
    }
})();
