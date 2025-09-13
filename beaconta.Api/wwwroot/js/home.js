/* =========================================================
   Home screen (SoC) — يعتمد jQuery + Bootstrap 4 + BMD + Toastr
   - لا يحتاج menu.js — تعريف MENU داخل هذا الملف
   - يحافظ على نفس سلوك نسختك الأصلية مع تحسين الثبات وتجربة الاستخدام
========================================================= */

$(function () {
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

    // ======= MENU (مضمّن هنا بدل menu.js) =======
    const MENU = {
        dashboard: {
            title: 'الرئيسية', groups: [{
                title: 'لوحة التحكم', items: [
                    { id: 'dashboard-overview', icon: 'bi-speedometer2', title: 'الرئيسية', desc: 'نظرة عامة', url: 'pages/dashboard.html' }
                ]
            }]
        },
        schoolYears: {
            title: 'إدارة السنوات الدراسية', groups: [{
                title: 'عمليات', items: [
                    { id: 'new-year', icon: 'bi-calendar-plus', title: 'إنشاء سنة جديدة', url: 'pages/new-year.html' },
                    { id: 'terms-calendar', icon: 'bi-calendar-week', title: 'تحديد الفصول والتقويم', url: '#' },
                    { id: 'rollover', icon: 'bi-arrows-collapse', title: 'ترحيل الطلاب والعقود', url: '#' },
                    { id: 'link-fees-curricula', icon: 'bi-link-45deg', title: 'ربط الرسوم والمناهج', url: '#' },
                    { id: 'annual-reports', icon: 'bi-file-earmark-bar-graph', title: 'تقارير سنوية', url: '#' }
                ]
            }]
        },
        schools: {
            title: 'إدارة المدارس', groups: [{
                title: 'المدارس والمراحل', items: [
                    { id: 'manage-schools', icon: 'bi-building', title: 'المدارس', url: 'pages/schools.html' },
                    { id: 'manage-stages', icon: 'bi-diagram-3', title: 'المراحل والصفوف', url: 'pages/stages.html' }
                ]
            }]
        },
        students: {
            title: 'الطلاب', groups: [
                {
                    title: 'إدارة الطلاب', items: [
                        { id: 'registration', icon: 'bi-person-plus', title: 'التسجيل والملفات', url: '#' },
                        { id: 'attendance', icon: 'bi-calendar-check', title: 'الحضور والغياب', url: '#' },
                        { id: 'subjects-curricula', icon: 'bi-bar-chart-line', title: 'الأداء الأكاديمي', url: '#' },
                        { id: 'behavior', icon: 'bi-emoji-smile', title: 'السلوك والأنشطة', url: '#' },
                        { id: 'graduation', icon: 'bi-person-check', title: 'التخرج والتحويل', url: '#' }
                    ]
                },
                {
                    title: 'الكتب الرسمية', items: [
                        { id: 'certificate-transfer', icon: 'bi-file-earmark-text', title: 'شهادة انتقال', url: '#' },
                        { id: 'certificate-proof', icon: 'bi-file-earmark-text', title: 'شهادة إثبات طالب', url: '#' },
                        { id: 'phase-completion', icon: 'bi-file-earmark-text', title: 'شهادة إنهاء مرحلة', url: '#' },
                        { id: 'good-conduct', icon: 'bi-file-earmark-text', title: 'شهادة حسن سلوك', url: '#' }
                    ]
                },
                {
                    title: 'إدارة وثائق الطلاب', items: [
                        { id: 'docs-checklist', icon: 'bi-card-checklist', title: 'قائمة الوثائق المطلوبة', url: '#' },
                        { id: 'docs-entry', icon: 'bi-inbox', title: 'إدخال واستلام الوثائق', url: '#' },
                        { id: 'docs-upload', icon: 'bi-upload', title: 'رفع نسخ إلكترونية وربطها بالطالب', url: '#' },
                        { id: 'docs-store', icon: 'bi-box', title: 'مستودع الوثائق الأصلية', url: '#' },
                        { id: 'docs-alerts', icon: 'bi-bell', title: 'تنبيهات النواقص + تقارير متابعة', url: '#' }
                    ]
                }
            ]
        },
        academia: {
            title: 'الأكاديمية', groups: [{
                title: 'الأكاديمية ', items: [
                    { id: 'subjects-curricula', icon: 'bi-journal-bookmark', title: 'المواد والمناهج', url: '#' },
                    { id: 'weekly-plans', icon: 'bi-calendar3-week', title: 'الخطط الأسبوعية', url: '#' },
                    { id: 'exams', icon: 'bi-pencil-square', title: 'الامتحانات', url: '#' },
                    { id: 'e-learning', icon: 'bi-laptop', title: 'التعليم الإلكتروني', url: '#' },
                    { id: 'automatic-schedules', icon: 'bi-table', title: 'الجداول الآلية', url: '#' },
                    { id: 'performance-reports', icon: 'bi-bar-chart', title: 'تقارير الأداء', url: '#' }
                ]
            }]
        },
        contracts: {
            title: 'العقود', groups: [{
                title: 'أنواع العقود', items: [
                    { id: 'parent-contracts', icon: 'bi-file-earmark-text', title: 'عقود أولياء الأمور', url: '#' },
                    { id: 'staff-contracts', icon: 'bi-file-earmark-text', title: 'عقود الموظفين', url: '#' },
                    { id: 'supplier-contracts', icon: 'bi-file-earmark-text', title: 'عقود الموردين', url: '#' }
                ]
            }]
        },
        finance: {
            title: 'المالية', groups: [
                {
                    title: 'المالية', items: [
                        { id: 'installments-bills', icon: 'bi-receipt', title: 'الأقساط والفواتير', url: '#' },
                        { id: 'payment-vouchers', icon: 'bi-cash-coin', title: 'سندات القبض', url: '#' },
                        { id: 'budget-reports', icon: 'bi-file-earmark-bar-graph', title: 'الميزانية والتقارير', url: '#' },
                        { id: 'national-billing', icon: 'bi-link-45deg', title: 'الربط مع الفوترة الوطنية', url: '#' }
                    ]
                },
                {
                    title: 'التحصيل القانوني', items: [
                        { id: 'follow-defaulters', icon: 'bi-clock-history', title: 'متابعة المتأخرين', url: '#' },
                        { id: 'warnings', icon: 'bi-exclamation-triangle', title: 'الإنذارات', url: '#' },
                        { id: 'cases-courts', icon: 'bi-gavel', title: 'القضايا والمحاكم', url: '#' },
                        { id: 'payment-status', icon: 'bi-check-circle', title: 'تحديث حالة السداد', url: '#' }
                    ]
                }
            ]
        },
        hr: {
            title: 'شؤون الموظفين', groups: [
                {
                    title: 'شؤون الموظفين', items: [
                        { id: 'personal-files', icon: 'bi-person-badge', title: 'الملفات الشخصية', url: '#' },
                        { id: 'salaries-advances', icon: 'bi-cash-stack', title: 'الرواتب والسلف', url: '#' },
                        { id: 'rewards-sanctions', icon: 'bi-gift', title: 'المكافآت والعقوبات', url: '#' },
                        { id: 'leaves-promotions', icon: 'bi-arrow-up-right-circle', title: 'الإجازات والترقيات', url: '#' },
                        { id: 'attendance-shifts', icon: 'bi-clock', title: 'الحضور والانصراف + المناوبات', url: '#' }
                    ]
                },
                {
                    title: 'التوظيف', items: [
                        { id: 'vacancy-announcement', icon: 'bi-megaphone', title: 'الإعلان عن الشواغر', url: '#' },
                        { id: 'application-receipt', icon: 'bi-envelope-open', title: 'استقبال الطلبات', url: '#' },
                        { id: 'screening-interviews', icon: 'bi-clipboard-check', title: 'فرز ومقابلات', url: '#' },
                        { id: 'convert-to-employee', icon: 'bi-person-check', title: 'التحويل إلى موظف', url: '#' }
                    ]
                }
            ]
        },
        transport: {
            title: 'المواصلات', groups: [{
                title: 'المواصلات', items: [
                    { id: 'buses-drivers', icon: 'bi-bus-front', title: 'إدارة الباصات والسائقين', url: '#' },
                    { id: 'routes', icon: 'bi-map', title: 'الجولات والمسارات', url: '#' },
                    { id: 'gps-tracking', icon: 'bi-geo-alt', title: 'تتبع GPS', url: '#' },
                    { id: 'parent-notifications', icon: 'bi-bell', title: 'إشعارات أولياء الأمور', url: '#' }
                ]
            }]
        },
        warehouses: {
            title: 'المستودعات', groups: [
                {
                    title: 'المستودعات', items: [
                        { id: 'book-management', icon: 'bi-journal', title: 'إدارة الكتب', url: '#' },
                        { id: 'uniform-management', icon: 'bi-shirt', title: 'إدارة الزي', url: '#' },
                        { id: 'pos-students', icon: 'bi-bag', title: 'البيع (POS للطلاب)', url: '#' },
                        { id: 'inventory-alerts', icon: 'bi-exclamation-circle', title: 'الجرد والتنبيهات', url: '#' }
                    ]
                },
                {
                    title: 'المشتريات', items: [
                        { id: 'purchase-requests', icon: 'bi-file-earmark-plus', title: 'طلبات الشراء', url: '#' },
                        { id: 'price-offers', icon: 'bi-tags', title: 'عروض الأسعار', url: '#' },
                        { id: 'purchase-orders', icon: 'bi-cart', title: 'أوامر الشراء', url: '#' },
                        { id: 'receiving', icon: 'bi-box-arrow-in-down', title: 'استلام وربط بالمستودع', url: '#' },
                        { id: 'finance-link', icon: 'bi-link-45deg', title: 'الربط مع المالية', url: '#' }
                    ]
                },
                {
                    title: 'المقصف الذكي', items: [
                        { id: 'canteen-products', icon: 'bi-list-ul', title: 'قائمة المنتجات والمخزون', url: '#' },
                        { id: 'canteen-pos', icon: 'bi-credit-card', title: 'نقطة البيع (POS)', url: '#' },
                        { id: 'student-wallet', icon: 'bi-wallet', title: 'الدفع بمحفظة الطالب / بطاقة NFC', url: '#' },
                        { id: 'parent-notifications-canteen', icon: 'bi-bell', title: 'إشعارات لولي الأمر', url: '#' },
                        { id: 'sales-reports', icon: 'bi-graph-up-arrow', title: 'تقارير المبيعات والأرباح', url: '#' },
                        { id: 'healthy-options', icon: 'bi-heart', title: 'خيارات التغذية الصحية', url: '#' }
                    ]
                }
            ]
        },
        archiving: {
            title: 'الأرشفة', groups: [{
                title: 'الأرشفة', items: [
                    { id: 'student-files-archive', icon: 'bi-folder', title: 'ملفات الطلاب', url: '#' },
                    { id: 'contracts-archive', icon: 'bi-file-earmark-zip', title: 'العقود', url: '#' },
                    { id: 'admin-documents', icon: 'bi-file-earmark-richtext', title: 'الوثائق الإدارية', url: '#' },
                    { id: 'outgoing-incoming-books', icon: 'bi-journal-arrow-down', title: 'الكتب الصادرة والواردة', url: '#' },
                    { id: 'official-copies', icon: 'bi-journal-arrow-up', title: 'نسخ الكتب الرسمية + الوثائق', url: '#' }
                ]
            }]
        },
        notes: {
            title: 'الملاحظات والقضايا', groups: [{
                title: 'الملاحظات والقضايا', items: [
                    { id: 'parents-complaints', icon: 'bi-chat-dots', title: 'شكاوى أولياء الأمور', url: '#' },
                    { id: 'student-cases', icon: 'bi-people', title: 'قضايا الطلاب', url: '#' },
                    { id: 'staff-cases', icon: 'bi-person', title: 'قضايا الموظفين', url: '#' }
                ]
            }]
        },
        circulars: {
            title: 'التعاميم الإدارية', groups: [{
                title: 'التعاميم الإدارية', items: [
                    { id: 'issue-circulars', icon: 'bi-send', title: 'إصدار التعاميم', url: '#' },
                    { id: 'follow-implementation', icon: 'bi-check2-square', title: 'متابعة التنفيذ', url: '#' }
                ]
            }]
        },
        permissions: {
            title: 'الصلاحيات', groups: [{
                title: 'الصلاحيات', items: [
                    { id: 'user-management', icon: 'bi-person-lines-fill', title: 'إدارة المستخدمين', url: '#' },
                    { id: 'role-management', icon: 'bi-shield-lock', title: 'المجموعات والصلاحيات التفصيلية', url: '#' }
                ]
            }]
        },
        monitoring: {
            title: 'المراقبة', groups: [{
                title: 'المراقبة', items: [
                    { id: 'logs-tracking', icon: 'bi-hdd-network', title: 'تتبع العمليات (Logs)', url: '#' },
                    { id: 'performance-reports-mon', icon: 'bi-bar-chart-line', title: 'تقارير الأداء', url: '#' }
                ]
            }]
        },
        centralReports: {
            title: 'نظام التقارير المركزي', groups: [{
                title: 'نظام التقارير المركزي', items: [
                    { id: 'student-reports', icon: 'bi-file-earmark-bar-graph', title: 'تقارير الطلاب', url: '#' },
                    { id: 'academia-reports', icon: 'bi-file-earmark-bar-graph', title: 'تقارير الأكاديميا', url: '#' },
                    { id: 'contracts-reports', icon: 'bi-file-earmark-bar-graph', title: 'تقارير العقود', url: '#' },
                    { id: 'finance-reports', icon: 'bi-file-earmark-bar-graph', title: 'تقارير المالية', url: '#' },
                    { id: 'hr-reports', icon: 'bi-file-earmark-bar-graph', title: 'تقارير الموظفين', url: '#' },
                    { id: 'transport-reports', icon: 'bi-file-earmark-bar-graph', title: 'تقارير المواصلات', url: '#' },
                    { id: 'warehouses-reports', icon: 'bi-file-earmark-bar-graph', title: 'تقارير المستودعات والمقصف', url: '#' },
                    { id: 'archiving-reports', icon: 'bi-file-earmark-bar-graph', title: 'تقارير الأرشفة', url: '#' },
                    { id: 'notes-reports', icon: 'bi-file-earmark-bar-graph', title: 'تقارير الملاحظات والقضايا', url: '#' },
                    { id: 'management-reports', icon: 'bi-file-earmark-bar-graph', title: 'تقارير الإدارة العليا (KPIs + AI + What-if)', url: '#' }
                ]
            }]
        },
        upperManagement: {
            title: 'الإدارة العليا', groups: [{
                title: 'الإدارة العليا', items: [
                    { id: 'executive-dashboard', icon: 'bi-speedometer2', title: 'Executive Dashboard', url: '#' },
                    { id: 'kpi', icon: 'bi-bar-chart', title: 'مؤشرات الأداء KPIs', url: '#' },
                    { id: 'strategic-reports', icon: 'bi-file-earmark-bar-graph', title: 'تقارير استراتيجية', url: '#' }
                ]
            }]
        }
    };

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
        const sec = MENU[state.main]; if (!sec) return;

        sec.groups.forEach((g, gi) => {
            const box = document.createElement('div'); box.className = 'group';
            box.innerHTML = `
        <div class="group-header" data-toggle="${gi}">
          <div class="group-title">${g.title}</div>
          <i class="bi bi-chevron-down"></i>
        </div>
        <div class="group-items"></div>`;
            const wrap = box.querySelector('.group-items');

            g.items.forEach(it => {
                const row = document.createElement('div');
                row.className = 'side-item';
                row.tabIndex = 0;
                row.dataset.open = it.id; row.dataset.url = it.url; row.dataset.title = it.title;
                row.innerHTML = `<i class="bi ${it.icon}"></i>
          <div><div class="font-weight-bold">${it.title}</div>
          <small class="text-muted">${it.desc || ''}</small></div>`;
                row.addEventListener('click', () => { openTab({ id: it.id, title: it.title, url: it.url }); toast('تم فتح: ' + it.title); drawerClose(); });
                row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); } });
                wrap.appendChild(row);
            });

            container.appendChild(box);
        });
        container.querySelectorAll('.group-header').forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed')));
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
            chip.addEventListener('click', (e) => { if (e.target.closest('.close')) { tryClose(t.id); } else { activateTab(t.id); } });
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
            const ld = document.createElement('div'); ld.className = 'loader'; ld.dataset.loader = tab.id; ld.innerHTML = '<div class="spinner"></div>';
            frames.appendChild(ld);

            f = document.createElement('iframe');
            f.className = 'frame'; f.dataset.tab = tab.id;
            const fallbackUrl = !tab.url || tab.url === '#' ? `pages/${tab.id}.html` : tab.url;
            const url = fallbackUrl.includes('?') ? `${fallbackUrl}&tabId=${encodeURIComponent(tab.id)}` : `${fallbackUrl}?tabId=${encodeURIComponent(tab.id)}`;
            f.src = url;
            f.setAttribute('sandbox', 'allow-forms allow-same-origin allow-scripts');
            f.addEventListener('load', () => frames.querySelector(`[data-loader="${tab.id}"]`)?.remove());
            frames.appendChild(f);
        }
    }

    function openTab({ id, title, url }) {
        const ex = state.tabs.find(t => t.id === id);
        state.tabs.forEach(t => t.active = false);
        if (ex) { ex.active = true; ensureFrame(ex); }
        else { const t = { id, title, url, active: true, dirty: false }; state.tabs.push(t); ensureFrame(t); }
        save(); renderTabs();
    }
    function activateTab(id) { state.tabs.forEach(t => t.active = (t.id === id)); save(); renderTabs(); }
    function setDirty(id, dirty = true) { const t = state.tabs.find(x => x.id === id); if (t) { t.dirty = !!dirty; save(); renderTabs(); } }
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
        save(); renderTabs();
    }

    // ======= Drawer (موبايل) =======
    function drawerOpen() { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); }
    function drawerClose() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
    $('#btnMenu').on('click', drawerOpen);
    $('#btnCloseDrawer').on('click', drawerClose);
    drawer.addEventListener('click', (e) => { if (e.target === drawer) drawerClose(); });

    // ======= Main Tabs (أعلى الشريط) =======
    function bindMainTabs(containerId) {
        const root = document.getElementById(containerId); if (!root) return;
        root.addEventListener('click', (e) => {
            const a = e.target.closest('.nav-link'); if (!a) return;
            e.preventDefault();
            root.querySelectorAll('.nav-link').forEach(x => x.classList.remove('active'));
            a.classList.add('active');
            state.main = a.dataset.main; save();
            buildSidebar(document.getElementById('sidebar'));
            buildSidebar(document.getElementById('sidebarMobile'));
        });
    }
    bindMainTabs('mainTabs');

    // ======= بحث جانبي + بحث علوي =======
    function applySideFilter(q) {
        document.querySelectorAll('#sidebar .side-item, #sidebarMobile .side-item').forEach(n => {
            const t = (n.dataset.title || '').toLowerCase();
            n.style.display = t.includes(q) ? '' : 'none';
        });
    }
    $('#sideSearch').on('input', function () { applySideFilter(this.value.trim().toLowerCase()); });
    // Ctrl+K يركّز البحث العلوي
    $(document).on('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#globalSearch').focus(); } });
    $('#globalSearch').on('keydown', function (e) {
        if (e.key === 'Enter') {
            const q = this.value.trim().toLowerCase(); if (!q) return;
            // افتح أول عنصر يطابق من القائمة الحالية
            const match = [...document.querySelectorAll('#sidebar .side-item')].find(n => (n.dataset.title || '').toLowerCase().includes(q));
            if (match) match.click(); else toast('لا توجد نتائج في هذا القسم');
        }
    });

    // ======= أزرار أعلى الشريط =======
    $('#themeBtn').on('click', () => {
        const isDark = $html.attr('data-theme') === 'dark';
        $html.attr('data-theme', isDark ? 'light' : 'dark');
        state.theme = $html.attr('data-theme'); save(); syncThemeIcon();
    });
    function syncThemeIcon() { const dark = $html.attr('data-theme') === 'dark'; $('#themeBtn').html(`<i class="bi ${dark ? 'bi-sun' : 'bi-moon-stars'}"></i>`); }

    $('#reloadActive').on('click', () => {
        const a = state.tabs.find(t => t.active); if (!a) return;
        const frame = frames.querySelector(`iframe[data-tab="${a.id}"]`); if (!frame) return;
        const ld = document.createElement('div'); ld.className = 'loader'; ld.dataset.loader = a.id; ld.innerHTML = '<div class="spinner"></div>';
        frames.appendChild(ld);
        frame.contentWindow.location.reload();
        frame.addEventListener('load', () => frames.querySelector(`[data-loader="${a.id}"]`)?.remove(), { once: true });
    });

    // ======= Fullscreen =======
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
    toggleBtn?.addEventListener('click', (e) => { e.preventDefault(); document.querySelector('#frames .iframe-fullscreen') ? exitFullscreen() : enterFullscreen(); });

    // ======= رسائل من الصفحات الفرعية =======
    window.addEventListener('message', (e) => {
        const d = e.data || {};
        if (d.type === 'openTab' && d.id && d.title && d.url) openTab(d);
        if (d.type === 'dirty' && d.tabId) setDirty(d.tabId, !!d.value);
    });

    // ======= اختيار السنة الدراسية =======
    $('#yearDropdown + .dropdown-menu .dropdown-item').on('click', function (e) {
        e.preventDefault();
        const yearText = this.textContent; const yearValue = this.dataset.value;
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
        if (e.altKey && (e.key === 'w' || e.key === 'W')) { e.preventDefault(); const a = state.tabs.find(t => t.active); if (a) tryClose(a.id); }
        // Alt+R إعادة تحميل التبويب
        if (e.altKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); $('#reloadActive').click(); }
    });

    // ======= Utilities =======
    function toast(msg) { toastr.info(msg, 'معلومة', { timeOut: 1400, positionClass: 'toast-bottom-left' }); }

    // ======= إقلاع =======
    load();
    buildSidebar(document.getElementById('sidebar'));
    buildSidebar(document.getElementById('sidebarMobile'));
    state.tabs.forEach(t => ensureFrame(t));
    if (state.tabs.length === 0) openTab({ id: 'dashboard-overview', title: 'الرئيسية', url: 'pages/dashboard.html' });
    else renderTabs();
    syncThemeIcon();
});
