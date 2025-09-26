/* =========================================================
   Home screen (SoC) — jQuery + Bootstrap 4 + BMD + Toastr
   - لا يوجد MENU ثابت هنا؛ يتم تحميله ديناميكياً من /api/menu/my
   - يعتمد على التوكن المخزّن في localStorage
========================================================= */

$(async function () {
    // تفعيل Bootstrap Material Design
    $('body').bootstrapMaterialDesign();

    // ======= الحالة العامة =======
    const KEY = 'school_shell_home_v2';
    const $html = $('html');
    let state = {
        theme: $html.attr('data-theme') || 'light',
        main: 'dashboard',
        tabs: [] // [{id,title,url,active,dirty}]
    };

    // ======= قائمة ديناميكية =======
    let MENU = {};           // سيتم تعبئته من السيرفر
    window.MENU = MENU;      // مرئي عالمياً إن احتجته للتصحيح

    async function loadMenu() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // لا يوجد توكن => رجّع المستخدم لصفحة الدخول
                window.location.href = 'login.html';
                return;
            }

            const res = await fetch('/api/menu/my', {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json'
                }
            });

            if (res.status === 401) {
                // انتهت صلاحية التوكن أو غير صالح
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            if (!res.ok) throw new Error('فشل تحميل القائمة');

            MENU = await res.json();
            window.MENU = MENU;

            // بعد التحميل ابني السايدبار (ديسكتوب + موبايل)
            buildSidebar(document.getElementById('sidebar'));
            buildSidebar(document.getElementById('sidebarMobile'));
        } catch (err) {
            console.error(err);
            toastr.error('لم يتم تحميل القوائم', 'خطأ');
        }
    }

    // ======= حفظ/قراءة الحالة =======
    function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
    function load() {
        try {
            const s = JSON.parse(localStorage.getItem(KEY));
            if (s) state = Object.assign(state, s);
            $html.attr('data-theme', state.theme);
            syncThemeIcon();
        } catch { }
    }

    // ======= عناصر DOM =======
    const tabsBar = document.getElementById('tabsBar');
    const frames = document.getElementById('frames');
    const drawer = document.getElementById('drawer');

    // ======= بناء السايدبار =======
    function buildSidebar(container) {
        if (!container) return;
        container.innerHTML = '';

        const sec = MENU?.[state.main];
        if (!sec || !sec.groups || !Array.isArray(sec.groups)) return;

        sec.groups.forEach((g, gi) => {
            const box = document.createElement('div');
            box.className = 'group';
            box.innerHTML = `
                <div class="group-header" data-toggle="${gi}">
                  <div class="group-title">${g.title || ''}</div>
                  <i class="bi bi-chevron-down"></i>
                </div>
                <div class="group-items"></div>`;
            const wrap = box.querySelector('.group-items');

            (g.items || []).forEach(it => {
                const row = document.createElement('div');
                row.className = 'side-item';
                row.tabIndex = 0;
                row.dataset.open = it.id;
                row.dataset.url = it.url;
                row.dataset.title = it.title;
                row.innerHTML = `
                    <i class="bi ${it.icon || 'bi-square'}"></i>
                    <div>
                        <div class="font-weight-bold">${it.title || ''}</div>
                        <small class="text-muted">${it.desc || ''}</small>
                    </div>`;
                row.addEventListener('click', () => {
                    openTab({ id: it.id, title: it.title, url: it.url });
                    toast('تم فتح: ' + it.title);
                    drawerClose();
                });
                row.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); }
                });
                wrap.appendChild(row);
            });

            container.appendChild(box);
        });

        container.querySelectorAll('.group-header')
            .forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed')));
    }

    // ======= تبويبات العمل + الإطارات =======
    function renderTabs() {
        tabsBar.innerHTML = '';
        document.querySelector('.empty').style.display = state.tabs.length ? 'none' : 'flex';

        state.tabs.forEach(t => {
            const chip = document.createElement('div');
            chip.className = `chip ${t.active ? 'active' : ''} ${t.dirty ? 'dirty' : ''} animate__animated animate__fadeIn`;
            chip.dataset.tab = t.id;
            chip.innerHTML = `
                <span class="dot"></span>
                <i class="bi bi-window-stack"></i>
                <span>${t.title}</span>
                <button class="close" title="إغلاق"><i class="bi bi-x-lg"></i></button>`;
            chip.addEventListener('click', (e) => {
                if (e.target.closest('.close')) { tryClose(t.id); }
                else { activateTab(t.id); }
            });
            tabsBar.appendChild(chip);
        });

        // إظهار/إخفاء الإطارات
        [...frames.querySelectorAll('iframe')].forEach(f => {
            const id = f.dataset.tab;
            f.style.display = state.tabs.find(x => x.id === id)?.active ? 'block' : 'none';
        });
    }

    function ensureFrame(tab) {
        let f = frames.querySelector(`iframe[data-tab="${tab.id}"]`);
        if (!f) {
            // Loader overlay
            const ld = document.createElement('div');
            ld.className = 'loader';
            ld.dataset.loader = tab.id;
            ld.innerHTML = '<div class="spinner"></div>';
            frames.appendChild(ld);

            f = document.createElement('iframe');
            f.className = 'frame';
            f.dataset.tab = tab.id;

            const fallbackUrl = !tab.url || tab.url === '#' ? `pages/${tab.id}.html` : tab.url;
            const url = fallbackUrl.includes('?')
                ? `${fallbackUrl}&tabId=${encodeURIComponent(tab.id)}`
                : `${fallbackUrl}?tabId=${encodeURIComponent(tab.id)}`;

            f.src = url;
            f.setAttribute('sandbox', 'allow-forms allow-same-origin allow-scripts');
            f.addEventListener('load', () => frames.querySelector(`[data-loader="${tab.id}"]`)?.remove());
            frames.appendChild(f);
        }
    }

    function openTab({ id, title, url }) {
        const ex = state.tabs.find(t => t.id === id);
        state.tabs.forEach(t => t.active = false);
        if (ex) {
            ex.active = true;
            ensureFrame(ex);
        } else {
            const t = { id, title, url, active: true, dirty: false };
            state.tabs.push(t);
            ensureFrame(t);
        }
        save();
        renderTabs();
    }

    function activateTab(id) {
        state.tabs.forEach(t => t.active = (t.id === id));
        save();
        renderTabs();
    }

    function setDirty(id, dirty = true) {
        const t = state.tabs.find(x => x.id === id);
        if (t) { t.dirty = !!dirty; save(); renderTabs(); }
    }

    function tryClose(id) {
        const t = state.tabs.find(x => x.id === id); if (!t) return;
        if (t.dirty && !confirm('هناك تغييرات غير محفوظة — إغلاق التبويب؟')) return;
        closeTab(id);
    }

    function closeTab(id) {
        const idx = state.tabs.findIndex(t => t.id === id); if (idx < 0) return;
        const wasActive = state.tabs[idx].active;
        frames.querySelector(`[data-loader="${id}"]`)?.remove();
        frames.querySelector(`iframe[data-tab="${id}"]`)?.remove();
        state.tabs.splice(idx, 1);
        if (wasActive && state.tabs.length) state.tabs[state.tabs.length - 1].active = true;
        save();
        renderTabs();
    }

    // ======= Drawer (موبايل) =======
    function drawerOpen() { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); }
    function drawerClose() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
    $('#btnMenu').on('click', drawerOpen);
    $('#btnCloseDrawer').on('click', drawerClose);
    drawer.addEventListener('click', (e) => { if (e.target === drawer) drawerClose(); });

    // ======= Main Tabs (أعلى الشريط) =======
    function bindMainTabs(containerId) {
        const root = document.getElementById(containerId);
        if (!root) return;
        root.addEventListener('click', (e) => {
            const a = e.target.closest('.nav-link');
            if (!a) return;
            e.preventDefault();
            root.querySelectorAll('.nav-link').forEach(x => x.classList.remove('active'));
            a.classList.add('active');
            state.main = a.dataset.main;
            save();
            buildSidebar(document.getElementById('sidebar'));
            buildSidebar(document.getElementById('sidebarMobile'));
        });
    }
    bindMainTabs('mainTabs');
    bindMainTabs('mainTabsMobile'); // لدعم شريط الموبايل داخل الـ Drawer

    // ======= بحث جانبي + بحث علوي =======
    function applySideFilter(q) {
        document.querySelectorAll('#sidebar .side-item, #sidebarMobile .side-item').forEach(n => {
            const t = (n.dataset.title || '').toLowerCase();
            n.style.display = t.includes(q) ? '' : 'none';
        });
    }
    $('#sideSearch').on('input', function () { applySideFilter(this.value.trim().toLowerCase()); });
    $('#sideSearchMobile').on('input', function () { applySideFilter(this.value.trim().toLowerCase()); });

    // Ctrl+K يركّز البحث العلوي (لو موجود عنصر بعنوان #globalSearch)
    $(document).on('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault(); $('#globalSearch').focus();
        }
    });
    $('#globalSearch').on('keydown', function (e) {
        if (e.key === 'Enter') {
            const q = this.value.trim().toLowerCase();
            if (!q) return;
            const match = [...document.querySelectorAll('#sidebar .side-item')]
                .find(n => (n.dataset.title || '').toLowerCase().includes(q));
            if (match) match.click(); else toast('لا توجد نتائج في هذا القسم');
        }
    });

    // ======= أزرار أعلى الشريط =======
    $('#themeBtn').on('click', () => {
        const isDark = $html.attr('data-theme') === 'dark';
        $html.attr('data-theme', isDark ? 'light' : 'dark');
        state.theme = $html.attr('data-theme');
        save();
        syncThemeIcon();
    });
    function syncThemeIcon() {
        const dark = $html.attr('data-theme') === 'dark';
        $('#themeBtn').html(`<i class="bi ${dark ? 'bi-sun' : 'bi-moon-stars'}"></i>`);
    }

    $('#reloadActive').on('click', () => {
        const a = state.tabs.find(t => t.active); if (!a) return;
        const frame = frames.querySelector(`iframe[data-tab="${a.id}"]`); if (!frame) return;
        const ld = document.createElement('div');
        ld.className = 'loader';
        ld.dataset.loader = a.id;
        ld.innerHTML = '<div class="spinner"></div>';
        frames.appendChild(ld);
        frame.contentWindow.location.reload();
        frame.addEventListener('load', () => frames.querySelector(`[data-loader="${a.id}"]`)?.remove(), { once: true });
    });

    // ======= وضع ملء الشاشة =======
    const toggleBtn = document.getElementById('iframeFullscreenToggle');
    $('#exitFullscreenBtn').on('click', exitFullscreen);
    function getActiveIframe() {
        const activeTab = state.tabs.find(t => t.active);
        if (activeTab) return frames.querySelector(`iframe[data-tab="${activeTab.id}"]`);
        const visible = [...document.querySelectorAll('#frames iframe')].find(f => getComputedStyle(f).display !== 'none');
        return visible || document.querySelector('#frames iframe:last-child') || null;
    }
    function enterFullscreen() {
        const iframe = getActiveIframe(); if (!iframe) return;
        iframe.classList.add('iframe-fullscreen');
        $('.appbar,.sidebar,.ws-tabs,#drawer').addClass('fullscreen-hidden');
        $('#fullscreenBar').show();
        toggleBtn?.querySelector('i')?.classList.replace('bi-arrows-fullscreen', 'bi-arrows-angle-contract');
    }
    function exitFullscreen() {
        const iframe = document.querySelector('#frames .iframe-fullscreen'); if (!iframe) return;
        iframe.classList.remove('iframe-fullscreen');
        $('.appbar,.sidebar,.ws-tabs,#drawer').removeClass('fullscreen-hidden');
        $('#fullscreenBar').hide();
        toggleBtn?.querySelector('i')?.classList.replace('bi-arrows-angle-contract', 'bi-arrows-fullscreen');
    }
    toggleBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#frames .iframe-fullscreen') ? exitFullscreen() : enterFullscreen();
    });

    // ======= رسائل من الصفحات الفرعية =======
    window.addEventListener('message', (e) => {
        const d = e.data || {};
        if (d.type === 'openTab' && d.id && d.title && d.url) openTab(d);
        if (d.type === 'dirty' && d.tabId) setDirty(d.tabId, !!d.value);
    });

    // ======= اختيار السنة الدراسية =======
    $('#yearDropdown + .dropdown-menu .dropdown-item').on('click', function (e) {
        e.preventDefault();
        const yearText = this.textContent;
        const yearValue = this.dataset.value;
        $('#currentYear').text(yearText);
        localStorage.setItem('schoolYear', yearValue);
        window.dispatchEvent(new CustomEvent('schoolYearChanged', { detail: yearValue }));
    });
    const savedYear = localStorage.getItem('schoolYear');
    if (savedYear) {
        const sel = document.querySelector(`#yearDropdown + .dropdown-menu .dropdown-item[data-value="${savedYear}"]`);
        if (sel) $('#currentYear').text(sel.textContent);
    }

    // ======= اختصارات مفيدة =======
    $(document).on('keydown', function (e) {
        // Alt+W إغلاق التبويب النشط
        if (e.altKey && (e.key === 'w' || e.key === 'W')) {
            e.preventDefault();
            const a = state.tabs.find(t => t.active);
            if (a) tryClose(a.id);
        }
        // Alt+R إعادة تحميل التبويب
        if (e.altKey && (e.key === 'r' || e.key === 'R')) {
            e.preventDefault();
            $('#reloadActive').click();
        }
    });

    // ======= Utilities =======
    function toast(msg) { toastr.info(msg, 'معلومة', { timeOut: 1400, positionClass: 'toast-bottom-left' }); }

    // ======= إقلاع =======
    load();                 // تحميل الثيم والحالة
    await loadMenu();       // تحميل القوائم من الـ API (يبني السايدبار أيضاً)

    // استعادة الإطارات المفتوحة سابقاً أو فتح الرئيسية
    state.tabs.forEach(t => ensureFrame(t));
    if (state.tabs.length === 0) {
        openTab({ id: 'dashboard-overview', title: 'الرئيسية', url: 'pages/dashboard.html' });
    } else {
        renderTabs();
    }

    // مزامنة أيقونة الثيم
    syncThemeIcon();
});
