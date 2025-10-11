(function () {
    'use strict';
    const $ = jQuery;

    // ================== REST ==================
    const API_BASE = '/api';
    const ENDPOINTS = {
        // مدارس/مراحل/فروع
        schools: `${API_BASE}/schools?simple=true`,
        stages: (schoolId) => `${API_BASE}/stages?schoolId=${schoolId || ''}`,
        school: (id) => `${API_BASE}/schools/${id}`,
        branchesBySchool: (schoolId) => `${API_BASE}/branches?schoolId=${schoolId || ''}`,

        // الصفوف السنوية GradeYears
        grades: `${API_BASE}/gradeyears`,
        grade: (id) => `${API_BASE}/gradeyears/${id}`,

        // السنة الحالية (عمومًا أو لفرع معيّن)
        schoolYearsCurrent: (branchId) =>
            `${API_BASE}/school-years/current${branchId ? `?branchId=${branchId}` : ''}`,

        // الشُّعب السنوية SectionYears
        sections: (gradeYearId) => `${API_BASE}/sectionyears/by-grade/${gradeYearId}`,
        section: (_gradeId, id) => `${API_BASE}/sectionyears/${id}`,
    };

    // ================== HTTP ==================
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

    // ========= Fallback helpers for current year (NEW) =========
    async function tryGetJson(url) {
        try {
            const res = await http('GET', url);
            return res ?? null;
        } catch (err) {
            if (String(err?.message || '').includes('404')) return null;
            return null; // نتسامح مع الأخطاء هنا كي نكمل المرشحين الآخرين
        }
    }

    // يحاول عدّة مسارات شائعة لقراءة السنة الحالية، ويدعم أشكال استجابة مختلفة
    async function fetchCurrentYear(branchId /* optional */) {
        const candidates = [
            ENDPOINTS.schoolYearsCurrent(branchId || undefined),
            `${API_BASE}/schoolyears/current${branchId ? `?branchId=${branchId}` : ''}`,
            `${API_BASE}/years/current${branchId ? `?branchId=${branchId}` : ''}`,
            `${API_BASE}/year/current${branchId ? `?branchId=${branchId}` : ''}`
        ];
        for (const url of candidates) {
            const j = await tryGetJson(url);
            if (!j) continue;

            const id =
                (typeof j === 'number' && j) ||
                j?.id ||
                j?.data?.id ||
                (Array.isArray(j) && j[0]?.id) ||
                null;
            if (id) return Number(id);
        }
        return null;
    }

    // ================== Cache ==================
    let SCHOOLS_BY_ID = Object.create(null);

    const api = {
        // مدارس
        getSchools: async () => {
            const list = await http('GET', ENDPOINTS.schools).catch(() => []);
            SCHOOLS_BY_ID = Object.create(null);
            (list || []).forEach(s => {
                const bid = s.branchId ?? s.BranchId ?? s.branchID ?? s.branch_id ?? s.branch?.id ?? s.Branch?.Id;
                SCHOOLS_BY_ID[String(s.id)] = { ...s, branchId: bid ?? null };
            });
            return list;
        },
        getSchool: async (id) => {
            const s = await http('GET', ENDPOINTS.school(id));
            const bid = s.branchId ?? s.BranchId ?? s.branchID ?? s.branch_id ?? s.branch?.id ?? s.Branch?.Id;
            const prev = SCHOOLS_BY_ID[String(id)] ?? {};
            SCHOOLS_BY_ID[String(id)] = { ...prev, ...s, branchId: bid ?? null };
            return SCHOOLS_BY_ID[String(id)];
        },
        getBranchesForSchool: async (schoolId) =>
            await http('GET', ENDPOINTS.branchesBySchool(schoolId)).catch(() => []),

        // مراحل
        getStages: async (schoolId) => await http('GET', ENDPOINTS.stages(schoolId)).catch(() => []),

        // GradeYears
        listGrades: async (params) => {
            const q = new URLSearchParams();
            if (params?.yearId) q.set('yearId', params.yearId);
            if (params?.schoolId) q.set('schoolId', params.schoolId);
            if (params?.stageId) q.set('stageId', params.stageId);
            if (params?.q) q.set('q', params.q);
            return await http('GET', `${ENDPOINTS.grades}?${q}`);
        },
        getGrade: async (id) => await http('GET', ENDPOINTS.grade(id)),
        createGrade: async (dto) => await http('POST', ENDPOINTS.grades, dto),
        updateGrade: async (id, dto) => {
            const body = { ...dto, id: (dto?.id ?? id) };
            return await http('PUT', ENDPOINTS.grade(id), body);
        },
        deleteGrade: async (id) => await http('DELETE', ENDPOINTS.grade(id)),

        // YearId الصحيح (فرعي/عمومي) — محدث ليستخدم fetchCurrentYear
        getCurrentYearIdForSchool: async (schoolId) => {
            let sc = SCHOOLS_BY_ID[String(schoolId)];
            if (!sc || !sc.branchId) sc = await api.getSchool(schoolId).catch(() => sc);

            let branchId = sc?.branchId ?? sc?.BranchId ?? sc?.branch?.id ?? sc?.Branch?.Id ?? null;
            if (!branchId) {
                const branches = await api.getBranchesForSchool(schoolId);
                if (Array.isArray(branches) && branches.length === 1) branchId = branches[0].id;
            }

            // 1) جرّب بالفرع
            let y = await fetchCurrentYear(branchId || undefined);
            if (y) return y;

            // 2) العام
            y = await fetchCurrentYear(undefined);
            return y ?? null;
        },
        getCurrentYearIdGlobal: async () => {
            const y = await fetchCurrentYear(undefined);
            return y ?? null;
        },

        // Sections
        listSections: async (gradeYearId) =>
            await http('GET', ENDPOINTS.sections(gradeYearId)).catch(() => []),
        createSection: async (gradeYearId, dto) =>
            await http('POST', `${API_BASE}/sectionyears`, { gradeYearId, ...dto }),
        updateSection: async (gradeYearId, id, dto) =>
            await http('PUT', ENDPOINTS.section(gradeYearId, id), { gradeYearId, ...dto }),
        deleteSection: async (_gradeYearId, id) =>
            await http('DELETE', ENDPOINTS.section(0, id)),
    };

    // ================== Helpers ==================
    const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
    const LOCALE = 'ar-SA-u-nu-latn';
    const numFmt = v => new Intl.NumberFormat(LOCALE).format(Number(v || 0));
    const gradeNameOf = (r) => r?.gradeName || r?.name || '';

    function toast(title, icon = 'success') {
        if (window.Swal) Swal.fire({ toast: true, position: 'top', timer: 2200, showConfirmButton: false, icon, title });
        else alert(title);
    }
    function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

    // أسماء العرض
    let SCHOOLS = [];
    let STAGES = [];
    const schoolName = id => (SCHOOLS.find(x => x.id == id)?.name) || id || '—';
    let STAGES_ALL = [];
    let STAGE_NAME_BY_ID = {};
    const stageName = id => STAGE_NAME_BY_ID[String(id)] || (STAGES.find(x => x.id == id)?.name) || '—';

    // السنة الحالية في الشارة — مع تصحيح yearId إن كانت "كود" وليس معرف
    async function renderYearBadge() {
        let yid = window.__APP__?.yearId;
        if (!yid || isLikelyYearCode(yid)) {
            try { yid = await resolveYearId($filterSchoolId.val() ? Number($filterSchoolId.val()) : undefined); } catch { }
        }
        $('#yearBadge').html(
            `<span class="chip"><i class="bi bi-info-circle"></i> السنة الحالية: <b class="ms-1">${esc(String(yid ?? '—'))}</b></span>`
        );
    }

    // ✅ تعتبر القيم التي تبدو "كود سنة" كـ (2024 أو "2024/2025") غير صالحة كـ DB Id
    function isLikelyYearCode(v) {
        const s = String(v ?? '').trim();
        if (!s) return true;
        if (s.includes('/')) return true;
        const n = Number(s);
        return Number.isFinite(n) && n >= 1900;
    }

    async function resolveYearId(schoolId) {
        if (schoolId) {
            const y = await api.getCurrentYearIdForSchool(Number(schoolId));
            if (y) return y;
        }
        const yg = await api.getCurrentYearIdGlobal();
        return yg ?? null;
    }

    // بادجات الشُّعب
    function renderGradeSectionCombinedBadges(_gradeName, sectionNames = []) {
        const names = Array.isArray(sectionNames) ? sectionNames : [];
        const chips = names.map(n =>
            `<span class="badge rounded-pill text-bg-light border me-1 mb-1">${esc(`${_gradeName || ''} - ${n}`.trim())}</span>`
        ).join('');
        const fallback = _gradeName
            ? `<span class="badge rounded-pill text-bg-primary border me-1 mb-1 badge-grade">${esc(_gradeName)}</span>`
            : '';
        return `<div class="badges-wrap">${chips || fallback}</div>`;
    }

    function enableStageSelect() {
        $stageId.prop('disabled', false).removeAttr('disabled');
        if ($stageId.data('select2')) {
            const container = $stageId.next('.select2-container');
            if (container && container.length) container.removeClass('select2-container--disabled');
            $stageId.trigger('change.select2');
        }
    }

    function isStageOptionsLoaded() {
        const count = $stageId.children('option').length;
        if (count === 0) return false;
        if (count === 1 && ($stageId.children('option').first().val() ?? '') === '') return false;
        return true;
    }
    async function ensureStagesLoadedForCurrentSchool() {
        const sid = Number($schoolId.val() || 0);
        if (!sid) return;
        if (!isStageOptionsLoaded() || $stageId.prop('disabled')) {
            await loadStagesFor(sid);
        }
    }

    // ================== DOM Elements ==================
    const $yearBadge = $('#yearBadge');
    const $txtSearch = $('#txtSearch');
    const $filterSchoolId = $('#filterSchoolId');
    const $filterStageId = $('#filterStageId');
    const $btnResetFilters = $('#btnResetFilters');
    const $btnRefresh = $('#btnRefresh');
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
    let ROWS = [];
    let dt;
    let _currentGradeCapacity = 0;

    // ✅ معرّف السنة المُحلول (DB Id) ليُستخدم في الإرسال دائمًا
    let RESOLVED_YEAR_ID = null;

    async function loadAllStages() {
        STAGES_ALL = await api.getStages(null).catch(() => []);
        STAGE_NAME_BY_ID = {};
        STAGES_ALL.forEach(st => { STAGE_NAME_BY_ID[String(st.id)] = st.name; });
    }

    async function loadLookups() {
        SCHOOLS = await api.getSchools(); // يبني SCHOOLS_BY_ID أيضاً

        $filterSchoolId.empty().append(new Option('الكل', ''));
        SCHOOLS.forEach(s => $filterSchoolId.append(new Option(s.name, String(s.id))));
        if (!$filterSchoolId.data('select2'))
            $filterSchoolId.select2({ theme: 'bootstrap-5', width: '100%', placeholder: 'كل المدارس' });

        $schoolId.empty();
        SCHOOLS.forEach(s => $schoolId.append(new Option(s.name, String(s.id))));
        if (!$schoolId.data('select2'))
            $schoolId.select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#gradeModal') });

        $stageId.prop('disabled', true);
        if (!$stageId.data('select2'))
            $stageId.select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#gradeModal') });

        $filterStageId.prop('disabled', true);
        if (!$filterStageId.data('select2'))
            $filterStageId.select2({ theme: 'bootstrap-5', width: '100%', placeholder: 'كل المراحل' });
    }

    async function loadStagesFor(schoolId) {
        STAGES = await api.getStages(schoolId);
        // مودال
        $stageId.prop('disabled', false).empty();
        STAGES.forEach(st => $stageId.append(new Option(st.name, String(st.id))));
        enableStageSelect();
        $stageId.trigger('change.select2');
        // فلتر
        $filterStageId.prop('disabled', false).empty().append(new Option('الكل', ''));
        STAGES.forEach(st => $filterStageId.append(new Option(st.name, String(st.id))));
        $filterStageId.trigger('change.select2');
    }

    // CSS: تكبير مودال الصف + تمرير مريح  (إصلاح المسافات الخاطئة)
    if (!document.getElementById('grade-modal-comfy-style')) {
        const st = document.createElement('style');
        st.id = 'grade-modal-comfy-style';
        st.textContent = `
            #gradeModal .modal-dialog { max-width: 980px; width: 95vw; }
            @media (min-width: 1400px) { #gradeModal .modal-dialog { max-width: 1100px; } }
            #gradeModal .modal-body { max-height: calc(100vh - 220px); overflow: auto; }
            #gradeModal .modal-content { border-radius: 14px; }
        `;
        document.head.appendChild(st);
    }

    // ================== Branch UI ==================
    function findBranchElements() {
        const $scope = $('#gradeModal');
        return {
            select: $scope.find(
                'select#branchId, select#BranchId, select[name="branchId"], select[data-field="branchId"], select[id*="branch"]'
            ).first(),
            text: $scope.find('#branchName, #BranchName, input[name="branchName"], [data-field="branchName"]').first(),
            label: $scope.find('#branchLabel, [data-field="branchLabel"]').first()
        };
    }

    function initBranchSelect2($sel) {
        if (!$sel || !$sel.length) return;
        if (!$sel.data('select2')) {
            $sel.select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#gradeModal') });
        }
    }
    async function fillBranchUIForSchool(schoolId) {
        const { select: $select, text: $text, label: $label } = findBranchElements();
        const setEmpty = () => {
            if ($select && $select.length) {
                $select.prop('disabled', true).empty().append(new Option('—', ''));
                initBranchSelect2($select);
                $select.val('').trigger('change.select2');
            }
            if ($text && $text.length) ($text.is('input,textarea') ? $text.val('—') : $text.text('—'));
            if ($label && $label.length) $label.addClass('text-muted');
        };

        const sid = Number(schoolId || 0);
        if (!sid) { setEmpty(); return; }

        initBranchSelect2($select);

        let sc = SCHOOLS_BY_ID[String(sid)];
        if (!sc || !sc.branchId) sc = await api.getSchool(sid).catch(() => sc);

        let branchId = sc?.branchId ?? sc?.BranchId ?? sc?.branch?.id ?? sc?.Branch?.Id ?? null;
        let branchName = sc?.branch?.name ?? sc?.Branch?.Name ?? sc?.branchName ?? null;

        const branches = await api.getBranchesForSchool(sid).catch(() => []);
        if (!Array.isArray(branches) || branches.length === 0) { setEmpty(); return; }

        if (!branchId) {
            branchId = branches[0].id;
            branchName = branches[0].name;
        }

        if ($select && $select.length) {
            $select.prop('disabled', false).empty();
            branches.forEach(b => $select.append(new Option(b.name || `#${b.id}`, b.id)));
            $select.val(String(branchId)).trigger('change.select2');
            if (branches.length === 1) {
                $select.prop('disabled', true);
                $select.next('.select2-container').find('.select2-selection').addClass('bg-light');
            } else {
                $select.prop('disabled', false);
                $select.next('.select2-container').find('.select2-selection').removeClass('bg-light');
            }
        }

        if ($text && $text.length)
            ($text.is('input,textarea') ? $text.val(branchName || (branchId ? `#${branchId}` : '—'))
                : $text.text(branchName || (branchId ? `#${branchId}` : '—')));
        if ($label && $label.length) $label.toggleClass('text-muted', !branchId);
    }

    // ================== Sections Preview Cache ==================
    const _SECTIONS_PREVIEW_CACHE = new Map();

    // يعيد أيضًا usedCapacity لحساب "المتاح"
    // يعيد أيضًا usedCapacity لحساب "المتاح"
    async function fetchSectionsPreview(gradeId) {
        if (_SECTIONS_PREVIEW_CACHE.has(gradeId)) return _SECTIONS_PREVIEW_CACHE.get(gradeId);

        const list = await api.listSections(gradeId).catch(() => []);
        const names = (list || []).map(s => s?.name).filter(Boolean);

        // لا تقصّ إلى 3 — أعِد جميع الأسماء
        const preview = names;  // ← التعديل

        const usedCapacity = (list || []).reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);

        const result = { sectionsPreview: preview, sectionsCount: names.length, usedCapacity };
        _SECTIONS_PREVIEW_CACHE.set(gradeId, result);
        return result;
    }


    // helper لإجمالي الرسوم
    function totalFeesOf(r) {
        if (Array.isArray(r?.fees) && r.fees.length) {
            return r.fees.reduce((s, f) => s + (Number(f.amount) || 0), 0);
        }
        return Number(r?.tuition || 0);
    }

    async function enrichRowsWithSections(rows, limit = 25) {
        const list = Array.isArray(rows) ? rows : [];
        const slice = list.slice(0, Math.max(0, limit));
        for (const r of slice) {
            try {
                const { sectionsPreview, sectionsCount, usedCapacity } = await fetchSectionsPreview(r.id);
                r.sectionsPreview = sectionsPreview;
                r.sectionsCount = sectionsCount;

                const totalCap = Number(r.capacity) || 0;
                const used = Number(usedCapacity) || 0;
                r.available = (totalCap - used);

                r._totalFees = totalFeesOf(r);
            } catch { /* ignore */ }
        }
        return rows;
    }

    // ================== Stats ==================
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

    // ================== Table (DataTables) ==================
    async function filterTable() {
        const schoolId = $filterSchoolId.val() ? Number($filterSchoolId.val()) : undefined;
        const stageId = !$filterStageId.prop('disabled') && $filterStageId.val() ? Number($filterStageId.val()) : undefined;

        // yearId الصحيح
        let yearId = window.__APP__?.yearId;
        try {
            if (!yearId || isLikelyYearCode(yearId)) {
                yearId = await resolveYearId(schoolId);
            }
        } catch { yearId = null; }

        const list = await api.listGrades({
            yearId: yearId || undefined,
            schoolId,
            stageId,
            q: ($txtSearch.val() || '').trim() || undefined
        });

        ROWS = (list || []).map(x => ({ ...x, gradeName: gradeNameOf(x) }));

        await enrichRowsWithSections(ROWS, 30);

        buildTable(ROWS);
        updateStats(ROWS);
        await renderYearBadge();
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
                    { data: null, render: r => `<span class="fw-semibold">${esc(gradeNameOf(r))}</span>` },
                    { data: 'shift', render: v => v === 'Morning' ? 'صباحي' : 'مسائي' },
                    { data: 'gender', render: v => v === 'Mixed' ? 'مختلط' : (v === 'Boys' ? 'بنين' : 'بنات') },
                    { data: 'capacity', className: 'text-mono', render: v => numFmt(v || 0) },
                    {
                        data: null,
                        className: 'text-mono',
                        render: r => {
                            const v = Number(r?.available ?? 0);
                            const txt = numFmt(v);
                            return v < 0
                                ? `<span class="text-danger fw-semibold" title="تنبيه: التجاوز عن السعة">${txt}</span>`
                                : txt;
                        }
                    },
                    { data: null, className: 'text-mono', render: r => numFmt(totalFeesOf(r)) },
                    {
                        data: null,
                        className: 'sections-col',
                        render: r => renderGradeSectionCombinedBadges(gradeNameOf(r), r.sectionsPreview)
                    },
                    { data: null, className: 'text-mono', render: (_, _t, r) => r.id },
                    {
                        data: null,
                        orderable: false,
                        searchable: false,
                        render: r => {
                            const willLock = (r.status === 'Active');
                            const lockClass = willLock ? 'btn-outline-warning' : 'btn-outline-success';
                            const lockIcon = willLock ? 'bi-lock' : 'bi-unlock';
                            const lockTitle = willLock ? 'قفل الصف (سيصبح غير نشط)' : 'فتح الصف (سيصبح نشطًا)';
                            return `
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-danger btn-del" data-id="${r.id}" title="حذف"><i class="bi bi-trash"></i></button>
                  <button class="btn ${lockClass} btn-lock" data-id="${r.id}" title="${lockTitle}"><i class="bi ${lockIcon}"></i></button>
                  <button class="btn btn-outline-info btn-sections" data-id="${r.id}" data-name="${esc(gradeNameOf(r))}" title="الشُعب"><i class="bi bi-grid-3x3-gap"></i></button>
                  <button class="btn btn-outline-primary btn-edit" data-id="${r.id}" title="تعديل"><i class="bi bi-pencil-square"></i></button>
                </div>`;
                        }
                    }
                ]
            });

            // أحداث الأزرار
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

            $table.on('click', '.btn-lock', async function () {
                const id = Number($(this).data('id')); if (!id) return;
                const $btn = $(this).prop('disabled', true);
                try {
                    const g = await api.getGrade(id);
                    const isActive = (g.status === 'Active');
                    const title = isActive ? 'قفل الصف؟' : 'فتح الصف؟';
                    const html = isActive
                        ? `سيؤدي <b>قفل الصف</b> إلى:<ul class="text-start"><li>إخفائه من قوائم التسجيل.</li><li>منع التعديلات العرضية.</li></ul>هل تريد المتابعة؟`
                        : `سيؤدي <b>فتح الصف</b> إلى:<ul class="text-start"><li>ظهوره في قوائم التسجيل.</li><li>السماح بالإدارة المعتادة.</li></ul>هل تريد المتابعة؟`;
                    let proceed = true;
                    if (window.Swal) {
                        const r = await Swal.fire({ icon: isActive ? 'warning' : 'question', title, html, focusCancel: true, showCancelButton: true, confirmButtonText: isActive ? 'تأكيد القفل' : 'تأكيد الفتح', cancelButtonText: 'إلغاء', reverseButtons: true });
                        proceed = r.isConfirmed;
                    } else proceed = confirm((isActive ? 'قفل' : 'فتح') + ' الصف؟');
                    if (!proceed) return;

                    const payload = {
                        id: g.id, yearId: g.yearId, schoolId: g.schoolId, stageId: g.stageId,
                        name: gradeNameOf(g), shift: g.shift, gender: g.gender,
                        capacity: g.capacity, tuition: g.tuition, sortOrder: g.sortOrder,
                        status: isActive ? 'Inactive' : 'Active', notes: g.notes || null,
                        fees: (g.fees || []).map(f => ({ type: f.type, name: f.name, amount: f.amount }))
                    };
                    await api.updateGrade(id, payload);
                    toast(isActive ? 'تم قفل الصف' : 'تم فتح الصف');
                    await filterTable();
                } catch (err) { toast(String(err?.message || err), 'error'); console.error(err); }
                finally { $btn.prop('disabled', false); }
            });

            if ($btnRefresh.length) $btnRefresh.on('click', filterTable);
            if ($btnAddGrade.length) $btnAddGrade.on('click', () => openGradeUpsert());
            if ($txtSearch.length) $txtSearch.on('input', debounce(filterTable, 300));

            if ($filterSchoolId.length) $filterSchoolId.on('change', async function () {
                const sid = Number($(this).val() || 0);
                if (sid) await loadStagesFor(sid);
                else { $filterStageId.val('').trigger('change'); $filterStageId.prop('disabled', true); }
                await fillBranchUIForSchool(sid || null);
                await filterTable();
            });

            if ($filterStageId.length) $filterStageId.on('change', filterTable);

            if ($btnResetFilters.length) $btnResetFilters.on('click', async () => {
                $txtSearch.val('');
                $filterSchoolId.val('').trigger('change');
                $filterStageId.val('').trigger('change');
                $filterStageId.prop('disabled', true);
                await fillBranchUIForSchool(null);
                await filterTable();
            });

        } else {
            dt.clear().rows.add(rows).draw(false);
        }
    }

    async function confirmDelete() {
        if (!window.Swal) return confirm('حذف هذا الصف؟');
        const r = await Swal.fire({ icon: 'warning', title: 'تأكيد', text: 'حذف هذا الصف؟', showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء' });
        return r.isConfirmed;
    }

    // ================== Modal (Add/Edit) ==================
    function resetGradeForm() {
        const $form = $('#frmGrade');
        if ($form.length) { $form[0].reset(); $form.removeClass('was-validated'); }
        $gradeYearId.val(''); CURRENT_GRADE_ID = null;

        $feesBody.empty(); $feeTotal.text('0');
        if (!$schoolId.data('select2'))
            $schoolId.select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#gradeModal') });
        if (!$stageId.data('select2'))
            $stageId.select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#gradeModal') });

        fillBranchUIForSchool(null);
    }

    function setGradeForm(g) {
        $gradeYearId.val(g?.id || '');
        $schoolId.val(String(g?.schoolId || '')).trigger('change');
        $stageId.val(String(g?.stageId || '')).trigger('change');
        $gradeName.val(gradeNameOf(g) || '');
        $shift.val(g?.shift || 'Morning');
        $gender.val(g?.gender || 'Mixed');
        $capacity.val(g?.capacity ?? 70);
        $tuition.val(g?.tuition ?? 0);
        $sortOrder.val(g?.sortOrder ?? 0);
        $status.val(g?.status || 'Active');
        $notes.val(g?.notes || '');
    }

    // ✅ ترجيح استخدام معرّف السنة المُحلول (RESOLVED_YEAR_ID) أولًا
    function mapGradeDto() {
        return {
            id: Number($gradeYearId.val() || 0) || 0,
            schoolId: Number($schoolId.val() || 0),
            stageId: Number($stageId.val() || 0),
            yearId: Number(RESOLVED_YEAR_ID || window.__APP__?.yearId || 0),
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

    let CURRENT_GRADE_ID = null;

    async function openGradeUpsert(id = null) {
        try {
            CURRENT_GRADE_ID = id || null;
            $('#gradeModalTitle').text(id ? 'تعديل صف' : 'صف جديد');
            resetGradeForm();

            const sid = Number($filterSchoolId.val() || 0);
            if (sid) {
                await loadStagesFor(sid);
                $schoolId.val(String(sid)).trigger('change');
                enableStageSelect();
                await fillBranchUIForSchool(sid);
            }

            // ✅ حسم/تحديث معرّف السنة الحقيقي (DB Id) عند فتح المودال
            try {
                const sidForYear = Number($filterSchoolId.val() || $schoolId.val() || 0) || undefined;
                RESOLVED_YEAR_ID = await resolveYearId(sidForYear);
            } catch {
                RESOLVED_YEAR_ID = null;
            }

            if (id) {
                const g = await api.getGrade(id);
                await loadStagesFor(g.schoolId);

                if (g?.schoolId && g.schoolId !== sid) {
                    $schoolId.val(String(g.schoolId)).trigger('change');
                    await fillBranchUIForSchool(g.schoolId);
                }

                setGradeForm(g);

                if (typeof setFees === 'function') {
                    setFees(g.fees || []);
                    if (!g.fees || g.fees.length === 0) addFeeRow();
                }
                enableStageSelect();
            } else {
                if (typeof setFees === 'function') setFees([]);
                addFeeRow();
                await ensureStagesLoadedForCurrentSchool();
            }

            if (gradeModal) gradeModal.show();
        } catch (err) { toast(String(err?.message || err), 'error'); console.error(err); }
    }

    $(document).on('shown.bs.modal', '#gradeModal', async function () {
        $(this).find('.modal-dialog').addClass('modal-xl');
        const sidNow = Number($schoolId.val() || 0);
        await fillBranchUIForSchool(sidNow || null);
        await ensureStagesLoadedForCurrentSchool();
    });

    // الرسوم المتعددة
    if ($btnAddFee.length) $btnAddFee.on('click', () => addFeeRow());
    function addFeeRow(item = { type: 'Tuition', name: '', amount: 0 }) {
        const idx = Date.now();
        const tr = $(/*html*/`
            <tr data-row="${idx}">
                <td>
                    <select class="form-select form-select-sm fee-type">
                        <option value="Tuition" ${item.type === 'Tuition' ? ' selected' : ''}>رسوم أساسية</option>
                        <option value="Books" ${item.type === 'Books' ? ' selected' : ''}>كتب</option>
                        <option value="Transport" ${item.type === 'Transport' ? ' selected' : ''}>نقل</option>
                        <option value="Other" ${item.type === 'Other' ? ' selected' : ''}>أخرى</option>
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
    function setFees(fees = []) {
        $feesBody.empty();
        (fees || []).forEach(f => addFeeRow({ type: f.type || 'Tuition', name: f.name || '', amount: Number(f.amount || 0) }));
        recomputeFeesTotal();
    }
    function collectFees() {
        const fees = [];
        $feesBody.find('tr').each(function () {
            const $tr = $(this);
            fees.push({ type: $tr.find('.fee-type').val(), name: ($tr.find('.fee-name').val() || '').trim(), amount: Number($tr.find('.fee-amount').val() || 0) });
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
            await fillBranchUIForSchool(sid);
        } else {
            $stageId.prop('disabled', true).trigger('change.select2');
            await fillBranchUIForSchool(null);
        }
    });

    if ($btnSaveGrade.length) $btnSaveGrade.on('click', saveGrade);

    async function saveGrade() {
        const $form = $('#frmGrade');
        if ($form.length && !$form[0].checkValidity()) { $form.addClass('was-validated'); return; }

        const dto = mapGradeDto();
        if (!dto.schoolId) { toast('اختر مدرسة/فرع', 'error'); return; }
        if (!dto.stageId) { toast('اختر مرحلة', 'error'); return; }
        if (!dto.name) { toast('اسم الصف مطلوب', 'error'); return; }

        // ======== تحديد yearId الصالح (DB Id) بشكل صارم ========
        let yearId = dto.yearId;
        if (isLikelyYearCode(yearId)) {
            yearId = null;
        }

        try {
            if (!yearId) {
                // جرّب أولًا بفرع المدرسة إن وُجد
                const sidForYear = Number(dto.schoolId || 0) || undefined;
                let branchId = null;
                if (sidForYear) {
                    const sc = SCHOOLS_BY_ID[String(sidForYear)];
                    branchId = sc?.branchId ?? sc?.BranchId ?? sc?.branch?.id ?? sc?.Branch?.Id ?? null;
                }
                yearId = await fetchCurrentYear(branchId || undefined);
                if (!yearId) yearId = await fetchCurrentYear(undefined); // العام
            }
        } catch {
            yearId = null;
        }

        if (!yearId || isLikelyYearCode(yearId)) {
            toast('تعذر تحديد السنة الدراسية الحالية (معرّف). الرجاء تفعيل سنة للفرع أو تحديد المدرسة بشكل صحيح.', 'error');
            return;
        }

        const fees = collectFees()
            .map(f => ({ type: String(f.type || 'Other'), name: (f.name || '').trim() || null, amount: Number(f.amount || 0) }))
            .filter(f => f.amount > 0 || (f.name && f.name.length > 0));

        const payload = {
            id: dto.id > 0 ? dto.id : undefined,
            yearId,
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
            const editId = CURRENT_GRADE_ID || dto.id;
            if (editId > 0) await api.updateGrade(editId, payload);
            else await api.createGrade(payload);

            if (gradeModal) gradeModal.hide();
            toast('تم الحفظ');
            await filterTable();

            CURRENT_GRADE_ID = null;
            RESOLVED_YEAR_ID = null; // تنظيف الحالة
            $gradeYearId.val('');
        } catch (err) {
            let msg = String(err?.message || err);
            try {
                const j = JSON.parse(msg);
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

        CURRENT_GRADE_ID = gradeId;
        const currentGradeId = gradeId;

        const row = ROWS.find(r => r.id === gradeId);
        _currentGradeCapacity = Number(row?.capacity || 0);

        const list = await api.listSections(gradeId).catch(() => []);
        renderSectionsTable(gradeId, list);
        recomputeCapacity(list);

        $btnAddSectionInline.off('click').on('click', () => addSectionInlineRow());

        // توليد دفعة شُعب
        $btnBulkSections.off('click').on('click', async () => {
            const raw = ($bulkLetters.val() || '').trim();
            if (!raw) { toast('أدخل الحروف/الأقسام أولًا', 'error'); return; }
            const normalized = raw.replace(/[،;|]/g, ',').replace(/\s+/g, ',');
            const letters = normalized.split(',').map(x => x.trim()).filter(Boolean);
            if (!letters.length) { toast('لا توجد عناصر لتوليدها', 'error'); return; }
            const cap = Number($bulkCapacity.val() || 35);

            try {
                for (const name of letters) {
                    await api.createSection(currentGradeId, { name, capacity: cap, teacher: null, notes: null });
                }
                const list2 = await api.listSections(currentGradeId).catch(() => []);
                renderSectionsTable(currentGradeId, list2);
                recomputeCapacity(list2);
                toast('تم توليد الشُعب');
            } catch (err) {
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

    $sectionsTableBody.off('click', '.sec-lock').on('click', '.sec-lock', async function () {
        toast('قفل/فتح الشُّعب غير مدعوم حاليًا في الخادم.', 'error');
    });

    function renderSectionsTable(gradeId, sections) {
        $sectionsTableBody.empty();
        (sections || []).forEach((s, i) => {
            $sectionsTableBody.append(sectionRowHtml(s, i + 1));
        });

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
                toast(String(err.message || err), 'error'); console.error(err);
            }
        });

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
                toast(String(err.message || err), 'error'); console.error(err);
            }
        });
    }

    function sectionRowHtml(s, idx) {
        const isActive = (s.status !== 'Inactive');
        const lockClass = isActive ? 'btn-outline-warning' : 'btn-outline-success';
        const lockIcon = isActive ? 'bi-lock' : 'bi-unlock';
        const lockTitle = isActive ? 'قفل الشُّعبة (ستصبح غير نشطة)' : 'فتح الشُّعبة (ستصبح نشطة)';
        const statusBadge = isActive
            ? '<span class="badge bg-success-subtle text-success">نشطة</span>'
            : '<span class="badge bg-secondary">مقفلة</span>';

        return `
            <tr data-id="${s.id || ''}" data-status="${isActive ? 'Active' : 'Inactive'}">
                <td class="text-mono">${idx}</td>
                <td class="sec-status">${statusBadge}</td>
                <td><input class="form-control form-control-sm sec-name" value="${esc(s.name || '')}" placeholder="أ/ب/ج"></td>
                <td style="width:120px"><input type="number" min="1" class="form-control form-control-sm sec-capacity" value="${s.capacity || 0}"></td>
                <td><input class="form-control form-control-sm sec-teacher" value="${esc(s.teacher || '')}" placeholder="مربي الفصل"></td>
                <td><input class="form-control form-control-sm sec-notes" value="${esc(s.notes || '')}" placeholder="ملاحظات"></td>
                <td class="text-nowrap" style="width:160px">
                    <button type="button" class="btn ${lockClass} btn-sm sec-lock" title="${lockTitle}"><i class="bi ${lockIcon}"></i></button>
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
        $sectionsTableBody.append(sectionRowHtml(
            { id: 0, name: '', capacity: Number($bulkCapacity.val() || 35) },
            $sectionsTableBody.find('tr').length + 1
        ));
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
            if (window.bootstrap && gradeModalEl)
                gradeModal = new bootstrap.Modal(gradeModalEl, { backdrop: 'static' });

            const sectionsModalEl = document.getElementById('sectionsModal');
            if (window.bootstrap && sectionsModalEl)
                sectionsModal = new bootstrap.Modal(sectionsModalEl, { backdrop: 'static' });

            await renderYearBadge();
            await loadAllStages();
            await loadLookups();

            const sidFromQuery = $filterSchoolId.val();
            if (sidFromQuery) {
                await loadStagesFor(Number(sidFromQuery));
                await fillBranchUIForSchool(Number(sidFromQuery));
            }

            // CSS بسيط للّفّ (wrap) لبادجات الشُّعب — مع تصحيح white-space
            if (!document.getElementById('grades-badges-wrap-style')) {
                const st = document.createElement('style');
                st.id = 'grades-badges-wrap-style';
                st.textContent = `
                    .badges-wrap { display:flex; flex-wrap:wrap; gap:.25rem .25rem; }
                    .badge-grade { white-space: normal; }
                    #tblYears td.sections-col .badge { white-space: normal; }
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
