// js/screens/role-management.js
$(async function () {
    let catalog = [];
    let roles = [];
    let selectedRoleId = null;
    let snapshotPerms = [];

    // -------- Helpers ----------
    const setSidebarCount = (n) => {
        // ✅ استخدم id مخصص في الشريط الجانبي
        const $el = $("#sidebarRoleUsersCount");
        if ($el.length) $el.text(`${n} مستخدم`);
    };

    const setModalCount = (n) => {
        // ✅ استخدم id مخصص داخل المودال
        const $el = $("#modalRoleUsersCount");
        if ($el.length) $el.text(n);
    };

    const normalizeRoles = (list) =>
        (list || []).map(r => ({
            ...r,
            // طبع الحقول لتكون موحدة على الواجهة
            usersCount: typeof r.usersCount === "number" ? r.usersCount : 0,
            perms: Array.isArray(r.permissions) ? r.permissions : (r.perms || []),
            createdAt: r.createdAt ? new Date(r.createdAt) : null
        }));

    // -------- API loading ----------
    async function loadAll() {
        try {
            const flatPermissions = await apiGet(API.base + "/Permissions");
            const rawRoles = await apiGet(API.roles);
            roles = normalizeRoles(rawRoles);

            // تجميع الصلاحيات { key, name, items[] }
            const grouped = {};
            flatPermissions.forEach(p => {
                const cat = p.category || "أخرى";
                if (!grouped[cat]) grouped[cat] = { key: cat, name: cat, items: [] };
                grouped[cat].items.push({ key: p.key, name: p.displayName || p.name });
            });
            catalog = Object.values(grouped);
        } catch (e) {
            toastError("فشل تحميل البيانات");
            console.error(e);
        }
    }

    // -------- UI builders ----------
    function renderRolesList() {
        const $list = $("#rolesList").empty();
        const $select = $("#roleSelect").empty();

        roles.forEach(r => {
            const item = $(`
        <div class="role-item ${r.id === selectedRoleId ? "active" : ""}" data-id="${r.id}">
          <div class="d-flex align-items-center justify-content-between">
            <div class="fw-bold">${escapeHtml(r.name)}</div>
            <span class="tag">${r.usersCount || 0} مستخدم</span>
          </div>
        </div>
      `);
            item.on("click", () => selectRole(r.id));
            $list.append(item);

            $select.append(new Option(`${r.name} (${r.usersCount || 0})`, r.id));
        });

        // لو كنت مفعل Select2
        if ($.fn.select2) {
            $select.off("change").on("change", function () {
                const id = parseInt($(this).val(), 10);
                if (!isNaN(id)) selectRole(id);
            });
            $select.val(selectedRoleId).trigger("change.select2");
        } else {
            $select.val(selectedRoleId);
        }
    }

    function buildPermPanel() {
        const $container = $("#permPanel").empty();

        catalog.forEach((cat, idx) => {
            const catId = `cat_${idx}`;
            const card = $(`
        <div class="perm-cat">
          <div class="d-flex align-items-center justify-content-between">
            <div class="perm-title">${cat.name}</div>
            <div class="d-flex align-items-center gap-2">
              <div class="form-check m-0">
                <input class="form-check-input parent-check" type="checkbox" data-cat="${cat.key}">
                <label class="form-check-label small text-muted">تحديد الكل</label>
              </div>
              <button class="btn btn-sm btn-light border toggleCat"><i class="bi bi-caret-down-fill"></i></button>
            </div>
          </div>
          <div class="perm-grid mt-2" id="${catId}">
            ${cat.items.map(i => `
              <div class="form-check">
                <input class="form-check-input perm-item" type="checkbox" data-key="${i.key}" data-cat="${cat.key}">
                <label class="form-check-label">${i.name}</label>
              </div>
            `).join("")}
          </div>
        </div>
      `);

            card.find(".parent-check").on("change", function () {
                const on = $(this).is(":checked");
                card.find(".perm-item").prop("checked", on).trigger("change", { bubble: false });
            });

            card.find(".toggleCat").on("click", function () {
                $("#" + catId).slideToggle(120);
                $(this).find("i").toggleClass("bi-caret-down-fill bi-caret-up-fill");
            });

            $container.append(card);
        });

        // بحث
        $("#permSearch").off("input").on("input", debounce(function () {
            const q = this.value.trim();
            $(".perm-cat").show();
            if (!q) { $(".perm-grid .form-check").show(); return; }

            $(".perm-grid .form-check").each(function () {
                const match = $(this).text().includes(q);
                $(this).toggle(match);
            });
            $(".perm-cat").each(function () {
                $(this).toggle($(this).find(".form-check:visible").length > 0);
            });
        }, 200));
    }

    // -------- UI behaviors ----------
    function selectRole(id) {
        selectedRoleId = id;

        $(".role-item").removeClass("active");
        $(`.role-item[data-id="${id}"]`).addClass("active");

        const role = roles.find(r => r.id === id) || {};
        // ✅ عدّاد الشريط الجانبي
        setSidebarCount(role.usersCount || 0);

        // إشارات الصلاحيات
        $(".perm-item").prop("checked", false).trigger("change", { bubble: false });
        (role.perms || []).forEach(k => {
            $(`.perm-item[data-key="${k}"]`).prop("checked", true).trigger("change", { bubble: false });
        });

        snapshotPerms = [...(role.perms || [])];
        $("#lastEdited").text(fmtDate(new Date()));
    }

    function collectChecked() {
        return $(".perm-item:checked").map((_, el) => $(el).data("key")).get();
    }

    async function saveRole(btn) {
        const perms = collectChecked();
        Forms.setBtnLoading(btn, true);
        try {
            // ✅ أرسل الجسم الصحيح
            await apiPut(API.roles + "/" + selectedRoleId + "/permissions", { permissions: perms });
            const role = roles.find(r => r.id === selectedRoleId);
            if (role) role.perms = [...perms];
            snapshotPerms = [...perms];
            toastSuccess("تم الحفظ بنجاح");
        } catch (e) {
            handleApiError(e);
        } finally {
            Forms.setBtnLoading(btn, false, '<i class="bi bi-save2 me-1"></i>حفظ التغييرات');
        }
    }

    function initRolesTable() {
        DTable.build("#rolesTable", {
            data: roles.map((r, i) => [i + 1, r.name, r.usersCount || 0, (r.perms || []).length, r.createdAt ? fmtDate(r.createdAt) : "-"]),
            columns: [
                { title: "#" },
                { title: "اسم المجموعة" },
                { title: "المستخدمون" },
                { title: "عدد الصلاحيات" },
                { title: "تاريخ الإنشاء" }
            ]
        });
    }

    function bindEvents() {
        $("#expandAll").on("click", () => $(".perm-grid").slideDown(120));
        $("#collapseAll").on("click", () => $(".perm-grid").slideUp(120));
        $("#selectAll").on("click", () => $(".perm-item").prop("checked", true).trigger("change"));
        $("#clearAll").on("click", () => $(".perm-item").prop("checked", false).trigger("change"));

        $("#btnSave").on("click", function () { saveRole(this); });
        $("#btnRevert").on("click", () => selectRole(selectedRoleId));
        $("#btnRolesTable").on("click", () => new bootstrap.Modal("#rolesTableModal").show());

        // إنشاء مجموعة
        $("#btnNewRole").on("click", () => new bootstrap.Modal("#newRoleModal").show());
        $("#createRole").on("click", async function () {
            const name = $("#newRoleName").val()?.trim();
            if (!name) return;
            try {
                const role = await apiPost(API.roles, { name });
                roles.push(...normalizeRoles([role]));
                renderRolesList();
                selectRole(role.id);
                bootstrap.Modal.getInstance(document.getElementById("newRoleModal")).hide();
            } catch (e) { handleApiError(e); }
        });

        // نسخ صلاحيات
        $("#btnCloneRole").on("click", () => {
            $("#cloneFrom").empty();
            roles.forEach(r => { if (r.id !== selectedRoleId) $("#cloneFrom").append(new Option(r.name, r.id)); });
            new bootstrap.Modal("#cloneRoleModal").show();
        });
        $("#applyClone").on("click", async function () {
            const fromRoleId = parseInt($("#cloneFrom").val(), 10);
            if (!fromRoleId) return;
            try {
                // ⚠️ إذا كان الـ API يتوقع int خام في Body، تأكد أن apiPost يرسل القيمة مباشرة وليس ككائن.
                await apiPost(API.roles + "/" + selectedRoleId + "/clone", fromRoleId);
                const src = roles.find(r => r.id === fromRoleId);
                const dest = roles.find(r => r.id === selectedRoleId);
                if (src && dest) dest.perms = [...(src.perms || [])];
                selectRole(selectedRoleId);
                bootstrap.Modal.getInstance(document.getElementById("cloneRoleModal")).hide();
            } catch (e) { handleApiError(e); }
        });

        // إعادة تسمية
        $("#renameRole").on("click", async () => {
            const r = roles.find(x => x.id === selectedRoleId);
            if (!r) return;
            const res = await Swal.fire({ title: "إعادة تسمية", input: "text", inputValue: r.name, showCancelButton: true });
            if (res.isConfirmed) {
                try { await apiPut(API.roles + "/" + r.id, { name: res.value }); r.name = res.value; renderRolesList(); selectRole(r.id); }
                catch (e) { handleApiError(e); }
            }
        });

        // حذف
        $("#deleteRole").on("click", async () => {
            const r = roles.find(x => x.id === selectedRoleId);
            if (!r) return;
            if (r.usersCount > 0) return Swal.fire({ icon: "info", text: "لا يمكن الحذف والمجموعة مرتبطة بمستخدمين" });
            const ok = await confirmDelete("هل تريد حذف هذه المجموعة؟");
            if (ok.isConfirmed) {
                try {
                    await apiDelete(API.roles + "/" + r.id);
                    roles = roles.filter(x => x.id !== r.id);
                    renderRolesList();
                    if (roles[0]) selectRole(roles[0].id);
                } catch (e) { handleApiError(e); }
            }
        });

        // عرض مستخدمي المجموعة
        $("#viewRoleUsers").on("click", async () => {
            if (!selectedRoleId) return;
            try {
                const users = await apiGet(API.roles + "/" + selectedRoleId + "/users");
                const role = roles.find(r => r.id === selectedRoleId);

                // تفاصيل المجموعة في المودال
                $("#roleName").text(role?.name || "غير معروف");
                setModalCount(users.length);
                $("#roleCreatedAt").text(role?.createdAt ? fmtDate(role.createdAt) : "-");

                // حدّث العدد في الذاكرة والقائمة والعداد الجانبي
                if (role) role.usersCount = users.length;
                renderRolesList();
                selectRole(selectedRoleId);

                // تعبئة الجدول
                const $tbody = $("#roleUsersTable tbody").empty();
                if (!users.length) {
                    $tbody.append(`
            <tr>
              <td colspan="7" class="text-center text-muted py-4">
                <i class="bi bi-info-circle me-2"></i> لا يوجد مستخدمون في هذه المجموعة
              </td>
            </tr>
          `);
                } else {
                    users.forEach((u, idx) => {
                        $tbody.append(`
              <tr>
                <td>${idx + 1}</td>
                <td><i class="bi bi-person-circle me-2 text-primary"></i>${escapeHtml(u.username)}</td>
                <td>${escapeHtml(u.fullName || "-")}</td>
                <td>${escapeHtml(u.email || "-")}</td>
                <td>${escapeHtml(u.phone || "-")}</td>
                <td>${u.lastLogin ? fmtDate(u.lastLogin) : "-"}</td>
                <td>
                  <span class="badge ${String(u.status).toLowerCase() === "active" ? "bg-success" : "bg-danger"}">
                    ${String(u.status).toLowerCase() === "active" ? "نشط" : "موقوف"}
                  </span>
                </td>
              </tr>
            `);
                    });
                }

                new bootstrap.Modal("#roleUsersModal").show();
            } catch (e) {
                handleApiError(e);
            }
        });
    }

    // -------- Bootstrap flow ----------
    await loadAll();
    buildPermPanel();
    selectedRoleId = roles?.[0]?.id || null;
    renderRolesList();
    if (selectedRoleId) selectRole(selectedRoleId);
    bindEvents();
    initRolesTable();
});
