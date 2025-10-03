// js/screens/school-years.js
// شاشة إدارة السنوات الدراسية — Beaconta
// يعتمد على: api.js, utils.js, forms.js, datatable.js

$(function () {

    // ===== إصلاح الترتيب/الـTDZ: خذ الإعداد من window.API مبكراً وباسم مختلف =====
    const ApiCfg = (window && window.API) ? window.API : { base: "/api" };

    // حارس للتأكد من جاهزية واجهة API حتى لو اختلف ترتيب التحميل
    function whenApiReady(fn, tries = 40) {
        if (window.API && window.api && typeof window.api.get === "function") return fn();
        if (tries <= 0) { console.error("API لم يتم تهيئته."); return; }
        setTimeout(() => whenApiReady(fn, tries - 1), 50);
    }

    // ===== إعدادات عامة =====
    const ENDPOINTS = {
        branches: `${ApiCfg.base}/branches`,                 // GET: قائمة الفروع [{id,name},...]
        listYears: `${ApiCfg.base}/school-years`,            // GET with query: branchId,status,isActive
        getYear: (id) => `${ApiCfg.base}/school-years/${id}`,// GET
        upsert: `${ApiCfg.base}/school-years`,               // POST/PUT
        delete: (id) => `${ApiCfg.base}/school-years/${id}`, // DELETE (يفضل Soft Delete)
        setActive: `${ApiCfg.base}/school-years/set-active`, // POST {branchId, yearId}
        overlaps: `${ApiCfg.base}/school-years/overlaps`     // POST {branchId,startDate,endDate,id?}
    };

    const $table = $("#yearsTable");
    const $filterForm = $("#filterForm");
    const $yearModal = new bootstrap.Modal($("#yearModal")[0]);
    const $activeModal = new bootstrap.Modal($("#activeModal")[0]);

    // Select2 تهيئة
    $(".select2").select2({ width: '100%', dir: "rtl" });

    // تحميل الفروع في الفلتر و المودالات
    async function loadBranches() {
        const list = await apiGet(ENDPOINTS.branches);
        // تعبئة فلتر الفروع
        const $f = $("#filterBranchId");
        $f.find("option:not([value=''])").remove();
        (list || []).forEach(b => $f.append(new Option(b.name, b.id)));

        // تعبئة حقل الفرع في مودال الإنشاء/التعديل
        const $branchSelect = $("#yearForm select[name='branchId']");
        $branchSelect.find("option").remove();
        (list || []).forEach(b => $branchSelect.append(new Option(b.name, b.id)));

        // تعبئة الفرع في مودال تعيين سنة فعّالة
        const $branchActive = $("#activeForm select[name='branchId']");
        $branchActive.find("option").remove();
        (list || []).forEach(b => $branchActive.append(new Option(b.name, b.id)));
    }

    // DataTable
    let dt = null;

    function colorBadge(hex, text) {
        const fg = pickReadableText(hex);
        return `<span class="year-badge" style="background:${hex}; color:${fg}">
              <span class="legend-dot" style="background:${fg}; border-color:#0003"></span>${text || hex}
            </span>`;
    }

    function statusPill(status) {
        let cls = "secondary";
        if (status === "Open") cls = "warning";
        if (status === "Closed") cls = "danger";
        if (status === "Archived") cls = "dark";
        return `<span class="badge status-badge bg-${cls}">${status}</span>`;
    }

    // اختيار لون نص مناسب للخلفية
    function pickReadableText(hex = "#0d6efd") {
        try {
            const c = hex.replace("#", "");
            const r = parseInt(c.substr(0, 2), 16);
            const g = parseInt(c.substr(2, 2), 16);
            const b = parseInt(c.substr(4, 2), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 150) ? "#111" : "#fff";
        } catch {
            return "#fff";
        }
    }

    async function loadTable() {
        const query = buildQuery();
        const url = ENDPOINTS.listYears + query;

        if (dt) {
            dt.ajax.url(url).load();
            return;
        }

        dt = makeDataTable($table, {
            ajax: { url, dataSrc: "" },
            order: [[0, "desc"]],
            columns: [
                {
                    data: "yearCode",
                    title: "السنة",
                    render: (v, _, row) => {
                        const isActive = row.isActive ? `<i class="bi bi-star-fill text-success ms-1" title="فعّالة الآن"></i>` : "";
                        return `<div class="d-flex align-items-center gap-2">
                      ${isActive}
                      <span class="fw-bold">${escapeHtml(v)}</span>
                    </div>`;
                    }
                },
                { data: "name", title: "الاسم", render: (v) => `<span class="fw-semibold">${escapeHtml(v)}</span>` },
                { data: "branchName", title: "الفرع" },
                {
                    data: null, title: "الفترة",
                    render: (r) => `${fmtDate(r.startDate)} — ${fmtDate(r.endDate)}`
                },
                { data: "status", title: "الحالة", render: (v) => statusPill(v) },
                {
                    data: "isActive", title: "فعّالة",
                    render: (v) => v ? `<span class="badge bg-success">نعم</span>` : `<span class="badge bg-secondary">لا</span>`
                },
                {
                    data: "colorHex", title: "اللون",
                    render: (hex, _, row) => hex ? colorBadge(hex, row.yearCode) : `<span class="text-muted">—</span>`
                },
                {
                    data: null, title: "أوامر", orderable: false, searchable: false,
                    render: (_, __, row) => {
                        const id = row.id;
                        return `
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary btn-edit" data-id="${id}" title="تعديل"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-outline-secondary btn-clone" data-id="${id}" title="استنساخ"><i class="bi bi-files"></i></button>
                <button class="btn btn-outline-dark btn-closeyr" data-id="${id}" title="إغلاق"><i class="bi bi-lock"></i></button>
                <button class="btn btn-outline-danger btn-del" data-id="${id}" title="حذف"><i class="bi bi-trash"></i></button>
              </div>`;
                    }
                }
            ],
            dom: "Bfrtip",
            buttons: [
                { extend: "excelHtml5", text: "تصدير Excel", title: "SchoolYears" },
                { extend: "copyHtml5", text: "نسخ" }
            ]
        });

        // Events (delegated)
        $table.on("click", ".btn-edit", onEdit);
        $table.on("click", ".btn-clone", onClone);
        $table.on("click", ".btn-closeyr", onCloseYear);
        $table.on("click", ".btn-del", onDelete);
    }

    function buildQuery() {
        const p = new URLSearchParams();
        const branchId = $("#filterBranchId").val();
        const status = $("#filterStatus").val();
        const active = $("#filterActive").val();

        if (branchId) p.set("branchId", branchId);
        if (status) p.set("status", status);
        if (active !== "") p.set("isActive", active);

        return p.toString() ? `?${p.toString()}` : "";
    }

    // ===== Handlers: Toolbar =====
    $("#btnAdd").on("click", () => openUpsert());
    $("#btnSetActive").on("click", () => openSetActive());
    $("#btnExport").on("click", () => dt?.button(0).trigger());
    $("#btnRefresh").on("click", () => loadTable());

    $("#btnClearFilters").on("click", () => {
        $("#filterBranchId").val("").trigger("change");
        $("#filterStatus").val("");
        $("#filterActive").val("");
        $filterForm.trigger("submit");
    });

    $filterForm.on("submit", (e) => {
        e.preventDefault();
        loadTable();
    });

    // ===== Upsert Modal =====
    async function openUpsert(id = null, cloneFrom = null) {
        $("#yearModalTitle").text(id ? "تعديل السنة" : (cloneFrom ? "استنساخ سنة" : "سنة جديدة"));
        resetForm("#yearForm");

        if (id || cloneFrom) {
            const data = await apiGet(ENDPOINTS.getYear(id || cloneFrom));
            setFormValues("#yearForm", {
                id: id ? data.id : "",
                yearCode: cloneFrom ? nextYearCode(data.yearCode) : data.yearCode,
                name: cloneFrom ? (data.name + " (نسخة)") : data.name,
                branchId: data.branchId,
                startDate: data.startDate?.substring(0, 10),
                endDate: data.endDate?.substring(0, 10),
                status: cloneFrom ? "Open" : data.status,
                colorHex: data.colorHex || "#0d6efd",
                isActive: false, // لا ننسخ الفعالية
                notes: data.notes || ""
            });
            $("#yearForm select[name='branchId']").val(data.branchId).trigger("change");
        } else {
            // قيَم افتراضية
            setFormValues("#yearForm", {
                status: "Open",
                colorHex: "#0d6efd",
                isActive: false
            });
        }

        $("#overlapAlert").addClass("d-none");
        $yearModal.show();
    }

    function nextYearCode(code = "") {
        // يحول "2025/2026" -> "2026/2027" إن أمكن
        const m = code.match(/(\d{4})\D+(\d{4})/);
        if (!m) return code;
        const a = (+m[1]) + 1, b = (+m[2]) + 1;
        return `${a}/${b}`;
    }

    // تحقق تداخل التواريخ لنفس الفرع
    async function checkOverlap() {
        const dto = serializeForm("#yearForm");
        if (!dto.branchId || !dto.startDate || !dto.endDate) return true;

        const payload = {
            branchId: +dto.branchId,
            startDate: dto.startDate,
            endDate: dto.endDate,
            id: dto.id ? +dto.id : null
        };
        const res = await apiPost(ENDPOINTS.overlaps, payload);
        const hasOverlap = Array.isArray(res) ? res.length > 0 : !!res?.hasOverlap;
        $("#overlapAlert").toggleClass("d-none", !hasOverlap);
        return !hasOverlap;
    }

    // حفظ
    $("#yearForm").on("submit", async function (e) {
        e.preventDefault();
        const dto = serializeForm("#yearForm");

        // تحقق التواريخ
        if (new Date(dto.endDate) < new Date(dto.startDate)) {
            toast.error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية.");
            return;
        }

        const okDates = await checkOverlap();
        if (!okDates) {
            const sure = await confirmDialog("توجد سنوات تتقاطع مع هذه الفترة لنفس الفرع. هل تريد المتابعة؟");
            if (!sure) return;
        }

        const isEdit = !!dto.id;
        const verb = isEdit ? apiPut : apiPost;
        const saved = await verb(ENDPOINTS.upsert, {
            id: isEdit ? +dto.id : 0,
            yearCode: dto.yearCode?.trim(),
            name: dto.name?.trim(),
            branchId: +dto.branchId,
            startDate: dto.startDate,
            endDate: dto.endDate,
            status: dto.status,
            colorHex: dto.colorHex || null,
            isActive: !!dto.isActive,
            notes: dto.notes?.trim() || null
        });

        if (saved) {
            toast.success("تم الحفظ بنجاح.");
            $yearModal.hide();
            loadTable();
        }
    });

    // عند تغيير مدخلات التاريخ/الفرع افحص التداخل
    $("#yearForm [name='branchId'], #yearForm [name='startDate'], #yearForm [name='endDate']").on("change", checkOverlap);

    // أوامر الصف
    async function onEdit() {
        const id = $(this).data("id");
        openUpsert(id, null);
    }
    async function onClone() {
        const id = $(this).data("id");
        openUpsert(null, id);
    }
    async function onCloseYear() {
        const id = $(this).data("id");
        const yes = await confirmDialog("سيتم تحويل حالة السنة إلى 'مغلق'. هل أنت متأكد؟");
        if (!yes) return;
        const data = await apiGet(ENDPOINTS.getYear(id));
        await apiPut(ENDPOINTS.upsert, { ...data, status: "Closed" });
        toast.success("تم إغلاق السنة.");
        loadTable();
    }
    async function onDelete() {
        const id = $(this).data("id");
        const yes = await confirmDialog("هل تريد حذف هذه السنة؟");
        if (!yes) return;
        await apiDelete(ENDPOINTS.delete(id));
        toast.success("تم الحذف.");
        loadTable();
    }

    // ===== Modal: Set Active Year per Branch =====
    async function openSetActive() {
        // حمّل الخيارات
        const branchId = $("#filterBranchId").val() || "";
        $("#activeForm select[name='branchId']").val(branchId).trigger("change");

        await populateYearsForBranch(branchId || null);
        $activeModal.show();
    }

    async function populateYearsForBranch(branchId) {
        const $y = $("#activeForm select[name='yearId']");
        $y.find("option").remove();

        let q = "";
        if (branchId) q = `?branchId=${branchId}`;

        const years = await apiGet(ENDPOINTS.listYears + q);
        years?.forEach(y => {
            const label = `${y.yearCode} — ${y.name}`;
            $y.append(new Option(label, y.id, false, y.isActive === true));
        });
    }

    $("#activeForm select[name='branchId']").on("change", async function () {
        const branchId = $(this).val();
        await populateYearsForBranch(branchId);
    });

    $("#activeForm").on("submit", async function (e) {
        e.preventDefault();
        const dto = serializeForm("#activeForm");
        await apiPost(ENDPOINTS.setActive, { branchId: +dto.branchId, yearId: +dto.yearId });
        toast.success("تم تعيين السنة الفعّالة للفرع.");
        $activeModal.hide();
        loadTable();
    });

    // ===== Utils (تغليف بسيط لدوال موجودة في utils.js/forms.js) =====
    function fmtDate(d) { return window.utils?.fmtDate?.(d) || (d ? String(d).substring(0, 10) : "—"); }
    function escapeHtml(s) { return window.utils?.escapeHtml?.(s) ?? String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])); }
    function toastProxy(type, msg) { (window.utils?.toast?.[type] || console.log)(msg); }
    const toast = {
        success: (m) => toastProxy("success", m),
        error: (m) => toastProxy("error", m)
    };
    function confirmDialog(message) {
        if (window.utils?.confirmDialog) return window.utils.confirmDialog(message);
        return Promise.resolve(window.confirm(message));
    }
    function serializeForm(sel) {
        return window.forms?.serializeForm?.(sel) || (function () {
            const o = {}; $(sel).serializeArray().forEach(x => o[x.name] = o[x.name] ? [].concat(o[x.name], x.value) : x.value);
            // جمع حقول checkbox ذات switch
            $(sel).find("input[type=checkbox]").each(function () { o[this.name] = this.checked; });
            return o;
        })();
    }
    function setFormValues(sel, obj) {
        return window.forms?.setFormValues?.(sel, obj) || (function () {
            const $f = $(sel);
            Object.entries(obj || {}).forEach(([k, v]) => {
                const $el = $f.find(`[name='${k}']`);
                if ($el.is(":checkbox")) $el.prop("checked", !!v);
                else $el.val(v);
                if ($el.hasClass("select2")) $el.trigger("change");
            });
        })();
    }
    function resetForm(sel) { return window.forms?.resetForm?.(sel) || $(sel)[0].reset(); }

    // API shortcuts
    const apiGet = window.api?.get || (url => $.getJSON(url));
    const apiPost = window.api?.post || ((url, body) => $.ajax({ url, method: "POST", data: JSON.stringify(body), contentType: "application/json" }));
    const apiPut = window.api?.put || ((url, body) => $.ajax({ url, method: "PUT", data: JSON.stringify(body), contentType: "application/json" }));
    const apiDelete = window.api?.delete || (url => $.ajax({ url, method: "DELETE" }));
    const makeDataTable = window.datatable?.make || ((tbl, opts) => $(tbl).DataTable(opts));
    // ⚠️ تم حذف const API المحلي لتجنّب الـTDZ/الـShadowing

    // ===== Bootstrap =====
    whenApiReady(async () => {
        await loadBranches();
        await loadTable();
        // ربط الأزرار السريعة
        $("#btnAdd").trigger("focus");
    });
});
