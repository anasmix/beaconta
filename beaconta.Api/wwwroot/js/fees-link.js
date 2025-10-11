// /js/fees-link.js — ربط الرسوم والمناهج (متصل بالباك-إند)
(function () {
    'use strict';
    const $ = jQuery;
    const U = window.Utils;

    // عناصر DOM
    const $selBranch = $('#selBranch');
    const $selYear = $('#selYear');
    const $selStage = $('#selStage');
    const $selGrade = $('#selGrade');
    const $selSection = $('#selSection');
    const $selCurrTemplate = $('#selCurrTemplate');
    const $selFeeBundle = $('#selFeeBundle');
    const $selSubjects = $('#selSubjects');

    const $tblSubjects = $('#tblSubjects tbody');
    const $tblBundleItems = $('#tblBundleItems tbody');
    const $bundleTotal = $('#bundleTotal');
    const $tblLinks = $('#tblLinks');

    // هذه الصفحة فقط: اعرض الأرقام باللاتيني
    U.useLatinDigits(true);

    // ========= خارطة السنة (UI PK -> قيمة السنة الفعلية) =========
    // ملاحظة: الخلفية لدينا تُرجع yearCode وليس value رقمي، لذا سنعتمد الـ PK افتراضيًا.
    let YEAR_PARAM = {}; // مثال: { 6: 2024, 7: 2025, ... } إن توفر
    function getYearParam() {
        const raw = Number($selYear.val());
        const p = YEAR_PARAM[raw];
        return (p ?? raw);
    }
    function getYearIdRaw() {
        const v = Number($selYear.val());
        return Number.isFinite(v) ? v : null;
    }

    // حالة
    let state = {
        links: [],
        bundles: [],
        currs: [],
        selectedSubjects: [],
        selectedBundleId: null
    };

    // خريطة الفرع → المدرسة
    let BRANCH_SCHOOL = {};

    // DataTable
    let dtLinks = null;

    // ========= أدوات مساعدة =========
    function fill($sel, arr) {
        $sel.empty();
        (arr || []).forEach(x => $sel.append(new Option(x.name, x.id)));
        $sel.trigger('change.select2'); // في حال كان مرتبط بـ select2
    }

    function translateRepeat(r) {
        switch ((r || '').toLowerCase()) {
            case 'once': return 'مرة واحدة';
            case 'monthly': return 'شهري';
            case 'term': return 'فصلي';
            case 'yearly': return 'سنوي';
            default: return r || '—';
        }
    }

    function getSchoolIdFromBranch(branchId) {
        return BRANCH_SCHOOL[branchId] ?? null;
    }

    // تلوين القيم السالبة (تحذير) مع الإبقاء على القيم معروضة
    function colorizeNegatives($root) {
        $root.find('tbody td').each(function () {
            const html = this.innerHTML;
            // استخرج أول رقم محتمل من النص دون المساس بالوسوم
            const txt = $(this).text().replace(/\s+/g, ' ').trim();
            const m = txt.match(/-?\d+([.,]\d+)?/);
            if (!m) return;
            const num = Number(m[0].replace(',', '.'));
            if (Number.isFinite(num) && num < 0) {
                $(this).addClass('text-danger fw-bold').attr('title', 'تحذير: قيمة سالبة');
            }
        });
    }

    // ========= تحميل سنوات/مراحل الفرع =========
    async function loadYearsAndStagesForCurrentBranch() {
        const branches = window._BRANCHES_FULL || [];
        let branchId = Number($selBranch.val());
        if (!branchId && branches?.length) {
            branchId = branches[0].id;
            $selBranch.val(branchId);
        }
        const schoolId =
            branches.find(b => Number(b.id) === Number(branchId))?.schoolId ??
            BRANCH_SCHOOL[branchId] ?? null;

        if (!branchId || !schoolId) {
            console.warn('[loadYearsAndStagesForCurrentBranch] missing branchId/schoolId', { branchId, schoolId });
            window._FEED = { years: [], stages: [] };
            YEAR_PARAM = {};
            return;
        }

        const [years, stages, currentYear] = await Promise.all([
            API.get('/school-years', { branchId }),
            API.get('/stages', { schoolId, branchId }),
            API.get('/school-years/current', { branchId })
        ]);

        YEAR_PARAM = {};
        window._FEED = {
            years: (years || []).map(y => {
                // دعم حقول متعددة محتملة من API قديمة/جديدة
                let apiYearVal =
                    y.year ?? y.value ?? y.yearCode ?? y.code ?? y.calendarYear ?? y.calendar ?? null;
                if (apiYearVal == null) {
                    const m = String(y.name ?? '').match(/\d{4}/);
                    if (m) apiYearVal = Number(m[0]);
                }
                if (y?.id != null && apiYearVal != null && !Number.isNaN(Number(apiYearVal))) {
                    YEAR_PARAM[y.id] = Number(apiYearVal);
                }
                return { id: y.id, name: y.name ?? String(apiYearVal ?? y.id) };
            }),
            stages: (stages || []).map(s => ({ id: s.id, name: s.name }))
        };

        // حدّث القوائم مع الحفاظ على الاختيار إن وُجد
        const prevYear = $selYear.val();
        const prevStage = $selStage.val();

        fill($selYear, window._FEED.years);
        fill($selStage, window._FEED.stages);

        // افتراضي: السنة الحالية من الخادم، وإن لم تتوفر فالأول، وإلا نحافظ على السابق إن كان صالحًا
        const defYearId =
            (currentYear && currentYear.id != null) ? currentYear.id :
                (window._FEED.years?.[0]?.id ?? null);

        if (prevYear && $selYear.find(`option[value="${prevYear}"]`).length) {
            $selYear.val(prevYear);
        } else if (defYearId != null) {
            $selYear.val(defYearId);
        }

        if (prevStage && $selStage.find(`option[value="${prevStage}"]`).length) {
            $selStage.val(prevStage);
        } else if (window._FEED.stages?.length) {
            $selStage.val(window._FEED.stages[0].id);
        }
    }

    // ========= Boot: تحميل ثوابت من الخادم =========
    async function bootState() {
        // الطلبات الأساسية
        try {
            // 1) الفروع أولاً
            const branches = await API.get('/branches');

            // بناء خريطة الفرع → المدرسة
            BRANCH_SCHOOL = {};
            (branches || []).forEach(b => { if (b?.id) BRANCH_SCHOOL[b.id] = b.schoolId || null; });

            // خزّن النسخة الكاملة (فيها schoolName) لاستخدامها في fillSelects
            window._BRANCHES_FULL = branches || [];

            // عيّن الفرع الافتراضي في السلكت قبل أي طلبات أخرى
            $selBranch.empty();
            (branches || []).forEach(b => {
                const label = [b.schoolName, b.name].filter(Boolean).join(' — ');
                $selBranch.append(new Option(label, b.id));
            });
            if (branches?.length) $selBranch.val(branches[0].id);

            // 2) حمّل سنوات/مراحل هذا الفرع فقط
            await loadYearsAndStagesForCurrentBranch();
        } catch (e) {
            console.error('Boot core failed', e);
            window._BRANCHES_FULL = [];
            window._FEED = { years: [], stages: [] };
            YEAR_PARAM = {};
        }

        // الطلبات الثانوية لا تُعطّل الشاشة
        try {
            const yearId = getYearIdRaw(); // ✅ استخدم الـ PK
            const [templates, bundles, feeItems] = await Promise.all([
                API.get('/curricula/templates', { yearId }),
                API.get('/fees/bundles'),
                API.get('/fees/items')
            ]);

            state.currs = templates || [];
            // مخرجات /fees/bundles على شكل: { id, name, items: [{ itemCode, amount, repeat, optional, note }] }
            state.bundles = (bundles || []).map(b => ({
                id: b.id,
                name: b.name,
                items: (b.items || []).map(i => ({
                    itemCode: i.itemCode,
                    amount: i.amount,
                    repeat: i.repeat,
                    optional: i.optional,
                    note: i.note
                }))
            }));

            window._FEE_ITEMS = feeItems || [];
            state.links = [];
        } catch (e) {
            console.warn('Optional feeds failed', e);
            state.currs = [];
            state.bundles = [];
            window._FEE_ITEMS = [];
        }
    }

    // ========= تعبئة القوائم =========
    async function fillSelects() {
        const branches = window._BRANCHES_FULL || [];
        const { years, stages } = window._FEED;

        // حافظ على الاختيارات إن وُجدت
        const prevBranch = $selBranch.val();
        const prevYear = $selYear.val();
        const prevStage = $selStage.val();

        // الفروع: اعرض "المدرسة — الفرع"
        $selBranch.empty();
        branches.forEach(b => {
            const label = [b.schoolName, b.name].filter(Boolean).join(' — ');
            $selBranch.append(new Option(label, b.id));
        });

        // السنوات والمراحل كما كانت
        fill($selYear, years);
        fill($selStage, stages);

        if (prevBranch && $selBranch.find(`option[value="${prevBranch}"]`).length) {
            $selBranch.val(prevBranch);
        } else if (branches?.length) {
            $selBranch.val(branches[0].id);
        }

        if (prevYear && $selYear.find(`option[value="${prevYear}"]`).length) {
            $selYear.val(prevYear);
        } // وإلا فقد ضُبطت مسبقًا في loadYearsAndStagesForCurrentBranch

        if (prevStage && $selStage.find(`option[value="${prevStage}"]`).length) {
            $selStage.val(prevStage);
        } else if (stages?.length) {
            $selStage.val(stages[0].id);
        }

        await rebuildGrades();
        await rebuildSections();

        fill($selCurrTemplate, state.currs);
        fill($selFeeBundle, state.bundles);

        await reloadSubjects();

        // Select2
        $('.select2').select2({ theme: 'bootstrap-5', width: '100%', dir: 'rtl', dropdownAutoWidth: true });
        $('select.form-select-sm').each(function () {
            if (!$(this).data('select2')) $(this).select2({ theme: 'bootstrap-5', width: '100%', dir: 'rtl', minimumResultsForSearch: 8 });
        });

        await reloadLinksFromApi();
    }

    // ========= الصفوف =========
    async function rebuildGrades() {
        const stageId = Number($selStage.val());
        const branchId = Number($selBranch.val());
        const schoolId = getSchoolIdFromBranch(branchId);
        const yearIdRaw = getYearIdRaw(); // PK للسنة

        console.debug('[rebuildGrades] branchId, schoolId, stageId, yearIdRaw =', branchId, schoolId, stageId, yearIdRaw);

        if (!schoolId || !yearIdRaw) {
            fill($selGrade, []);
            fill($selSection, []);
            console.warn('[rebuildGrades] missing schoolId/yearIdRaw -> skip');
            return;
        }

        let grades = [];
        try {
            // المحاولة الأولى مع المرحلة
            grades = await API.get('/grades', { schoolId, yearId: yearIdRaw, stageId }) || [];

            // fallback: حاول بدون stageId لو رجعت فاضية
            if (!grades.length && stageId) {
                console.warn('[rebuildGrades] empty with stageId, retry without stageId');
                grades = await API.get('/grades', { schoolId, yearId: yearIdRaw }) || [];
            }
        } catch (e) {
            console.error('[rebuildGrades] GET /grades failed', e);
            Swal.fire('خطأ', 'تعذر جلب الصفوف من الخادم.', 'error');
            fill($selGrade, []);
            fill($selSection, []);
            return;
        }

        const items = grades.map(g => ({ id: g.id, name: g.gradeName || g.name || `#${g.id}` }));
        fill($selGrade, items);

        if (items.length) {
            $selGrade.val(items[0].id).trigger('change');
        } else {
            fill($selSection, []);
            console.info('[rebuildGrades] لا توجد صفوف مطابقة للفلاتر الحالية.');
            Swal.fire('تنبيه', 'لا توجد صفوف مطابقة للفلاتر الحالية.', 'info');
        }
    }

    async function rebuildSections() {
        const gradeYearId = Number($selGrade.val());
        if (!gradeYearId) { fill($selSection, []); return; }

        try {
            const secs = await API.get(`/grades/${gradeYearId}/sections`);
            const items = (secs || []).map(s => ({ id: s.id, name: s.name }));
            fill($selSection, items);

            if (!items.length) {
                console.info('[rebuildSections] no sections found for gradeYearId=', gradeYearId);
            }
        } catch (e) {
            console.error('[rebuildSections] GET /grades/{id}/sections failed', e);
            const msg = (e && e.status === 403) ? 'غير مصرح — تأكد من سياسة grades.view' : 'تعذر جلب الشعب.';
            Swal.fire('خطأ', msg, 'error');
            fill($selSection, []);
        }
    }

    // ========= المواد =========
    async function reloadSubjects() {
        const branchId = Number($selBranch.val());
        const yearId = getYearIdRaw(); // ✅ PK
        const gradeYearId = Number($selGrade.val());
        const subs = await API.get('/subjects', { branchId, yearId, gradeYearId });
        $selSubjects.empty();
        (subs || []).forEach(s => {
            $selSubjects.append(new Option(`${s.name} (${s.code})`, s.id));
        });
    }

    // ========= جدول المواد المختارة =========
    function refreshSubjectsTable() {
        const ids = ($selSubjects.val() || []).map(Number);
        const rows = [];
        $tblSubjects.empty();
        ids.forEach((id, i) => {
            const opt = $selSubjects.find(`option[value="${id}"]`).text();
            const m = /(.+)\s\((.+)\)$/.exec(opt); // "الاسم (الكود)"
            const name = m ? m[1] : opt;
            const code = m ? m[2] : '';
            rows.push({ id, name, code });
            $tblSubjects.append(`
        <tr>
          <td>${i + 1}</td>
          <td>${U.escapeHtml(name)}</td>
          <td>${U.escapeHtml(code)}</td>
          <td>—</td>
          <td></td>
        </tr>
      `);
        });
        state.selectedSubjects = rows;
        $('#kpiSubjectsCount').text(U.int(rows.length));
        $('#kpiSubjectsSub').text(`${rows.length} مادة مختارة`);
    }

    // ========= جدول عناصر الحزمة =========
    function refreshBundleItemsTable() {
        const bundleId = $selFeeBundle.val();
        state.selectedBundleId = bundleId;
        const bundle = state.bundles.find(b => String(b.id) === String(bundleId));

        $tblBundleItems.empty();
        let sum = 0;
        if (bundle?.items?.length) {
            bundle.items.forEach((it, i) => {
                sum += Number(it.amount) || 0;
                $tblBundleItems.append(`
          <tr>
            <td>${i + 1}</td>
            <td>${U.escapeHtml(it.itemCode)}</td>
            <td>${U.money(it.amount)}</td>
            <td>${translateRepeat(it.repeat)}</td>
            <td>${it.optional ? 'نعم' : 'لا'}</td>
          </tr>
        `);
            });
        }
        $bundleTotal.text(U.money(sum));
        $('#kpiTotal').text(U.money(sum));
        $('#kpiTotalSub').text(bundle ? `إجمالي "${bundle.name}"` : '—');

        // لون القيم السالبة (إن وجدت) بعد إعادة الرسم
        colorizeNegatives($('#tblBundleItems'));
    }

    // ========= تحميل الروابط =========
    async function reloadLinksFromApi() {
        const branchId = Number($selBranch.val());
        const schoolId = getSchoolIdFromBranch(branchId);
        const yearIdRaw = getYearIdRaw(); // PK للسنة
        const stageId = Number($selStage.val());
        const gradeYearId = Number($selGrade.val());
        const sectionYearId = Number($selSection.val());

        if (!schoolId || !yearIdRaw) {
            state.links = [];
            renderLinksTable();
            return;
        }

        // لا ترسل أي فلتر اختياري إلا لو مُختار بالفعل
        const params = { schoolId, yearId: yearIdRaw };
        if (gradeYearId) params.gradeYearId = gradeYearId;
        if (sectionYearId) params.sectionYearId = sectionYearId;
        if (gradeYearId && stageId) params.stageId = stageId;

        try {
            const list = await API.get('/feeslinks', params);
            state.links = (list || []).map(l => ({
                id: l.id,
                subjectName: l.subjectName,
                levelText: [l.schoolName, l.branchName, l.yearName, l.stageName, l.gradeYearName, l.sectionName].filter(Boolean).join(' / '),
                bundleName: l.bundleName,
                itemsCount: l.itemsCount ?? 0,
                total: l.total ?? 0,
                effective: l.effectiveFrom ?? '—',
                status: l.status || 'Draft'
            }));
        } catch (e) {
            console.error('Error: GET /feeslinks ->', e);
            if (e && (e.status === 403 || e.status === 500)) {
                Swal.fire('تنبيه', 'تعذر تحميل الروابط (تحقق من سياسات التفويض fees.links.view).', 'info');
            }
            state.links = [];
        }
        renderLinksTable();
    }

    function renderLinksTable() {
        if (!dtLinks) return;
        dtLinks.clear().rows.add(state.links).draw();
        $('#kpiLinksCount').text(U.int(state.links.length));
        $('#kpiLinksSub').text(state.links.length ? 'روابط جاهزة' : '—');

        // لون القيم السالبة (لو وجود عمود إجمالي سالب لسبب ما)
        colorizeNegatives($(dtLinks.table().container()));
    }

    // ========= DataTable الروابط =========
    function ensureLinksTable() {
        if (dtLinks) return;
        dtLinks = $tblLinks.DataTable({
            data: [],
            columns: [
                { data: 'id', title: 'المعرف' },
                { data: 'subjectName', title: 'المادة' },
                { data: 'levelText', title: 'المستوى' },
                { data: 'bundleName', title: 'حزمة الرسوم' },
                { data: 'itemsCount', title: 'عدد البنود' },
                { data: 'total', title: 'الإجمالي', render: v => `<b>${U.money(v)}</b>` },
                { data: 'effective', title: 'السريان' },
                {
                    data: 'status', title: 'الحالة',
                    render: v => {
                        const map = { Draft: 'ث/مسودة', Active: 'فعال', Inactive: 'موقوف' };
                        const cls = v === 'Active' ? 'success' : (v === 'Draft' ? 'secondary' : 'warning');
                        return `<span class="badge text-bg-${cls}">${map[v] || v}</span>`;
                    }
                },
                {
                    data: null, title: 'عمليات', orderable: false, render: () => `
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary act-edit" title="تعديل"><i class="bi bi-pencil-square"></i></button>
              <button class="btn btn-outline-danger act-del" title="حذف"><i class="bi bi-trash"></i></button>
            </div>
          `
                }
            ],
            order: [[0, 'desc']],
            responsive: true,
            language: U.dtArabic(),
            drawCallback: function () {
                const fix = (el) => { if (el) el.textContent = U.toLatinDigits(el.textContent); };
                fix(document.querySelector('.dataTables_info'));
                document.querySelectorAll('.dataTables_paginate a, .dataTables_paginate span').forEach(fix);

                // مهم: لا نستبدل textContent للخلايا حتى لا نمسح الوسوم، نعالج الـ HTML نفسه
                $tblLinks.find('tbody td').each(function () {
                    this.innerHTML = U.toLatinDigits(this.innerHTML);
                });

                // تلوين القيم السالبة
                colorizeNegatives($(dtLinks.table().container()));
            }
        });

        // حذف رابط
        $tblLinks.on('click', '.act-del', function () {
            const row = dtLinks.row($(this).closest('tr'));
            const data = row.data();
            Swal.fire({
                icon: 'warning',
                title: 'حذف الرابط',
                text: `هل تريد حذف رابط "${U.escapeHtml(data.subjectName)}"؟`,
                showCancelButton: true,
                confirmButtonText: 'نعم، حذف',
                cancelButtonText: 'إلغاء'
            }).then(async res => {
                if (!res.isConfirmed) return;
                try {
                    await API.del(`/feeslinks/${data.id}`);
                    await reloadLinksFromApi();
                    refreshKpis();
                } catch (e) { console.error(e); Swal.fire('خطأ', 'تعذر الحذف.', 'error'); }
            });
        });

        // تعديل سريع
        $tblLinks.on('click', '.act-edit', async function () {
            const data = dtLinks.row($(this).closest('tr')).data();
            const { value: result } = await Swal.fire({
                icon: 'info',
                title: 'تحرير سريع',
                html: `
          <div class="text-start">
            <div class="mb-2">المادة: <b>${U.escapeHtml(data.subjectName)}</b></div>
            <div class="mb-2">الحزمة: <b>${U.escapeHtml(data.bundleName)}</b></div>
            <div class="mb-2">الحالة الحالية: <b>${U.escapeHtml(data.status)}</b></div>
            <label class="form-label">الحالة</label>
            <select id="swStatus" class="form-select mb-2">
              <option value="Draft" ${data.status === 'Draft' ? 'selected' : ''}>مسودة</option>
              <option value="Active" ${data.status === 'Active' ? 'selected' : ''}>فعال</option>
              <option value="Inactive" ${data.status === 'Inactive' ? 'selected' : ''}>موقوف</option>
            </select>
            <label class="form-label">سريان من</label>
            <input id="swEff" type="date" class="form-control" value="${(data.effective || '').slice(0, 10)}"/>
          </div>
        `,
                showCancelButton: true,
                confirmButtonText: 'حفظ',
                cancelButtonText: 'إغلاق',
                preConfirm: () => ({ status: $('#swStatus').val(), effectiveFrom: $('#swEff').val() || null })
            });
            if (!result) return;
            try {
                await API.put(`/feeslinks/${data.id}`, result);
                await reloadLinksFromApi();
                refreshKpis();
            } catch (e) { console.error(e); Swal.fire('خطأ', 'تعذر الحفظ.', 'error'); }
        });
    }

    async function reloadLinksTableAndKpis() {
        await reloadLinksFromApi();
        refreshKpis();
    }

    function refreshKpis() {
        $('#kpiLinksCount').text(U.int(state.links.length));
        $('#kpiLinksSub').text(state.links.length ? 'روابط جاهزة للنشر/التعديل' : '—');

        const bundle = state.bundles.find(b => String(b.id) === String($selFeeBundle.val()));
        const sum = (bundle?.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
        $('#kpiTotal').text(U.money(sum));
        $('#kpiTotalSub').text(bundle ? `إجمالي "${bundle.name}"` : '—');
    }

    async function assignBundleToSelectedSubjects() {
        const bundle = state.bundles.find(b => String(b.id) === String($selFeeBundle.val()));
        if (!bundle) { Swal.fire('لا توجد حزمة', 'اختر حزمة رسوم أولاً', 'info'); return; }

        const subjectIds = ($selSubjects.val() || []).map(Number);
        if (!subjectIds.length) { Swal.fire('لا توجد مواد', 'اختر مادة أو أكثر', 'info'); return; }

        const branchId = Number($selBranch.val());
        const schoolId = getSchoolIdFromBranch(branchId);
        const stageId = Number($selStage.val());
        const gradeYearId = Number($selGrade.val());
        const sectionYearId = Number($selSection.val());
        if (!schoolId || !getYearIdRaw() || !gradeYearId || !sectionYearId) {
            Swal.fire('بيانات غير مكتملة', 'حدد الفرع/السنة/الصف/الشعبة', 'info'); return;
        }

        const payload = {
            schoolId, branchId,
            yearId: getYearIdRaw(), // ✅ PK
            stageId, gradeYearId, sectionYearId,
            feeBundleId: bundle.id,
            subjectIds,
            effectiveFrom: $('#dtEffective').val() || null,
            status: $('#selStatus').val() || 'Draft'
        };

        try {
            U.setProgress(35, 'جارٍ إنشاء الروابط...');
            await API.post('/feeslinks/bulk', payload);
            U.setProgress(80, 'تحديث البيانات...');
            await reloadLinksFromApi();
            U.setProgress(100, 'تم');
            Swal.fire('تم', `أُسنِدت "${bundle.name}" إلى ${subjectIds.length} مادة`, 'success');
        } catch (e) {
            console.error(e);
            Swal.fire('خطأ', 'فشل إنشاء الروابط.', 'error');
        } finally {
            setTimeout(() => U.setProgress(0, 'جاهز'), 400);
        }
    }

    // ========= إنشاء حزمة جديدة (اختياري) =========
    function openBundleModal() {
        // تجهيز Select للبنود من الكتالوج
        const $biItem = $('#biItem');
        $biItem.empty();
        (window._FEE_ITEMS || []).forEach(i => $biItem.append(new Option(i.name || i.itemCode || i.code, i.id)));
        if (!$biItem.data('select2')) $biItem.select2({ theme: 'bootstrap-5', width: '100%', dir: 'rtl' });

        const $tbody = $('#tblNewBundleItems tbody').empty();
        $('#bundleSum').text('0.00');
        $('#txtBundleName').val('');
        $('#txtBundleDesc').val('');
        $('#biAmount').val('');
        $('#biNote').val('');
        $('#biRepeat').val('once');
        $('#biOptional').prop('checked', false);

        const tempItems = [];

        function redrawTemp() {
            $tbody.empty();
            let sum = 0;
            tempItems.forEach((it, idx) => {
                const def = (window._FEE_ITEMS || []).find(x => String(x.id) === String(it.itemId));
                const label = def?.name || def?.itemCode || it.itemId;
                sum += Number(it.amount) || 0;
                $tbody.append(`
          <tr data-i="${idx}">
            <td>${idx + 1}</td>
            <td>${U.escapeHtml(label)}</td>
            <td>${U.money(it.amount)}</td>
            <td>${translateRepeat(it.repeat)}</td>
            <td>${it.optional ? 'نعم' : 'لا'}</td>
            <td>${U.escapeHtml(it.note || '')}</td>
            <td><button class="btn btn-sm btn-outline-danger bi-del"><i class="bi bi-x-lg"></i></button></td>
          </tr>
        `);
            });
            $('#bundleSum').text(U.money(sum));

            // تلوين السوالب (لو حدثت)
            colorizeNegatives($('#tblNewBundleItems'));
        }

        $('#btnAddBundleItem').off('click').on('click', function () {
            const itemId = $('#biItem').val();
            const amount = Number($('#biAmount').val());
            const repeat = $('#biRepeat').val();
            const optional = $('#biOptional').is(':checked');
            const note = $('#biNote').val();
            if (!itemId || !amount) { Swal.fire('بيانات ناقصة', 'اختر بندًا وحدد قيمة.', 'info'); return; }
            tempItems.push({ itemId, amount, repeat, optional, note });
            redrawTemp();
            $('#biAmount').val(''); $('#biNote').val(''); $('#biOptional').prop('checked', false);
        });

        $('#tblNewBundleItems').off('click', '.bi-del').on('click', '.bi-del', function () {
            const idx = Number($(this).closest('tr').data('i'));
            tempItems.splice(idx, 1); redrawTemp();
        });

        // حفظ (محلي أو عبر API لو وفّرت POST /api/fees/bundles)
        $('#btnSaveBundle').off('click').on('click', async function () {
            const name = ($('#txtBundleName').val() || '').trim();
            const desc = $('#txtBundleDesc').val() || '';
            if (!name) { Swal.fire('اسم الحزمة مطلوب', 'اكتب اسمًا واضحًا.', 'info'); return; }
            if (!tempItems.length) { Swal.fire('لا توجد بنود', 'أضف بندًا واحدًا على الأقل.', 'info'); return; }

            // بدون POST فعلي للحزم: نخزّنها محليًا فقط لكي تُستخدم فورًا
            const toItems = tempItems.map(x => {
                const def = (window._FEE_ITEMS || []).find(fi => String(fi.id) === String(x.itemId));
                return {
                    itemCode: def?.itemCode || def?.code || String(x.itemId),
                    amount: x.amount, repeat: x.repeat, optional: !!x.optional, note: x.note || ''
                };
            });
            const newBundle = { id: U.uid('B'), name, items: toItems, desc };
            state.bundles.unshift(newBundle);

            $selFeeBundle.append(new Option(newBundle.name, newBundle.id, true, true)).trigger('change');
            bootstrap.Modal.getInstance(document.getElementById('mdlBundle'))?.hide();
            Swal.fire('تم', 'حُفِظت الحزمة محليًا (لا يوجد EndPoint للحفظ).', 'success');
        });

        new bootstrap.Modal('#mdlBundle').show();
    }

    // ========= قوالب المناهج =========
    function openCurrTemplateModal() {
        $('#txtCurrTemplate').val('');
        $('#btnSaveCurrTemplate').off('click').on('click', async function () {
            const name = ($('#txtCurrTemplate').val() || '').trim();
            if (!name) { Swal.fire('الاسم مطلوب', 'اكتب اسم قالب المنهج.', 'info'); return; }
            const yearId = getYearIdRaw(); // ✅ PK
            try {
                await API.post('/curricula/templates', { name, yearId });
                const templates = await API.get('/curricula/templates', { yearId });
                state.currs = templates || [];
                $selCurrTemplate.empty(); fill($selCurrTemplate, state.currs);
                bootstrap.Modal.getInstance(document.getElementById('mdlCurrTemplate'))?.hide();
                Swal.fire('تم', 'تم إنشاء القالب.', 'success');
            } catch (e) { console.error(e); Swal.fire('خطأ', 'تعذر إنشاء القالب.', 'error'); }
        });
        new bootstrap.Modal('#mdlCurrTemplate').show();
    }

    // ========= نشر/تصدير =========
    async function publishNow() {
        if (!state.links.length) {
            Swal.fire('لا توجد روابط', 'أنشئ روابط أولًا قبل النشر.', 'info'); return;
        }
        try {
            U.setProgress(40, 'جارٍ النشر...');
            // (لا يوجد EndPoint نشر مستقل، نعيد التحميل فقط)
            await reloadLinksFromApi();
            U.setProgress(100, 'تم');
            Swal.fire('تم', 'تم تحديث الحالة من الخادم.', 'success');
        } catch (e) { console.error(e); Swal.fire('خطأ', 'تعذر النشر.', 'error'); }
        finally { setTimeout(() => U.setProgress(0, 'جاهز'), 400); }
    }

    function exportJSON() {
        const blob = new Blob([JSON.stringify(state.links, null, 2)], { type: 'application/json;charset=utf-8' });
        U.download('fees-links.json', blob);
    }

    function exportCSV() {
        const header = ['Id', 'Subject', 'Level', 'Bundle', 'ItemsCount', 'Total', 'Effective', 'Status'];
        const rows = [header];
        state.links.forEach(l => {
            rows.push([l.id, l.subjectName, l.levelText, l.bundleName, l.itemsCount, l.total, l.effective, l.status]);
        });
        const csv = U.toCSV(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        U.download('fees-links.csv', blob);
    }

    async function reloadLinksTableAndKpis() {
        await reloadLinksFromApi();
        refreshKpis();
    }

    function refreshKpis() {
        $('#kpiLinksCount').text(U.int(state.links.length));
        $('#kpiLinksSub').text(state.links.length ? 'روابط جاهزة للنشر/التعديل' : '—');

        const bundle = state.bundles.find(b => String(b.id) === String($selFeeBundle.val()));
        const sum = (bundle?.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
        $('#kpiTotal').text(U.money(sum));
        $('#kpiTotalSub').text(bundle ? `إجمالي "${bundle.name}"` : '—');
    }

    // ========= Wizard مبسط =========
    async function runWizard() {
        const bundle = state.bundles.find(b => String(b.id) === String($selFeeBundle.val()));
        const subsCount = state.selectedSubjects.length;

        const progressSteps = ['1', '2', '3'];
        const steps = [
            {
                title: 'التثبّت من المستوى',
                html: `
          <div class="text-start">
            <div>الفرع: <b>${$selBranch.find('option:selected').text()}</b></div>
            <div>السنة: <b>${$selYear.find('option:selected').text()}</b></div>
            <div>المرحلة/الصف/الشعبة:
              <b>${$selStage.find('option:selected').text()} / ${$selGrade.find('option:selected').text()} / ${$selSection.find('option:selected').text()}</b>
            </div>
          </div>
        `
            },
            {
                title: 'الحزمة والمواد',
                html: `
          <div class="text-start">
            <div>الحزمة: <b>${bundle ? bundle.name : '—'}</b></div>
            <div>عدد المواد المختارة: <b>${subsCount}</b></div>
          </div>
        `
            },
            {
                title: 'السريان والحالة',
                html: `
          <div class="text-start">
            <div>سريان من: <b>${$('#dtEffective').val() || '—'}</b></div>
            <div>الحالة: <b>${$('#selStatus option:selected').text()}</b></div>
          </div>
        `
            }
        ];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const res = await Swal.fire({
                icon: 'info',
                ...step,
                showCancelButton: true,
                cancelButtonText: 'إلغاء',
                confirmButtonText: i < steps.length - 1 ? 'التالي' : 'إنهاء',
                reverseButtons: true,
                progressSteps,
                currentProgressStep: i
            });
            if (res.dismiss) return;
        }

        await assignBundleToSelectedSubjects();
    }

    // ========= Bind events =========
    function bindEvents() {
        $selBranch.on('change', async () => {
            await loadYearsAndStagesForCurrentBranch(); // ✅ حمّل سنة/مرحلة الفرع أولاً
            await rebuildGrades();        // 👈 أعد الصفوف وفق المدرسة الجديدة
            await rebuildSections();      // ثم الشعب
            await reloadSubjects();       // ثم المواد
            await reloadLinksTableAndKpis();
        });

        $selYear.on('change', async () => {
            const yearId = getYearIdRaw(); // ✅ استخدم PK
            try { state.currs = await API.get('/curricula/templates', { yearId }) || []; } catch { }
            $selCurrTemplate.empty(); fill($selCurrTemplate, state.currs);
            await reloadSubjects(); await reloadLinksTableAndKpis();
        });

        $selStage.on('change', async () => { await rebuildGrades(); await reloadLinksTableAndKpis(); });
        $selGrade.on('change', async () => { await rebuildSections(); await reloadSubjects(); await reloadLinksTableAndKpis(); });
        $selSection.on('change', reloadLinksTableAndKpis);

        $selSubjects.on('change', refreshSubjectsTable);
        $selFeeBundle.on('change', () => { refreshBundleItemsTable(); refreshKpis(); });

        $('#btnAddSubjects').on('click', assignBundleToSelectedSubjects);
        $('#btnLoadSubjects').on('click', reloadSubjects);

        $('#btnNewBundle').on('click', openBundleModal);
        $('#btnNewCurrTemplate').on('click', openCurrTemplateModal);

        $('#btnSaveDraft').on('click', () => Swal.fire('ملاحظة', 'الحفظ المحلي لاغٍ بعد الربط. البيانات تُقرأ من الخادم.', 'info'));
        $('#btnPublish').on('click', publishNow);
        $('#btnQuickPublish').on('click', publishNow);
        $('#btnExportJson').on('click', exportJSON);
        $('#btnExportCsv').on('click', exportCSV);
        $('#btnReset').on('click', async () => { await reloadLinksFromApi(); refreshKpis(); Swal.fire('تم', 'أُعيد التحميل من الخادم.', 'success'); });

        $('#btnWizard').on('click', runWizard);
    }

    // ========= Init =========
    async function init() {
        await bootState();
        ensureLinksTable();        // 👈 أنشئ الجدول أولاً
        await fillSelects();       // هذا سيجلب البيانات ويعرضها الآن
        refreshSubjectsTable();
        if (state.bundles?.length) $selFeeBundle.val(state.bundles[0].id).trigger('change');
        refreshBundleItemsTable();
        refreshKpis();
        U.setProgress(0, 'جاهز');
    }

    $(init);
    bindEvents();
})();
