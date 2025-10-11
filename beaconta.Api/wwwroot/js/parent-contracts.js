(function () {
    'use strict';
    const $ = jQuery;

    // ===== Utils fallbacks (تستخدم core إن وُجدت) =====
    const U = window.Utils || {
        useLatinDigits: () => { },
        toLatinDigits: (s) => String(s ?? ''),
        money: (n) => (Number(n || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        int: (n) => Number(n || 0).toLocaleString('en-US'),
        select2($el, ph) { if ($el?.select2) { $el.select2({ theme: 'bootstrap-5', width: '100%', dir: 'rtl', placeholder: ph || '— اختر —' }); } },
        dtArabic: () => ({ sProcessing: "جارٍ المعالجة...", sLengthMenu: "أظهر _MENU_", sZeroRecords: "لا نتائج", sInfo: "إظهار _START_ إلى _END_ من أصل _TOTAL_", sInfoEmpty: "0 من 0", sSearch: "ابحث:", oPaginate: { sFirst: "الأول", sPrevious: "السابق", sNext: "التالي", sLast: "الأخير" } }),
        toastOk: (t) => Swal.fire({ icon: 'success', title: 'تم', text: t, timer: 1100, showConfirmButton: false }),
        toastErr: (t) => Swal.fire({ icon: 'error', title: 'خطأ', text: t })
    };
    const Forms = window.Forms || {
        serialize($frm) {
            const o = {}; $frm.serializeArray().forEach(x => { o[x.name] = x.value; });
            $frm.find('input[type=checkbox]').each(function () { o[this.name] = this.checked; });
            return o;
        },
        reset($frm) { $frm[0]?.reset(); }
    };
    const Tables = window.Tables || {
        make($el, opts) {
            const dt = $el.DataTable(Object.assign({ language: U.dtArabic(), responsive: true, deferRender: true }, opts || {}));
            return dt;
        }
    };

    // ====== Role Detection (manager/employee) ======
    function detectRole() {
        // 1) من Auth/State إن وُجد
        const r1 = window.Auth?.user?.role || window.State?.user?.role;
        if (r1) { return /admin|manager/i.test(r1) ? 'manager' : 'employee'; }
        // 2) querystring ?role=manager|employee
        const qs = new URLSearchParams(location.search);
        const r2 = qs.get('role');
        if (r2) { return r2.toLowerCase() === 'manager' ? 'manager' : 'employee'; }
        // 3) افتراضي: موظف
        return 'employee';
    }
    const ROLE = detectRole();

    // ====== Mock Data (localStorage) ======
    const STORE_KEY = 'pc.contracts.v1';
    const BRANCHES = [{ id: 1, name: 'الفرع الرئيسي' }, { id: 2, name: 'فرع البنين' }, { id: 3, name: 'فرع البنات' }];
    const YEARS = [{ id: 2023, name: '2023/2024' }, { id: 2024, name: '2024/2025' }, { id: 2025, name: '2025/2026' }];

    function seedIfEmpty() {
        const cur = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
        if (cur.length) return;
        const demo = [
            {
                id: 1, code: 'C-0001', parentName: 'سالم العتيبي', parentMobile: '0555555551',
                branchId: 1, yearId: 2024, status: 'Active', startDate: '2025-08-20', endDate: null,
                total: 12000, paid: 4000, signed: true, notes: 'خصم أخ/أخت 10%',
                students: [{ id: 1, name: 'عبدالله', grade: 'خامس' }],
                installments: [{ no: 1, due: '2025-09-10', amount: 2000, note: 'دفعة شهر 9' }, { no: 2, due: '2025-10-10', amount: 2000 }]
            },
            {
                id: 2, code: 'C-0002', parentName: 'مها القحطاني', parentMobile: '0555555552',
                branchId: 3, yearId: 2025, status: 'Draft', startDate: '2025-09-01', endDate: null,
                total: 9000, paid: 0, signed: false, notes: '',
                students: [{ id: 2, name: 'سارة', grade: 'رابع' }, { id: 3, name: 'ليان', grade: 'أول' }],
                installments: [{ no: 1, due: '2025-09-15', amount: 3000 }, { no: 2, due: '2025-10-15', amount: 3000 }, { no: 3, due: '2025-11-15', amount: 3000 }]
            }
        ];
        localStorage.setItem(STORE_KEY, JSON.stringify(demo));
    }
    function loadAll() { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
    function saveAll(rows) { localStorage.setItem(STORE_KEY, JSON.stringify(rows || [])); }

    // ====== DOM ======
    const $selBranch = $('#selBranch');
    const $selYear = $('#selYear');
    const $selStatus = $('#selStatus');
    const $btnReload = $('#btnReload');

    const $roleBadge = $('#roleBadge');
    const $managerFilters = $('#managerFilters');
    const $managerActions = $('#managerActions');
    const $employeeQuickPanel = $('#employeeQuickPanel');
    const $managerTablePanel = $('#managerTablePanel');

    const $kpiCount = $('#kpiCount');
    const $kpiTotal = $('#kpiTotal');
    const $kpiPaid = $('#kpiPaid');
    const $kpiRemain = $('#kpiRemain');
    const $footerSummary = $('#footerSummary');

    const $tbl = $('#tblContracts');

    const $frmQuick = $('#frmQuick');
    const $qBranch = $('#qBranch');
    const $qYear = $('#qYear');

    const dlg = new bootstrap.Modal('#dlgContract');
    const $frm = $('#frmContract');
    const $dlgTitle = $('#dlgTitle');
    const $btnDlgSave = $('#btnDlgSave');
    const $btnDlgDelete = $('#btnDlgDelete');

    // ====== Role UI ======
    function applyRoleUI() {
        if (ROLE === 'manager') {
            $roleBadge.text('مدير').removeClass().addClass('badge rounded-pill text-bg-primary');
            $managerFilters.show(); $managerActions.show(); $managerTablePanel.show();
            $employeeQuickPanel.show(); // المدير يرى الاثنين
        } else {
            $roleBadge.text('موظف').removeClass().addClass('badge rounded-pill text-bg-secondary');
            $managerFilters.hide(); $managerActions.hide(); $managerTablePanel.hide();
            $employeeQuickPanel.show();
        }
    }

    // ====== Select2 ======
    function fillSelect($sel, rows, keep) {
        const prev = keep ? $sel.val() : null;
        $sel.empty();
        rows.forEach(r => $sel.append(new Option(r.name, r.id)));
        if (keep && prev && $sel.find(`option[value="${prev}"]`).length) { $sel.val(prev); }
        $sel.trigger('change.select2');
    }
    function initFilters() {
        U.select2($selBranch, 'اختر الفرع');
        U.select2($selYear, 'اختر السنة');
        U.select2($selStatus, 'كل الحالات');
        U.select2($qBranch, 'فرع');
        U.select2($qYear, 'سنة');
        fillSelect($selBranch, BRANCHES);
        fillSelect($qBranch, BRANCHES);
        fillSelect($selYear, YEARS);
        fillSelect($qYear, YEARS);

        // اختر أحدث سنة تلقائياً
        const latest = YEARS.map(x => x.id).sort((a, b) => b - a)[0];
        $selYear.val(latest).trigger('change.select2');
        $qYear.val(latest).trigger('change.select2');
    }

    // ====== Table ======
    let dt = null;
    function makeTable(data) {
        if (!dt) {
            dt = Tables.make($tbl, {
                data: data,
                columns: [
                    { title: '#', data: null, render: (d, t, r, m) => m.row + 1, width: '36px' },
                    { title: 'الكود', data: 'code' },
                    { title: 'وليّ الأمر', data: 'parentName' },
                    { title: 'الجوال', data: 'parentMobile' },
                    { title: 'الفرع', data: null, render: (r) => BRANCHES.find(b => b.id === r.branchId)?.name || '—' },
                    { title: 'السنة', data: null, render: (r) => YEARS.find(y => y.id === r.yearId)?.name || '—' },
                    {
                        title: 'الحالة', data: 'status', render: (v) => {
                            const map = { Draft: 'secondary', Active: 'success', Closed: 'dark' };
                            return `<span class="badge text-bg-${map[v] || 'secondary'}">${v}</span>`;
                        }
                    },
                    { title: 'إجمالي', data: 'total', render: (v) => `<b>${U.money(v)}</b>` },
                    { title: 'مدفوع', data: 'paid', render: (v) => `<span class="text-success">${U.money(v)}</span>` },
                    { title: 'متبقي', data: null, render: (r) => `<span class="text-danger">${U.money((r.total || 0) - (r.paid || 0))}</span>` },
                    {
                        title: 'عمليات', data: null, orderable: false, width: '160px', className: 'text-center',
                        render: (r) => {
                            const edit = `<button class="btn btn-sm btn-outline-primary act-edit" data-id="${r.id}" title="تعديل"><i class="bi bi-pencil-square"></i></button>`;
                            const clone = `<button class="btn btn-sm btn-outline-info act-clone" data-id="${r.id}" title="استنساخ"><i class="bi bi-layers"></i></button>`;
                            const close = `<button class="btn btn-sm btn-outline-warning act-close" data-id="${r.id}" title="إغلاق"><i class="bi bi-lock"></i></button>`;
                            const del = `<button class="btn btn-sm btn-outline-danger act-del" data-id="${r.id}" title="حذف"><i class="bi bi-trash"></i></button>`;
                            if (ROLE === 'manager') return `<div class="btn-group btn-group-sm">${edit}${clone}${close}${del}</div>`;
                            // الموظف لا يرى إلا "تعديل محدود" (نفتح المودال لكن نخفي بعض الحقول داخل)
                            return `<div class="btn-group btn-group-sm">${edit}</div>`;
                        }
                    }
                ]
            });

            // events
            $tbl.on('click', '.act-edit', onEditRow);
            $tbl.on('click', '.act-clone', onCloneRow);
            $tbl.on('click', '.act-close', onCloseRow);
            $tbl.on('click', '.act-del', onDeleteRow);
        } else {
            dt.clear().rows.add(data).draw();
        }
    }

    // ====== Load + Filter + KPIs ======
    function applyFilters(rows) {
        let list = rows.slice();
        if (ROLE === 'manager') {
            const b = Number($selBranch.val() || 0); if (b) list = list.filter(x => x.branchId === b);
            const y = Number($selYear.val() || 0); if (y) list = list.filter(x => x.yearId === y);
            const s = String($selStatus.val() || ''); if (s) list = list.filter(x => x.status === s);
        }
        return list;
    }
    function refreshKPIs(list) {
        const total = list.reduce((a, x) => a + (x.total || 0), 0);
        const paid = list.reduce((a, x) => a + (x.paid || 0), 0);
        const remain = total - paid;
        $kpiCount.text(U.int(list.length));
        $kpiTotal.text(U.money(total));
        $kpiPaid.text(U.money(paid));
        $kpiRemain.text(U.money(remain));
    }
    function reloadAll() {
        const all = loadAll();
        const filtered = applyFilters(all);
        makeTable(filtered);
        refreshKPIs(filtered);
        $footerSummary.text('تم تحديث البيانات.');
    }

    // ====== Employee Quick Save ======
    $frmQuick.on('submit', function (e) {
        e.preventDefault();
        const p = Forms.serialize($frmQuick);
        const all = loadAll();
        const nextId = (all.map(x => x.id).sort((a, b) => b - a)[0] || 0) + 1;
        const code = 'C-' + String(nextId).padStart(4, '0');

        const total = Number(p.Total || 0);
        const first = Number(p.FirstPay || 0);
        const branchId = Number(p.BranchId || 0) || BRANCHES[0].id;
        const yearId = Number(p.YearId || 0) || YEARS.map(x => x.id).sort((a, b) => b - a)[0];

        const row = {
            id: nextId, code,
            parentName: p.ParentName, parentMobile: p.ParentMobile,
            branchId, yearId, status: 'Draft',
            startDate: p.StartDate || null, endDate: null,
            total, paid: first, signed: false, notes: '',
            students: [{ id: Date.now(), name: p.StudentName, grade: p.StudentGrade || '' }],
            installments: first > 0 ? [{ no: 1, due: p.StartDate || new Date().toISOString().slice(0, 10), amount: first, note: 'دفعة أولى' }] : []
        };

        all.unshift(row); saveAll(all);
        Forms.reset($frmQuick);
        U.toastOk('تم إنشاء عقد سريع.');
        // الموظف لا يرى الجدول، لكن نحدّث المؤشرات
        reloadAll();
    });

    // ====== Full Modal Helpers ======
    function openModal(row) {
        $dlgTitle.text(row?.id ? `تعديل عقد ${row.code}` : 'عقد جديد');
        // تعبئة selects داخل المودال
        const $mBranch = $frm.find('select[name="BranchId"]');
        const $mYear = $frm.find('select[name="YearId"]');
        U.select2($mBranch, 'فرع'); U.select2($mYear, 'سنة');
        fillSelect($mBranch, BRANCHES, true);
        fillSelect($mYear, YEARS, true);

        Forms.reset($frm);
        $('#studentsList').empty(); $('#tblPlan tbody').empty();
        if (row) {
            $frm.find('[name="Id"]').val(row.id || 0);
            $frm.find('[name="ParentName"]').val(row.parentName || '');
            $frm.find('[name="ParentMobile"]').val(row.parentMobile || '');
            $mBranch.val(row.branchId).trigger('change.select2');
            $mYear.val(row.yearId).trigger('change.select2');
            $frm.find('[name="Status"]').val(row.status || 'Draft');
            $frm.find('[name="StartDate"]').val(row.startDate || '');
            $frm.find('[name="EndDate"]').val(row.endDate || '');
            $frm.find('[name="Signed"]').prop('checked', !!row.signed);
            $frm.find('[name="Total"]').val(row.total || 0);
            $frm.find('[name="Paid"]').val(row.paid || 0);
            $('#Remain').val(U.money((row.total || 0) - (row.paid || 0)));
            $frm.find('[name="Notes"]').val(row.notes || '');

            (row.students || []).forEach(addStudentLi);
            (row.installments || []).forEach(addPlanRow);
        } else {
            $frm.find('[name="Id"]').val(0);
            $('#Remain').val('0.00');
        }

        // role限制 داخل المودال (الموظف: يبقي الأساسيات فقط)
        if (ROLE === 'employee') {
            // إخفاء بعض الحقول المتقدمة
            $frm.find('[name="Status"]').closest('.col-6, .col-3').hide();
            $('#studentsBox').show(); // يحتاج إدخال طلاب
        } else {
            $frm.find('[name="Status"]').closest('.col-6, .col-3').show();
        }

        dlg.show();
    }

    function addStudentLi(s) {
        const li = $(`<li class="list-group-item">
      <div>
        <b>${U.toLatinDigits(s.name)}</b> <span class="text-muted">(${s.grade || '—'})</span>
      </div>
      <button type="button" class="btn btn-sm btn-outline-danger"><i class="bi bi-x-lg"></i></button>
    </li>`);
        li.find('button').on('click', () => li.remove());
        $('#studentsList').append(li);
    }

    function addPlanRow(p) {
        const tr = $(`<tr>
      <td></td>
      <td>${p.due || ''}</td>
      <td class="text-end">${U.money(p.amount || 0)}</td>
      <td>${p.note || ''}</td>
      <td class="text-center"><button type="button" class="btn btn-sm btn-outline-danger"><i class="bi bi-x-lg"></i></button></td>
    </tr>`);
        tr.find('button').on('click', () => tr.remove());
        $('#tblPlan tbody').append(tr);
        reindexPlan();
    }
    function reindexPlan() {
        $('#tblPlan tbody tr').each(function (i) { $(this).find('td:first').text(i + 1); });
    }

    // Students add
    $('#btnAddStudent').on('click', () => {
        const name = $('#stName').val().trim();
        if (!name) { U.toastErr('أدخل اسم الطالب.'); return; }
        addStudentLi({ id: Date.now(), name, grade: $('#stGrade').val().trim() });
        $('#stName').val(''); $('#stGrade').val('');
    });

    // Plan add
    $('#btnAddPlan').on('click', () => {
        const due = $('#plDue').val(); const amt = Number($('#plAmt').val() || 0);
        if (!due || !amt) { U.toastErr('حدّد تاريخًا ومبلغًا.'); return; }
        addPlanRow({ due, amount: amt, note: $('#plNote').val() });
        $('#plAmt').val(''); $('#plNote').val('');
    });

    // Recalc remain
    $frm.on('input', '[name="Total"],[name="Paid"]', () => {
        const t = Number($frm.find('[name="Total"]').val() || 0);
        const p = Number($frm.find('[name="Paid"]').val() || 0);
        $('#Remain').val(U.money(t - p));
    });

    // Save modal
    $btnDlgSave.on('click', () => {
        const all = loadAll();
        const payload = Forms.serialize($frm);
        const id = Number(payload.Id || 0);
        // collect students
        const students = [];
        $('#studentsList li').each(function () {
            const txt = $(this).find('b').text(); // name
            const meta = $(this).find('.text-muted').text().replace(/[()]/g, ''); // grade
            students.push({ id: Date.now() + Math.random(), name: txt, grade: meta });
        });
        const installments = [];
        $('#tblPlan tbody tr').each(function (i) {
            const tds = $(this).find('td'); // [#, due, amount, note, x]
            installments.push({ no: i + 1, due: $(tds[1]).text(), amount: Number($(tds[2]).text().replace(/,/g, '')) || 0, note: $(tds[3]).text() });
        });

        const obj = {
            id: id || ((all.map(x => x.id).sort((a, b) => b - a)[0] || 0) + 1),
            code: id ? (all.find(x => x.id === id)?.code || ('C-' + String(id).padStart(4, '0'))) : ('C-' + String((all.map(x => x.id).sort((a, b) => b - a)[0] || 0) + 1).padStart(4, '0')),
            parentName: payload.ParentName, parentMobile: payload.ParentMobile,
            branchId: Number(payload.BranchId || 0) || BRANCHES[0].id,
            yearId: Number(payload.YearId || 0) || YEARS[YEARS.length - 1].id,
            status: payload.Status || 'Draft',
            startDate: payload.StartDate || null, endDate: payload.EndDate || null,
            total: Number(payload.Total || 0), paid: Number(payload.Paid || 0),
            signed: !!payload.Signed, notes: payload.Notes || '',
            students, installments
        };

        if (id > 0) {
            const idx = all.findIndex(x => x.id === id);
            if (idx >= 0) all[idx] = obj;
        } else {
            all.unshift(obj);
        }
        saveAll(all);
        dlg.hide();
        U.toastOk('تم الحفظ.');
        reloadAll();
    });

    // Delete from modal
    $btnDlgDelete.on('click', async () => {
        const id = Number($frm.find('[name="Id"]').val() || 0);
        if (!id) { dlg.hide(); return; }
        const ok = await Swal.fire({ icon: 'warning', title: 'حذف عقد', text: 'هل تريد الحذف؟', showCancelButton: true, confirmButtonText: 'حذف' });
        if (!ok.isConfirmed) return;
        const all = loadAll().filter(x => x.id !== id);
        saveAll(all); dlg.hide(); reloadAll(); U.toastOk('تم الحذف.');
    });

    // ====== Row Actions ======
    function onEditRow() {
        const id = Number($(this).data('id'));
        const row = loadAll().find(x => x.id === id);
        openModal(row);
    }
    function onCloneRow() {
        const id = Number($(this).data('id'));
        const all = loadAll();
        const src = all.find(x => x.id === id); if (!src) return;
        const nextId = (all.map(x => x.id).sort((a, b) => b - a)[0] || 0) + 1;
        const clone = JSON.parse(JSON.stringify(src));
        clone.id = nextId; clone.code = 'C-' + String(nextId).padStart(4, '0'); clone.status = 'Draft'; clone.signed = false;
        all.unshift(clone); saveAll(all); reloadAll(); U.toastOk('تم الاستنساخ.');
    }
    async function onCloseRow() {
        const id = Number($(this).data('id'));
        const ok = await Swal.fire({ icon: 'question', title: 'إغلاق العقد', text: 'سيصبح العقد مغلقًا ولا يقبل تعديلات.', showCancelButton: true, confirmButtonText: 'إغلاق' });
        if (!ok.isConfirmed) return;
        const all = loadAll(); const r = all.find(x => x.id === id); if (!r) return;
        r.status = 'Closed'; saveAll(all); reloadAll(); U.toastOk('تم الإغلاق.');
    }
    async function onDeleteRow() {
        const id = Number($(this).data('id'));
        const ok = await Swal.fire({ icon: 'warning', title: 'حذف عقد', text: 'هل تريد الحذف؟', showCancelButton: true, confirmButtonText: 'حذف' });
        if (!ok.isConfirmed) return;
        const all = loadAll().filter(x => x.id !== id); saveAll(all); reloadAll(); U.toastOk('تم الحذف.');
    }

    // ====== Top actions ======
    $('#btnNewFull').on('click', () => openModal(null));
    $('#btnExportCsv').on('click', () => {
        const rows = loadAll();
        const head = 'Id,Code,ParentName,ParentMobile,Branch,Year,Status,Total,Paid,Remain';
        const csv = [head].concat(rows.map(r => {
            const remain = (r.total || 0) - (r.paid || 0);
            const cells = [r.id, r.code, r.parentName, r.parentMobile, (BRANCHES.find(b => b.id === r.branchId)?.name || ''), (YEARS.find(y => y.id === r.yearId)?.name || ''), r.status, r.total, r.paid, remain];
            return cells.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
        })).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'parent-contracts.csv'; a.click();
    });
    $('#btnExportJson').on('click', () => {
        const blob = new Blob([JSON.stringify(loadAll(), null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'parent-contracts.json'; a.click();
    });
    $('#btnPrint').on('click', () => window.print());
    $('#btnResetDemo').on('click', async () => {
        const ok = await Swal.fire({ icon: 'warning', title: 'إعادة بيانات التجربة', text: 'سيتم مسح البيانات الحالية واستبدالها ببيانات تجريبية.', showCancelButton: true, confirmButtonText: 'تابع' });
        if (!ok.isConfirmed) return;
        localStorage.removeItem(STORE_KEY); seedIfEmpty(); reloadAll(); U.toastOk('أعيدت البيانات.');
    });

    // ====== Manager Filters ======
    $btnReload.on('click', reloadAll);
    $selBranch.on('change', reloadAll);
    $selYear.on('change', reloadAll);
    $selStatus.on('change', reloadAll);

    // ====== Init ======
    $(async function init() {
        try {
            U.useLatinDigits(true);
            applyRoleUI();
            seedIfEmpty();
            initFilters();
            reloadAll();
            $footerSummary.text('جاهز.');
        } catch (e) {
            console.error(e);
            U.toastErr('تعذر تحميل الشاشة.');
        }
    });
})();
