// =========================
// Branches screen logic — Professional & Complete
// =========================
$(async function () {
    'use strict';

    // ---- RBAC keys
    const PERMS = {
        view: 'branches.view',
        create: 'branches.create',
        update: 'branches.update',
        delete: 'branches.delete',
        export: 'branches.export'
    };

    // ---- Endpoints (back-end should support these)
    const ENDPOINTS = {
        // فروع
        list: (p) => `/branches${p || ''}`,              // GET /branches?schoolId=&status=&city=&capMin=&capMax=
        get: (id) => `/branches/${id}`,                  // GET /branches/{id}
        create: () => `/branches`,                       // POST /branches
        update: (id) => `/branches/${id}`,               // PUT /branches/{id}
        delete: (id) => `/branches/${id}`,               // DELETE /branches/{id}
        stats: (p) => `/branches/stats${p || ''}`,       // GET /branches/stats?schoolId=

        // مدارس (للفلاتر والاختيار)
        schools: () => `/schools`,                       // GET /schools
    };

    // ---- Perm helpers
    const applyAuth = (root = document) => window.Authorize?.applyWithin?.(root);
    const ensurePerm = (k) => {
        if (!(window.Authorize && typeof Authorize.has === 'function')) return true;
        if (!Authorize.has(k)) { window.Utils?.toastError?.('ليست لديك صلاحية لهذا الإجراء'); return false; }
        return true;
    };
    const esc = (s) => (window.utils?.escapeHtml?.(s) ?? String(s ?? '').replace(/[&<>\"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])));

    const $tbl = $("#tblBranches");
    const dtButtons = [
        { extend: "excelHtml5", text: "تصدير Excel", title: "Branches" },
        { extend: "copyHtml5", text: "نسخ" },
        { extend: "print", text: "طباعة" }
    ];

    // ---- Load schools into filters/selects
    async function loadSchoolsInto($sel, includeAllOption = false) {
        const items = await Api.get(ENDPOINTS.schools());
        $sel.empty();
        if (includeAllOption) $sel.append(new Option("كل المدارس", "", true, true));
        (items || []).forEach(s => {
            $sel.append(new Option(s.name, s.id));
        });
        // Select2
        $sel.select2({ theme: 'bootstrap-5', width: '100%', allowClear: includeAllOption, placeholder: includeAllOption ? 'كل المدارس' : 'اختر مدرسة' });
    }

    // ---- Status badge
    const statusPill = (status) => {
        const on = String(status).toLowerCase() === "active";
        return `<span class="badge bg-${on ? "success" : "secondary"}">${on ? "نشطة" : "غير نشطة"}</span>`;
    };

    // ---- Map link
    const mapLink = (lat, lng) => {
        if (lat == null || lng == null || lat === "" || lng === "") return "—";
        const u = `https://maps.google.com/?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`;
        return `<a href="${u}" target="_blank" rel="noopener"><i class="bi bi-geo-alt"></i></a>`;
    };

    // ---- Select header ensure (first column)
    function ensureSelectHeader() {
        const $th0 = $("#tblBranches thead th").first();
        if ($th0.length && !$th0.find("#chkAll").length) {
            $th0.addClass("text-center").css("width", "40px")
                .html('<input type="checkbox" id="chkAll" aria-label="select-all">');
        }
    }


    // ---- Query builder
    function buildQuery() {
        const p = new URLSearchParams();
        const schoolId = $("#filterSchoolId").val();
        const status = $("#filterStatus").val();
        const city = $("#filterCity").val()?.trim();
        const capMin = $("#filterCapMin").val();
        const capMax = $("#filterCapMax").val();
        if (schoolId) p.set("schoolId", schoolId);
        if (status) p.set("status", status);
        if (city) p.set("city", city);
        if (capMin) p.set("capMin", capMin);
        if (capMax) p.set("capMax", capMax);
        const q = p.toString();
        return q ? `?${q}` : "";
    }

    let dt;

    async function tblReload() {
        if (!dt) { await loadTable(); return; }
        dt.ajax.url(API.base + ENDPOINTS.list(buildQuery())).load(null, false);
    }

    async function loadTable() {
        ensureSelectHeader();

        dt = $("#tblBranches").DataTable({
            ajax: {
                url: API.base + ENDPOINTS.list(buildQuery()),
                dataSrc: "",
                beforeSend: function (xhr) {
                    const t = window.getToken?.();
                    if (t) xhr.setRequestHeader("Authorization", "Bearer " + t);
                }
            },
            responsive: true,
            order: [[2, "asc"]],
            dom: "Bfrtip",
            buttons: dtButtons,
            columns: [
                {
                    data: "id",
                    title: $("#tblBranches thead th").first().html(),
                    className: "text-center",
                    orderable: false,
                    render: (id) => `<input type="checkbox" class="row-check" data-id="${id}" aria-label="select">`
                },
                { data: "schoolName", title: "المدرسة", render: v => `<strong>${esc(v)}</strong>` },
                { data: "name", title: "الفرع", render: v => esc(v) },
                { data: "code", title: "الكود", className: "inline-editable", render: v => esc(v) },
                { data: "status", title: "الحالة", className: "inline-editable", render: statusPill },
                { data: "city", title: "المدينة", render: v => esc(v || "—") },
                { data: "district", title: "الحي", render: v => esc(v || "—") },
                { data: "phone", title: "الهاتف", className: "inline-editable", render: v => esc(v || "—") },
                { data: "capacity", title: "السعة", className: "inline-editable text-center" },
                { data: "currentStudents", title: "الملتحقون", className: "text-center" },
                {
                    data: null, title: "إجراءات", orderable: false, searchable: false,
                    render: (row) => `
            <div class="d-flex gap-1 flex-wrap">
              <a class="btn btn-sm btn-outline-secondary" href="https://maps.google.com/?q=${encodeURIComponent(row.latitude ?? '')},${encodeURIComponent(row.longitude ?? '')}" target="_blank" title="خريطة"><i class="bi bi-geo-alt"></i></a>
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

        // Row actions
        $tbl.on("click", ".btn-edit", onEdit);
        $tbl.on("click", ".btn-del", onDelete);

        // Select-all
        $tbl.on("change", "#chkAll", function () {
            $(".row-check").prop("checked", this.checked).trigger("change");
        });
        $tbl.on("change", ".row-check", function () {
            const n = $(".row-check:checked").length;
            $("#bulkCount").text(n);
            $("#bulkToolbar").toggleClass("bulk-toolbar", n === 0);
            applyAuth(document.getElementById('bulkToolbar'));
        });

        // Inline edit
        $tbl.on("click", "td.inline-editable", function () {
            const cell = dt.cell(this);
            const row = dt.row(this.closest("tr")).data();
            const idx = cell.index().column; // 3=code, 4=status, 7=phone, 8=capacity
            if (idx === 3) inlineEditText(cell, row, "code");
            else if (idx === 4) inlineEditStatus(cell, row, "status");
            else if (idx === 7) inlineEditText(cell, row, "phone");
            else if (idx === 8) inlineEditNumber(cell, row, "capacity");
        });

        dt.on("draw", () => applyAuth(document.getElementById('tblBranches')));

        // Buttons
        $("#btnExport").on("click", () => { if (ensurePerm(PERMS.export)) dt?.button(0).trigger(); });

        // Stats
        loadStats();
    }

    // ---- Filters
    await loadSchoolsInto($("#filterSchoolId"), true);
    $("#filterSchoolId, #filterStatus").on("change", tblReload);
    $("#filterCity, #filterCapMin, #filterCapMax").on("input", debounce(tblReload, 300));
    $("#btnResetFilters").on("click", function () {
        $("#filterSchoolId").val("").trigger("change");
        $("#filterStatus").val("");
        $("#filterCity").val("");
        $("#filterCapMin").val("");
        $("#filterCapMax").val("");
        tblReload();
        loadStats();
    });

    // ---- Stats
    async function loadStats() {
        try {
            const qs = buildQuery();
            const s = await Api.get(ENDPOINTS.stats(qs.replace('/?', '?'))); // safeguard
            $("#statTotal").text(s?.total ?? 0);
            $("#statActive").text(s?.active ?? 0);
            $("#statInactive").text(s?.inactive ?? 0);
            const d = new Date();
            $("#statUpdated").text(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
        } catch (err) {
            console.warn("loadStats failed", err);
        }
    }

    // ---- Modal Add/Edit
    const modal = new bootstrap.Modal($("#branchModal")[0]);

    $("#btnAddBranch").attr('data-perm', PERMS.create).on("click", async () => {
        if (!ensurePerm(PERMS.create)) return;
        openUpsert();
    });

    async function openUpsert(id = null) {
        $("#branchModalTitle").text(id ? "تعديل فرع" : "فرع جديد");
        resetForm("#frmBranch");

        // fill schools in form select (single)
        await loadSchoolsInto($("#schoolId"), false);

        if (id) {
            try {
                const b = await Api.get(ENDPOINTS.get(id));
                $("#branchId").val(b.id);
                $("#schoolId").val(b.schoolId).trigger("change");
                $("#name").val(b.name || "");
                $("#code").val(b.code || "");
                $("#status").val(b.status || "Active");
                $("#city").val(b.city || "");
                $("#district").val(b.district || "");
                $("#phone").val(b.phone || "");
                $("#managerName").val(b.managerName || "");
                $("#capacity").val(b.capacity ?? 0);
                $("#currentStudents").val(b.currentStudents ?? 0);
                $("#latitude").val(b.latitude ?? "");
                $("#longitude").val(b.longitude ?? "");
                $("#notes").val(b.notes ?? "");
            } catch (err) {
                console.error("load branch failed", err);
                return Swal.fire({ icon: "error", title: "تعذر تحميل البيانات" });
            }
        } else {
            // default school from filter if chosen
            const fSchool = $("#filterSchoolId").val();
            if (fSchool) $("#schoolId").val(fSchool).trigger("change");
            $("#status").val("Active");
        }
        modal.show();
    }

    $("#btnSaveBranch").on("click", async function () {
        const form = document.getElementById("frmBranch");
        if (!form.checkValidity()) { form.classList.add("was-validated"); return; }

        const dto = {
            id: +($("#branchId").val() || 0),
            schoolId: +($("#schoolId").val() || 0),
            name: $("#name").val()?.trim(),
            code: $("#code").val()?.trim(),
            status: $("#status").val() || "Active",
            city: $("#city").val()?.trim() || null,
            district: $("#district").val()?.trim() || null,
            phone: $("#phone").val()?.trim() || null,
            managerName: $("#managerName").val()?.trim() || null,
            capacity: +($("#capacity").val() || 0),
            currentStudents: +($("#currentStudents").val() || 0),
            latitude: $("#latitude").val() ? Number($("#latitude").val()) : null,
            longitude: $("#longitude").val() ? Number($("#longitude").val()) : null,
            notes: $("#notes").val()?.trim() || null
        };

        try {
            const saved = dto.id
                ? await Api.put(ENDPOINTS.update(dto.id), dto)
                : await Api.post(ENDPOINTS.create(), dto);

            if (saved) {
                Swal.fire({ icon: "success", title: "تم الحفظ", timer: 1200, showConfirmButton: false });
                modal.hide();
                dt.ajax.reload(null, false);
                loadStats();
            }
        } catch (err) {
            console.error("save branch failed", err);
            const msg = err?.responseJSON?.message || err?.responseText || "حدث خطأ أثناء الحفظ";
            Swal.fire({ icon: "error", title: "فشل الحفظ", text: String(msg).substring(0, 400) });
        }
    });

    // ---- Row actions
    async function onEdit() {
        if (!ensurePerm(PERMS.update)) return;
        openUpsert($(this).data("id"));
    }

    async function onDelete() {
        if (!ensurePerm(PERMS.delete)) return;
        const id = $(this).data("id");
        const conf = await Swal.fire({
            icon: "warning", title: "حذف الفرع", text: "هل أنت متأكد من الحذف؟",
            showCancelButton: true, confirmButtonText: "حذف", cancelButtonText: "إلغاء"
        });
        if (!conf.isConfirmed) return;
        try {
            await Api.delete(ENDPOINTS.delete(id));
            Swal.fire({ icon: "success", title: "تم الحذف", timer: 900, showConfirmButton: false });
            dt.ajax.reload(null, false);
            loadStats();
        } catch (err) {
            console.error("delete failed", err);
            Swal.fire({ icon: "error", title: "تعذر حذف الفرع", text: err?.responseJSON?.message || "" });
        }
    }

    // ---- Bulk actions
    $("#bulkActivate").on("click", () => bulkToggle("Active"));
    $("#bulkDeactivate").on("click", () => bulkToggle("Inactive"));
    $("#bulkDelete").on("click", bulkDelete);
    $("#bulkTransfer").on("click", async () => {
        const ids = selectedIds(); if (!ids.length) return;
        await loadSchoolsInto($("#transferSchoolId"), false);
        new bootstrap.Modal("#transferModal").show();
    });
    $("#btnConfirmTransfer").on("click", bulkTransferConfirm);

    function selectedIds() { return $(".row-check:checked").map((_, el) => +el.dataset.id).get(); }

    async function bulkToggle(status) {
        if (!ensurePerm(PERMS.update)) return;
        const ids = selectedIds(); if (!ids.length) return;
        const conf = await Swal.fire({
            icon: "question", title: status === "Active" ? "تفعيل المحدد؟" : "تعطيل المحدد؟",
            showCancelButton: true, confirmButtonText: "تأكيد", cancelButtonText: "إلغاء"
        });
        if (!conf.isConfirmed) return;

        try {
            await Promise.all(ids.map(id => Api.put(ENDPOINTS.update(id), { id, status })));
            Swal.fire({ icon: "success", title: "تم التحديث", timer: 900, showConfirmButton: false });
            dt.ajax.reload(null, false);
            loadStats();
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
            await Promise.all(ids.map(id => Api.delete(ENDPOINTS.delete(id))));
            Swal.fire({ icon: "success", title: "تم الحذف", timer: 900, showConfirmButton: false });
            dt.ajax.reload(null, false);
            loadStats();
            $("#chkAll").prop("checked", false).trigger("change");
            $(".row-check").prop("checked", false).trigger("change");
        } catch (err) {
            console.error("bulk delete failed", err);
            Swal.fire({ icon: "error", title: "تعذر الحذف الجماعي" });
        }
    }

    async function bulkTransferConfirm() {
        const ids = selectedIds(); if (!ids.length) return;
        const toSchoolId = +($("#transferSchoolId").val() || 0);
        if (!toSchoolId) return;

        const conf = await Swal.fire({
            icon: "question", title: "تأكيد نقل الفروع المحددة؟",
            showCancelButton: true, confirmButtonText: "نقل", cancelButtonText: "إلغاء"
        });
        if (!conf.isConfirmed) return;

        try {
            // نفذ نقل جماعي عبر تحديث schoolId لكل فرع
            await Promise.all(ids.map(id => Api.put(ENDPOINTS.update(id), { id, schoolId: toSchoolId })));
            Swal.fire({ icon: "success", title: "تم النقل", timer: 900, showConfirmButton: false });
            dt.ajax.reload(null, false);
            loadStats();
            $("#chkAll").prop("checked", false).trigger("change");
            $(".row-check").prop("checked", false).trigger("change");
            bootstrap.Modal.getInstance(document.getElementById('transferModal'))?.hide();
        } catch (err) {
            console.error("bulk transfer failed", err);
            Swal.fire({ icon: "error", title: "تعذر النقل" });
        }
    }

    // ---- Inline edit helpers
    async function inlineEditText(cell, row, field) {
        if (!ensurePerm(PERMS.update)) return;
        const old = row[field] ?? "";
        const $td = $(cell.node());
        $td.off("click");
        $td.html(`<input type="text" class="form-control form-control-sm" value="${esc(old)}">`);
        const $inp = $td.find("input");
        $inp.trigger("focus").on("keydown blur", async (e) => {
            if (e.type === "keydown" && !["Enter", "Escape"].includes(e.key)) return;
            const cancel = e.key === "Escape";
            const val = cancel ? old : ($inp.val() || "").trim();
            try { if (!cancel && val !== old) await Api.put(ENDPOINTS.update(row.id), { id: row.id, [field]: val }); }
            catch (err) { console.error("inline edit failed", err); Swal.fire({ icon: "error", title: "تعذر التعديل" }); }
            dt.ajax.reload(null, false);
        });
    }

    async function inlineEditNumber(cell, row, field) {
        if (!ensurePerm(PERMS.update)) return;
        const old = Number(row[field] ?? 0);
        const $td = $(cell.node());
        $td.off("click");
        $td.html(`<input type="number" class="form-control form-control-sm" value="${old}">`);
        const $inp = $td.find("input");
        $inp.trigger("focus").on("keydown blur", async (e) => {
            if (e.type === "keydown" && !["Enter", "Escape"].includes(e.key)) return;
            const cancel = e.key === "Escape";
            const val = cancel ? old : Number($inp.val() || 0);
            try { if (!cancel && val !== old) await Api.put(ENDPOINTS.update(row.id), { id: row.id, [field]: val }); }
            catch (err) { console.error("inline edit failed", err); Swal.fire({ icon: "error", title: "تعذر التعديل" }); }
            dt.ajax.reload(null, false);
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
            try { if (val !== old) await Api.put(ENDPOINTS.update(row.id), { id: row.id, [field]: val }); }
            catch (err) { console.error("inline edit failed", err); Swal.fire({ icon: "error", title: "تعذر التعديل" }); }
            dt.ajax.reload(null, false);
        });
    }

    // ---- Utils
    function resetForm(sel) { return window.forms?.resetForm?.(sel) || $(sel)[0].reset(); }
    function debounce(fn, ms = 300) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }

    // ---- Init
    if (window.Authorize?.load) { try { await Authorize.load(); } catch { } }
    applyAuth(document);

    // ensure select2 on school filters prepared (already loaded above)
    await loadTable();

    // top buttons auth attributes
    $("#btnAddBranch").attr('data-perm', PERMS.create);
    $("#btnExport").attr('data-perm', PERMS.export);
    applyAuth(document);
});
