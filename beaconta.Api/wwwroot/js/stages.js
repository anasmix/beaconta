// /js/stages.js
// شاشة: إدارة المراحل الدراسية
// المتطلبات: api.js, utils.js, datatable.js, forms.js, authorize.js, loader.js, auth.js

(function () {
    'use strict';

    const BOOT = window.__STAGES_PAGE_BOOTSTRAP__ || {};
    const EP = BOOT.endpoints || {};
    const PERM = BOOT.perms || {};
    const OPTS = (BOOT.options || {});
    const COLS = BOOT.tableColumns || [];

    // عناصر DOM
    const $tbl = $('#tblStages');
    const $chkAll = $('#chkAll');
    const $bulkToolbar = $('#bulkToolbar');
    const $bulkCount = $('#bulkCount');
    const $txtSearch = $('#txtSearch');
    const $filterSchoolId = $('#filterSchoolId');
    const $filterStatus = $('#filterStatus');
    const $btnReset = $('#btnResetFilters');
    const $btnAdd = $('#btnAddStage');
    const $btnExport = $('#btnExport');
    const $btnRefresh = $('#btnRefresh');
    const $btnColVis = $('#btnColVis');
    const $skeleton = $('#tableSkeleton');

    // مودال + حقول
    const modalEl = document.getElementById('stageModal');
    const modal = new bootstrap.Modal(modalEl, { backdrop: 'static' });
    const $form = $('#frmStage');
    const $stageId = $('#stageId');
    const $schoolId = $('#schoolId');
    const $code = $('#code');
    const $name = $('#name');
    const $colorHex = $('#colorHex');
    const $sort = $('#sortOrder');
    const $status = $('#status');
    const $notes = $('#notes');
    const $metaInfo = $('#metaInfo');
    const $btnSave = $('#btnSaveStage');

    // إحصاءات
    const $statTotal = $('#statTotal');
    const $statActive = $('#statActive');
    const $statInactive = $('#statInactive');
    const $statUpdated = $('#statUpdated');

    // حالة داخلية
    let dt;
    let selected = new Set(); // مفاتيح الصفوف المحددة
    let lastFetchAt = null;

    // ========= Helpers =========

    function fmtStatus(v) {
        return v === 'Active'
            ? `<span class='badge rounded-pill bg-success-subtle text-success badge-status'>نشطة</span>`
            : `<span class='badge rounded-pill bg-secondary-subtle text-secondary badge-status'>غير نشطة</span>`;
    }

    function actionsHtml(row) {
        const id = row.id;
        const canUpdate = authorize.has(PERM.update);
        const canDelete = authorize.has(PERM.delete);

        const toggleBtn = canUpdate
            ? (row.status === 'Active'
                ? `<button class="btn btn-outline-secondary btn-sm btn-action" data-act="deactivate" data-id="${id}" title="تعطيل"><i class="bi bi-slash-circle"></i></button>`
                : `<button class="btn btn-outline-success btn-sm btn-action" data-act="activate" data-id="${id}" title="تفعيل"><i class="bi bi-check2-circle"></i></button>`)
            : '';

        return `
      <div class="d-flex gap-1 flex-wrap">
        <button class="btn btn-outline-primary btn-sm btn-action" data-act="edit" data-id="${id}" ${!canUpdate ? 'disabled' : ''} title="تعديل"><i class="bi bi-pencil-square"></i></button>
        ${toggleBtn}
        <button class="btn btn-outline-danger btn-sm btn-action" data-act="delete" data-id="${id}" ${!canDelete ? 'disabled' : ''} title="حذف"><i class="bi bi-trash3"></i></button>
      </div>
    `;
    }

    function rowCheckbox(id) {
        const checked = selected.has(id) ? 'checked' : '';
        return `<input type="checkbox" class="row-check" data-id="${id}" ${checked} aria-label="تحديد">`;
    }

    function colorCell(v) {
        const value = v || '#999999';
        return `<span class='color-chip' style='background:${value}'></span> <span class='text-muted'>${value}</span>`;
    }

    function updateStats(rows) {
        const total = rows.length;
        const active = rows.filter(r => r.status === 'Active').length;
        $statTotal.text(total);
        $statActive.text(active);
        $statInactive.text(total - active);
        lastFetchAt = new Date();
        $statUpdated.text(utils.formatDateTime(lastFetchAt));
    }

    function updateBulkToolbar() {
        const count = selected.size;
        $bulkCount.text(count);
        $bulkToolbar.toggle(count > 0);
        $chkAll.prop('indeterminate', count > 0 && count < dt.rows({ search: 'applied' }).data().length);
    }

    function clearForm() {
        $stageId.val('');
        $schoolId.val(null).trigger('change');
        $code.val('');
        $name.val('');
        $colorHex.val('#0ea5e9');
        $sort.val(0);
        $status.val('Active');
        $notes.val('');
        $metaInfo.attr('hidden', true).text('');
        forms.clearValidation($form[0]);
    }

    function fillForm(row) {
        $stageId.val(row.id);
        $schoolId.val(row.schoolId).trigger('change');
        $code.val(row.code);
        $name.val(row.name);
        $colorHex.val(row.colorHex || '#0ea5e9');
        $sort.val(row.sortOrder ?? 0);
        $status.val(row.status || 'Active');
        $notes.val(row.notes || '');
        if (row.createdAt || row.updatedAt) {
            $metaInfo.removeAttr('hidden').text(
                `أنشئت: ${utils.formatDateTime(row.createdAt)} — آخر تعديل: ${utils.formatDateTime(row.updatedAt)}`
            );
        }
    }

    function buildQuery() {
        const p = new URLSearchParams();
        const schoolId = $filterSchoolId.val();
        const status = $filterStatus.val();
        const q = $txtSearch.val()?.trim();

        if (schoolId) p.set('schoolId', schoolId);
        if (status) p.set('status', status);
        if (q) p.set('q', q);

        return p.toString() ? ('?' + p.toString()) : '';
    }

    function fetchList() {
        $skeleton.show();
        return api.get(EP.list + buildQuery())
            .then(res => {
                // نتوقع مصفوفة عناصر
                const rows = Array.isArray(res) ? res : (res?.items || []);
                updateStats(rows);
                return rows;
            })
            .catch(err => {
                utils.toastError(utils.apiMessage(err, 'تعذر جلب البيانات'));
                return [];
            })
            .finally(() => $skeleton.hide());
    }

    // ========= DataTable =========
    async function initTable() {
        const initialData = await fetchList();

        dt = $tbl.DataTable({
            data: initialData,
            responsive: true,
            deferRender: true,
            order: [[1, 'asc']],
            pageLength: OPTS.pageLength ?? 25,
            stateSave: !!OPTS.saveState,
            language: datatable.arabicRtl(),
            columns: [
                { data: null, className: 'text-center', render: (data, type, row) => rowCheckbox(row.id) },
                {
                    data: 'name', render: (v, t, row) => {
                        const badge = row.schoolName ? `<span class="badge bg-info-subtle text-info ms-2">${utils.escape(row.schoolName)}</span>` : '';
                        return `<div class="fw-bold">${utils.escape(v)}</div><div class="small text-muted">${utils.escape(row.code || '')}</div>${badge}`;
                    }
                },
                { data: 'code', className: 'text-muted' },
                { data: 'schoolName', render: v => utils.escape(v || '—') },
                { data: 'colorHex', render: colorCell, className: 'text-nowrap' },
                { data: 'sortOrder', className: 'text-center' },
                { data: 'status', render: fmtStatus, className: 'text-nowrap' },
                { data: null, render: (d, t, row) => actionsHtml(row) }
            ],
            dom: 'Bfrtip',
            buttons: [
                // أزرار DataTables الافتراضية (يمكن إخفاؤها، نستخدم زر تصدير المخصص)
            ],
            drawCallback: function () {
                // تطبيق التفويض على أزرار الإجراءات داخل الصفوف
                authorize.applyIn($tbl[0]);
            }
        });

        // تحديد صفوف بالنقر مع دعم Shift
        datatable.enableShiftRangeSelection($tbl, '.row-check', (id, checked) => {
            if (checked) selected.add(id); else selected.delete(id);
            updateBulkToolbar();
        });

        // أحداث تحديد الصف/الكل
        $tbl.on('change', '.row-check', function () {
            const id = $(this).data('id');
            this.checked ? selected.add(id) : selected.delete(id);
            updateBulkToolbar();
        });

        $chkAll.on('change', function () {
            const checked = this.checked;
            $tbl.find('tbody .row-check').each((_, el) => {
                const id = $(el).data('id');
                if (checked) { selected.add(id); el.checked = true; } else { selected.delete(id); el.checked = false; }
            });
            updateBulkToolbar();
        });

        // أزرار الإجراءات في الصف
        $tbl.on('click', '.btn-action', onRowAction);

        // التحكم بالأعمدة
        $btnColVis.on('click', () => datatable.columnVisPopover($btnColVis[0], dt));

        // تحديث
        $btnRefresh.on('click', reloadTable);

        // تصدير
        $btnExport.on('click', onExport);

        // فلاتر
        const debouncedSearch = utils.debounce(() => reloadTable(true), 350);
        $txtSearch.on('input', debouncedSearch);
        $filterSchoolId.on('change', () => reloadTable(true));
        $filterStatus.on('change', () => reloadTable(true));
        $btnReset.on('click', resetFilters);

        // إضافة
        $btnAdd.on('click', () => { openCreate(); });

        // حفظ
        $btnSave.on('click', saveForm);

        // تحميل المدارس للفلاتر والمودال
        await populateSchools();

        // تطبيق صلاحيات عامة
        authorize.apply(); // للأزرار العلوية
    }

    async function reloadTable(preserveSelection) {
        const rows = await fetchList();
        dt.clear().rows.add(rows).draw(false);
        if (!preserveSelection) selected.clear();
        updateBulkToolbar();
    }

    // ========= Export =========
    async function onExport() {
        if (!authorize.has(PERM.export)) return;
        try {
            loader.show();
            const q = buildQuery();
            await api.download(EP.export + q, 'stages-export.xlsx');
            utils.toastSuccess('تم توليد ملف الإكسل.');
        } catch (err) {
            utils.toastError(utils.apiMessage(err, 'تعذر التصدير'));
        } finally {
            loader.hide();
        }
    }

    // ========= Row Actions =========
    async function onRowAction(e) {
        const $btn = $(e.currentTarget);
        const act = $btn.data('act');
        const id = $btn.data('id');

        if (act === 'edit') {
            const row = dt.data().toArray().find(r => r.id === id);
            if (!row) return;
            openEdit(row);
        }

        if (act === 'delete') {
            if (!authorize.has(PERM.delete)) return;
            const ok = await utils.confirm('حذف المرحلة', 'هل أنت متأكد من الحذف؟ لا يمكن التراجع.', 'حذف', 'إلغاء', 'warning');
            if (!ok) return;
            try {
                loader.show();
                await api.delete(EP.remove(id));
                utils.toastSuccess('تم الحذف.');
                await reloadTable();
            } catch (err) {
                utils.toastError(utils.apiMessage(err, 'تعذر الحذف'));
            } finally {
                loader.hide();
            }
        }

        if (act === 'activate' || act === 'deactivate') {
            if (!authorize.has(PERM.update)) return;
            const payload = { ids: [id], op: act === 'activate' ? 'activate' : 'deactivate' };
            try {
                loader.show();
                await api.put(EP.bulk, payload);
                utils.toastSuccess('تم تحديث الحالة.');
                await reloadTable(true);
            } catch (err) {
                utils.toastError(utils.apiMessage(err, 'تعذر تحديث الحالة'));
            } finally {
                loader.hide();
            }
        }
    }

    // ========= Bulk actions =========
    $('#bulkActivate').on('click', () => bulkOp('activate'));
    $('#bulkDeactivate').on('click', () => bulkOp('deactivate'));
    $('#bulkDelete').on('click', async () => {
        const ok = await utils.confirm('حذف جماعي', 'سيتم حذف العناصر المحددة. هل أنت متأكد؟', 'حذف', 'إلغاء', 'warning');
        if (ok) bulkOp('delete');
    });

    async function bulkOp(op) {
        if (selected.size === 0) return;
        if (op === 'delete' && !authorize.has(PERM.delete)) return;
        if ((op === 'activate' || op === 'deactivate') && !authorize.has(PERM.update)) return;

        const ids = Array.from(selected);
        try {
            loader.show();
            await api.put(EP.bulk, { ids, op });
            utils.toastSuccess('تم تطبيق العملية.');
            await reloadTable();
        } catch (err) {
            utils.toastError(utils.apiMessage(err, 'تعذر تنفيذ العملية'));
        } finally {
            loader.hide();
        }
    }

    // ========= Filters =========
    async function populateSchools() {
        try {
            const data = await api.get(EP.schools);
            const opts = [{ id: '', text: 'الكل' }, ...data.map(x => ({ id: String(x.id), text: x.name }))];
            utils.select2($filterSchoolId, opts, { allowClear: true, placeholder: 'الكل' });
            utils.select2($schoolId, data.map(x => ({ id: String(x.id), text: x.name })), { dropdownParent: $(modalEl) });
            // استعادة قيمة من الاستعلام إن وُجد
            const u = new URLSearchParams(location.search);
            if (u.get('schoolId')) $filterSchoolId.val(u.get('schoolId')).trigger('change');
        } catch (err) {
            utils.toastError('تعذر تحميل المدارس');
        }
    }

    function resetFilters() {
        $txtSearch.val('');
        $filterSchoolId.val(null).trigger('change');
        $filterStatus.val('');
        reloadTable();
    }

    // ========= Create / Edit =========
    function openCreate() {
        clearForm();
        $('#stageModalTitle').text('مرحلة جديدة');
        modal.show();
    }

    function openEdit(row) {
        clearForm();
        fillForm(row);
        $('#stageModalTitle').text('تعديل المرحلة');
        modal.show();
    }

    async function saveForm() {
        if (!forms.validate($form[0])) return;

        const payload = {
            schoolId: utils.toInt($schoolId.val()),
            code: $code.val().trim(),
            name: $name.val().trim(),
            colorHex: $colorHex.val(),
            sortOrder: utils.toInt($sort.val()),
            status: $status.val(),
            notes: $notes.val()?.trim() || null
        };

        const id = $stageId.val();
        const isNew = !id;

        try {
            loader.show();
            if (isNew) {
                const created = await api.post(EP.create, payload);
                utils.toastSuccess('تمت الإضافة بنجاح.');
                // إدراج متفائل
                const rows = dt.data().toArray();
                rows.push(created);
                dt.clear().rows.add(rows).draw(false);
            } else {
                const updated = await api.put(EP.update(id), payload);
                utils.toastSuccess('تم الحفظ.');
                // تحديث متفائل
                const rows = dt.data().toArray().map(r => r.id == updated.id ? updated : r);
                dt.clear().rows.add(rows).draw(false);
            }
            modal.hide();
            updateStats(dt.data().toArray());
        } catch (err) {
            // تعامُل مع الأخطاء الحقلية ModelState
            const msg = utils.apiMessage(err, 'تعذر الحفظ');
            const fieldErrors = utils.apiFieldErrors(err);
            if (fieldErrors) {
                forms.applyFieldErrors($form[0], fieldErrors);
                utils.toastError('تحقق من الحقول المميزة.');
            } else {
                utils.toastError(msg);
            }
        } finally {
            loader.hide();
        }
    }

    // ========= URL state sync (اختياري مفيد) =========
    function syncUrl() {
        const p = new URLSearchParams();
        if ($filterSchoolId.val()) p.set('schoolId', $filterSchoolId.val());
        if ($filterStatus.val()) p.set('status', $filterStatus.val());
        if ($txtSearch.val()) p.set('q', $txtSearch.val().trim());
        history.replaceState(null, '', p.toString() ? ('?' + p.toString()) : location.pathname);
    }
    $txtSearch.on('change', syncUrl);
    $filterSchoolId.on('change', syncUrl);
    $filterStatus.on('change', syncUrl);

    // ========= Keyboard Shortcuts =========
    utils.hotkey('ctrl+/', () => $txtSearch.trigger('focus'));
    utils.hotkey('ctrl+shift+n', () => authorize.has(PERM.create) && openCreate());

    // ========= Boot =========
    $(async function () {
        try {
            loader.show();
            await initTable();
        } finally {
            loader.hide();
        }
    });

})();
