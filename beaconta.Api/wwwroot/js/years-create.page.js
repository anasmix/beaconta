// شاشة إدارة السنوات الدراسية — مطابقة لنمط الصفوف/الشُعب
// يعتمد على: api.js, utils.js, forms.js, datatable.js

(function () {
    'use strict';

    // التقاط إعداد الـAPI كما في الصفوف/الشعب
    const ApiCfg = (window && window.API) ? window.API : { base: "/api" };

    const ENDPOINTS = {
        branches: `${ApiCfg.base}/branches`,                  // GET: [{id,name}]
        list: `${ApiCfg.base}/school-years`,              // GET: ?branchId=&status=&isActive=
        getOne: (id) => `${ApiCfg.base}/school-years/${id}`,// GET
        upsert: `${ApiCfg.base}/school-years`,              // POST/PUT
        remove: (id) => `${ApiCfg.base}/school-years/${id}`,// DELETE
        setActive: `${ApiCfg.base}/school-years/set-active`,   // POST {branchId, yearId}
        overlaps: `${ApiCfg.base}/school-years/overlaps`      // POST {branchId,startDate,endDate,id?}
    };

    const $table = $("#yearsTable");
    const $filterForm = $("#filterForm");
    const $yearModal = new bootstrap.Modal($("#yearModal")[0]);
    const $activeModal = new bootstrap.Modal($("#activeModal")[0]);

    $(".select2").select2({ width: '100%', dir: "rtl", theme: "bootstrap-5" });

    // Utils مختصرة (تfallback إن غابت utils.js/forms.js)
    const fmtDate = (d) => window.utils?.fmtDate?.(d) || (d ? String(d).substring(0, 10) : "—");
    const escapeHtml = (s) => window.utils?.escapeHtml?.(s) ?? String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[m]));
    const toast = {
        success: (m) => (window.utils?.toast?.success || console.log)(m),
        error: (m) => (window.utils?.toast?.error || console.error)(m)
    };
    const confirmDialog = (m) => window.utils?.confirmDialog ? window.utils.confirmDialog(m) : Promise.resolve(window.confirm(m));
    const serializeForm = (sel) => window.forms?.serializeForm?.(sel) || (function () { const o = {}; $(sel).serializeArray().forEach(x => o[x.name] = o[x.name] ? [].concat(o[x.name], x.value) : x.value); $(sel).find("input[type=checkbox]").each(function () { o[this.name] = this.checked; }); return o; })();
    const setFormValues = (sel, obj) => window.forms?.setFormValues?.(sel, obj) || (function () { const $f = $(sel); Object.entries(obj || {}).forEach(([k, v]) => { const $el = $f.find(`[name='${k}']`); if ($el.is(":checkbox")) $el.prop("checked", !!v); else $el.val(v); if ($el.hasClass("select2")) $el.trigger("change"); }); })();
    const resetForm = (sel) => window.forms?.resetForm?.(sel) || $(sel)[0].reset();

    const apiGet = window.api?.get || (url => $.getJSON(url));
    const apiPost = window.api?.post || ((url, body) => $.ajax({ url, method: "POST", data: JSON.stringify(body), contentType: "application/json" }));
    const apiPut = window.api?.put || ((url, body) => $.ajax({ url, method: "PUT", data: JSON.stringify(body), contentType: "application/json" }));
    const apiDelete = window.api?.delete || (url => $.ajax({ url, method: "DELETE" }));
    const makeDataTable = window.datatable?.make || ((tbl, opts) => $(tbl).DataTable(opts));

    // ألوان ووسوم
    function pickReadableText(hex = "#0d6efd") {
        try {
            const c = hex.replace("#", ""); const r = parseInt(c.substr(0, 2), 16); const g = parseInt(c.substr(2, 2), 16); const b = parseInt(c.substr(4, 2), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000; return (yiq >= 150) ? "#111" : "#fff";
        } catch { return "#fff"; }
    }
    const colorBadge = (hex, text) => hex
        ? `<span class="year-badge" style="background:${hex};color:${pickReadableText(hex)}"><span class="legend-dot" style="background:${pickReadableText(hex)};border-color:#0003"></span>${escapeHtml(text || hex)}</span>`
        : `<span class="text-muted">—</span>`;

    const statusPill = (s) => {
        let cls = "secondary";
        if (s === "Open") cls = "warning";
        else if (s === "Closed") cls = "danger";
        else if (s === "Archived") cls = "dark";
        return `<span class="badge status-badge bg-${cls}">${escapeHtml(s || "—")}</span>`;
    };

    // تحميل الفروع في الفلاتر والمودالات
    async function loadBranches() {
        const list = await apiGet(ENDPOINTS.branches);
        const $f = $("#filterBranchId"); $f.find("option:not([value=''])").remove();
        (list || []).forEach(b => $f.append(new Option(b.name, b.id)));

        const $sel1 = $("#yearForm select[name='branchId']"); $sel1.empty();
        (list || []).forEach(b => $sel1.append(new Option(b.name, b.id)));

        const $sel2 = $("#activeForm select[name='branchId']"); $sel2.empty();
        (list || []).forEach(b => $sel2.append(new Option(b.name, b.id)));
    }

    function buildQuery() {
        const p = new URLSearchParams();
        const branchId = $("#filterBranchId").val(); const status = $("#filterStatus").val(); const active = $("#filterActive").val();
        if (branchId) p.set("branchId", branchId);
        if (status) p.set("status", status);
        if (active !== "") p.set("isActive", active);
        const q = p.toString();
        return q ? `?${q}` : "";
    }

    let dt = null;
    async function loadTable() {
        const url = ENDPOINTS.list + buildQuery();
        if (dt) { dt.ajax.url(url).load(); return; }

        dt = makeDataTable($table, {
            ajax: { url, dataSrc: "" },
            order: [[0, "desc"]],
            columns: [
                {
                    data: "yearCode", title: "السنة",
                    render: (v, _, row) => {
                        const star = row.isActive ? `<i class="bi bi-star-fill text-success ms-1" title="فعّالة"></i>` : "";
                        return `<div class="d-flex align-items-center gap-2">${star}<span class="fw-bold">${escapeHtml(v)}</span></div>`;
                    }
                },
                { data: "name", title: "الاسم", render: v => `<span class="fw-semibold">${escapeHtml(v)}</span>` },
                { data: "branchName", title: "الفرع" },
                { data: null, title: "الفترة", render: r => `${fmtDate(r.startDate)} — ${fmtDate(r.endDate)}` },
                { data: "status", title: "الحالة", render: statusPill },
                { data: "isActive", title: "فعّالة", render: v => v ? `<span class="badge bg-success">نعم</span>` : `<span class="badge bg-secondary">لا</span>` },
                { data: "colorHex", title: "اللون", render: (hex, __, row) => colorBadge(hex, row.yearCode) },
                {
                    data: null, title: "أوامر", orderable: false, searchable: false,
                    render: (_, __, row) => {
                        const id = row.id;
                        return `<div class="btn-group btn-group-sm">
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

        // Events Delegation
        $table.on("click", ".btn-edit", onEdit);
        $table.on("click", ".btn-clone", onClone);
        $table.on("click", ".btn-closeyr", onCloseYear);
        $table.on("click", ".btn-del", onDelete);
    }

    // أزرار التولبار
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

    $filterForm.on("submit", (e) => { e.preventDefault(); loadTable(); });

    // فتح مودال إضافة/تعديل/استنساخ
    async function openUpsert(id = null, cloneFrom = null) {
        $("#yearModalTitle").text(id ? "تعديل السنة" : (cloneFrom ? "استنساخ سنة" : "سنة جديدة"));
        resetForm("#yearForm");
        $("#overlapAlert").addClass("d-none");

        if (id || cloneFrom) {
            const data = await apiGet(ENDPOINTS.getOne(id || cloneFrom));
            setFormValues("#yearForm", {
                id: id ? data.id : "",
                yearCode: cloneFrom ? nextYearCode(data.yearCode) : data.yearCode,
                name: cloneFrom ? `${data.name} (نسخة)` : data.name,
                branchId: data.branchId,
                startDate: data.startDate?.substring(0, 10),
                endDate: data.endDate?.substring(0, 10),
                status: cloneFrom ? "Open" : data.status,
                colorHex: data.colorHex || "#0d6efd",
                isActive: false,
                notes: data.notes || ""
            });
            $("#yearForm select[name='branchId']").val(data.branchId).trigger("change");
        } else {
            setFormValues("#yearForm", { status: "Open", colorHex: "#0d6efd", isActive: false });
        }

        $yearModal.show();
    }

    function nextYearCode(code = "") {
        const m = code.match(/(\d{4})\D+(\d{4})/);
        if (!m) return code;
        const a = (+m[1]) + 1, b = (+m[2]) + 1;
        return `${a}/${b}`;
    }

    // تحقق تداخل التواريخ
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
    $("#yearForm [name='branchId'], #yearForm [name='startDate'], #yearForm [name='endDate']").on("change", checkOverlap);

    // حفظ
    $("#yearForm").on("submit", async function (e) {
        e.preventDefault();
        const dto = serializeForm("#yearForm");

        if (new Date(dto.endDate) < new Date(dto.startDate)) {
            toast.error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية.");
            return;
        }

        const ok = await checkOverlap();
        if (!ok) {
            const sure = await confirmDialog("توجد سنوات تتقاطع مع هذه الفترة لنفس الفرع. هل تريد المتابعة؟");
            if (!sure) return;
        }

        const isEdit = !!dto.id;
        const verb = isEdit ? apiPut : apiPost;

        const payload = {
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
        };

        const saved = await verb(ENDPOINTS.upsert, payload);
        if (saved) {
            toast.success("تم الحفظ بنجاح.");
            $yearModal.hide();
            loadTable();
        }
    });

    // أوامر الصف
    async function onEdit() { const id = $(this).data("id"); openUpsert(id, null); }
    async function onClone() { const id = $(this).data("id"); openUpsert(null, id); }
    async function onCloseYear() {
        const id = $(this).data("id");
        const yes = await confirmDialog("سيتم تحويل حالة السنة إلى 'مغلق'. هل أنت متأكد؟");
        if (!yes) return;
        const data = await apiGet(ENDPOINTS.getOne(id));
        await apiPut(ENDPOINTS.upsert, { ...data, status: "Closed" });
        toast.success("تم إغلاق السنة.");
        loadTable();
    }
    async function onDelete() {
        const id = $(this).data("id");
        const yes = await confirmDialog("هل تريد حذف هذه السنة؟");
        if (!yes) return;
        await apiDelete(ENDPOINTS.remove(id));
        toast.success("تم الحذف.");
        loadTable();
    }

    // مودال تعيين سنة فعّالة
    async function openSetActive() {
        const branchId = $("#filterBranchId").val() || "";
        $("#activeForm select[name='branchId']").val(branchId).trigger("change");
        await populateYearsForBranch(branchId || null);
        $activeModal.show();
    }
    async function populateYearsForBranch(branchId) {
        const $y = $("#activeForm select[name='yearId']");
        $y.empty();
        const q = branchId ? `?branchId=${branchId}` : "";
        const years = await apiGet(ENDPOINTS.list + q);
        (years || []).forEach(y => {
            const label = `${y.yearCode} — ${y.name}`;
            $y.append(new Option(label, y.id, false, y.isActive === true));
        });
    }
    $("#activeForm select[name='branchId']").on("change", async function () {
        await populateYearsForBranch($(this).val());
    });
    $("#activeForm").on("submit", async function (e) {
        e.preventDefault();
        const dto = serializeForm("#activeForm");
        await apiPost(ENDPOINTS.setActive, { branchId: +dto.branchId, yearId: +dto.yearId });
        toast.success("تم تعيين السنة الفعّالة للفرع.");
        $activeModal.hide();
        loadTable();
    });

    // تمهيد الصفحة
    (async function init() {
        await loadBranches();
        await loadTable();
        $("#btnAdd").trigger("focus");
    })();
})();
