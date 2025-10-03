// =========================
// Schools screen logic — FINAL (client-fetch DT + inline edit + bulk)
// =========================
$(async function () {
    'use strict';

    const PERMS = {
        view: 'schools.view',
        create: 'schools.create',
        update: 'schools.update',
        delete: 'schools.delete',
        export: 'schools.export'
    };

    if (window.Authorize?.load) { try { await Authorize.load(); } catch (e) { console.warn('Authorize.load failed', e); } }

    let dt, cache = [];
    const $tbl = $("#tblSchools");
    const modal = new bootstrap.Modal($("#schoolModal")[0]);

    const applyAuth = (root = document) => window.Authorize?.applyWithin?.(root);
    const ensurePerm = (k) => (window.Authorize?.has?.(k) ?? true) || (window.Utils?.toastError?.('ليست لديك صلاحية'), false);
    const esc = (s) => (window.utils?.escapeHtml?.(s) ?? String(s ?? "").replace(/[&<>\"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])));

    const statusPill = s => {
        const on = String(s).toLowerCase() === "active";
        return `<span class="badge badge-status bg-${on ? "success" : "secondary"}">${on ? "نشطة" : "غير نشطة"}</span>`;
    };
    const colorChip = hex => `<span class="color-chip" style="background:${hex || "#0000"}"></span>`;

    // شريط الإجراءات الجماعية (إن لم يوجد)
    (function injectBulkBar() {
        if (document.getElementById('bulkToolbar')) return;
        const bar = document.createElement('div');
        bar.id = "bulkToolbar"; bar.className = "d-flex gap-2 mt-3 bulk-toolbar";
        bar.innerHTML = `
      <span class="badge bg-info-subtle text-info-emphasis px-3">المحدد: <b id="bulkCount">0</b></span>
      <button id="bulkActivate" class="btn btn-sm btn-outline-success" data-perm="${PERMS.update}">
        <i class="bi bi-toggle2-on me-1"></i>تفعيل
      </button>
      <button id="bulkDeactivate" class="btn btn-sm btn-outline-warning" data-perm="${PERMS.update}">
        <i class="bi bi-toggle2-off me-1"></i>تعطيل
      </button>
      <button id="bulkDelete" class="btn btn-sm btn-outline-danger" data-perm="${PERMS.delete}">
        <i class="bi bi-trash3 me-1"></i>حذف
      </button>`;
        document.querySelector('.toolbar-card')?.appendChild(bar);
    })();

    // إصلاح الهيدر: عمود التحديد
    function ensureSelectHeader() {
        const $tr = $("#tblSchools thead tr"); if ($tr.length === 0) return;
        const already = $tr.find("#chkAll").length > 0;
        if (!already) {
            $tr.prepend('<th class="text-center" style="width:40px;"><input type="checkbox" id="chkAll" aria-label="select-all"></th>');
        }
    }

    // فلاتر
    function buildQuery() {
        const p = new URLSearchParams();
        const q = $("#txtSearch").val()?.trim();
        const st = $("#filterStatus").val();
        const fc = $("#filterColor").val();
        if (q) p.set("q", q);
        if (st) p.set("status", st);
        if (fc) p.set("color", fc);
        return p;
    }
    function applyClientFilters(rows) {
        const p = buildQuery();
        let out = rows.slice();
        const q = p.get('q'); if (q) {
            const qq = q.toLowerCase();
            out = out.filter(r => (r.name || '').toLowerCase().includes(qq) || (r.code || '').toLowerCase().includes(qq));
        }
        const st = p.get('status'); if (st) {
            out = out.filter(r => String(r.status) === st);
        }
        const fc = p.get('color'); if (fc) {
            out = out.filter(r => {
                const c = (r.colorHex || '').toLowerCase();
                if (!c) return false;
                if (fc === 'other') return !['#0d6efd', '#198754', '#dc3545'].includes(c); // مثال بسيط
                if (fc === 'blue') return c === '#0d6efd';
                if (fc === 'green') return c === '#198754';
                if (fc === 'red') return c === '#dc3545';
                return true;
            });
        }
        return out;
    }

    async function fetchSchools() {
        // ⚠️ بدال ajax DataTables: استخدم Api.get ليضمن Authorization
        const rows = await Api.get("/schools");
        cache = Array.isArray(rows) ? rows : [];
        return applyClientFilters(cache);
    }

    async function tblReload() {
        const data = await fetchSchools();
        if (!dt) {
            await loadTable(data);
        } else {
            dt.clear().rows.add(data).draw(false);
            applyAuth(document.getElementById('tblSchools'));
        }
    }

    async function loadTable(initialData) {
        ensureSelectHeader();

        dt = $("#tblSchools").DataTable({
            data: initialData || [],
            order: [[1, "asc"]],
            responsive: true,
            dom: "Bfrtip",
            buttons: [
                { extend: "excelHtml5", text: "تصدير Excel", title: "Schools" },
                { extend: "copyHtml5", text: "نسخ" },
                { extend: "print", text: "طباعة" }
            ],
            columns: [
                {
                    data: "id",
                    title: $("#tblSchools thead th").first().html(),
                    className: "text-center",
                    orderable: false,
                    render: id => `<input type="checkbox" class="row-check" data-id="${id}" aria-label="select">`
                },
                { data: "name", title: "المدرسة", render: v => `<strong>${esc(v)}</strong>` },
                { data: "code", title: "الكود", className: "inline-editable", render: v => esc(v ?? "—") },
                { data: "status", title: "الحالة", className: "inline-editable", render: statusPill },
                { data: "colorHex", title: "اللون", className: "inline-editable", render: colorChip },
                { data: "branchesCount", title: "عدد الفروع", defaultContent: "0", className: "text-center" },
                {
                    data: null, title: "إجراءات", orderable: false, searchable: false,
                    render: (row) => `
            <div class="d-flex gap-1 flex-wrap">
              <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${row.id}" data-perm="${PERMS.update}">
                <i class="bi bi-pencil-square me-1"></i>تعديل
              </button>
              <button class="btn btn-sm btn-outline-danger btn-del" data-id="${row.id}" data-perm="${PERMS.delete}">
                <i class="bi bi-trash me-1"></i>حذف
              </button>
            </div>`
                }
            ]
        });

        // أحداث الجدول
        $tbl.on("click", ".btn-edit", onEdit);
        $tbl.on("click", ".btn-del", onDelete);

        $tbl.on("change", "#chkAll", function () {
            $(".row-check").prop("checked", this.checked).trigger("change");
        });
        $tbl.on("change", ".row-check", function () {
            const n = $(".row-check:checked").length;
            $("#bulkCount").text(n);
            $("#bulkToolbar").toggleClass("bulk-toolbar", n === 0);
            applyAuth(document.getElementById('bulkToolbar'));
        });

        // inline edit
        $tbl.on("click", "td.inline-editable", function () {
            const cell = dt.cell(this);
            const rowData = dt.row(this.closest("tr")).data();
            const colIdx = cell.index().column; // 2=code, 3=status, 4=colorHex
            if (colIdx === 2) inlineEditText(cell, rowData, "code");
            else if (colIdx === 3) inlineEditStatus(cell, rowData, "status");
            else if (colIdx === 4) inlineEditColor(cell, rowData, "colorHex");
        });

        dt.on('draw', () => applyAuth(document.getElementById('tblSchools')));

        $("#btnExport").on("click", () => { if (ensurePerm(PERMS.export)) dt?.button(0).trigger(); });

        // أول إحصاءات
        loadStats();
    }

    // فلاتر
    $("#btnResetFilters").on("click", function () {
        $("#txtSearch").val("");
        $("#filterStatus").val("");
        $("#filterColor").val("");
        tblReload(); loadStats();
    });
    $("#txtSearch").on("input", debounce(() => tblReload(), 300));
    $("#filterStatus,#filterColor").on("change", tblReload);

    // إحصاءات
    async function loadStats() {
        try {
            const s = await Api.get("/schools/stats");
            $("#statTotal").text(s?.total ?? 0);
            $("#statActive").text(s?.active ?? 0);
            $("#statInactive").text(s?.inactive ?? 0);
            const d = new Date();
            $("#statUpdated").text(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
        } catch (err) { console.warn("loadStats failed", err); }
    }

    // إضافة/تعديل
    $("#btnAddSchool").attr('data-perm', PERMS.create).on("click", () => {
        if (!ensurePerm(PERMS.create)) return;
        openUpsert();
    });

    async function openUpsert(id = null) {
        $("#schoolModalTitle").text(id ? "تعديل مدرسة" : "مدرسة جديدة");
        resetForm("#frmSchool");
        if (id) {
            try {
                const s = await Api.get(`/schools/${id}`);
                $("#schoolId").val(s.id);
                $("#name").val(s.name || "");
                $("#code").val(s.code || "");
                $("#status").val(s.status || "Active");
                $("#colorHex").val(s.colorHex || "#0d6efd");
                $("#notes").val(s.notes || "");
            } catch (err) {
                console.error("load school failed", err);
                return Swal.fire({ icon: "error", title: "تعذر تحميل البيانات" });
            }
        } else {
            $("#status").val("Active");
            $("#colorHex").val("#0d6efd");
        }
        modal.show();
    }

    $("#btnSaveSchool").on("click", async function () {
        const form = document.getElementById("frmSchool");
        if (!form.checkValidity()) { form.classList.add("was-validated"); return; }

        const dto = {
            id: +($("#schoolId").val() || 0),
            name: $("#name").val()?.trim(),
            code: $("#code").val()?.trim() || null,
            status: $("#status").val() || "Active",
            colorHex: $("#colorHex").val() || null,
            notes: $("#notes").val()?.trim() || null
        };

        try {
            const saved = dto.id
                ? await Api.put(`/schools/${dto.id}`, dto)  // PUT /schools/{id}
                : await Api.post("/schools", dto);          // POST /schools
            if (saved) {
                Swal.fire({ icon: "success", title: "تم الحفظ", timer: 1200, showConfirmButton: false });
                modal.hide();
                await tblReload();
                await loadStats();
            }
        } catch (err) {
            console.error("save failed", err);
            Swal.fire({ icon: "error", title: "فشل الحفظ", text: err?.responseJSON?.message || "حدث خطأ أثناء الحفظ" });
        }
    });

    // إجراءات صف
    async function onEdit() { if (ensurePerm(PERMS.update)) openUpsert($(this).data("id")); }
    async function onDelete() {
        if (!ensurePerm(PERMS.delete)) return;
        const id = $(this).data("id");
        const conf = await Swal.fire({
            icon: "warning", title: "حذف المدرسة", text: "هل أنت متأكد من الحذف؟",
            showCancelButton: true, confirmButtonText: "حذف", cancelButtonText: "إلغاء"
        });
        if (!conf.isConfirmed) return;
        try {
            await Api.delete(`/schools/${id}`);
            Swal.fire({ icon: "success", title: "تم الحذف", timer: 900, showConfirmButton: false });
            await tblReload();
            await loadStats();
        } catch (err) {
            console.error("delete failed", err);
            Swal.fire({ icon: "error", title: "تعذر حذف المدرسة", text: err?.responseJSON?.message || "" });
        }
    }

    // إجراءات جماعية
    $("#bulkActivate").on("click", () => bulkToggle("Active"));
    $("#bulkDeactivate").on("click", () => bulkToggle("Inactive"));
    $("#bulkDelete").on("click", bulkDelete);

    function selectedIds() { return $(".row-check:checked").map((_, el) => +el.dataset.id).get(); }

    async function bulkToggle(targetStatus) {
        if (!ensurePerm(PERMS.update)) return;
        const ids = selectedIds(); if (!ids.length) return;
        const conf = await Swal.fire({
            icon: "question", title: targetStatus === "Active" ? "تفعيل المحدد؟" : "تعطيل المحدد؟",
            showCancelButton: true, confirmButtonText: "تأكيد", cancelButtonText: "إلغاء"
        });
        if (!conf.isConfirmed) return;
        try {
            await Promise.all(ids.map(id => Api.put(`/schools/${id}`, { id, status: targetStatus })));
            Swal.fire({ icon: "success", title: "تم التحديث", timer: 900, showConfirmButton: false });
            await tblReload(); await loadStats();
            $("#chkAll").prop("checked", false).trigger("change");
            $(".row-check").prop("checked", false).trigger("change");
        } catch (err) {
            console.error("bulk toggle failed", err);
            Swal.fire({ icon: "error", title: "تعذر الإجراء الجماعي" });
        }
    }

    async function bulkDelete() {
        if (!ensurePerm(PERMS.delete)) return;
        const ids = selectedIds(); if (!ids.length) return;
        const conf = await Swal.fire({
            icon: "warning", title: "حذف المحدد؟", text: `سيتم حذف ${ids.length} عنصرًا`,
            showCancelButton: true, confirmButtonText: "حذف", cancelButtonText: "إلغاء"
        });
        if (!conf.isConfirmed) return;
        try {
            await Promise.all(ids.map(id => Api.delete(`/schools/${id}`)));
            Swal.fire({ icon: "success", title: "تم الحذف", timer: 900, showConfirmButton: false });
            await tblReload(); await loadStats();
            $("#chkAll").prop("checked", false).trigger("change");
            $(".row-check").prop("checked", false).trigger("change");
        } catch (err) {
            console.error("bulk delete failed", err);
            Swal.fire({ icon: "error", title: "تعذر الحذف الجماعي" });
        }
    }

    // Inline Edits
    async function inlineEditText(cell, row, field) {
        if (!ensurePerm(PERMS.update)) return;
        const old = row[field] ?? "";
        const $td = $(cell.node());
        $td.off("click"); $td.html(`<input type="text" class="form-control form-control-sm" value="${esc(old)}">`);
        const $inp = $td.find("input");
        $inp.trigger("focus").on("keydown blur", async (e) => {
            if (e.type === "keydown" && !["Enter", "Escape"].includes(e.key)) return;
            const cancel = e.key === "Escape";
            const val = cancel ? old : ($inp.val() || "").trim();
            try { if (!cancel && val !== old) await Api.put(`/schools/${row.id}`, { id: row.id, [field]: val }); }
            catch (err) { console.error("inline update failed", err); Swal.fire({ icon: "error", title: "تعذر التعديل" }); }
            await tblReload();
        });
    }
    async function inlineEditStatus(cell, row, field) {
        if (!ensurePerm(PERMS.update)) return;
        const old = row[field] ?? "Active";
        const $td = $(cell.node());
        $td.off("click");
        $td.html(`
      <select class="form-select form-select-sm">
        <option value="Active" ${old === "Active" ? "selected" : ""}>نشطة</option>
        <option value="Inactive" ${old === "Inactive" ? "selected" : ""}>غير نشطة</option>
      </select>`);
        const $sel = $td.find("select");
        $sel.trigger("focus").on("change blur", async () => {
            const val = $sel.val();
            try { if (val !== old) await Api.put(`/schools/${row.id}`, { id: row.id, [field]: val }); }
            catch (err) { console.error("inline update failed", err); Swal.fire({ icon: "error", title: "تعذر التعديل" }); }
            await tblReload();
        });
    }
    async function inlineEditColor(cell, row, field) {
        if (!ensurePerm(PERMS.update)) return;
        const old = row[field] ?? "#0d6efd";
        const $td = $(cell.node());
        $td.off("click"); $td.html(`<input type="color" class="form-control form-control-color form-control-sm" value="${old}">`);
        const $inp = $td.find("input");
        $inp.trigger("focus").on("change blur", async () => {
            const val = $inp.val();
            try { if (val !== old) await Api.put(`/schools/${row.id}`, { id: row.id, [field]: val }); }
            catch (err) { console.error("inline update failed", err); Swal.fire({ icon: "error", title: "تعذر التعديل" }); }
            await tblReload();
        });
    }

    // Utils
    function resetForm(sel) { return window.forms?.resetForm?.(sel) || $(sel)[0].reset(); }
    function debounce(fn, ms = 300) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }

    // Init
    applyAuth(document);
    await tblReload();
    $("#btnAddSchool").attr('data-perm', PERMS.create);
    $("#btnExport").attr('data-perm', PERMS.export);
    applyAuth(document);
});
