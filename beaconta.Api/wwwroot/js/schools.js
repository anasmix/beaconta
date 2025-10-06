
// /js/schools.js
(function () {
    'use strict';
    const $ = jQuery;

    // ============================ الإعدادات العامة ============================
    const API_BASE = '/api/schools';

    // اجلب التوكن من localStorage أو متغير عام
    function getToken() {
        return window.AUTH_TOKEN || localStorage.getItem('token') || '';
    }

    async function apiFetch(path, { method = 'GET', query = null, body = null, headers = {} } = {}) {
        const url = new URL((path.startsWith('http') ? path : (API_BASE + path)), window.location.origin);
        if (query && typeof query === 'object') {
            Object.entries(query).forEach(([k, v]) => {
                if (v !== undefined && v !== null && String(v).trim() !== '') url.searchParams.set(k, v);
            });
        }
        const res = await fetch(url.toString(), {
            method,
            headers: {
                'Accept': 'application/json',
                ...(body ? { 'Content-Type': 'application/json' } : {}),
                ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
                ...headers
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (res.status === 401) {
            await Swal.fire({ icon: 'warning', title: 'غير مخوّل', text: 'انتهت صلاحية الجلسة أو التوكن مفقود.' });
            throw new Error('Unauthorized');
        }
        if (res.status === 204) return null;
        const ct = res.headers.get('content-type') || '';
        const data = ct.includes('application/json') ? await res.json() : await res.text();
        if (!res.ok) {
            const msg = (data && (data.message || data.title || data.error || data)) || res.statusText;
            throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
        return data;
    }

    // ============================ DOM Elements ============================
    const $tbl = $('#tblSchools');
    const $chkAll = $('#chkAll');
    const $txtSearch = $('#txtSearch');
    const $filterStatus = $('#filterStatus');
    const $filterColor = $('#filterColor');
    const $btnReset = $('#btnResetFilters');
    const $btnAdd = $('#btnAddSchool');
    const $btnExport = $('#btnExport');
    const $btnImport = $('#btnImport');
    const $fileImport = $('#fileImport');
    const $btnTemplates = $('#btnTemplates');

    // Modal
    const modal = new bootstrap.Modal('#schoolModal', { backdrop: 'static' });
    const $form = $('#frmSchool');
    const $schoolId = $('#schoolId');
    const $name = $('#name');
    const $code = $('#code');
    const $status = $('#status');
    const $colorHex = $('#colorHex');
    const $branchesCount = $('#branchesCount'); // للعرض فقط بالفرونت
    const $notes = $('#notes');
    const $btnSave = $('#btnSaveSchool');

    // Stats
    const $statTotal = $('#statTotal');
    const $statActive = $('#statActive');
    const $statInactive = $('#statInactive');
    const $statUpdated = $('#statUpdated');

    // Templates modal
    const tplModal = new bootstrap.Modal('#templatesModal', { backdrop: 'static' });
    const $tplSet = $('#tplSet');
    const $btnApplyTemplate = $('#btnApplyTemplate');

    // ============================ Utils ============================
    const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
    function toast(title, icon = 'success') { if (window.Swal) Swal.fire({ toast: true, position: 'top', timer: 1800, showConfirmButton: false, icon, title }); else alert(title); }
    async function confirmSweet(text) { if (!window.Swal) return confirm(text); const r = await Swal.fire({ icon: 'warning', title: 'تأكيد', text, showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'إلغاء' }); return r.isConfirmed; }
    function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) } }
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function fmtStatus(v) {
        return v === 'Active'
            ? `<span class='badge rounded-pill bg-success-subtle text-success badge-status'>نشطة</span>`
            : `<span class='badge rounded-pill bg-secondary-subtle text-secondary badge-status'>غير نشطة</span>`;
    }
    function colorCell(v) { const value = v || '#999999'; return `<span class='color-chip' style='background:${value}'></span> <span class='text-muted'>${value}</span>`; }

    // آخر بيانات محمّلة (للتصدير وإعادة الرسم)
    let LAST_ROWS = [];

    // ============================ DataTable ============================
    let dt;
    function ensureDataTable() {
        if (dt) return dt;
        dt = $tbl.DataTable({
            data: [],
            rowId: 'id',
            responsive: true,
            deferRender: true,
            order: [[1, 'asc']],
            language: { url: "https://cdn.datatables.net/plug-ins/1.13.8/i18n/ar.json" },
            columns: [
                { data: null, className: 'text-center', render: (d, t, row) => `<input type="checkbox" class="row-check" data-id="${row.id}" aria-label="تحديد">` },
                { data: 'name', render: (v, t, row) => `<div class="fw-bold">${esc(v)}</div><div class="small text-muted">${esc(row.notes || '')}</div>` },
                { data: 'code', className: 'text-muted' },
                { data: 'status', render: fmtStatus },
                { data: 'colorHex', render: colorCell, className: 'text-nowrap' },
                { data: 'branchesCount', className: 'text-center' },
                { data: null, orderable: false, searchable: false, render: actionBtns }
            ]
        });

        // events
        $tbl.on('change', '.row-check', onRowCheck);
        $chkAll.on('change', onCheckAll);
        $tbl.on('click', '.btn-action', onRowAction);
        return dt;
    }

    // يتحقق إن كان الكود متاحًا من API
    async function isCodeAvailable(code, currentId) {
        if (!code || !code.trim()) return true;
        try {
            const res = await apiFetch('/check-code', { method: 'GET', query: { code, id: Number(currentId || 0) } });
            return !!res?.available;
        } catch { return true; }
    }

    // يولّد اقتراحًا جديدًا ثم يتأكد من توافره بالتكرار حتى يجد متاحًا
    async function suggestNextAvailableCode(originalCode, currentId) {
        if (!originalCode) return null;

        // 1) لو الكود ينتهي بأرقام، زِد الرقم. وإلا أضف "-2"
        const baseMatch = originalCode.match(/^(.*?)(\d+)$/);
        let base = originalCode, n = 2;
        if (baseMatch) {
            base = baseMatch[1];
            n = parseInt(baseMatch[2], 10) + 1;
        } else if (!/-\d+$/.test(originalCode)) {
            base = originalCode + '-';
        }

        // 2) جرّب لغاية 100 محاولة (كافي جدًا عمليًا)
        for (let i = 0; i < 100; i++) {
            const candidate = `${base}${n}`;
            if (await isCodeAvailable(candidate, currentId)) return candidate;
            n++;
        }
        return null; // improbable
    }

    function renderRows(rows) {
        LAST_ROWS = rows || [];
        const table = ensureDataTable();
        table.clear().rows.add(LAST_ROWS).draw(false);
        $statUpdated.text(new Date().toLocaleString('ar-EG'));
        // لا نعيد حساب إجمالي/نشطة/غير نشطة هنا — تُجلب من /stats لتبقى عامة النظام
        clearSelection();
    }

    // ============================ تحميل البيانات ============================
    async function loadRowsFromServer() {
        const q = ($txtSearch.val() || '').trim();
        const status = $filterStatus.val();
        const color = $filterColor.val();

        const rows = await apiFetch('', { query: { q, status, color } });
        renderRows(rows);
    }

    async function loadStats() {
        try {
            const s = await apiFetch('/stats');
            $statTotal.text(s.total ?? 0);
            $statActive.text(s.active ?? 0);
            $statInactive.text(s.inactive ?? 0);
        } catch (e) {
            // لو فشل، لا نكسر الصفحة
            console.warn('stats error:', e);
        }
    }

    // ============================ إجراءات الصف ============================
    function actionBtns(row) {
        const isActive = row.status === 'Active';
        return `<div class="btn-group btn-group-sm">
      <button class="btn btn-outline-primary btn-action" data-act="edit" data-id="${row.id}" title="تعديل"><i class="bi bi-pencil-square"></i></button>
      <button class="btn btn-outline-${isActive ? 'warning' : 'success'} btn-action" data-act="toggle" data-id="${row.id}" title="${isActive ? 'تعطيل' : 'تفعيل'}"><i class="bi bi-toggle2-${isActive ? 'off' : 'on'}"></i></button>
      <button class="btn btn-outline-danger btn-action" data-act="delete" data-id="${row.id}" title="حذف"><i class="bi bi-trash3"></i></button>
    </div>`;
    }

    async function onRowAction(e) {
        const $b = $(e.currentTarget); const act = $b.data('act'); const id = Number($b.data('id'));
        if (act === 'edit') return openEdit(id);
        if (act === 'delete') {
            const ok = await confirmSweet('حذف المدرسة؟ لا يمكن التراجع.');
            if (!ok) return;
            try {
                await apiFetch(`/${id}`, { method: 'DELETE' });
                toast('تم الحذف');
                await Promise.all([loadRowsFromServer(), loadStats()]);
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'خطأ', text: String(err.message || err) });
            }
            return;
        }
        if (act === 'toggle') {
            try {
                const curr = await apiFetch(`/${id}`, { method: 'GET' });
                const dto = {
                    id: curr.id,
                    name: curr.name,
                    code: curr.code,
                    status: curr.status === 'Active' ? 'Inactive' : 'Active',
                    colorHex: curr.colorHex,
                    notes: curr.notes
                };
                await apiFetch(`/${id}`, { method: 'PUT', body: dto });
                toast('تم التحديث');
                await Promise.all([loadRowsFromServer(), loadStats()]);
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'خطأ', text: String(err.message || err) });
            }
        }
    }

    // ============================ إنشاء/تعديل ============================
    function buildPalette() {
        const palette = ['#0d6efd', '#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#198754', '#dc3545', '#6c757d', '#64748b'];
        const $wrap = $('#colorPalette').empty().addClass('d-flex flex-wrap gap-2 palette');
        palette.forEach(c => {
            const sw = $(`<div class="sw" title="${c}" style="background:${c}"></div>`);
            sw.on('click', () => $colorHex.val(c));
            $wrap.append(sw);
        });
    }
    function suggestNextCode(code) {
        if (!code) return null;
        const m = code.match(/^(.*?)(\d+)$/
        );
        if (m) {
            const base = m[1];
            const n = parseInt(m[2], 10) + 1;
            return base + n;
        }
        return code + "-2";
    }

    function openCreate() {
        $('#schoolModalTitle').text('مدرسة جديدة'); $form[0].reset(); $form.removeClass('was-validated');
        $schoolId.val(''); $colorHex.val('#0d6efd'); $status.val('Active'); $branchesCount.val(0);
        buildPalette();
        modal.show();
    }
    async function openEdit(id) {
        try {
            const r = await apiFetch(`/${id}`, { method: 'GET' });
            $('#schoolModalTitle').text('تعديل مدرسة'); $form.removeClass('was-validated');
            $schoolId.val(r.id); $name.val(r.name); $code.val(r.code || ''); $status.val(r.status || 'Active'); $colorHex.val(r.colorHex || '#0d6efd'); $branchesCount.val(r.branchesCount || 0); $notes.val(r.notes || '');
            buildPalette();
            modal.show();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'خطأ', text: String(err.message || err) });
        }
    }
    async function saveSchool() {
        const f = $form[0];
        if (!f.checkValidity()) { $form.addClass('was-validated'); return; }

        const idVal = Number($schoolId.val() || 0) || 0;
        const codeVal = ($code.val() || '').trim();
        const dto = {
            id: idVal,
            name: $name.val().trim(),
            code: codeVal,
            status: $status.val(),
            colorHex: $colorHex.val(),
            notes: $notes.val()?.trim() || ''
        };

        try {
            // ===== تحقق مسبق من تفرّد الكود =====
            if (codeVal) {
                const ok = await isCodeAvailable(codeVal, idVal);
                if (!ok) {
                    $code.addClass('is-invalid');
                    let $fb = $code.siblings('.invalid-feedback');
                    if ($fb.length === 0) $fb = $('<div class="invalid-feedback"></div>').insertAfter($code);

                    // اقترح آليًا
                    const suggestion = await suggestNextAvailableCode(codeVal, idVal);
                    if (suggestion) {
                        $fb.html(`الكود "${codeVal}" مستخدم بالفعل. <button type="button" class="btn btn-link p-0 ms-1 small" id="applyCodeSuggestion">استخدم الاقتراح: ${suggestion}</button>`);
                        $('#applyCodeSuggestion').on('click', () => {
                            $code.val(suggestion).removeClass('is-invalid');
                            $fb.text('');
                        });
                    } else {
                        $fb.text(`الكود "${codeVal}" مستخدم بالفعل. الرجاء تغيير القيمة.`);
                    }
                    $code.trigger('focus');
                    return;
                }
            }
            // =====================================

            if (dto.id === 0) {
                await apiFetch('', { method: 'POST', body: dto });
            } else {
                await apiFetch(`/${dto.id}`, { method: 'PUT', body: dto });
            }
            modal.hide();
            toast('تم الحفظ');
            await Promise.all([loadRowsFromServer(), loadStats()]);
        } catch (err) {
            const msg = String(err.message || err);

            // fallback: في حال وصلنا 409 من الخادم
            if (/DUPLICATE_CODE/i.test(msg)) {
                const m = msg.match(/Code '([^']+)'/i);
                const used = m ? m[1] : codeVal;
                $code.addClass('is-invalid');
                let $fb = $code.siblings('.invalid-feedback');
                if ($fb.length === 0) $fb = $('<div class="invalid-feedback"></div>').insertAfter($code);
                const suggestion = await suggestNextAvailableCode(used, idVal);
                if (suggestion) {
                    $fb.html(`الكود "${used}" مستخدم بالفعل. <button type="button" class="btn btn-link p-0 ms-1 small" id="applyCodeSuggestion2">استخدم الاقتراح: ${suggestion}</button>`);
                    $('#applyCodeSuggestion2').on('click', () => { $code.val(suggestion).removeClass('is-invalid'); $fb.text(''); });
                } else {
                    $fb.text(`الكود "${used}" مستخدم بالفعل. الرجاء تغيير القيمة.`);
                }
                $code.trigger('focus');
                return;
            }

            Swal.fire({ icon: 'error', title: 'فشل الحفظ', text: msg });
        }
    }

    // نظافة واجهة: إزالة وسم الخطأ عند الكتابة
    $code.on('input', () => $code.removeClass('is-invalid'));

    // ============================ التحديد والعمليات الجماعية ============================
    let selected = new Set();
    function onRowCheck() { const id = Number($(this).data('id')); this.checked ? selected.add(id) : selected.delete(id); updateBulkToolbar(); }
    function onCheckAll() {
        const checked = this.checked;
        $tbl.find('tbody .row-check').each(function () {
            const id = Number($(this).data('id'));
            if (checked) { selected.add(id); this.checked = true; } else { selected.delete(id); this.checked = false; }
        });
        updateBulkToolbar();
    }
    function updateBulkToolbar() {
        const count = selected.size;
        $('#bulkCount').text(count);
        $('.bulk-toolbar').toggle(count > 0);
        const visible = $tbl.find('tbody .row-check').length;
        $('#chkAll').prop('indeterminate', count > 0 && count < visible);
    }
    function clearSelection() { selected.clear(); updateBulkToolbar(); $('#chkAll').prop('checked', false).prop('indeterminate', false); }

    $('#bulkActivate').on('click', () => bulkOpStatus('Active'));
    $('#bulkDeactivate').on('click', () => bulkOpStatus('Inactive'));
    $('#bulkDelete').on('click', async () => {
        const ok = await confirmSweet('سيتم حذف العناصر المحددة، هل أنت متأكد؟');
        if (!ok) return;
        await bulkDelete();
    });

    async function bulkOpStatus(targetStatus) {
        if (selected.size === 0) return;
        try {
            // نحافظ على رتم لطيف على السيرفر
            for (const id of selected) {
                const curr = await apiFetch(`/${id}`, { method: 'GET' });
                if (!curr) continue;
                if (curr.status !== targetStatus) {
                    const dto = { id: curr.id, name: curr.name, code: curr.code, status: targetStatus, colorHex: curr.colorHex, notes: curr.notes };
                    await apiFetch(`/${id}`, { method: 'PUT', body: dto });
                    await sleep(50);
                }
            }
            toast('تم التحديث');
            await Promise.all([loadRowsFromServer(), loadStats()]);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'خطأ', text: String(err.message || err) });
        } finally {
            clearSelection();
        }
    }

    async function bulkDelete() {
        if (selected.size === 0) return;
        try {
            for (const id of selected) {
                await apiFetch(`/${id}`, { method: 'DELETE' });
                await sleep(50);
            }
            toast('تم الحذف');
            await Promise.all([loadRowsFromServer(), loadStats()]);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'خطأ', text: String(err.message || err) });
        } finally {
            clearSelection();
        }
    }

    // ============================ التصدير/الاستيراد ============================
    $btnExport.on('click', exportCsv);
    $btnImport.on('click', () => $fileImport.trigger('click'));
    $fileImport.on('change', onImportCsv);

    function exportCsv() {
        const rows = LAST_ROWS || [];
        const head = ['Name', 'Code', 'Status', 'Color', 'Branches', 'Notes'];
        const lines = [head.join(',')];
        const escCsv = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
        rows.forEach(r => lines.push([
            r.name, r.code || '', r.status, r.colorHex, r.branchesCount || 0, r.notes || ''
        ].map(escCsv).join(',')));
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'schools.csv'; a.click(); URL.revokeObjectURL(a.href);
    }

    async function onImportCsv(ev) {
        const file = ev.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const text = String(reader.result || '').trim();
                const lines = text.split(/\r?\n/).filter(Boolean);
                if (!lines.length) return;
                const header = lines.shift().split(',').map(h => h.trim().toLowerCase());
                // Expect: Name,Code,Status,Color,Branches,Notes
                const idx = (k) => header.indexOf(k);
                const iName = idx('name'), iCode = idx('code'), iStatus = idx('status'), iColor = idx('color'), iBranches = idx('branches'), iNotes = idx('notes');

                // نعمل إدخالات متتالية لتجنّب ضغط السيرفر
                for (const line of lines) {
                    const parts = parseCsvLine(line);
                    const dto = {
                        id: 0,
                        name: parts[iName] || '',
                        code: parts[iCode] || '',
                        status: parts[iStatus] || 'Active',
                        colorHex: parts[iColor] || '#0d6efd',
                        notes: parts[iNotes] || ''
                        // branchesCount ليس ضمن DTO الباك-إند (يُحسب من الفروع)
                    };
                    if (dto.name.trim()) {
                        await apiFetch('', { method: 'POST', body: dto });
                        await sleep(40);
                    }
                }
                toast('تم الاستيراد');
                await Promise.all([loadRowsFromServer(), loadStats()]);
            } catch (e) {
                console.error(e);
                Swal.fire({ icon: 'error', title: 'تعذر استيراد الملف', text: String(e.message || e) });
            } finally {
                $fileImport.val('');
            }
        };
        reader.readAsText(file, 'utf-8');
    }

    function parseCsvLine(line) {
        const out = [], re = /(?!\s*$)\s*(?:"([^"]*(?:""[^"]*)*)"|([^,]*))\s*(?:,|$)/g;
        line.replace(re, (m, quoted, plain) => { out.push(quoted ? quoted.replace(/""/g, '"') : plain); return ''; });
        return out;
    }

    // ============================ القوالب ============================
    const TEMPLATE_SETS = [
        {
            id: 'intl-basic', name: 'مجموعة دولية (أزرق/أخضر/بنفسجي/برتقالي)', items: [
                { name: 'مدارس أفق الدولية', code: 'OFQ', color: '#0ea5e9', status: 'Active', branches: 2 },
                { name: 'مدارس الريادة العالمية', code: 'RDA', color: '#10b981', status: 'Active', branches: 1 },
                { name: 'مدرسة النخبة', code: 'NKB', color: '#8b5cf6', status: 'Active', branches: 3 },
                { name: 'مدرسة البيان', code: 'BYN', color: '#f59e0b', status: 'Active', branches: 1 },
            ]
        },
        {
            id: 'local-plus', name: 'مجموعة محلية +', items: [
                { name: 'مدرسة الفجر', code: 'FJR', color: '#0d6efd', status: 'Active', branches: 1 },
                { name: 'مدارس الوفاق', code: 'WFK', color: '#198754', status: 'Inactive', branches: 1 },
                { name: 'مدرسة الندى', code: 'NDH', color: '#dc3545', status: 'Active', branches: 2 },
            ]
        },
    ];

    $btnTemplates.on('click', openTemplates);
    $btnApplyTemplate.on('click', applyTemplate);

    function openTemplates() {
        $tplSet.empty(); TEMPLATE_SETS.forEach(t => $tplSet.append(new Option(t.name, t.id)));
        try { $tplSet.select2('destroy'); } catch (e) { }
        $tplSet.select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#templatesModal') });
        tplModal.show();
    }
    async function applyTemplate() {
        const setId = $tplSet.val(); if (!setId) return;
        const set = TEMPLATE_SETS.find(t => t.id === setId); if (!set) return;
        try {
            for (const it of set.items) {
                const dto = { id: 0, name: it.name, code: it.code, status: it.status, colorHex: it.color, notes: 'أُنشئت من قالب' };
                await apiFetch('', { method: 'POST', body: dto });
                await sleep(40);
            }
            tplModal.hide(); toast('تم إنشاء مدارس من القالب');
            await Promise.all([loadRowsFromServer(), loadStats()]);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'خطأ', text: String(err.message || err) });
        }
    }

    // ============================ ربط الأحداث العامة ============================
    $btnAdd.on('click', openCreate);
    $btnSave.on('click', saveSchool);
    $form.on('submit', function (e) { e.preventDefault(); if (this.checkValidity()) saveSchool(); else $form.addClass('was-validated'); });

    $txtSearch.on('input', debounce(loadRowsFromServer, 250));
    $filterStatus.on('change', loadRowsFromServer);
    $filterColor.on('change', loadRowsFromServer);
    $btnReset.on('click', () => { $txtSearch.val(''); $filterStatus.val(''); $filterColor.val(''); loadRowsFromServer(); });

    // ============================ الإقلاع ============================
    $(async function () {
        ensureDataTable();
        // لوحة الألوان تُبنى عند فتح المودال
        await Promise.all([loadStats(), loadRowsFromServer()]);
    });

})();


//// =========================
//// Schools screen logic — FINAL (client-fetch DT + inline edit + bulk)
//// =========================
//$(async function () {
//    'use strict';

//    const PERMS = {
//        view: 'schools.view',
//        create: 'schools.create',
//        update: 'schools.update',
//        delete: 'schools.delete',
//        export: 'schools.export'
//    };

//    if (window.Authorize?.load) { try { await Authorize.load(); } catch (e) { console.warn('Authorize.load failed', e); } }

//    let dt, cache = [];
//    const $tbl = $("#tblSchools");
//    const modal = new bootstrap.Modal($("#schoolModal")[0]);

//    const applyAuth = (root = document) => window.Authorize?.applyWithin?.(root);
//    const ensurePerm = (k) => (window.Authorize?.has?.(k) ?? true) || (window.Utils?.toastError?.('ليست لديك صلاحية'), false);
//    const esc = (s) => (window.utils?.escapeHtml?.(s) ?? String(s ?? "").replace(/[&<>\"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])));

//    const statusPill = s => {
//        const on = String(s).toLowerCase() === "active";
//        return `<span class="badge badge-status bg-${on ? "success" : "secondary"}">${on ? "نشطة" : "غير نشطة"}</span>`;
//    };
//    const colorChip = hex => `<span class="color-chip" style="background:${hex || "#0000"}"></span>`;

//    // شريط الإجراءات الجماعية (إن لم يوجد)
//    (function injectBulkBar() {
//        if (document.getElementById('bulkToolbar')) return;
//        const bar = document.createElement('div');
//        bar.id = "bulkToolbar"; bar.className = "d-flex gap-2 mt-3 bulk-toolbar";
//        bar.innerHTML = `
//      <span class="badge bg-info-subtle text-info-emphasis px-3">المحدد: <b id="bulkCount">0</b></span>
//      <button id="bulkActivate" class="btn btn-sm btn-outline-success" data-perm="${PERMS.update}">
//        <i class="bi bi-toggle2-on me-1"></i>تفعيل
//      </button>
//      <button id="bulkDeactivate" class="btn btn-sm btn-outline-warning" data-perm="${PERMS.update}">
//        <i class="bi bi-toggle2-off me-1"></i>تعطيل
//      </button>
//      <button id="bulkDelete" class="btn btn-sm btn-outline-danger" data-perm="${PERMS.delete}">
//        <i class="bi bi-trash3 me-1"></i>حذف
//      </button>`;
//        document.querySelector('.toolbar-card')?.appendChild(bar);
//    })();

//    // إصلاح الهيدر: عمود التحديد
//    function ensureSelectHeader() {
//        const $tr = $("#tblSchools thead tr"); if ($tr.length === 0) return;
//        const already = $tr.find("#chkAll").length > 0;
//        if (!already) {
//            $tr.prepend('<th class="text-center" style="width:40px;"><input type="checkbox" id="chkAll" aria-label="select-all"></th>');
//        }
//    }

//    // فلاتر
//    function buildQuery() {
//        const p = new URLSearchParams();
//        const q = $("#txtSearch").val()?.trim();
//        const st = $("#filterStatus").val();
//        const fc = $("#filterColor").val();
//        if (q) p.set("q", q);
//        if (st) p.set("status", st);
//        if (fc) p.set("color", fc);
//        return p;
//    }
//    function applyClientFilters(rows) {
//        const p = buildQuery();
//        let out = rows.slice();
//        const q = p.get('q'); if (q) {
//            const qq = q.toLowerCase();
//            out = out.filter(r => (r.name || '').toLowerCase().includes(qq) || (r.code || '').toLowerCase().includes(qq));
//        }
//        const st = p.get('status'); if (st) {
//            out = out.filter(r => String(r.status) === st);
//        }
//        const fc = p.get('color'); if (fc) {
//            out = out.filter(r => {
//                const c = (r.colorHex || '').toLowerCase();
//                if (!c) return false;
//                if (fc === 'other') return !['#0d6efd', '#198754', '#dc3545'].includes(c); // مثال بسيط
//                if (fc === 'blue') return c === '#0d6efd';
//                if (fc === 'green') return c === '#198754';
//                if (fc === 'red') return c === '#dc3545';
//                return true;
//            });
//        }
//        return out;
//    }

//    async function fetchSchools() {
//        // ⚠️ بدال ajax DataTables: استخدم Api.get ليضمن Authorization
//        const rows = await Api.get("/schools");
//        cache = Array.isArray(rows) ? rows : [];
//        return applyClientFilters(cache);
//    }

//    async function tblReload() {
//        const data = await fetchSchools();
//        if (!dt) {
//            await loadTable(data);
//        } else {
//            dt.clear().rows.add(data).draw(false);
//            applyAuth(document.getElementById('tblSchools'));
//        }
//    }

//    async function loadTable(initialData) {
//        ensureSelectHeader();

//        dt = $("#tblSchools").DataTable({
//            data: initialData || [],
//            order: [[1, "asc"]],
//            responsive: true,
//            dom: "Bfrtip",
//            buttons: [
//                { extend: "excelHtml5", text: "تصدير Excel", title: "Schools" },
//                { extend: "copyHtml5", text: "نسخ" },
//                { extend: "print", text: "طباعة" }
//            ],
//            columns: [
//                {
//                    data: "id",
//                    title: $("#tblSchools thead th").first().html(),
//                    className: "text-center",
//                    orderable: false,
//                    render: id => `<input type="checkbox" class="row-check" data-id="${id}" aria-label="select">`
//                },
//                { data: "name", title: "المدرسة", render: v => `<strong>${esc(v)}</strong>` },
//                { data: "code", title: "الكود", className: "inline-editable", render: v => esc(v ?? "—") },
//                { data: "status", title: "الحالة", className: "inline-editable", render: statusPill },
//                { data: "colorHex", title: "اللون", className: "inline-editable", render: colorChip },
//                { data: "branchesCount", title: "عدد الفروع", defaultContent: "0", className: "text-center" },
//                {
//                    data: null, title: "إجراءات", orderable: false, searchable: false,
//                    render: (row) => `
//            <div class="d-flex gap-1 flex-wrap">
//              <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${row.id}" data-perm="${PERMS.update}">
//                <i class="bi bi-pencil-square me-1"></i>تعديل
//              </button>
//              <button class="btn btn-sm btn-outline-danger btn-del" data-id="${row.id}" data-perm="${PERMS.delete}">
//                <i class="bi bi-trash me-1"></i>حذف
//              </button>
//            </div>`
//                }
//            ]
//        });

//        // أحداث الجدول
//        $tbl.on("click", ".btn-edit", onEdit);
//        $tbl.on("click", ".btn-del", onDelete);

//        $tbl.on("change", "#chkAll", function () {
//            $(".row-check").prop("checked", this.checked).trigger("change");
//        });
//        $tbl.on("change", ".row-check", function () {
//            const n = $(".row-check:checked").length;
//            $("#bulkCount").text(n);
//            $("#bulkToolbar").toggleClass("bulk-toolbar", n === 0);
//            applyAuth(document.getElementById('bulkToolbar'));
//        });

//        // inline edit
//        $tbl.on("click", "td.inline-editable", function () {
//            const cell = dt.cell(this);
//            const rowData = dt.row(this.closest("tr")).data();
//            const colIdx = cell.index().column; // 2=code, 3=status, 4=colorHex
//            if (colIdx === 2) inlineEditText(cell, rowData, "code");
//            else if (colIdx === 3) inlineEditStatus(cell, rowData, "status");
//            else if (colIdx === 4) inlineEditColor(cell, rowData, "colorHex");
//        });

//        dt.on('draw', () => applyAuth(document.getElementById('tblSchools')));

//        $("#btnExport").on("click", () => { if (ensurePerm(PERMS.export)) dt?.button(0).trigger(); });

//        // أول إحصاءات
//        loadStats();
//    }

//    // فلاتر
//    $("#btnResetFilters").on("click", function () {
//        $("#txtSearch").val("");
//        $("#filterStatus").val("");
//        $("#filterColor").val("");
//        tblReload(); loadStats();
//    });
//    $("#txtSearch").on("input", debounce(() => tblReload(), 300));
//    $("#filterStatus,#filterColor").on("change", tblReload);

//    // إحصاءات
//    async function loadStats() {
//        try {
//            const s = await Api.get("/schools/stats");
//            $("#statTotal").text(s?.total ?? 0);
//            $("#statActive").text(s?.active ?? 0);
//            $("#statInactive").text(s?.inactive ?? 0);
//            const d = new Date();
//            $("#statUpdated").text(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
//        } catch (err) { console.warn("loadStats failed", err); }
//    }

//    // إضافة/تعديل
//    $("#btnAddSchool").attr('data-perm', PERMS.create).on("click", () => {
//        if (!ensurePerm(PERMS.create)) return;
//        openUpsert();
//    });

//    async function openUpsert(id = null) {
//        $("#schoolModalTitle").text(id ? "تعديل مدرسة" : "مدرسة جديدة");
//        resetForm("#frmSchool");
//        if (id) {
//            try {
//                const s = await Api.get(`/schools/${id}`);
//                $("#schoolId").val(s.id);
//                $("#name").val(s.name || "");
//                $("#code").val(s.code || "");
//                $("#status").val(s.status || "Active");
//                $("#colorHex").val(s.colorHex || "#0d6efd");
//                $("#notes").val(s.notes || "");
//            } catch (err) {
//                console.error("load school failed", err);
//                return Swal.fire({ icon: "error", title: "تعذر تحميل البيانات" });
//            }
//        } else {
//            $("#status").val("Active");
//            $("#colorHex").val("#0d6efd");
//        }
//        modal.show();
//    }

//    $("#btnSaveSchool").on("click", async function () {
//        const form = document.getElementById("frmSchool");
//        if (!form.checkValidity()) { form.classList.add("was-validated"); return; }

//        const dto = {
//            id: +($("#schoolId").val() || 0),
//            name: $("#name").val()?.trim(),
//            code: $("#code").val()?.trim() || null,
//            status: $("#status").val() || "Active",
//            colorHex: $("#colorHex").val() || null,
//            notes: $("#notes").val()?.trim() || null
//        };

//        try {
//            const saved = dto.id
//                ? await Api.put(`/schools/${dto.id}`, dto)  // PUT /schools/{id}
//                : await Api.post("/schools", dto);          // POST /schools
//            if (saved) {
//                Swal.fire({ icon: "success", title: "تم الحفظ", timer: 1200, showConfirmButton: false });
//                modal.hide();
//                await tblReload();
//                await loadStats();
//            }
//        } catch (err) {
//            console.error("save failed", err);
//            Swal.fire({ icon: "error", title: "فشل الحفظ", text: err?.responseJSON?.message || "حدث خطأ أثناء الحفظ" });
//        }
//    });

//    // إجراءات صف
//    async function onEdit() { if (ensurePerm(PERMS.update)) openUpsert($(this).data("id")); }
//    async function onDelete() {
//        if (!ensurePerm(PERMS.delete)) return;
//        const id = $(this).data("id");
//        const conf = await Swal.fire({
//            icon: "warning", title: "حذف المدرسة", text: "هل أنت متأكد من الحذف؟",
//            showCancelButton: true, confirmButtonText: "حذف", cancelButtonText: "إلغاء"
//        });
//        if (!conf.isConfirmed) return;
//        try {
//            await Api.delete(`/schools/${id}`);
//            Swal.fire({ icon: "success", title: "تم الحذف", timer: 900, showConfirmButton: false });
//            await tblReload();
//            await loadStats();
//        } catch (err) {
//            console.error("delete failed", err);
//            Swal.fire({ icon: "error", title: "تعذر حذف المدرسة", text: err?.responseJSON?.message || "" });
//        }
//    }

//    // إجراءات جماعية
//    $("#bulkActivate").on("click", () => bulkToggle("Active"));
//    $("#bulkDeactivate").on("click", () => bulkToggle("Inactive"));
//    $("#bulkDelete").on("click", bulkDelete);

//    function selectedIds() { return $(".row-check:checked").map((_, el) => +el.dataset.id).get(); }

//    async function bulkToggle(targetStatus) {
//        if (!ensurePerm(PERMS.update)) return;
//        const ids = selectedIds(); if (!ids.length) return;
//        const conf = await Swal.fire({
//            icon: "question", title: targetStatus === "Active" ? "تفعيل المحدد؟" : "تعطيل المحدد؟",
//            showCancelButton: true, confirmButtonText: "تأكيد", cancelButtonText: "إلغاء"
//        });
//        if (!conf.isConfirmed) return;
//        try {
//            await Promise.all(ids.map(id => Api.put(`/schools/${id}`, { id, status: targetStatus })));
//            Swal.fire({ icon: "success", title: "تم التحديث", timer: 900, showConfirmButton: false });
//            await tblReload(); await loadStats();
//            $("#chkAll").prop("checked", false).trigger("change");
//            $(".row-check").prop("checked", false).trigger("change");
//        } catch (err) {
//            console.error("bulk toggle failed", err);
//            Swal.fire({ icon: "error", title: "تعذر الإجراء الجماعي" });
//        }
//    }

//    async function bulkDelete() {
//        if (!ensurePerm(PERMS.delete)) return;
//        const ids = selectedIds(); if (!ids.length) return;
//        const conf = await Swal.fire({
//            icon: "warning", title: "حذف المحدد؟", text: `سيتم حذف ${ids.length} عنصرًا`,
//            showCancelButton: true, confirmButtonText: "حذف", cancelButtonText: "إلغاء"
//        });
//        if (!conf.isConfirmed) return;
//        try {
//            await Promise.all(ids.map(id => Api.delete(`/schools/${id}`)));
//            Swal.fire({ icon: "success", title: "تم الحذف", timer: 900, showConfirmButton: false });
//            await tblReload(); await loadStats();
//            $("#chkAll").prop("checked", false).trigger("change");
//            $(".row-check").prop("checked", false).trigger("change");
//        } catch (err) {
//            console.error("bulk delete failed", err);
//            Swal.fire({ icon: "error", title: "تعذر الحذف الجماعي" });
//        }
//    }

//    // Inline Edits
//    async function inlineEditText(cell, row, field) {
//        if (!ensurePerm(PERMS.update)) return;
//        const old = row[field] ?? "";
//        const $td = $(cell.node());
//        $td.off("click"); $td.html(`<input type="text" class="form-control form-control-sm" value="${esc(old)}">`);
//        const $inp = $td.find("input");
//        $inp.trigger("focus").on("keydown blur", async (e) => {
//            if (e.type === "keydown" && !["Enter", "Escape"].includes(e.key)) return;
//            const cancel = e.key === "Escape";
//            const val = cancel ? old : ($inp.val() || "").trim();
//            try { if (!cancel && val !== old) await Api.put(`/schools/${row.id}`, { id: row.id, [field]: val }); }
//            catch (err) { console.error("inline update failed", err); Swal.fire({ icon: "error", title: "تعذر التعديل" }); }
//            await tblReload();
//        });
//    }
//    async function inlineEditStatus(cell, row, field) {
//        if (!ensurePerm(PERMS.update)) return;
//        const old = row[field] ?? "Active";
//        const $td = $(cell.node());
//        $td.off("click");
//        $td.html(`
//      <select class="form-select form-select-sm">
//        <option value="Active" ${old === "Active" ? "selected" : ""}>نشطة</option>
//        <option value="Inactive" ${old === "Inactive" ? "selected" : ""}>غير نشطة</option>
//      </select>`);
//        const $sel = $td.find("select");
//        $sel.trigger("focus").on("change blur", async () => {
//            const val = $sel.val();
//            try { if (val !== old) await Api.put(`/schools/${row.id}`, { id: row.id, [field]: val }); }
//            catch (err) { console.error("inline update failed", err); Swal.fire({ icon: "error", title: "تعذر التعديل" }); }
//            await tblReload();
//        });
//    }
//    async function inlineEditColor(cell, row, field) {
//        if (!ensurePerm(PERMS.update)) return;
//        const old = row[field] ?? "#0d6efd";
//        const $td = $(cell.node());
//        $td.off("click"); $td.html(`<input type="color" class="form-control form-control-color form-control-sm" value="${old}">`);
//        const $inp = $td.find("input");
//        $inp.trigger("focus").on("change blur", async () => {
//            const val = $inp.val();
//            try { if (val !== old) await Api.put(`/schools/${row.id}`, { id: row.id, [field]: val }); }
//            catch (err) { console.error("inline update failed", err); Swal.fire({ icon: "error", title: "تعذر التعديل" }); }
//            await tblReload();
//        });
//    }

//    // Utils
//    function resetForm(sel) { return window.forms?.resetForm?.(sel) || $(sel)[0].reset(); }
//    function debounce(fn, ms = 300) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }

//    // Init
//    applyAuth(document);
//    await tblReload();
//    $("#btnAddSchool").attr('data-perm', PERMS.create);
//    $("#btnExport").attr('data-perm', PERMS.export);
//    applyAuth(document);
//});
