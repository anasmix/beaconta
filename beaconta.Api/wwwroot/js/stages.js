(function () {
    'use strict';
    const $ = jQuery;

    // ================== الإعدادات ==================
    const API_BASE = '/api'; // غيّرها إن كان لديك Prefix مختلف
    const ENDPOINTS = {
        stages: `${API_BASE}/stages`,
        stagesStats: `${API_BASE}/stages/stats`,
        stagesBulk: `${API_BASE}/stages/bulk`,
        schools: `${API_BASE}/schools?simple=true`, // غيّرها لاندبوينت المدارس لديك
        export: `${API_BASE}/stages/export`
    };

    // لو عندك طريقة أخرى للتوكن، عدّل هنا
    function getToken() {
        return localStorage.getItem('token'); // "Bearer <token>" غير مطلوبة هنا
    }

    async function http(method, url, body, opts = {}) {
        const headers = { 'Accept': 'application/json' };
        if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json';
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(url, {
            method,
            headers,
            body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
            credentials: 'include', // لو لا تحتاج الكوكيز احذفها
            ...opts
        });

        // export قد يعيد ملف، نتركه للـcaller
        const isJson = res.headers.get('content-type')?.includes('application/json');
        if (!res.ok) {
            let msg = `HTTP ${res.status}`;
            if (isJson) {
                const j = await res.json().catch(() => null);
                if (j?.message) msg = j.message;
                else if (typeof j === 'string') msg = j;
            } else {
                const t = await res.text().catch(() => null);
                if (t) msg = t;
            }
            throw new Error(msg);
        }
        if (!isJson) return res; // للملفات
        return res.json();
    }

    // =============== عناصر الواجهة ===============
    const $txtSearch = $('#txtSearch');
    const $filterSchoolId = $('#filterSchoolId');
    const $filterStatus = $('#filterStatus');
    const $filterColorGroup = $('#filterColorGroup');
    const $btnReset = $('#btnResetFilters');
    const $btnRefresh = $('#btnRefresh');
    const $btnAdd = $('#btnAddStage');
    const $btnExport = $('#btnExport');
    const $btnTemplate = $('#btnTemplates');

    const $statTotal = $('#statTotal');
    const $statActive = $('#statActive');
    const $statInactive = $('#statInactive');
    const $statUpdated = $('#statUpdated');

    const stageModal = new bootstrap.Modal('#stageModal', { backdrop: 'static' });
    const $stageId = $('#stageId'), $schoolId = $('#schoolId'), $code = $('#code'), $name = $('#name'), $colorHex = $('#colorHex'), $sortOrder = $('#sortOrder'), $status = $('#status'), $notes = $('#notes');
    const $btnSave = $('#btnSave');

    const templatesModal = new bootstrap.Modal('#templatesModal', { backdrop: 'static' });
    const $tplSchoolId = $('#tplSchoolId');
    const $tplSet = $('#tplSet');
    const $tplPrefix = $('#tplPrefix');
    const $btnApplyTemplate = $('#btnApplyTemplate');

    function toast(title, icon = 'success') {
        if (window.Swal) Swal.fire({ toast: true, position: 'top', timer: 1800, showConfirmButton: false, icon, title });
        else alert(title);
    }
    async function confirmSweet(text) {
        if (!window.Swal) return confirm(text);
        const r = await Swal.fire({ icon: 'warning', title: 'تأكيد', text, showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء' });
        return r.isConfirmed;
    }
    const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));

    // =============== حالة الصفحة ===============
    let SCHOOLS = [];
    let ROWS = [];      // البيانات الحالية (filtrable)
    let dt;
    let selected = new Set();

    // =============== Helpers ===============
    function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) } }
    const schoolName = id => SCHOOLS.find(s => s.id == id)?.name || '—';

    function fmtStatus(v) {
        return v === 'Active'
            ? `<span class="badge rounded-pill bg-success-subtle text-success badge-status">نشطة</span>`
            : `<span class="badge rounded-pill bg-secondary-subtle text-secondary badge-status">غير نشطة</span>`;
    }
    function colorCell(v) {
        const value = v || '#999999';
        return `<span class='color-chip' style='background:${value}'></span> <span class='text-muted'>${esc(value)}</span>`;
    }

    function recomputeStats(rows) {
        const total = rows.length;
        const active = rows.filter(r => r.status === 'Active').length;
        $statTotal.text(total);
        $statActive.text(active);
        $statInactive.text(total - active);
        $statUpdated.text(new Date().toLocaleString('ar-EG'));
    }

    function filteredRows() {
        let rows = [...ROWS];
        const sid = Number($filterSchoolId.val() || 0);
        const st = $filterStatus.val();
        const cg = $filterColorGroup.val();
        const q = ($txtSearch.val() || '').trim().toLowerCase();
        if (sid) rows = rows.filter(r => r.schoolId == sid);
        if (st) rows = rows.filter(r => r.status === st);
        if (cg) {
            const norm = c => (c || '').trim().toLowerCase();
            rows = rows.filter(r => {
                const c = norm(r.colorHex);
                if (cg === 'blue') return c === '#0ea5e9' || c === '#0d6efd';
                if (cg === 'green') return c === '#10b981' || c === '#198754';
                if (cg === 'purple') return c === '#8b5cf6';
                if (cg === 'orange') return c === '#f59e0b';
                if (cg === 'red') return c === '#ef4444' || c === '#dc3545';
                return true;
            });
        }
        if (q) rows = rows.filter(r => (r.name || '').toLowerCase().includes(q)
            || (r.code || '').toLowerCase().includes(q)
            || (schoolName(r.schoolId) || '').toLowerCase().includes(q));
        return rows;
    }

    // =============== API Calls ===============
    async function apiGetStages(params) {
        // params: { q, status, schoolId }
        const query = new URLSearchParams();
        if (params?.q) query.set('q', params.q);
        if (params?.status) query.set('status', params.status);
        if (params?.schoolId) query.set('schoolId', params.schoolId);
        const url = `${ENDPOINTS.stages}${query.toString() ? `?${query.toString()}` : ''}`;
        return await http('GET', url);
    }

    async function apiGetStats() {
        return await http('GET', ENDPOINTS.stagesStats);
    }

    async function apiGetStage(id) {
        return await http('GET', `${ENDPOINTS.stages}/${id}`);
    }

    async function apiCreateStage(dto) {
        return await http('POST', ENDPOINTS.stages, dto);
    }

    async function apiUpdateStage(id, dto) {
        return await http('PUT', `${ENDPOINTS.stages}/${id}`, dto);
    }

    async function apiDeleteStage(id) {
        return await http('DELETE', `${ENDPOINTS.stages}/${id}`);
    }

    async function apiToggleStatus(id) {
        return await http('POST', `${ENDPOINTS.stages}/${id}/toggle-status`);
    }

    async function apiBulk(op, ids) {
        return await http('PUT', ENDPOINTS.stagesBulk, { op, ids });
    }

    async function apiExport(params) {
        const query = new URLSearchParams();
        if (params?.q) query.set('q', params.q);
        if (params?.status) query.set('status', params.status);
        if (params?.schoolId) query.set('schoolId', params.schoolId);
        const url = `${ENDPOINTS.export}${query.toString() ? `?${query.toString()}` : ''}`;

        const token = getToken();
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/octet-stream',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            credentials: 'include'
        });
        if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'stages-export.xlsx';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async function apiGetSchools() {
        // يُتوقع أن يعيد [{id,name}]
        try {
            return await http('GET', ENDPOINTS.schools);
        } catch {
            // فشل: ارجع مصفوفة فارغة
            return [];
        }
    }

    // =============== بناء الجدول ===============
    function actionBtns(row) {
        const isActive = row.status === 'Active';
        return `<div class="btn-group btn-group-sm">
      <button class="btn btn-outline-primary btn-action" data-act="edit" data-id="${row.id}" title="تعديل"><i class="bi bi-pencil-square"></i></button>
      <button class="btn btn-outline-${isActive ? 'warning' : 'success'} btn-action" data-act="toggle" data-id="${row.id}" title="${isActive ? 'تعطيل' : 'تفعيل'}"><i class="bi bi-toggle2-${isActive ? 'off' : 'on'}"></i></button>
      <button class="btn btn-outline-danger btn-action" data-act="delete" data-id="${row.id}" title="حذف"><i class="bi bi-trash3"></i></button>
    </div>`;
    }

    function onRowAction(e) {
        const $b = $(e.currentTarget); const act = $b.data('act'); const id = Number($b.data('id'));
        if (act === 'edit') return openEdit(id);
        if (act === 'delete') return deleteStage(id);
        if (act === 'toggle') return toggleStage(id);
    }

    function onRowCheck() { const id = Number($(this).data('id')); this.checked ? selected.add(id) : selected.delete(id); updateBulkToolbar(); }
    function onCheckAll() {
        const checked = this.checked;
        $('#tblStages tbody .row-check').each(function () {
            const id = Number($(this).data('id'));
            if (checked) { selected.add(id); this.checked = true; } else { selected.delete(id); this.checked = false; }
        });
        updateBulkToolbar();
    }
    function updateBulkToolbar() {
        const count = selected.size;
        $('#bulkCount').text(count);
        $('.bulk-toolbar').toggle(count > 0);
        const totalVisible = $('#tblStages tbody .row-check').length;
        const some = count > 0 && count < totalVisible;
        $('#chkAll').prop('indeterminate', some);
    }
    function clearSelection() { selected.clear(); updateBulkToolbar(); $('#chkAll').prop('checked', false).prop('indeterminate', false); }

    function buildFilters() {
        // schools
        $filterSchoolId.empty().append(new Option('الكل', ''));
        SCHOOLS.forEach(s => $filterSchoolId.append(new Option(s.name, String(s.id))));
        // Select2
        $('#filterSchoolId,#schoolId,#tplSchoolId').each(function () {
            $(this).select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $(this).closest('.modal').length ? $(this).closest('.modal') : undefined });
        });
        $('#tplSet').select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#templatesModal') });
    }

    function buildPalette() {
        const palette = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#0d6efd', '#198754', '#dc3545', '#6c757d'];
        const $wrap = $('#colorPalette').empty().addClass('d-flex flex-wrap gap-2 palette');
        palette.forEach(c => {
            const sw = $(`<div class="sw" title="${c}" style="background:${c}"></div>`);
            sw.on('click', () => $('#colorHex').val(c));
            $wrap.append(sw);
        });
    }

    function rebuildTable(rows) {
        if (!dt) {
            dt = $('#tblStages').DataTable({
                data: rows,
                rowId: 'id',
                responsive: true,
                deferRender: true,
                order: [[1, 'asc']],
                language: { url: "https://cdn.datatables.net/plug-ins/1.13.8/i18n/ar.json" },
                columns: [
                    { data: null, className: 'text-center', render: (d, t, row) => `<input type="checkbox" class="row-check" data-id="${row.id}" aria-label="تحديد">` },
                    { data: 'name', render: (v, t, row) => `<div class="fw-bold">${esc(v)}</div><div class="small text-muted">${esc(row.code || '')}</div>` },
                    { data: 'code', className: 'text-muted' },
                    { data: 'schoolId', render: v => esc(schoolName(v)) },
                    { data: 'colorHex', render: colorCell, className: 'text-nowrap' },
                    { data: 'sortOrder', className: 'text-center' },
                    { data: 'status', render: fmtStatus, className: 'text-nowrap' },
                    { data: null, orderable: false, searchable: false, render: (d, t, row) => actionBtns(row) }
                ]
            });

            $('#tblStages').on('change', '.row-check', onRowCheck);
            $('#chkAll').on('change', onCheckAll);
            $('#tblStages').on('click', '.btn-action', onRowAction);

            $txtSearch.on('input', debounce(applyFiltersAndRefresh, 250));
            $filterSchoolId.on('change', applyFiltersAndRefresh);
            $filterStatus.on('change', applyFiltersAndRefresh);
            $filterColorGroup.on('change', applyFiltersAndRefresh);

            $('#bulkActivate').on('click', () => doBulk('activate'));
            $('#bulkDeactivate').on('click', () => doBulk('deactivate'));
            $('#bulkDelete').on('click', () => doBulk('delete'));

            $('#btnRefresh').on('click', async () => { await loadData(); clearSelection(); });
            $('#btnResetFilters').on('click', () => {
                $txtSearch.val(''); $filterSchoolId.val('').trigger('change'); $filterStatus.val(''); $filterColorGroup.val('');
                applyFiltersAndRefresh(); clearSelection();
            });

            $('#btnAddStage').on('click', openCreate);
            $('#btnSave').on('click', saveStage);
            $('#btnExport').on('click', exportFile);
            $('#btnTemplates').on('click', openTemplates);
            $('#btnApplyTemplate').on('click', applyTemplate);
        } else {
            dt.clear().rows.add(rows).draw(false);
        }
        recomputeStats(rows);
    }

    function applyFiltersAndRefresh() {
        const rows = filteredRows();
        dt.clear().rows.add(rows).draw(false);
        recomputeStats(rows);
    }

    // =============== CRUD Handlers ===============
    function openCreate() {
        $('#modalTitle').text('مرحلة جديدة'); $('#frmStage')[0].reset(); $('#frmStage').removeClass('was-validated');
        $stageId.val(''); $sortOrder.val(0); $status.val('Active'); $colorHex.val('#0ea5e9');

        $schoolId.empty();
        SCHOOLS.forEach(s => $schoolId.append(new Option(s.name, String(s.id))));
        $schoolId.trigger('change');

        buildPalette();
        stageModal.show();
    }

    async function openEdit(id) {
        try {
            const r = await apiGetStage(id);
            $('#modalTitle').text('تعديل المرحلة'); $('#frmStage').removeClass('was-validated');
            $stageId.val(r.id); $code.val(r.code || ''); $name.val(r.name || ''); $colorHex.val(r.colorHex || '#0ea5e9');
            $sortOrder.val(r.sortOrder || 0); $status.val(r.status || 'Active'); $notes.val(r.notes || '');

            $schoolId.empty();
            SCHOOLS.forEach(s => $schoolId.append(new Option(s.name, String(s.id), false, s.id === r.schoolId)));
            $schoolId.trigger('change');

            buildPalette();
            stageModal.show();
        } catch (e) {
            toast(String(e.message || e), 'error');
        }
    }

    async function saveStage() {
        const f = $('#frmStage')[0]; if (!f.checkValidity()) { $('#frmStage').addClass('was-validated'); return; }
        const dto = {
            id: Number($stageId.val() || 0),
            schoolId: Number($schoolId.val()),
            code: ($code.val() || '').trim(),
            name: ($name.val() || '').trim(),
            colorHex: $colorHex.val(),
            sortOrder: Number($sortOrder.val() || 0),
            status: $status.val(),
            notes: ($notes.val() || '').trim()
        };
        try {
            if (dto.id && dto.id > 0) await apiUpdateStage(dto.id, dto);
            else {
                // POST يرجع العنصر، لكن مش ضروري نستخدمه هنا
                await apiCreateStage(dto);
            }
            stageModal.hide();
            await loadData();
            toast('تم الحفظ');
        } catch (e) {
            toast(String(e.message || e), 'error');
        }
    }

    async function deleteStage(id) {
        const ok = await confirmSweet('سيتم حذف المرحلة. هل أنت متأكد؟');
        if (!ok) return;
        try {
            await apiDeleteStage(id);
            await loadData();
            toast('تم الحذف');
        } catch (e) {
            toast(String(e.message || e), 'error');
        }
    }

    async function toggleStage(id) {
        try {
            await apiToggleStatus(id);
            await loadData();
        } catch (e) {
            toast(String(e.message || e), 'error');
        }
    }

    async function doBulk(op) {
        if (selected.size === 0) return;
        if (op === 'delete') {
            const ok = await confirmSweet('سيتم حذف المراحل المحددة، هل أنت متأكد؟');
            if (!ok) return;
        }
        try {
            await apiBulk(op, [...selected]);
            await loadData();
            toast(op === 'delete' ? 'تم الحذف' : 'تم تحديث الحالة');
        } catch (e) {
            toast(String(e.message || e), 'error');
        }
    }

    async function exportFile() {
        const params = {
            q: ($txtSearch.val() || '').trim() || undefined,
            status: $filterStatus.val() || undefined,
            schoolId: $filterSchoolId.val() || undefined
        };
        try { await apiExport(params); }
        catch (e) { toast(String(e.message || e), 'error'); }
    }

    // =============== القوالب السريعة (واجهة فقط) ===============
    const TEMPLATE_SETS = [
        {
            id: 'kg-el-md-hs', name: 'KG + Elementary + Middle + High', items: [
                { code: 'KG', name: 'رياض الأطفال', color: '#f59e0b' },
                { code: 'EL', name: 'الأساسي', color: '#0ea5e9' },
                { code: 'MD', name: 'الإعدادي', color: '#10b981' },
                { code: 'HS', name: 'الثانوي', color: '#8b5cf6' }
            ]
        },
        {
            id: 'kg-el-hs', name: 'KG + Elementary + High', items: [
                { code: 'KG', name: 'رياض الأطفال', color: '#f59e0b' },
                { code: 'EL', name: 'الأساسي', color: '#0ea5e9' },
                { code: 'HS', name: 'الثانوي', color: '#8b5cf6' }
            ]
        },
        {
            id: 'custom-3', name: 'مراحل مخصصة (3 خانات)', items: [
                { code: 'A1', name: 'مرحلة A1', color: '#0ea5e9' },
                { code: 'A2', name: 'مرحلة A2', color: '#10b981' },
                { code: 'A3', name: 'مرحلة A3', color: '#8b5cf6' }
            ]
        }
    ];

    function openTemplates() {
        $tplSchoolId.empty(); SCHOOLS.forEach(s => $tplSchoolId.append(new Option(s.name, String(s.id))));
        $tplSet.empty(); TEMPLATE_SETS.forEach(t => $tplSet.append(new Option(t.name, t.id)));
        $tplPrefix.val(''); templatesModal.show();
    }

    async function applyTemplate() {
        const sid = Number($tplSchoolId.val() || 0); const setId = $tplSet.val(); const prefix = ($tplPrefix.val() || '').trim();
        if (!sid || !setId) { toast('اختر مدرسة وقائمة قوالب', 'warning'); return; }
        const set = TEMPLATE_SETS.find(t => t.id === setId); if (!set) return;

        try {
            // أنشئ العناصر واحدًا واحدًا عبر POST
            for (let i = 0; i < set.items.length; i++) {
                const it = set.items[i];
                await apiCreateStage({
                    id: 0,
                    schoolId: sid,
                    code: (prefix ? (prefix + '-') : '') + it.code,
                    name: it.name,
                    colorHex: it.color,
                    sortOrder: i + 1,
                    status: 'Active',
                    notes: 'أُنشئت من قالب سريع'
                });
            }
            templatesModal.hide();
            await loadData();
            toast('تم إنشاء مراحل من القالب');
        } catch (e) {
            toast(String(e.message || e), 'error');
        }
    }

    // =============== تحميل البيانات ===============
    async function loadSchools() {
        SCHOOLS = await apiGetSchools();
        // fallback لو رجع فاضي
        if (!Array.isArray(SCHOOLS) || SCHOOLS.length === 0) {
            SCHOOLS = [{ id: 1, name: 'المدرسة #1' }];
        }
        buildFilters();
    }

    async function loadStages() {
        // نقرأ من الـAPI مع الفلاتر الظاهرة
        const params = {
            q: ($txtSearch.val() || '').trim() || undefined,
            status: $filterStatus.val() || undefined,
            schoolId: $filterSchoolId.val() || undefined
        };
        const data = await apiGetStages(params);
        // نضمن الحقول اللازمة
        ROWS = (data || []).map(r => ({
            id: r.id,
            schoolId: r.schoolId,
            code: r.code,
            name: r.name,
            colorHex: r.colorHex,
            sortOrder: r.sortOrder ?? 0,
            status: r.status ?? 'Active',
            notes: r.notes ?? ''
        }));
    }

    async function loadStats() {
        // لو حابب تعرض أرقام من السيرفر بدل الحساب المحلي (اختياري)
        // const s = await apiGetStats();
        // $statTotal.text(s.total); $statActive.text(s.active); $statInactive.text(s.inactive); $statUpdated.text(new Date().toLocaleString('ar-EG'));
    }

    async function loadData() {
        try {
            await loadStages();
            rebuildTable(filteredRows());
            await loadStats();
            clearSelection();
        } catch (e) {
            toast(String(e.message || e), 'error');
        }
    }

    // =============== Init ===============
    $(async function () {
        try {
            await loadSchools();
            await loadData();
        } catch (e) {
            toast(String(e.message || e), 'error');
        }
    });

})();
