// /js/subjects-curricula.js — نسخة موحّدة وفق النمط المعتمد (fees-link-style)
(function () {
    'use strict';

    const $ = jQuery;

    // ===== Utils (fallback آمن) =====
    const U = (function () {
        if (window.Utils) return window.Utils;
        console.warn('[subjects-curricula] Utils fallback is active.');
        return {
            useLatinDigits: () => { /* no-op */ },
            toLatinDigits: (s) => String(s ?? ''),
            escapeHtml: (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])),
            money: (n) => (Number(n || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            int: (n) => Number(n || 0).toLocaleString('en-US'),
            dtArabic: () => ({
                sProcessing: "جارٍ المعالجة...",
                sLengthMenu: "أظهر _MENU_ مدخلات",
                sZeroRecords: "لم يُعثر على أية سجلات",
                sInfo: "إظهار _START_ إلى _END_ من أصل _TOTAL_ مدخل",
                sInfoEmpty: "يعرض 0 إلى 0 من أصل 0",
                sInfoFiltered: "(منتقاة من مجموع _MAX_ مُدخل)",
                sSearch: "ابحث:",
                oPaginate: { sFirst: "الأول", sPrevious: "السابق", sNext: "التالي", sLast: "الأخير" }
            }),
            select2($el, placeholder) {
                if ($el && $el.select2) {
                    $el.select2({
                        theme: 'bootstrap-5', width: '100%', dir: 'rtl',
                        placeholder: placeholder || '— اختر —',
                        language: { noResults: () => 'لا توجد نتائج', searching: () => 'جارِ التحميل...' }
                    });
                }
            },
            download(name, blobOrText, mime) {
                const blob = blobOrText instanceof Blob ? blobOrText : new Blob([blobOrText], { type: mime || 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = name;
                document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
            },
            toastOk: (m) => Swal?.fire?.({ icon: 'success', title: 'تم', text: m, timer: 1200, showConfirmButton: false }) ?? alert('تم: ' + m),
            toastErr: (m) => Swal?.fire?.({ icon: 'error', title: 'خطأ', text: m }) ?? alert('خطأ: ' + m),
            confirmDanger: (title, text) => Swal?.fire?.({ icon: 'warning', title, text, showCancelButton: true, confirmButtonText: 'نعم، تابع', cancelButtonText: 'رجوع' })
                ?? Promise.resolve({ isConfirmed: confirm((title || '') + '\n' + (text || '')) })
        };
    })();

    // فعِّل الأرقام اللاتينية بعد DOMReady
    $(function () { U.useLatinDigits(true); });

    // ===== Fallbacks: Api / Tables / Forms =====
    const Api = (function () {
        if (window.Api) return window.Api;
        if (window.API) return window.API; // دعم الاسم القديم
        function ajax(method, url, data) {
            const isJson = method !== 'GET' && data !== undefined;
            const full = url.startsWith('/api') ? url : '/api' + (url.startsWith('/') ? url : '/' + url);
            return $.ajax({
                url: full, method,
                data: isJson ? JSON.stringify(data) : data,
                contentType: isJson ? 'application/json; charset=utf-8' : undefined,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
        }
        return (window.Api = {
            get: (u, q) => ajax('GET', u + (q ? ('?' + new URLSearchParams(q)) : '')),
            post: (u, b) => ajax('POST', u, b),
            put: (u, b) => ajax('PUT', u, b),
            delete: (u) => ajax('DELETE', u)
        });
    })();

    const Tables = (function () {
        if (window.Tables?.make) return window.Tables;
        function safeDT($el, opts) {
            if (typeof $el.DataTable !== 'function') {
                console.warn('[subjects-curricula] jQuery DataTables ليست محمّلة. سيتم استخدام واجهة كاذبة.');
                return {
                    clear() { return this; },
                    rows: { add() { return this; }, data() { return []; } },
                    draw() { return this; },
                    row() { return { data() { return null; } }; }
                };
            }
            return $el.DataTable(Object.assign({
                responsive: true,
                processing: false,
                serverSide: false,
                paging: true,
                searching: true,
                language: U.dtArabic()
            }, opts || {}));
        }
        return (window.Tables = { make: safeDT });
    })();

    // ===== Forms (shim: يكمل أي Forms موجود) =====
    const Forms = (function () {
        const base = window.Forms || {};

        function _reset($form) {
            if (!$form || !$form[0]) return;
            $form[0].reset?.();
            $form.find('input,select,textarea').each(function () {
                const $f = $(this);
                if ($f.is('select')) $f.val(null).trigger('change');
                else $f.val('');
            });
        }

        function _fill($form, obj) {
            if (!$form) return;
            Object.entries(obj || {}).forEach(([k, v]) => {
                const $f = $form.find(`[name="${k}"]`);
                if ($f.length) { $f.val(v); if ($f.is('select')) $f.trigger('change'); }
            });
        }

        function _serialize($form) {
            const o = {};
            if (!$form || !$form[0]) return o;
            new FormData($form[0]).forEach((v, k) => {
                if (o[k] !== undefined) {
                    if (!Array.isArray(o[k])) o[k] = [o[k]];
                    o[k].push(v);
                } else o[k] = v;
            });
            return o;
        }

        // أضف الدوال فقط إذا كانت غير موجودة
        if (typeof base.reset !== 'function') base.reset = _reset;
        if (typeof base.fill !== 'function') base.fill = _fill;
        if (typeof base.serialize !== 'function') base.serialize = _serialize;

        return (window.Forms = base);
    })();

    // ===== DOM =====
    const $selBranch = $('#selBranch');
    const $selYear = $('#selYear');        // Year.Id (PK)
    const $selStage = $('#selStage');
    const $selGrade = $('#selGrade');      // GradeYear.Id (PK)
    const $selSection = $('#selSection');  // SectionYear.Id (PK)
    const $btnReload = $('#btnReload');

    const $tblSubjects = $('#tblSubjects');
    const $tblTemplates = $('#tblTemplates');
    const $tblAssign = $('#tblAssignments');

    const dlgSubject = new bootstrap.Modal('#dlgSubject');
    const dlgTemplate = new bootstrap.Modal('#dlgTemplate');
    const $frmSubject = $('#frmSubject');
    const $frmTemplate = $('#frmTemplate');
    const $tplSubjects = $('#tplSubjects');
    const $tplYear = $('#tplYear');

    const $kpiYears = $('#kpiYears');
    const $kpiStages = $('#kpiStages');
    const $kpiSubjects = $('#kpiSubjects');
    const $kpiTemplates = $('#kpiTemplates');
    const $footerSummary = $('#footerSummary');

    const $selAssignGrade = $('#selAssignGrade');
    const $selAssignTemplate = $('#selAssignTemplate');
    const $btnAssign = $('#btnAssign');

    // Select2
    U.select2($selBranch, 'اختر مدرسة/فرع');
    U.select2($selYear, 'اختر السنة الدراسية');
    U.select2($selStage, 'اختر المرحلة');
    U.select2($selGrade, 'اختر الصف');
    U.select2($selSection, 'اختر الشعبة');
    U.select2($tplSubjects, 'اختر مواد القالب');
    U.select2($tplYear, 'اختر السنة');
    U.select2($selAssignGrade, 'اختر صفاً');
    U.select2($selAssignTemplate, 'اختر قالباً');

    // ===== جداول =====
    let dtSubjects, dtTemplates, dtAssign;

    // ===== Endpoints =====
    const END = {
        schoolsSimple: '/schools?simple=true',
        branches: '/branches',
        branchesBySchool: (schoolId) => `/branches?schoolId=${schoolId || ''}`,
        yearsForBranch: (branchId) => `/school-years${branchId ? `?branchId=${branchId}` : ''}`,
        stages: (schoolId) => `/stages?schoolId=${schoolId || ''}`,
        gradeyears: '/gradeyears',                                     // expects: yearId (PK) + stageId? + schoolId?
        sectionsByGrade: (gradeYearId) => `/gradeyears/${gradeYearId}/sections`, // مطابق للكنترولر
        subjects: '/subjects',
        templates: '/curriculumtemplates',                              // GET yearId?
        tplSubjects: (id) => `/curriculumtemplates/${id}/subjects`,     // GET / POST
        assignments: '/assignments'
    };

    // ===== Helpers =====
    function qp(params) {
        const q = Object.entries(params || {})
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
        return q ? ('?' + q) : '';
    }
    function getYearIdRaw() {
        const v = Number($selYear.val());
        return Number.isFinite(v) ? v : null;
    }

    // ===== حالة عامة =====
    let BRANCH_SCHOOL = {};  // branchId -> schoolId
    let STATE = { templates: [], subjects: [], assignments: [] };

    // ===== تعبئة عنصر select =====
    function fill($sel, arr, keepValue) {
        const prev = keepValue ? $sel.val() : null;
        $sel.empty();
        (arr || []).forEach(x => $sel.append(new Option(x.name, x.id)));
        if (keepValue && prev && $sel.find(`option[value="${prev}"]`).length) $sel.val(prev);
        $sel.trigger('change.select2');
    }

    // =================== Boot ===================
    async function loadBranches() {
        $selBranch.prop('disabled', true).empty();
        const [schools, branches] = await Promise.all([Api.get(END.schoolsSimple), Api.get(END.branches)]);
        BRANCH_SCHOOL = {};
        (branches || []).forEach(b => { if (b?.id) BRANCH_SCHOOL[b.id] = b.schoolId || null; });

        $selBranch.append(new Option('— اختر —', ''));
        (schools || []).forEach(s => $selBranch.append(new Option(`🟦 ${s.name}`, `school:${s.id}`)));
        (branches || []).forEach(b => $selBranch.append(new Option(`- ${b.name}`, b.id)));

        $selBranch.prop('disabled', false).val('').trigger('change');
    }

    async function loadYearsAndStagesForBranch() {
        const branchVal = String($selBranch.val() || '');
        const isBranch = branchVal && !branchVal.startsWith('school:');
        const schoolId = isBranch ? BRANCH_SCHOOL[branchVal] : (branchVal ? Number(branchVal.split(':')[1]) : null);

        // Years
        $selYear.prop('disabled', true).empty();
        const years = await Api.get(END.yearsForBranch(isBranch ? branchVal : '')) || [];
        $selYear.append(new Option('— اختر —', ''));
        years.forEach(y => $selYear.append(new Option(y.name, y.id)));
        const latestYearId = years.map(y => Number(y.id)).filter(Number.isFinite).sort((a, b) => b - a)[0] ?? null;
        if (latestYearId != null) $selYear.val(latestYearId);
        $selYear.prop('disabled', false).trigger('change');
        $kpiYears.text(U.int(years.length));

        // Stages
        $selStage.prop('disabled', true).empty();
        const stages = await Api.get(END.stages(schoolId || '')) || [];
        $selStage.append(new Option('— اختر —', ''));
        stages.forEach(s => $selStage.append(new Option(s.name, s.id)));
        if (stages.length) $selStage.val(stages[0].id);
        $selStage.prop('disabled', false).trigger('change');
        $kpiStages.text(U.int(stages.length));
    }

    // =================== GradeYears / Sections ===================
    async function loadGrades() {
        const yearId = getYearIdRaw();
        const branchVal = String($selBranch.val() || '');
        const isBranch = branchVal && !branchVal.startsWith('school:');
        const schoolId = isBranch ? BRANCH_SCHOOL[branchVal] : (branchVal ? Number(branchVal.split(':')[1]) : null);
        const stageId = Number($selStage.val() || 0) || undefined;

        $selGrade.prop('disabled', true).empty();
        if (!yearId) {
            $selGrade.append(new Option('— اختر —', ''));
            $selGrade.prop('disabled', false).trigger('change');
            return;
        }

        const params = { yearId, stageId, schoolId };
        const list = await Api.get(END.gradeyears + qp(params)) || [];
        const items = list.map(g => ({ id: g.id, name: g.gradeName || g.name || `#${g.id}` }));

        $selGrade.append(new Option('— اختر —', ''));
        items.forEach(x => $selGrade.append(new Option(x.name, x.id)));
        if (items.length) $selGrade.val(items[0].id);
        $selGrade.prop('disabled', false).trigger('change');

        // تبويب الإسناد
        $selAssignGrade.empty();
        items.forEach(x => $selAssignGrade.append(new Option(x.name, x.id)));
        $selAssignGrade.trigger('change');
    }

    async function loadSections(gradeYearId) {
        $selSection.prop('disabled', true).empty();
        $selSection.append(new Option('— اختر —', ''));
        if (!gradeYearId) {
            $selSection.prop('disabled', false).trigger('change');
            return;
        }
        const data = await Api.get(END.sectionsByGrade(gradeYearId)) || [];
        data.forEach(x => $selSection.append(new Option(x.name, x.id)));
        $selSection.prop('disabled', false).trigger('change');
    }

    // يحاول GET /subjects ثم يسقط إلى POST /subjects/search إذا 405
    async function fetchSubjectsCompat(params) {
        try {
            return await Api.get('/subjects', params);            // النمط القديم (GET)
        } catch (err) {
            const status = err?.status || err?.xhr?.status;
            if (status === 405) {
                // النمط الجديد (POST search) - نفس الباراميترات في البودي
                return await Api.post('/subjects/search', params);
            }
            throw err;
        }
    }


    // =================== Subjects CRUD ===================
    async function loadSubjects() {
        const query = {
            yearId: getYearIdRaw() || undefined,
            stageId: $selStage.val() || undefined,
            gradeYearId: $selGrade.val() || undefined
        };

        // 👇 التغيير هنا
        const data = await fetchSubjectsCompat(query);

        if (!dtSubjects) {
            dtSubjects = window.Tables.make($tblSubjects, {
                rowId: 'id',
                language: U.dtArabic(),
                columns: [
                    { title: '#', data: null, render: (d, t, r, meta) => meta.row + 1, width: '32px' },
                    { title: 'الرمز', data: 'code' },
                    { title: 'الاسم', data: 'name' },
                    { title: 'ملاحظات', data: 'note', defaultContent: '—' },
                    {
                        title: '', data: null, orderable: false, className: 'text-center', width: '160px',
                        render: (row) => `
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary btn-edit" data-id="${row.id}" title="تعديل"><i class="bi bi-pencil-square"></i></button>
              <button class="btn btn-outline-danger btn-del" data-id="${row.id}" title="حذف"><i class="bi bi-trash"></i></button>
            </div>`
                    }
                ],
                // 👇 تأكد أن مكتبة window.Tables.make ترجع كائن DataTable (dt)
                data: data || [],
                drawCallback() {
                    $tblSubjects.find('tbody td').each(function () { this.innerHTML = U.toLatinDigits(this.innerHTML); });
                }
            });
            $tblSubjects.on('click', '.btn-edit', onEditSubject);
            $tblSubjects.on('click', '.btn-del', onDeleteSubject);
        } else {
            // إصلاح خطأ clear().rows(...).add is not a function
            dtSubjects.clear();
            if (data && data.length) dtSubjects.rows.add(data);
            dtSubjects.draw();
        }

        STATE.subjects = data || [];
        $kpiSubjects.text(U.int(STATE.subjects.length));
    }

    function getSubjectRowById(id) {
        return dtSubjects ? (dtSubjects.row('#' + id).data() || dtSubjects.rows().data().toArray().find(x => x.id === id)) : null;
    }

    async function onEditSubject(e) {
        const id = Number($(e.currentTarget).data('id'));
        const row = getSubjectRowById(id);
        Forms.reset($frmSubject);
        Forms.fill($frmSubject, { Id: row?.id || 0, Code: row?.code || '', Name: row?.name || '', Note: row?.note || '' });
        dlgSubject.show();
    }

    $('#btnNewSubject').on('click', () => { Forms.reset($frmSubject); $frmSubject.find('[name="Id"]').val(0); dlgSubject.show(); });

    $('#btnSaveSubject').on('click', async () => {
        const payload = Forms.serialize($frmSubject);
        const id = Number(payload.Id || 0);
        try {
            if (id > 0) await Api.put(`/subjects/${id}`, payload);
            else await Api.post('/subjects', payload);
            U.toastOk('تم حفظ المادة.');
            dlgSubject.hide();
            await loadSubjects();
            await refreshAssignSelectors();
        } catch (err) { console.error(err); U.toastErr('تعذر حفظ المادة.'); }
    });

    async function onDeleteSubject(e) {
        const id = Number($(e.currentTarget).data('id'));
        const ok = await U.confirmDanger('حذف مادة', 'هل أنت متأكد من الحذف؟');
        if (!ok.isConfirmed) return;
        try {
            await Api.delete(`/subjects/${id}`);
            U.toastOk('تم الحذف.');
            await loadSubjects();
            await refreshAssignSelectors();
        } catch (err) { console.error(err); U.toastErr('تعذر الحذف.'); }
    }

    // Import/Export CSV (اختياري)
    $('#btnExportSubjects').on('click', async () => {
        const rows = dtSubjects ? dtSubjects.rows().data().toArray() : [];
        const csv = ['Id,Code,Name,Note']
            .concat(rows.map(r => [r.id, r.code, r.name, (r.note || '')].map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')))
            .join('\n');
        U.download('subjects.csv', csv, 'text/csv;charset=utf-8');
    });
    $('#btnImportSubjects').on('click', () => {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.csv,text/csv';
        inp.onchange = async () => {
            const file = inp.files[0]; if (!file) return;
            const text = await file.text(); const lines = text.split(/\r?\n/).filter(x => x.trim());
            lines.shift(); // header
            for (const line of lines) {
                const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
                const [, Code, Name, Note] = cols;
                if (!Name) continue;
                await Api.post('/subjects', { Code, Name, Note });
            }
            U.toastOk('تم الاستيراد.');
            await loadSubjects();
            await refreshAssignSelectors();
        };
        inp.click();
    });

    // =================== Templates CRUD + Mapping ===================
    async function loadTemplates() {
        const templates = await Api.get(END.templates + qp({ yearId: getYearIdRaw() || undefined })) || [];
        const enriched = [];
        for (const t of templates) {
            const subIds = await Api.get(END.tplSubjects(t.id)) || [];
            const yearName = t.yearId ? ($selYear.find(`option[value="${t.yearId}"]`).text() || '—') : '—';
            enriched.push({ ...t, subjectsCount: subIds.length, yearName });
        }

        if (!dtTemplates) {
            dtTemplates = Tables.make($tblTemplates, {
                rowId: 'id',
                language: U.dtArabic(),
                columns: [
                    { title: '#', data: null, render: (d, t, r, meta) => meta.row + 1, width: '32px' },
                    { title: 'الرمز', data: 'templateCode' },
                    { title: 'الاسم', data: 'name' },
                    { title: 'السنة', data: 'yearName', defaultContent: '—' },
                    {
                        title: 'مواد القالب', data: null, className: 'text-center', width: '100px',
                        render: (r) => `<span class="badge bg-secondary-subtle text-secondary border">${r.subjectsCount || 0}</span>`
                    },
                    {
                        title: '', data: null, orderable: false, className: 'text-center', width: '220px',
                        render: (row) => `
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-info btn-map" data-id="${row.id}" title="تعيين مواد"><i class="bi bi-list-check"></i></button>
                <button class="btn btn-outline-primary btn-edit" data-id="${row.id}" title="تعديل"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-outline-danger btn-del" data-id="${row.id}" title="حذف"><i class="bi bi-trash"></i></button>
              </div>`
                    }
                ],
                data: enriched
            });
            $tblTemplates.on('click', '.btn-edit', onEditTemplate);
            $tblTemplates.on('click', '.btn-del', onDeleteTemplate);
            $tblTemplates.on('click', '.btn-map', onMapTemplateSubjects);
        } else {
            // ✅ التصحيح هنا
            dtTemplates.clear().rows.add(enriched).draw();
        }

        STATE.templates = enriched;
        $kpiTemplates.text(U.int(STATE.templates.length));
    }

    function copyYearOptionsIntoTpl() {
        const $src = $selYear; const $dst = $tplYear; $dst.empty();
        $dst.append(new Option('— اختر —', ''));
        $src.find('option').each(function () { if (!this.value) return; $dst.append(new Option($(this).text(), this.value)); });
        $dst.val($src.val()).trigger('change.select2');
    }

    async function fillTplSubjects() {
        const q = { yearId: getYearIdRaw() || undefined, stageId: $selStage.val() || undefined, gradeYearId: $selGrade.val() || undefined };
        const subs = await Api.get(END.subjects + qp(q)) || [];
        $tplSubjects.empty(); subs.forEach(s => $tplSubjects.append(new Option(`${s.name}`, s.id)));
        $tplSubjects.trigger('change.select2');
    }

    $('#btnNewTemplate').on('click', async () => {
        Forms.reset($frmTemplate);
        $frmTemplate.find('[name="Id"]').val(0);
        copyYearOptionsIntoTpl();
        await fillTplSubjects();
        dlgTemplate.show();
    });

    async function onEditTemplate(e) {
        const id = Number($(e.currentTarget).data('id'));
        const row = dtTemplates.row('#' + id).data() || dtTemplates.rows().data().toArray().find(x => x.id === id);
        copyYearOptionsIntoTpl();
        await fillTplSubjects();
        Forms.reset($frmTemplate);
        Forms.fill($frmTemplate, { Id: row.id, TemplateCode: row.templateCode, Name: row.name, YearId: row.yearId });
        const selected = await Api.get(END.tplSubjects(row.id));
        $('#tplSubjects').val((selected || []).map(String)).trigger('change');
        dlgTemplate.show();
    }

    async function onMapTemplateSubjects(e) {
        return onEditTemplate(e);
    }

    $('#btnSaveTemplate').on('click', async () => {
        const payload = Forms.serialize($frmTemplate);
        payload.SubjectIds = $('#tplSubjects').val() || [];
        const id = Number(payload.Id || 0);
        try {
            let savedId = id;
            if (id > 0) {
                await Api.put(`${END.templates}/${id}`, payload);
            } else {
                const saved = await Api.post(END.templates, payload);
                savedId = saved?.id || 0;
            }
            await Api.post(`${END.templates}/${savedId}/subjects`, { subjectIds: (payload.SubjectIds || []).map(Number) });
            U.toastOk('تم حفظ القالب وتعيين مواده.');
            dlgTemplate.hide();
            await loadTemplates();
            await refreshAssignSelectors();
        } catch (err) {
            console.error(err);
            U.toastErr('تعذر حفظ القالب.');
        }
    });

    async function onDeleteTemplate(e) {
        const id = Number($(e.currentTarget).data('id'));
        const ok = await U.confirmDanger('حذف قالب', 'هل أنت متأكد من الحذف؟');
        if (!ok.isConfirmed) return;
        try {
            await Api.delete(`${END.templates}/${id}`);
            U.toastOk('تم الحذف.');
            await loadTemplates();
            await refreshAssignSelectors();
        } catch (err) { console.error(err); U.toastErr('تعذر الحذف.'); }
    }

    // =================== Assignments (GradeYear ↔ Template) ===================
    async function refreshAssignSelectors() {
        const tpls = await Api.get(END.templates + qp({ yearId: getYearIdRaw() || undefined })) || [];
        $selAssignTemplate.empty(); tpls.forEach(t => $selAssignTemplate.append(new Option(`${t.name}`, t.id)));
        $selAssignTemplate.trigger('change.select2');
    }

    async function loadAssignments() {
        const list = await Api.get(END.assignments) || [];
        const grades = await Api.get(END.gradeyears + qp({ yearId: getYearIdRaw() || undefined, stageId: $selStage.val() || undefined })) || [];
        const tpls = await Api.get(END.templates + qp({ yearId: getYearIdRaw() || undefined })) || [];

        const rows = (list || []).map(a => ({
            id: a.id,
            gradeName: grades.find(g => g.id === a.gradeYearId)?.name || grades.find(g => g.id === a.gradeYearId)?.gradeName || a.gradeYearId,
            templateName: tpls.find(t => t.id === a.templateId)?.name || a.templateId
        }));

        if (!dtAssign) {
            dtAssign = Tables.make($tblAssign, {
                rowId: 'id',
                language: U.dtArabic(),
                columns: [
                    { title: '#', data: null, render: (d, t, r, meta) => meta.row + 1, width: '32px' },
                    { title: 'الصف', data: 'gradeName' },
                    { title: 'القالب المعين', data: 'templateName' },
                    {
                        title: '', data: null, orderable: false, className: 'text-center', width: '100px',
                        render: (row) => `<button class="btn btn-sm btn-outline-danger btn-del" data-id="${row.id}" title="إلغاء"><i class="bi bi-trash"></i></button>`
                    }
                ],
                data: rows
            });
            $tblAssign.on('click', '.btn-del', onDeleteAssign);
        } else {
            // ✅ التصحيح هنا
            dtAssign.clear().rows.add(rows).draw();
        }
    }

    async function onDeleteAssign(e) {
        const id = Number($(e.currentTarget).data('id'));
        const ok = await U.confirmDanger('إلغاء إسناد', 'هل تريد إلغاء هذا الإسناد؟'); if (!ok.isConfirmed) return;
        await Api.delete(`${END.assignments}/${id}`); U.toastOk('تم الإلغاء.'); await loadAssignments();
    }

    $btnAssign.on('click', async () => {
        const gid = Number($selAssignGrade.val());
        const tid = Number($selAssignTemplate.val());
        if (!gid || !tid) { U.toastErr('اختر صفاً وقالباً أولاً.'); return; }
        await Api.post(END.assignments, { gradeYearId: gid, templateId: tid });
        U.toastOk('تم الإسناد.');
        await loadAssignments();
    });

    // =================== Reload pipeline + Events ===================
    async function reloadAll() {
        await Promise.all([loadSubjects(), loadTemplates(), loadAssignments()]);
        $footerSummary.text('تم تحديث البيانات.');
    }

    $selBranch.on('change', async function () {
        await loadYearsAndStagesForBranch();
        await loadGrades();
        await loadSections(null);
        await refreshAssignSelectors();
        await reloadAll();
    });
    $selYear.on('change', reloadAll);
    $selStage.on('change', async () => { await loadGrades(); await reloadAll(); });
    $selGrade.on('change', async function () { await loadSections($(this).val()); await reloadAll(); });
    $selSection.on('change', reloadAll);
    $btnReload.on('click', reloadAll);

    $('#btnSave').on('click', () => U.toastOk('لا توجد تغييرات معلّقة حالياً.'));
    $('#btnCancel').on('click', () => location.reload());

    // =================== Init ===================
    $(async function init() {
        try {
            await loadBranches();
            await refreshAssignSelectors();
        } catch (err) {
            console.error(err);
            U.toastErr('تعذر تحميل الفلاتر الأساسية.');
        }
    });
})();
