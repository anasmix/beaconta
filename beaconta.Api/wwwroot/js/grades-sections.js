// /js/grades-sections.js
(function () {
    'use strict';
    const $ = jQuery;

    // ================== REST ==================
    const API_BASE = '/api';
    const ENDPOINTS = {
        schools: `${API_BASE}/schools?simple=true`,
        stages: (schoolId) => `${API_BASE}/stages?schoolId=${schoolId || ''}`,

        grades: `${API_BASE}/grades`,
        grade: (id) => `${API_BASE}/grades/${id}`,
        // داخل const ENDPOINTS = { ... }
        gradeView: (id) => `${API_BASE}/grades/view/${id}`, // مسار احتياطي إن كان الباك إند يستعمل /view/{id}

        // الشُعب
        sections: (gradeId) => `${API_BASE}/grades/${gradeId}/sections`,
        section: (gradeId, id) => `${API_BASE}/grades/${gradeId}/sections/${id}`,

        // ✅ مسارات قفل/فتح الشُّعب (إضافة جديدة)
        sectionLock: (gradeId, id) => `${API_BASE}/grades/${gradeId}/sections/${id}/lock`,
        sectionUnlock: (gradeId, id) => `${API_BASE}/grades/${gradeId}/sections/${id}/unlock`,
    };

    function getToken() { return localStorage.getItem('token'); }
    async function http(method, url, body, opts = {}) {
        const headers = { 'Accept': 'application/json' };
        if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json';
        const tok = getToken(); if (tok) headers['Authorization'] = `Bearer ${tok}`;

        const res = await fetch(url, {
            method,
            headers,
            body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
            credentials: 'include',
            ...opts
        });

        const ct = res.headers.get('content-type') || '';
        if (!res.ok) {
            let msg = `HTTP ${res.status}`;
            try {
                if (ct.includes('application/json')) {
                    const j = await res.json();
                    msg = j?.message || j?.title || j?.error || JSON.stringify(j) || msg;
                } else {
                    msg = (await res.text()) || msg;
                }
            } catch { /* ignore */ }
            throw new Error(msg);
        }
        if (!ct.includes('application/json')) return res;
        return res.status === 204 ? null : res.json();
    }

    const api = {
        getSchools: async () => await http('GET', ENDPOINTS.schools).catch(() => []),
        getStages: async (schoolId) => await http('GET', ENDPOINTS.stages(schoolId)).catch(() => []),

        listGrades: async (params) => {
            const q = new URLSearchParams();
            if (params?.schoolId) q.set('schoolId', params.schoolId);
            if (params?.stageId) q.set('stageId', params.stageId);
            if (params?.yearId) q.set('yearId', params.yearId);
            if (params?.status) q.set('status', params.status);
            if (params?.shift) q.set('shift', params.shift);
            if (params?.q) q.set('q', params.q);
            const url = `${ENDPOINTS.grades}?${q}`;
            return await http('GET', url);
        },
        getGrade: async (id) => await http('GET', ENDPOINTS.grade(id)),
        createGrade: async (dto) => await http('POST', ENDPOINTS.grades, dto),
        updateGrade: async (id, dto) => await http('PUT', ENDPOINTS.grade(id), dto),
        deleteGrade: async (id) => await http('DELETE', ENDPOINTS.grade(id)),

        // === الشُعب (تم الحقن التلقائي لـ gradeYearId) ===
        listSections: async (gradeId) => await http('GET', ENDPOINTS.sections(gradeId)).catch(() => []),

        // NOTE: الباك إند يطلب GradeYearId>0؛ نستخدم gradeId من المسار ونرسله باسم gradeYearId.
        createSection: async (gradeId, dto) =>
            await http('POST', ENDPOINTS.sections(gradeId), { gradeYearId: gradeId, ...dto }),

        updateSection: async (gradeId, id, dto) =>
            await http('PUT', ENDPOINTS.section(gradeId, id), { gradeYearId: Number(gradeId), ...dto }),

        deleteSection: async (gradeId, id) => await http('DELETE', ENDPOINTS.section(gradeId, id)),

        // ✅ قفل/فتح الشُّعب (إضافات جديدة)
        toggleSectionLock: async (gradeId, id, lock) => {
            try {
                const url = lock ? ENDPOINTS.sectionLock(gradeId, id) : ENDPOINTS.sectionUnlock(gradeId, id);
                return await http('PATCH', url, null);
            } catch (e) {
                // fallback: تغيير status مباشرة لو لا يوجد lock/unlock
                const status = lock ? 'Inactive' : 'Active';
                return await http('PATCH', ENDPOINTS.section(gradeId, id), { status });
            }
        },

        setSectionStatus: async (gradeId, id, status) =>
            await http('PATCH', ENDPOINTS.section(gradeId, id), { status }),
    };

    // ================== DOM ==================
    const $yearBadge = $('#yearBadge');
    const $txtSearch = $('#txtSearch');
    const $filterSchoolId = $('#filterSchoolId');
    const $filterStageId = $('#filterStageId');
    const $btnResetFilters = $('#btnResetFilters');
    const $btnRefresh = $('#btnRefresh');
    const $btnExport = $('#btnExport');
    const $btnReports = $('#btnReports');
    const $btnAddGrade = $('#btnAddGrade');

    // عناصر نموذج الصف
    const $gradeYearId = $('#gradeYearId');
    const $schoolId = $('#schoolId');
    const $stageId = $('#stageId');
    const $gradeName = $('#gradeName');
    const $shift = $('#shift');
    const $gender = $('#gender');
    const $capacity = $('#capacity');
    const $tuition = $('#tuition');
    const $sortOrder = $('#sortOrder');
    const $status = $('#status');
    const $notes = $('#notes');

    const $feesBody = $('#feesBody');
    const $feeTotal = $('#feeTotal');
    const $btnAddFee = $('#btnAddFee');
    const $btnSaveGrade = $('#btnSaveGrade');

    // عناصر مودال الشُعب
    const $sectionsTableBody = $('#tblSections tbody');
    const $sectionsModalTitle = $('#sectionsModalTitle');
    const $capTotal = $('#capTotal');
    const $capUsed = $('#capUsed');
    const $capFree = $('#capFree');
    const $btnAddSectionInline = $('#btnAddSectionInline');
    const $btnBulkSections = $('#btnBulkSections');
    const $bulkLetters = $('#bulkLetters');
    const $bulkCapacity = $('#bulkCapacity');

    // مودالات
    let gradeModal = null;
    let sectionsModal = null;

    // ================== State ==================
    let SCHOOLS = [];
    let STAGES = [];
    let ROWS = [];
    let dt;
    let _currentGradeCapacity = 0;

    let STAGES_ALL = [];
    let STAGE_NAME_BY_ID = {};

    // 👇 جديد: حالة صريحة للإنشاء/التعديل
    let CURRENT_GRADE_ID = null; // null = إنشاء, رقم = تعديل

    // ================== Helpers ==================
    const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
    const LOCALE = 'ar-SA-u-nu-latn';
    const numFmt = v => new Intl.NumberFormat(LOCALE).format(Number(v || 0));

    function toast(title, icon = 'success') { if (window.Swal) Swal.fire({ toast: true, position: 'top', timer: 2200, showConfirmButton: false, icon, title }); else alert(title); }
    function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

    const schoolName = id => (SCHOOLS.find(x => x.id == id)?.name) || id || '—';
    const stageName = id => STAGE_NAME_BY_ID[String(id)] || (STAGES.find(x => x.id == id)?.name) || '—';

    function renderYearBadge() {
        const yid = window.__APP__?.yearId;
        $yearBadge.html(`<span class="chip"><i class="bi bi-info-circle"></i> السنة الحالية: <b class="ms-1">${esc(String(yid ?? '—'))}</b></span>`);
    }

    // لا نحذف الدوال القديمة؛ هذه دالة جديدة
    function renderGradeSectionCombinedBadges(gradeName, sectionNames = []) {
        const names = Array.isArray(sectionNames) ? sectionNames : [];
        const chips = names.map(n =>
            `<span class="badge rounded-pill text-bg-light border me-1 mb-1">${esc(`${gradeName || ''} - ${n}`.trim())}</span>`
        ).join('');

        // لو لا توجد شُعب، على الأقل أظهر بادج باسم الصف
        const fallback = gradeName
            ? `<span class="badge rounded-pill text-bg-primary border me-1 mb-1 badge-grade">${esc(gradeName)}</span>`
            : '';

        return `<div class="badges-wrap">${chips || fallback}</div>`;
    }

    // ضعها قرب الهيلبرز
    function renderSectionBadges(preview = [], total = 0) {
        const extra = Math.max(0, (Number(total) || 0) - (preview?.length || 0));
        const chips = (preview || []).map(n =>
            `<span class="badge rounded-pill text-bg-light border me-1">${esc(n)}</span>`
        ).join('');
        const more = extra > 0
            ? `<span class="badge rounded-pill text-bg-secondary">+${extra}</span>`
            : '';
        return chips + more;
    }
    // لا تحذف الدالة القديمة، فقط أضف هذه:
    function renderAllSectionBadges(names = []) {
        const chips = (names || []).map(n =>
            `<span class="badge rounded-pill text-bg-light border me-1 mb-1">${esc(n)}</span>`
        ).join('');
        // غلاف يسمح بالـ flex-wrap
        return `<div class="badges-wrap">${chips}</div>`;
    }



    function enableStageSelect() {
        $stageId.prop('disabled', false).removeAttr('disabled');
        if ($stageId.data('select2')) {
            const container = $stageId.next('.select2-container');
            if (container && container.length) container.removeClass('select2-container--disabled');
            $stageId.trigger('change.select2');
        }
    }

    async function loadAllStages() {
        STAGES_ALL = await api.getStages(null).catch(() => []);
        STAGE_NAME_BY_ID = {};
        STAGES_ALL.forEach(st => { STAGE_NAME_BY_ID[String(st.id)] = st.name; });
    }

    function updateStats(rows) {
        const list = rows || [];
        const totalGrades = list.length;
        const totalSections = list.reduce((s, r) => s + (Number(r.sectionsCount) || 0), 0);
        const activeGrades = list.reduce((s, r) => s + (r.status === 'Active' ? 1 : 0), 0);
        $('#statGrades').text(totalGrades.toLocaleString(LOCALE));
        $('#statSections').text(totalSections.toLocaleString(LOCALE));
        $('#statActiveGrades').text(activeGrades.toLocaleString(LOCALE));
        $('#statUpdated').text(new Date().toLocaleString(LOCALE));
    }

    // ================== Filters / Lookups ==================
    async function loadLookups() {
        SCHOOLS = await api.getSchools();
        $filterSchoolId.empty().append(new Option('الكل', ''));
        SCHOOLS.forEach(s => $filterSchoolId.append(new Option(s.name, String(s.id))));
        if (!$filterSchoolId.data('select2')) $filterSchoolId.select2({ theme: 'bootstrap-5', width: '100%', placeholder: 'كل المدارس' });

        $schoolId.empty();
        SCHOOLS.forEach(s => $schoolId.append(new Option(s.name, String(s.id))));
        if (!$schoolId.data('select2')) $schoolId.select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#gradeModal') });

        $stageId.prop('disabled', true);
        if (!$stageId.data('select2')) $stageId.select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#gradeModal') });

        $filterStageId.prop('disabled', true);
        if (!$filterStageId.data('select2')) $filterStageId.select2({ theme: 'bootstrap-5', width: '100%', placeholder: 'كل المراحل' });
    }

    async function loadStagesFor(schoolId) {
        STAGES = await api.getStages(schoolId);
        $stageId.prop('disabled', false).empty();
        STAGES.forEach(st => $stageId.append(new Option(st.name, String(st.id))));
        enableStageSelect();
        $stageId.trigger('change.select2');

        $filterStageId.prop('disabled', false).empty().append(new Option('الكل', ''));
        STAGES.forEach(st => $filterStageId.append(new Option(st.name, String(st.id))));
        $filterStageId.trigger('change.select2');
    }

    // ================== Table ==================
    async function filterTable() {
        const params = {
            schoolId: $filterSchoolId.val() || undefined,
            stageId: $filterStageId.prop('disabled') ? undefined : ($filterStageId.val() || undefined),
            yearId: window.__APP__?.yearId || undefined,
            q: ($txtSearch.val() || '').trim() || undefined
        };
        const list = await api.listGrades(params);
        ROWS = list || [];
        buildTable(ROWS);
        updateStats(ROWS);
    }

    function buildTable(rows) {
        const $table = $('#tblYears');
        if (!$table.length) { console.warn('tblYears not found in DOM'); return; }

        if (!dt) {
            dt = $table.DataTable({
                data: rows,
                rowId: 'id',
                responsive: true,
                deferRender: true,
                language: { url: "https://cdn.datatables.net/plug-ins/1.13.8/i18n/ar.json" },
                columns: [
                    { data: 'schoolId', render: v => esc(schoolName(v)) },
                    { data: 'stageId', render: v => esc(stageName(v)) },
                    { data: 'gradeName', render: v => `<span class="fw-semibold">${esc(v)}</span>` },
                    { data: 'shift', render: v => v === 'Morning' ? 'صباحي' : 'مسائي' },
                    { data: 'gender', render: v => v === 'Mixed' ? 'مختلط' : (v === 'Boys' ? 'بنين' : 'بنات') },
                    { data: 'capacity', className: 'text-mono' },
                    { data: 'available', className: 'text-mono', render: v => v ?? 0 },
                    { data: 'feesTotal', className: 'text-mono', render: v => numFmt(v) },
                    { data: null, className: 'sections-col', render: r => renderGradeSectionCombinedBadges(r.gradeName, r.sectionsPreview) },

                    { data: null, className: 'text-mono', render: (_, _t, r) => r.id },
                    {
                        data: null,
                        orderable: false,
                        searchable: false,
                        render: r => {
                            const willLock = (r.status === 'Active'); // الإجراء القادم
                            const lockClass = willLock ? 'btn-outline-warning' : 'btn-outline-success';
                            const lockIcon = willLock ? 'bi-lock' : 'bi-unlock';
                            const lockTitle = willLock ? 'قفل الصف (سيصبح غير نشط)' : 'فتح الصف (سيصبح نشطًا)';

                            return `
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-danger btn-del" data-id="${r.id}" title="حذف">
          <i class="bi bi-trash"></i>
        </button>
        <button class="btn ${lockClass} btn-lock" data-id="${r.id}" title="${lockTitle}">
          <i class="bi ${lockIcon}"></i>
        </button>
        <button class="btn btn-outline-info btn-sections" data-id="${r.id}" data-name="${esc(r.gradeName)}" title="الشُعب">
          <i class="bi bi-grid-3x3-gap"></i>
        </button>
        <button class="btn btn-outline-primary btn-edit" data-id="${r.id}" title="تعديل">
          <i class="bi bi-pencil-square"></i>
        </button>
      </div>`;
                        }
                    }

                ]
            });

            $table.on('click', '.btn-edit', e => openGradeUpsert(Number($(e.currentTarget).data('id'))));
            $table.on('click', '.btn-del', async e => {
                const id = Number($(e.currentTarget).data('id'));
                if (!id) return;
                const ok = await confirmDelete();
                if (!ok) return;
                await api.deleteGrade(id);
                toast('تم الحذف');
                await filterTable();
            });

            $table.on('click', '.btn-sections', async (e) => {
                const id = Number($(e.currentTarget).data('id'));
                const nm = $(e.currentTarget).data('name') || (ROWS.find(x => x.id === id)?.gradeName) || '';
                await openSections(id, nm);
            });
            // ✅ زر القفل/الفتح مع رسالة تأكيد قبل الإجراء
            $table.on('click', '.btn-lock', async function () {
                const id = Number($(this).data('id'));
                if (!id) return;

                const $btn = $(this).prop('disabled', true);
                try {
                    // 1) احضر بيانات الصف لتحديد الحالة الحالية
                    const g = await api.getGrade(id);
                    const isActive = (g.status === 'Active');

                    // نصوص التأكيد حسب الحالة
                    const title = isActive ? 'قفل الصف؟' : 'فتح الصف؟';
                    const html = isActive
                        ? `
        سيؤدي <b>قفل الصف</b> إلى:
        <ul class="text-start">
          <li>إخفائه من قوائم التسجيل والاختيار.</li>
          <li>منع التعديلات العرضية على الشُعب والرسوم.</li>
        </ul>
        هل تريد المتابعة؟
      `
                        : `
        سيؤدي <b>فتح الصف</b> إلى:
        <ul class="text-start">
          <li>ظهوره مرة أخرى في قوائم التسجيل.</li>
          <li>السماح بإدارة الشُعب والرسوم بشكل طبيعي.</li>
        </ul>
        هل تريد المتابعة؟
      `;
                    const confirmText = isActive ? 'تأكيد القفل' : 'تأكيد الفتح';

                    // 2) نافذة التأكيد (SweetAlert)، مع بديل confirm() لو غير متوفّر
                    let proceed = true;
                    if (window.Swal) {
                        const r = await Swal.fire({
                            icon: isActive ? 'warning' : 'question',
                            title,
                            html,
                            focusCancel: true,
                            showCancelButton: true,
                            confirmButtonText: confirmText,
                            cancelButtonText: 'إلغاء',
                            reverseButtons: true,
                        });
                        proceed = r.isConfirmed;
                    } else {
                        proceed = confirm((isActive ? 'قفل' : 'فتح') + ' الصف؟');
                    }
                    if (!proceed) return;

                    // 3) بناء الحمولة وفق SaveReq مع عكس الحالة فقط
                    const payload = {
                        yearId: g.yearId,
                        schoolId: g.schoolId,
                        stageId: g.stageId,
                        name: g.gradeName || g.name || '',
                        shift: g.shift,
                        gender: g.gender,
                        capacity: g.capacity,
                        tuition: g.tuition,
                        sortOrder: g.sortOrder,
                        status: isActive ? 'Inactive' : 'Active', // ← التبديل
                        notes: g.notes || null,
                        fees: (g.fees || []).map(f => ({ type: f.type, name: f.name, amount: f.amount }))
                    };

                    // 4) التنفيذ والتحديث
                    await api.updateGrade(id, payload);
                    toast(isActive ? 'تم قفل الصف' : 'تم فتح الصف');
                    await filterTable();
                } catch (err) {
                    toast(String(err?.message || err), 'error');
                    console.error(err);
                } finally {
                    $btn.prop('disabled', false);
                }
            });

            if ($btnRefresh.length) $btnRefresh.on('click', filterTable);
            if ($btnAddGrade.length) $btnAddGrade.on('click', () => openGradeUpsert());
            if ($txtSearch.length) $txtSearch.on('input', debounce(filterTable, 300));
            if ($filterSchoolId.length) $filterSchoolId.on('change', async function () {
                const sid = Number($(this).val() || 0);
                if (sid) await loadStagesFor(sid); else { $filterStageId.val('').trigger('change'); $filterStageId.prop('disabled', true); }
                await filterTable();
            });
            if ($filterStageId.length) $filterStageId.on('change', filterTable);
            if ($btnResetFilters.length) $btnResetFilters.on('click', async () => {
                $txtSearch.val('');
                $filterSchoolId.val('').trigger('change');
                $filterStageId.val('').trigger('change');
                $filterStageId.prop('disabled', true);
                await filterTable();
            });

        } else {
            dt.clear().rows.add(rows).draw(false);
        }
    }

    async function confirmDelete() {
        if (!window.Swal) return confirm('حذف هذا الصف؟');
        const r = await Swal.fire({
            icon: 'warning', title: 'تأكيد', text: 'حذف هذا الصف؟',
            showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
        });
        return r.isConfirmed;
    }

    // ================== Modal (Add/Edit) ==================
    function resetGradeForm() {
        const $form = $('#frmGrade');
        if ($form.length) { $form[0].reset(); $form.removeClass('was-validated'); }
        // 👇 تصفير الحقل المخفي وحالة المودال
        $gradeYearId.val('');
        CURRENT_GRADE_ID = null;

        $feesBody.empty();
        $feeTotal.text('0');
        if (!$schoolId.data('select2')) $schoolId.select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#gradeModal') });
        if (!$stageId.data('select2')) $stageId.select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#gradeModal') });
    }

    function setGradeForm(g) {
        $gradeYearId.val(g?.id || '');
        $schoolId.val(String(g?.schoolId || '')).trigger('change');
        $stageId.val(String(g?.stageId || '')).trigger('change');
        $gradeName.val(g?.gradeName || '');
        $shift.val(g?.shift || 'Morning');
        $gender.val(g?.gender || 'Mixed');
        $capacity.val(g?.capacity ?? 70);
        $tuition.val(g?.tuition ?? 0);
        $sortOrder.val(g?.sortOrder ?? 0);
        $status.val(g?.status || 'Active');
        $notes.val(g?.notes || '');
    }

    function mapGradeDto() {
        return {
            id: Number($gradeYearId.val() || 0) || 0,
            schoolId: Number($schoolId.val() || 0),
            stageId: Number($stageId.val() || 0),
            yearId: Number(window.__APP__?.yearId || 0),
            name: ($gradeName.val() || '').trim(),
            shift: $shift.val(),
            gender: $gender.val(),
            capacity: Number($capacity.val() || 0),
            tuition: Number($tuition.val() || 0),
            sortOrder: Number($sortOrder.val() || 0),
            status: $status.val(),
            notes: ($notes.val() || '').trim() || null,
        };
    }

    async function openGradeUpsert(id = null) {
        try {
            // 👇 ثبّت وضع المودال
            CURRENT_GRADE_ID = id || null;

            $('#gradeModalTitle').text(id ? 'تعديل صف' : 'صف جديد');
            resetGradeForm();

            // لو في مدرسة محددة من الفلتر، جهّز مراحلها
            const sid = Number($filterSchoolId.val() || 0);
            if (sid) {
                await loadStagesFor(sid);
                $schoolId.val(String(sid)).trigger('change');
                enableStageSelect();
            }

            if (id) {
                const g = await api.getGrade(id);

                // لو المدرسة مختلفة عن الفلتر الحالي، حمّل مراحلها
                if (g?.schoolId && g.schoolId !== sid) {
                    await loadStagesFor(g.schoolId);
                    $schoolId.val(String(g.schoolId)).trigger('change');
                }

                setGradeForm({
                    id: g.id,
                    schoolId: g.schoolId,
                    stageId: g.stageId,
                    gradeName: g.gradeName || g.name || '',
                    shift: g.shift,
                    gender: g.gender,
                    capacity: g.capacity,
                    tuition: g.tuition,
                    sortOrder: g.sortOrder,
                    status: g.status,
                    notes: g.notes
                });

                // ✅ عرض الرسوم القادمة من الـ API (إن وُجدت)
                if (typeof setFees === 'function') {
                    setFees(g.fees || []);
                    if (!g.fees || g.fees.length === 0) addFeeRow(); // صف افتراضي عند عدم وجود رسوم
                }

                enableStageSelect();
            } else {
                // ✅ نموذج جديد: صف رسوم افتراضي
                if (typeof setFees === 'function') setFees([]);
                addFeeRow();
            }

            if (gradeModal) gradeModal.show();
        } catch (err) {
            toast(String(err?.message || err), 'error');
            console.error(err);
        }
    }

    if ($btnAddFee.length) $btnAddFee.on('click', () => addFeeRow());
    function addFeeRow(item = { type: 'Tuition', name: '', amount: 0 }) {
        const idx = Date.now();
        const tr = $(/*html*/`
      <tr data-row="${idx}">
        <td>
          <select class="form-select form-select-sm fee-type">
            <option value="Tuition"${item.type === 'Tuition' ? ' selected' : ''}>رسوم أساسية</option>
            <option value="Books"${item.type === 'Books' ? ' selected' : ''}>كتب</option>
            <option value="Transport"${item.type === 'Transport' ? ' selected' : ''}>نقل</option>
            <option value="Other"${item.type === 'Other' ? ' selected' : ''}>أخرى</option>
          </select>
        </td>
        <td><input class="form-control form-control-sm fee-name" value="${esc(item.name || '')}" placeholder="الوصف"></td>
        <td style="width:160px"><input type="number" step="0.01" class="form-control form-control-sm fee-amount" value="${item.amount || 0}"></td>
        <td><button type="button" class="btn btn-sm btn-outline-danger fee-del"><i class="bi bi-x"></i></button></td>
      </tr>
    `);
        tr.find('.fee-amount').on('input', recomputeFeesTotal);
        tr.find('.fee-del').on('click', () => { tr.remove(); recomputeFeesTotal(); });
        $feesBody.append(tr);
        recomputeFeesTotal();
    }

    // ضِف هذا قرب دوال الرسوم الحالية
    function setFees(fees = []) {
        $feesBody.empty();
        (fees || []).forEach(f => addFeeRow({
            type: f.type || 'Tuition',
            name: f.name || '',
            amount: Number(f.amount || 0)
        }));
        recomputeFeesTotal();
    }

    function collectFees() {
        const fees = [];
        $feesBody.find('tr').each(function () {
            const $tr = $(this);
            fees.push({
                type: $tr.find('.fee-type').val(),
                name: ($tr.find('.fee-name').val() || '').trim(),
                amount: Number($tr.find('.fee-amount').val() || 0)
            });
        });
        return fees;
    }

    function recomputeFeesTotal() {
        const total = collectFees().reduce((s, f) => s + (Number(f.amount) || 0), 0);
        $feeTotal.text(numFmt(total));
    }

    if ($schoolId.length) $schoolId.on('change', async function () {
        const sid = Number($(this).val() || 0);
        if (sid) {
            await loadStagesFor(sid);
        } else {
            $stageId.prop('disabled', true).trigger('change.select2');
        }
    });

    if ($btnSaveGrade.length) $btnSaveGrade.on('click', saveGrade);

    async function saveGrade() {
        const $form = $('#frmGrade');
        if ($form.length && !$form[0].checkValidity()) {
            $form.addClass('was-validated');
            return;
        }

        const dto = mapGradeDto();
        if (!dto.schoolId) { toast('اختر مدرسة/فرع', 'error'); return; }
        if (!dto.stageId) { toast('اختر مرحلة', 'error'); return; }
        if (!dto.name) { toast('اسم الصف مطلوب', 'error'); return; }

        const fees = collectFees()
            .map(f => ({ type: String(f.type || 'Other'), name: (f.name || '').trim() || null, amount: Number(f.amount || 0) }))
            .filter(f => f.amount > 0 || (f.name && f.name.length > 0));

        const payload = {
            yearId: dto.yearId,
            schoolId: dto.schoolId,
            stageId: dto.stageId,
            name: dto.name,
            shift: dto.shift,
            gender: dto.gender,
            capacity: dto.capacity,
            tuition: dto.tuition,
            sortOrder: dto.sortOrder,
            status: dto.status,
            notes: dto.notes,
            fees
        };

        try {
            // 👇 استخدم الحالة الصريحة أولًا، مع الإبقاء على منطقك القديم كتاريخ
            const editId = CURRENT_GRADE_ID || dto.id;

            if (editId > 0) {
                await api.updateGrade(editId, payload);     // PUT
            } else {
                await api.createGrade(payload);              // POST
            }

            // === منطقك القديم (أُبقي كتعليق كما طلبت عدم الحذف) ===
            // if (dto.id > 0) await api.updateGrade(dto.id, payload);     // PUT
            // else await api.createGrade(dto);                        // POST

            if (gradeModal) gradeModal.hide();
            toast('تم الحفظ');
            await filterTable();

            // صفّر الحالة بعد الحفظ
            CURRENT_GRADE_ID = null;
            $gradeYearId.val('');
        } catch (err) {
            // نحاول قراءة JSON من رسالة الخطأ
            let msg = String(err?.message || err);
            try {
                const j = JSON.parse(msg);
                // لو الباك إند أرجع code = DUPLICATE_GRADE
                if (j.code === 'DUPLICATE_GRADE') {
                    toast('يوجد صف بنفس الاسم لهذه السنة/المدرسة/المرحلة. افتح الصف للتعديل أو غيّر الاسم.', 'error');
                    return;
                }
                msg = j.message || msg;
            } catch { }
            toast(msg, 'error');
        }
    }

    // ================== Sections Modal (CRUD) ==================
    function ensureSectionsModal() {
        if (!sectionsModal) {
            const el = document.getElementById('sectionsModal');
            if (window.bootstrap && el) sectionsModal = new bootstrap.Modal(el, { backdrop: 'static' });
        }
    }

    async function openSections(gradeId, gradeName) {
        ensureSectionsModal();
        $sectionsModalTitle.text(gradeName || `#${gradeId}`);

        // ✅ ثبّت رقم الصف الحالي للشُّعب
        CURRENT_GRADE_ID = gradeId;

        // ✅ اجعل المتغير المستخدم في زر "توليد" معرفًا
        const currentGradeId = gradeId;

        // حدّث السعة الإجمالية من الصف إن وُجد
        const row = ROWS.find(r => r.id === gradeId);
        _currentGradeCapacity = Number(row?.capacity || 0);

        // حمّل الشُعب الحالية
        const list = await api.listSections(gradeId).catch(() => []);
        renderSectionsTable(gradeId, list);
        recomputeCapacity(list);

        // إضافة سطر يدوي
        $btnAddSectionInline.off('click').on('click', () => addSectionInlineRow());

        /*  (تم الإبقاء عليه كمرجع — الدالة الفعلية أُضيفت داخل كائن api)
        toggleSectionLock: async (gradeId, id, lock) =>
            await http('PATCH', lock ? ENDPOINTS.section(gradeId, id) + '/lock'
                : ENDPOINTS.section(gradeId, id) + '/unlock'),
        */

        // ✅ توليد دفعة شُعب
        $btnBulkSections.off('click').on('click', async () => {
            const raw = ($bulkLetters.val() || '').trim();
            if (!raw) { toast('أدخل الحروف/الأقسام أولًا', 'error'); return; }

            // ✅ دعم الفاصلة العربية والمسافات والفواصل الأخرى
            const normalized = raw.replace(/[،;|]/g, ',').replace(/\s+/g, ',');
            const letters = normalized.split(',')
                .map(x => x.trim())
                .filter(Boolean);

            if (!letters.length) { toast('لا توجد عناصر لتوليدها', 'error'); return; }

            const cap = Number($bulkCapacity.val() || 35);

            try {
                // يمكنك تنفيذها تتابعيًا أو بشكل متوازي:
                // تتابعيًا:
                for (const name of letters) {
                    await api.createSection(currentGradeId, { name, capacity: cap, teacher: null, notes: null });
                }
                // // أو متوازيًا:
                // await Promise.all(letters.map(name => api.createSection(currentGradeId, { name, capacity: cap, teacher: null, notes: null })));

                const list2 = await api.listSections(currentGradeId).catch(() => []);
                renderSectionsTable(currentGradeId, list2);
                recomputeCapacity(list2);
                toast('تم توليد الشُعب');
            } catch (err) {
                // إظهار أول خطأ فالديشن بشكل واضح إن وُجد
                let msg = String(err?.message || err);
                try {
                    const j = JSON.parse(msg);
                    const first = Object.values(j.errors || {})[0]?.[0];
                    if (first) msg = first;
                } catch { /* ignore */ }
                toast(msg, 'error');
                console.error(err);
            }
        });

        sectionsModal?.show();
    }

    // مستمع قفل/فتح الشُّعب
    $sectionsTableBody.off('click', '.sec-lock').on('click', '.sec-lock', async function () {
        const $tr = $(this).closest('tr');
        const id = Number($tr.data('id') || 0);
        if (!id) return;

        const current = String($tr.data('status') || 'Active');
        const isActive = (current === 'Active');
        const nextStatus = isActive ? 'Inactive' : 'Active';

        // رسالة توضيحية
        const htmlMsg = isActive
            ? 'قفل الشُّعبة يعني إخفاءها من التسجيل/التخصيص وإيقاف استخدامها مؤقتًا دون حذف بياناتها.'
            : 'فتح الشُّعبة سيعيد إتاحتها للتسجيل/التخصيص والعمل عليها.';

        // تأكيد
        let ok = true;
        if (window.Swal) {
            const res = await Swal.fire({
                icon: isActive ? 'warning' : 'question',
                title: isActive ? 'قفل الشُّعبة؟' : 'فتح الشُّعبة؟',
                html: `<div class="text-start">${htmlMsg}</div>`,
                showCancelButton: true,
                confirmButtonText: isActive ? 'تأكيد القفل' : 'تأكيد الفتح',
                cancelButtonText: 'إلغاء'
            });
            ok = res.isConfirmed;
        } else {
            ok = confirm((isActive ? 'قفل' : 'فتح') + ' الشُّعبة؟');
        }
        if (!ok) return;

        const $btn = $(this).prop('disabled', true);
        try {
            await api.toggleSectionLock(CURRENT_GRADE_ID || 0, id, isActive); // PATCH

            // حدّث الحالة بصريًا فورًا
            $tr.attr('data-status', nextStatus);
            const $badgeCell = $tr.find('td').eq(1); // نفس مكان البادج
            $badgeCell.find('.badge').remove();
            $badgeCell.prepend(
                nextStatus === 'Active'
                    ? '<span class="badge bg-success-subtle text-success">نشطة</span>'
                    : '<span class="badge bg-secondary">مقفلة</span>'
            );

            // بدّل لون/أيقونة الزر
            const $icon = $btn.find('i');
            if (nextStatus === 'Active') {
                $btn.removeClass('btn-outline-success').addClass('btn-outline-warning')
                    .attr('title', 'قفل الشُّعبة (ستصبح غير نشطة)');
                $icon.removeClass('bi-unlock').addClass('bi-lock');
            } else {
                $btn.removeClass('btn-outline-warning').addClass('btn-outline-success')
                    .attr('title', 'فتح الشُّعبة (ستصبح نشطة)');
                $icon.removeClass('bi-lock').addClass('bi-unlock');
            }

            toast(nextStatus === 'Active' ? 'تم فتح الشُّعبة' : 'تم قفل الشُّعبة');
        } catch (err) {
            toast(String(err?.message || err), 'error');
            console.error(err);
        } finally {
            $btn.prop('disabled', false);
        }
    });

    function renderSectionsTable(gradeId, sections) {
        $sectionsTableBody.empty();
        (sections || []).forEach((s, i) => {
            $sectionsTableBody.append(sectionRowHtml(s, i + 1));
        });

        // حفظ
        $sectionsTableBody.off('click', '.sec-save').on('click', '.sec-save', async function () {
            const $tr = $(this).closest('tr');
            const dto = readSectionRow($tr);
            if (!dto.name) { toast('اسم الشعبة مطلوب', 'error'); return; }
            try {
                if (dto.id) {
                    await api.updateSection(gradeId, dto.id, dto);
                } else {
                    const created = await api.createSection(gradeId, dto);
                    $tr.replaceWith(sectionRowHtml(created, $sectionsTableBody.find('tr').length));
                }
                toast('تم الحفظ');
                const fresh = await api.listSections(gradeId).catch(() => []);
                renderSectionsTable(gradeId, fresh);
                recomputeCapacity(fresh);
            } catch (err) {
                toast(String(err.message || err), 'error');
                console.error(err);
            }
        });

        // حذف
        $sectionsTableBody.off('click', '.sec-del').on('click', '.sec-del', async function () {
            const $tr = $(this).closest('tr');
            const id = Number($tr.data('id') || 0);
            try {
                if (id) await api.deleteSection(gradeId, id);
                $tr.remove();
                const fresh = await api.listSections(gradeId).catch(() => []);
                recomputeCapacity(fresh);
                toast('تم الحذف');
            } catch (err) {
                toast(String(err.message || err), 'error');
                console.error(err);
            }
        });
    }

    function sectionRowHtml(s, idx) {
        const isActive = (s.status !== 'Inactive'); // افتراضي Active لو null
        const lockClass = isActive ? 'btn-outline-warning' : 'btn-outline-success';
        const lockIcon = isActive ? 'bi-lock' : 'bi-unlock';
        const lockTitle = isActive ? 'قفل الشُّعبة (ستصبح غير نشطة)' : 'فتح الشُّعبة (ستصبح نشطة)';
        const statusBadge = isActive
            ? '<span class="badge bg-success-subtle text-success">نشطة</span>'
            : '<span class="badge bg-secondary">مقفلة</span>';

        return `
    <tr data-id="${s.id || ''}" data-status="${isActive ? 'Active' : 'Inactive'}">
      <td class="text-mono">${idx}</td>

      <!-- ✅ عمود الحالة المستقل -->
      <td class="sec-status">${statusBadge}</td>

      <!-- الاسم -->
      <td>
        <input class="form-control form-control-sm sec-name" value="${esc(s.name || '')}" placeholder="أ/ب/ج">
      </td>

      <!-- السعة -->
      <td style="width:120px">
        <input type="number" min="1" class="form-control form-control-sm sec-capacity" value="${s.capacity || 0}">
      </td>

      <!-- المربي -->
      <td>
        <input class="form-control form-control-sm sec-teacher" value="${esc(s.teacher || '')}" placeholder="مربي الفصل">
      </td>

      <!-- الملاحظات -->
      <td>
        <input class="form-control form-control-sm sec-notes" value="${esc(s.notes || '')}" placeholder="ملاحظات">
      </td>

      <!-- الإجراءات -->
      <td class="text-nowrap" style="width:160px">
        <button type="button" class="btn ${lockClass} btn-sm sec-lock" title="${lockTitle}">
          <i class="bi ${lockIcon}"></i>
        </button>
        <button type="button" class="btn btn-sm btn-outline-primary sec-save"><i class="bi bi-check2"></i></button>
        <button type="button" class="btn btn-sm btn-outline-danger sec-del"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
    }


    function readSectionRow($tr) {
        return {
            id: Number($tr.data('id') || 0) || 0,
            name: ($tr.find('.sec-name').val() || '').trim(),
            capacity: Number($tr.find('.sec-capacity').val() || 0),
            teacher: ($tr.find('.sec-teacher').val() || '').trim() || null,
            notes: ($tr.find('.sec-notes').val() || '').trim() || null
        };
    }

    function addSectionInlineRow() {
        $sectionsTableBody.append(sectionRowHtml({ id: 0, name: '', capacity: Number($bulkCapacity.val() || 35) }, $sectionsTableBody.find('tr').length + 1));
    }

    function recomputeCapacity(sections) {
        const used = (sections || []).reduce((s, x) => s + (Number(x.capacity) || 0), 0);
        const total = _currentGradeCapacity || 0;
        $capUsed.text(numFmt(used));
        $capTotal.text(numFmt(total));
        $capFree.text(numFmt((total || 0) - used));
    }

    // ================== Init ==================
    $(async function () {
        try {
            const gradeModalEl = document.getElementById('gradeModal');
            if (window.bootstrap && gradeModalEl) {
                gradeModal = new bootstrap.Modal(gradeModalEl, { backdrop: 'static' });
            }
            const sectionsModalEl = document.getElementById('sectionsModal');
            if (window.bootstrap && sectionsModalEl) {
                sectionsModal = new bootstrap.Modal(sectionsModalEl, { backdrop: 'static' });
            }

            renderYearBadge();
            await loadAllStages();
            await loadLookups();

            const sidFromQuery = $filterSchoolId.val();
            if (sidFromQuery) await loadStagesFor(Number(sidFromQuery));

            // ✅ CSS بسيط للّفّ (wrap) للبادجات
            if (!document.getElementById('grades-badges-wrap-style')) {
                const st = document.createElement('style');
                st.id = 'grades-badges-wrap-style';
                st.textContent = `
                .badges-wrap { display:flex; flex-wrap:wrap; gap:.25rem .25rem; }
                .badge-grade { white-space:normal; }
                #tblYears td.sections-col .badge { white-space:normal; }
              `;
                document.head.appendChild(st);
            }

            await filterTable();
        } catch (e) {
            toast(String(e.message || e), 'error');
            console.error(e);
        }
    });

})();
