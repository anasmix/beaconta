// /js/school-years.js
(function () {
    'use strict';
    const $ = jQuery;

    // ================== REST ==================
    const API_BASE = '/api';
    const ENDPOINTS = {
        branches: `${API_BASE}/branches`,
        schools: `${API_BASE}/schools?simple=true`,                 // يرجّع [{id,name}] أو اضبطه بما لديك
        years: `${API_BASE}/school-years`,                          // GET (list) + POST (create)
        year: (id) => `${API_BASE}/school-years/${id}`,             // GET (by id) + PUT (update) + DELETE
        overlaps: `${API_BASE}/school-years/overlaps`,              // POST {id?, branchId, startDate, endDate}
        setActive: `${API_BASE}/school-years/set-active`,           // POST {branchId, yearId}
    };

    // ================== HTTP ==================
    function getToken() { return localStorage.getItem('token'); }
    async function http(method, url, body, opts = {}) {
        const headers = { 'Accept': 'application/json' };
        if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json';
        const tok = getToken(); if (tok) headers['Authorization'] = `Bearer ${tok}`;
        const res = await fetch(url, { method, headers, body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined, credentials: 'include', ...opts });
        const ct = res.headers.get('content-type') || '';
        if (!res.ok) {
            let msg = `HTTP ${res.status}`;
            try {
                if (ct.includes('application/json')) {
                    const j = await res.json();
                    msg = j?.message || j?.title || j?.error || JSON.stringify(j) || msg;
                } else msg = (await res.text()) || msg;
            } catch { /* ignore */ }
            throw new Error(msg);
        }
        if (!ct.includes('application/json')) return res;
        return res.status === 204 ? null : res.json();
    }

    const api = {
        // lookups
        getBranches: async () => await http('GET', ENDPOINTS.branches).catch(() => []),
        getSchools: async () => await http('GET', ENDPOINTS.schools).catch(() => []),

        // years
        listYears: async (params) => {
            const q = new URLSearchParams();
            if (params?.q) q.set('q', params.q);
            if (params?.branchId) q.set('branchId', params.branchId);
            if (params?.status) q.set('status', params.status);
            if (params?.isActive !== undefined && params.isActive !== '') q.set('isActive', String(params.isActive));
            const url = `${ENDPOINTS.years}${q.toString() ? ('?' + q.toString()) : ''}`;
            return await http('GET', url);
        },
        getYear: async (id) => await http('GET', ENDPOINTS.year(id)),

        // ✅ PUT الصحيح إلى /school-years/{id}
        upsertYear: async (dto) => {
            if (dto?.id && dto.id > 0) {
                return await http('PUT', ENDPOINTS.year(dto.id), dto);
            } else {
                return await http('POST', ENDPOINTS.years, dto);
            }
        },

        deleteYear: async (id) => await http('DELETE', ENDPOINTS.year(id)),
        checkOverlap: async (payload) => await http('POST', ENDPOINTS.overlaps, payload),
        setActive: async (branchId, yearId) => await http('POST', ENDPOINTS.setActive, { branchId, yearId }),
    };

    // ================== DOM ==================
    const $txtSearch = $('#txtSearch');
    const $filterBranchId = $('#filterBranchId');
    const $filterStatus = $('#filterStatus');
    const $filterActive = $('#filterActive');
    const $btnResetFilters = $('#btnResetFilters');

    const $btnCompare = $('#btnCompare'); // احتياطي
    const $btnAdd = $('#btnAdd');
    const $btnSetActive = $('#btnSetActive');

    // مودالات
    let yearModal = null;
    let activeModal = null;

    // عناصر نموذج السنة
    const $yearId = $('#yearId');
    const $yearCode = $('#yearCode');
    const $yearName = $('#yearName');
    const $branchId = $('#branchId');
    const $startDate = $('#startDate');
    const $endDate = $('#endDate');
    const $status = $('#status');
    const $colorHex = $('#colorHex');
    const $isActive = $('#isActive');
    const $financeBackPostDays = $('#financeBackPostDays');
    const $allowPaymentsOnClosedAcademic = $('#allowPaymentsOnClosedAcademic');
    const $notes = $('#notes');
    const $overlapAlert = $('#overlapAlert');

    // مودال تعيين سنة فعّالة
    const $activeBranchId = $('#activeBranchId');
    const $activeYearId = $('#activeYearId');
    const $btnConfirmSetActive = $('#btnConfirmSetActive');

    // ================== State ==================
    let BRANCHES = [];
    let dt;
    const branchesMap = {};   // branchId -> "School — Branch"

    // ================== Helpers (أرقام لاتينية + تاريخ ميلادي) ==================
    // أرقام لاتينية في الواجهة العربية
    const LOCALE_NUM = 'ar-SA-u-nu-latn';                     // أرقام لاتينية
    const LOCALE_DT = 'ar-SA-u-ca-gregory-nu-latn';          // غريغوري + أرقام لاتينية

    const numFmt = (v) => new Intl.NumberFormat(LOCALE_NUM).format(Number(v || 0));
    const dateTimeFmt = (d) => new Intl.DateTimeFormat(LOCALE_DT, { dateStyle: 'short', timeStyle: 'short' })
        .format(d instanceof Date ? d : new Date(d || Date.now()));

    // لتحويل أي نص فيه أرقام هندية (في مخرجات طرف ثالث مثل DataTables)
    const toLatinDigits = (s = '') => String(s).replace(/[\u0660-\u0669\u06F0-\u06F9]/g,
        ch => {
            const code = ch.charCodeAt(0);
            const zero = (code >= 0x06F0) ? 0x06F0 : 0x0660;
            return String(code - zero);
        });

    const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
    function toast(title, icon = 'success') { if (window.Swal) Swal.fire({ toast: true, position: 'top', timer: 2200, showConfirmButton: false, icon, title }); else alert(title); }
    function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

    function pickReadableText(hex = '#0d6efd') {
        try {
            const c = hex.replace('#', ''); const r = parseInt(c.substr(0, 2), 16); const g = parseInt(c.substr(2, 2), 16); const b = parseInt(c.substr(4, 2), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000; return (yiq >= 150) ? '#111' : '#fff';
        } catch { return '#fff'; }
    }
    function statusPill(s) {
        let cls = 'secondary', label = '—';
        if (s === 'Open') { cls = 'warning'; label = 'مفتوح'; }
        else if (s === 'ClosedAcademic') { cls = 'secondary'; label = 'مغلق أكاديميًا'; }
        else if (s === 'Closed') { cls = 'danger'; label = 'مغلق'; }
        else if (s === 'Archived') { cls = 'dark'; label = 'مؤرشف'; }
        return `<span class="badge bg-${cls}">${label}</span>`;
    }
    function renderActive(val) {
        return val
            ? `<span class="chip"><span class="dot" style="background:#10b981"></span>نعم</span>`
            : `<span class="chip"><span class="dot" style="background:#94a3b8"></span>لا</span>`;
    }
    function renderPeriod(s, e) {
        const sd = s ? new Date(s) : null, ed = e ? new Date(e) : null;
        if (!sd || !ed) return '—';
        const pad = n => String(n).padStart(2, '0');
        return `${pad(sd.getMonth() + 1)}/${sd.getFullYear()} — ${pad(ed.getMonth() + 1)}/${ed.getFullYear()}`;
    }
    function colorBadge(hex, text) {
        if (!hex) return `<span class="text-muted">—</span>`;
        const fg = pickReadableText(hex);
        return `<span class="chip" style="background:${hex};color:${fg}"><span class="dot" style="background:${fg};border:1px solid #0002"></span>${esc(text || hex)}</span>`;
    }

    // ================== Lookups ==================
    async function loadLookups() {
        // نبني خريطة المدارس أولاً
        const SCHOOLS = await api.getSchools(); // /api/schools?simple=true
        const schoolById = {};
        (SCHOOLS || []).forEach(s => { schoolById[s.id] = s.name; });

        // نجلب الفروع
        BRANCHES = await api.getBranches();

        const $f = $filterBranchId.empty().append(new Option('الكل', ''));
        $branchId.empty();
        $activeBranchId.empty();

        (BRANCHES || []).forEach(b => {
            const schoolName = b.schoolName || schoolById[b.schoolId] || '';
            const label = schoolName ? `${schoolName} — ${b.name}` : b.name;
            branchesMap[b.id] = label;

            $f.append(new Option(label, b.id));
            $branchId.append(new Option(label, b.id));
            $activeBranchId.append(new Option(label, b.id));
        });

        // Select2 داخل المودالات لتفادي مشاكل الطبقات
        if (window.$?.fn?.select2) {
            if (!$branchId.data('select2')) {
                $branchId.select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#yearModal') });
            }
            if (!$activeBranchId.data('select2')) {
                $activeBranchId.select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#activeModal') });
            }
            if (!$filterBranchId.data('select2')) {
                $filterBranchId.select2({ theme: 'bootstrap-5', width: '100%' });
            }
        }
    }

    // ================== Table ==================
    async function filterTable() {
        const params = {
            q: ($txtSearch.val() || '').trim() || undefined,
            branchId: $filterBranchId.val() || undefined,
            status: $filterStatus.val() || undefined,
            isActive: $filterActive.val() === '' ? undefined : $filterActive.val()
        };
        const list = await api.listYears(params);
        buildTable(list || []);
        updateStats(list || []);
    }

    function updateStats(rows) {
        const total = rows.length;
        const active = rows.reduce((s, r) => s + (r.isActive ? 1 : 0), 0);
        const open = rows.reduce((s, r) => s + (r.status === 'Open' ? 1 : 0), 0);
        $('#statTotal').text(numFmt(total));
        $('#statActive').text(numFmt(active));
        $('#statOpen').text(numFmt(open));
        $('#statUpdated').text(dateTimeFmt(new Date()));   // ميلادي + أرقام لاتينية
    }

    function buildTable(rows) {
        const $table = $('#tblYears');
        if (!$table.length) { console.warn('tblYears not found'); return; }

        // إن كان الجدول مهيأ مسبقًا: حدّث البيانات فقط
        if ($.fn.DataTable.isDataTable($table)) {
            const inst = $table.DataTable();
            inst.clear().rows.add(rows).draw(false);

            // إجبار النصوص السفلية على أرقام لاتينية (إن وُجدت الدالة)
            if (typeof toLatinDigits === 'function') {
                const $info = $('.dataTables_info');
                $info.text(toLatinDigits($info.text()));
                $('.dataTables_paginate').find('span, a').each(function () {
                    $(this).text(toLatinDigits($(this).text()));
                });
            }
            return;
        }

        // تهيئة أولى (آمنة ضد التهيئة المكررة)
        dt = $table.DataTable({
            destroy: true,          // يمنع بقاء تهيئة قديمة
            retrieve: true,         // يسترجع المثيل إن وُجد
            lengthChange: false,    // إخفاء "أظهر مدخلات" نهائياً (لا تكرار)
            pagingType: 'simple_numbers',
            data: rows,
            rowId: 'id',
            responsive: true,
            deferRender: true,
            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/ar.json' },
            // لا نضع l في الـ DOM حتى لا تظهر قائمة “أظهر مدخلات”
            dom: "<'row'<'col-sm-12'tr>>" +
                "<'d-flex justify-content-between align-items-center mt-2'<'small i><'small p>>",
            order: [[0, 'desc']],
            drawCallback: function () {
                if (typeof toLatinDigits === 'function') {
                    const $info = $('.dataTables_info');
                    $info.text(toLatinDigits($info.text()));
                    $('.dataTables_paginate').find('span, a').each(function () {
                        $(this).text(toLatinDigits($(this).text()));
                    });
                }
            },
            columns: [
                {
                    data: 'yearCode',
                    title: 'السنة',
                    render: (v, _, r) =>
                        `<div class="d-flex align-items-center gap-2">
            ${r.isActive ? '<i class="bi bi-star-fill text-success" title="فعّالة"></i>' : ''}
            <span class="fw-bold">${esc(v || r.code || '')}</span>
          </div>`
                },
                { data: 'name', title: 'الاسم', render: v => `<span class="fw-semibold">${esc(v || '')}</span>` },
                { data: 'branchId', title: 'الفرع', render: v => esc(branchesMap[v] || v || '') },
                { data: null, title: 'الفترة', render: r => renderPeriod(r.startDate, r.endDate) },
                { data: 'status', title: 'الحالة', render: v => statusPill(v) },
                { data: 'isActive', title: 'فعّالة', render: v => renderActive(!!v) },
                { data: 'colorHex', title: 'اللون', render: (hex, __, r) => colorBadge(hex, r.yearCode || r.code) },
                {
                    data: null, title: 'إجراءات', orderable: false, searchable: false, className: 'text-center',
                    render: (_, __, r) => `
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary btn-icon btn-edit" data-id="${r.id}" title="تعديل">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-outline-secondary btn-icon btn-set-active" data-id="${r.id}" data-branch="${r.branchId}" title="تعيين كفعّالة">
              <i class="bi bi-check2-circle"></i>
            </button>
            <!-- اسم واضح بدل btn-close -->
            <button class="btn btn-outline-dark btn-icon btn-year-close" data-id="${r.id}" title="إغلاق السنة (سيتم ضبط الحالة إلى مغلق)">
              <i class="bi bi-lock"></i>
            </button>
            <button class="btn btn-outline-danger btn-icon btn-del" data-id="${r.id}" title="حذف">
              <i class="bi bi-trash"></i>
            </button>
          </div>`
                }
            ]
        });

        // اربط الأحداث مرة واحدة فقط (لأننا لا نعيد التهيئة)
        $table.off('click', '.btn-edit .btn-del .btn-year-close .btn-set-active'); // تنظيف احترازي

        $table.on('click', '.btn-edit', e => openUpsert(Number($(e.currentTarget).data('id'))));

        $table.on('click', '.btn-del', async e => {
            const id = Number($(e.currentTarget).data('id'));
            if (!id) return;
            const ok = await confirmDelete('حذف هذه السنة؟'); if (!ok) return;
            await api.deleteYear(id);
            toast('تم الحذف');
            await filterTable();
            await refreshCurrentYearBadge();
        });

        $table.on('click', '.btn-year-close', async e => {
            const id = Number($(e.currentTarget).data('id'));
            const ok = await confirmDelete('سيتم تحويل حالة السنة إلى "مغلق". متابعة؟');
            if (!ok) return;
            const y = await api.getYear(id);
            await api.upsertYear({ ...y, status: 'Closed' });
            toast('تم إغلاق السنة');
            await filterTable();
            await refreshCurrentYearBadge();
        });

        $table.on('click', '.btn-set-active', async e => {
            const id = Number($(e.currentTarget).data('id'));
            const branch = Number($(e.currentTarget).data('branch'));
            await openSetActive(branch || '', id || '');
        });
    }

    function exportYears() {
        const rows = dt?.rows().data().toArray() || [];
        const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'SchoolYears.json';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async function confirmDelete(msg) {
        if (!window.Swal) return confirm(msg || 'تأكيد الحذف؟');
        const r = await Swal.fire({
            icon: 'warning', title: 'تأكيد', text: msg || 'تأكيد الحذف؟',
            showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
        });
        return r.isConfirmed;
    }

    // ================== Upsert ==================
    function resetYearForm() {
        const $f = $('#frmYear');
        if ($f.length) { $f[0].reset(); $f.removeClass('was-validated'); }
        $yearId.val('0');
        $overlapAlert.addClass('d-none');
        $status.val('Open');
        $colorHex.val('#0d6efd');
        $isActive.prop('checked', false);
        $allowPaymentsOnClosedAcademic.val('false');
    }

    function readYearForm() {
        return {
            id: Number($yearId.val() || 0) || 0,
            yearCode: ($yearCode.val() || '').trim(),
            name: ($yearName.val() || '').trim(),
            branchId: Number($branchId.val() || 0),
            startDate: $startDate.val(),
            endDate: $endDate.val(),
            status: $status.val(),
            colorHex: $colorHex.val() || null,
            isActive: $isActive.is(':checked'),
            financeBackPostDays: ($financeBackPostDays.val() ? Number($financeBackPostDays.val()) : null),
            allowPaymentsOnClosedAcademic: $allowPaymentsOnClosedAcademic.val() === 'true',
            notes: ($notes.val() || '').trim() || null
        };
    }

    async function checkOverlapUI() {
        const dto = readYearForm();
        if (!dto.branchId || !dto.startDate || !dto.endDate) return true;
        const res = await api.checkOverlap({ id: dto.id || null, branchId: dto.branchId, startDate: dto.startDate, endDate: dto.endDate });
        const has = !!res?.hasOverlap;
        $overlapAlert.toggleClass('d-none', !has);
        return !has;
    }

    $branchId.on('change', checkOverlapUI);
    $startDate.on('change', checkOverlapUI);
    $endDate.on('change', checkOverlapUI);

    async function openUpsert(id = 0) {
        $('#yearModalTitle').text(id ? 'تعديل السنة' : 'سنة جديدة');
        resetYearForm();

        if (id) {
            const y = await api.getYear(id);
            $yearId.val(y.id);
            $yearCode.val(y.yearCode || y.code || '');
            $yearName.val(y.name || '');
            $branchId.val(String(y.branchId)).trigger('change');
            $startDate.val((y.startDate || '').substring(0, 10));
            $endDate.val((y.endDate || '').substring(0, 10));
            $status.val(y.status || 'Open');
            $colorHex.val(y.colorHex || '#0d6efd');
            $isActive.prop('checked', !!y.isActive);
            $financeBackPostDays.val(y.financeBackPostDays ?? '');
            $allowPaymentsOnClosedAcademic.val(String(!!y.allowPaymentsOnClosedAcademic));
            $notes.val(y.notes || '');
        }

        yearModal?.show();
    }

    // ======== Current Active Year badge ========
    async function refreshCurrentYearBadge() {
        // لو عندك endpoint حالي: /api/school-years/current?branchId=
        const branchId = $('#filterBranchId').val() || '';
        let cur = null;
        try {
            const url = branchId ? `/api/school-years/current?branchId=${branchId}` : `/api/school-years/current`;
            cur = await http('GET', url);
        } catch { /* ignore */ }

        const $holder = $('#yearBadge').empty();
        if (!$holder.length) return; // لو لم يوجد العنصر في الصفحة الحالية
        if (!cur) {
            $holder.html(`<span class="year-badge"><span class="dot"></span> — لا توجد سنة فعّالة</span>`);
            return;
        }

        const label = `${cur.yearCode || cur.code || ''} — ${cur.name || ''}`;
        $holder.html(`
            <span class="year-badge" title="السنة الفعّالة للفرع الحالي">
              <i class="bi bi-star-fill"></i>
              <span>${esc(label)}</span>
              <span class="dot"></span>
            </span>
        `);
    }

    $('#btnSaveYear').on('click', async function () {
        const $f = $('#frmYear');
        if ($f.length && !$f[0].checkValidity()) { $f.addClass('was-validated'); return; }

        const dto = readYearForm();
        if (!dto.yearCode || !dto.name || !dto.branchId || !dto.startDate || !dto.endDate) { toast('الحقول الإلزامية مطلوبة', 'error'); return; }
        if (new Date(dto.endDate) < new Date(dto.startDate)) { toast('تاريخ النهاية يجب أن يكون بعد البداية', 'error'); return; }

        const ok = await checkOverlapUI();
        if (!ok) {
            let proceed = true;
            if (window.Swal) {
                const r = await Swal.fire({ icon: 'warning', title: 'تعارض في التواريخ', text: 'توجد سنوات تتقاطع لهذه الفترة. متابعة الحفظ؟', showCancelButton: true, confirmButtonText: 'متابعة', cancelButtonText: 'إلغاء' });
                proceed = r.isConfirmed;
            } else proceed = confirm('توجد سنوات تتقاطع لهذه الفترة. متابعة الحفظ؟');
            if (!proceed) return;
        }

        await api.upsertYear(dto);
        toast('تم الحفظ بنجاح');
        yearModal?.hide();
        await filterTable();
        await refreshCurrentYearBadge();
    });

    // ================== Active Year Modal ==================
    async function openSetActive(preselectBranchId = '', preselectYearId = '') {
        if (preselectBranchId) $activeBranchId.val(String(preselectBranchId)).trigger('change');
        const branchId = $activeBranchId.val() || '';
        await populateYearsForBranch(branchId || '', preselectYearId || '');
        activeModal?.show();
    }

    async function populateYearsForBranch(branchId, preselectYearId) {
        $activeYearId.empty();
        const list = await api.listYears({ branchId });
        (list || []).forEach(y => {
            const label = `${y.yearCode || y.code} — ${y.name || ''}`;
            const selected = preselectYearId ? (String(y.id) === String(preselectYearId)) : !!y.isActive;
            $activeYearId.append(new Option(label, y.id, false, selected));
        });
    }

    $activeBranchId.on('change', async function () { await populateYearsForBranch($(this).val() || '', ''); });

    $btnConfirmSetActive.on('click', async function () {
        const branchId = Number($activeBranchId.val() || 0);
        const yearId = Number($activeYearId.val() || 0);
        if (!branchId || !yearId) { toast('اختر الفرع والسنة', 'error'); return; }
        await api.setActive(branchId, yearId);
        toast('تم تعيين السنة الفعّالة');
        activeModal?.hide();
        await filterTable();
        await refreshCurrentYearBadge();
    });

    // ================== Toolbar ==================
    $btnAdd.on('click', () => openUpsert(0));
    $btnSetActive.on('click', () => openSetActive());
    $('#btnExport').on('click', () => exportYears());

    $('#btnRefresh').on('click', async () => { await filterTable(); await refreshCurrentYearBadge(); });

    $btnCompare.on('click', () => $('#compareModal').modal?.('show')); // placeholder

    $btnResetFilters.on('click', async () => {
        $txtSearch.val('');
        $filterBranchId.val('').trigger('change');
        $filterStatus.val('');
        $filterActive.val('');
        await filterTable();
    });

    $txtSearch.on('input', debounce(filterTable, 300));
    $filterBranchId.on('change', async () => { await filterTable(); await refreshCurrentYearBadge(); });
    $filterStatus.on('change', filterTable);
    $filterActive.on('change', filterTable);

    // ================== Init ==================
    $(async function () {
        try {
            const yearModalEl = document.getElementById('yearModal');
            if (window.bootstrap && yearModalEl) yearModal = new bootstrap.Modal(yearModalEl, { backdrop: 'static' });
            const activeModalEl = document.getElementById('activeModal');
            if (window.bootstrap && activeModalEl) activeModal = new bootstrap.Modal(activeModalEl, { backdrop: 'static' });

            await loadLookups();
            await filterTable();
            await refreshCurrentYearBadge();

            // تحسين بسيط لالتفاف الشيبس
            if (!document.getElementById('years-badges-wrap-style')) {
                const st = document.createElement('style');
                st.id = 'years-badges-wrap-style';
                st.textContent = `.chip{display:inline-flex;align-items:center;gap:.35rem;padding:.25rem .6rem;border-radius:999px;background:#f1f5f9;color:#334155}.chip .dot{width:.6rem;height:.6rem;border-radius:50%}`;
                document.head.appendChild(st);
            }
        } catch (e) {
            toast(String(e.message || e), 'error');
            console.error(e);
        }
    });

})();
