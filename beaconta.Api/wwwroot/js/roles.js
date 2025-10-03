// js/screens/role-management.js
$(async function () {
    let catalog = [];
    let roles = [];
    let selectedRoleId = null;
    let snapshotPerms = [];

    // -------- Helpers ----------
    const setSidebarCount = (n) => $("#sidebarRoleUsersCount").text(`${n} مستخدم`);
    const setModalCount = (n) => $("#modalRoleUsersCount").text(n);

    const normalizeRoles = (list) =>
        (list || []).map(r => ({
            ...r,
            usersCount: typeof r.usersCount === "number" ? r.usersCount : 0,
            perms: Array.isArray(r.permissionIds) ? r.permissionIds : (r.perms || []),
            createdAt: r.createdAt ? new Date(r.createdAt) : null
        }));

    // -------- API loading ----------
    async function loadAll() {
        try {
            const catalogData = await apiGet(API.base + "/menu/catalog");
            const rawRoles = await apiGet(API.roles);
            roles = normalizeRoles(rawRoles);

            // ✅ حمّل الأفعال الديناميكية من الـ catalog
            catalog = catalogData.map(sec => ({
                key: sec.sectionKey,
                name: sec.title,
                items: sec.groups.flatMap(g =>
                    g.items.map(i => ({
                        id: i.itemKey,
                        key: i.itemKey,
                        name: i.title,
                        category: sec.title + " / " + g.title,
                        // actions: { actionKey, title, permissionKey }
                        actions: Array.isArray(i.actions) ? i.actions.map(a => ({
                            actionKey: a.actionKey,
                            title: a.title,
                            perm: a.permissionKey
                        })) : []
                    }))
                )
            }));
        } catch (e) {
            Utils.toastError("فشل تحميل البيانات");
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
                  <div class="fw-bold">${Utils.escapeHtml(r.name)}</div>
                  <span class="tag">${r.usersCount || 0} مستخدم</span>
                </div>
              </div>
            `);
            item.on("click", () => selectRole(r.id));
            $list.append(item);

            $select.append(new Option(`${r.name} (${r.usersCount || 0})`, r.id));
        });

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

    // -------- Collect checked permissions ----------
    const collectCheckedIds = () =>
        $(".perm-item:checked")
            .map((_, el) => el.dataset.id) // ✅ مفاتيح نصّية (permissionKey)
            .get()
            .filter(id => id);

    // -------- Build permissions panel (with dynamic actions) ----------
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
                    <button class="btn btn-sm btn-light border toggleCat" type="button">
                      <i class="bi bi-caret-down-fill"></i>
                    </button>
                  </div>
                </div>
                <div class="perm-grid mt-2" id="${catId}">
                  ${cat.items.map(i => `
                    <div class="border rounded-3 p-2">
                      <div class="d-flex align-items-center justify-content-between mb-1">
                        <label class="fw-bold mb-0">${i.name}</label>
                        <div class="form-check m-0">
                          <input class="form-check-input item-check" type="checkbox" data-item="${i.key}">
                          <label class="form-check-label small text-muted">الكل</label>
                        </div>
                      </div>
                      <div class="d-flex flex-wrap gap-3">
                        ${i.actions?.length
                    ? i.actions.map(a => `
                                <div class="form-check">
                                  <input class="form-check-input perm-item"
                                         type="checkbox"
                                         value="${a.perm}"
                                         data-id="${a.perm}"
                                         data-action="${a.actionKey}"
                                         data-key="${i.key}"
                                         data-cat="${cat.key}">
                                  <label class="form-check-label">
                                    ${Utils.escapeHtml(a.title || a.actionKey)}
                                    <span class="text-muted small">(${Utils.escapeHtml(a.actionKey)})</span>
                                  </label>
                                </div>
                              `).join("")
                    : `<div class="text-muted small">لا توجد أفعال معرفة لهذه الشاشة</div>`
                }
                      </div>
                    </div>
                  `).join("")}
                </div>
              </div>
            `);

            // تحديد/إلغاء تحديد كل أفعال الفئة
            card.find(".parent-check").on("change", function () {
                const on = $(this).is(":checked");
                card.find(".perm-item").prop("checked", on).trigger("change", { bubble: false });
                card.find(".item-check").prop("checked", on);
            });

            // تحديد/إلغاء تحديد كل أفعال شاشة واحدة (item)
            card.find(".item-check").on("change", function () {
                const on = $(this).is(":checked");
                const itemKey = $(this).data("item");
                card.find(`.perm-item[data-key="${itemKey}"]`).prop("checked", on).trigger("change", { bubble: false });
            });

            // طي/توسيع
            card.find(".toggleCat").on("click", function () {
                $("#" + catId).slideToggle(120);
                $(this).find("i").toggleClass("bi-caret-down-fill bi-caret-up-fill");
            });

            $container.append(card);
        });

        // البحث
        $("#permSearch").off("input").on("input", Utils.debounce(function () {
            const q = this.value.trim();
            $(".perm-cat").show();
            if (!q) { $(".perm-grid .border.p-2").show(); return; }

            $(".perm-grid .border.p-2").each(function () {
                const match = $(this).text().includes(q);
                $(this).toggle(match);
            });
            $(".perm-cat").each(function () {
                $(this).toggle($(this).find(".border.p-2:visible").length > 0);
            });
        }, 200));
    }

    // -------- Select Role ----------
    function selectRole(id) {
        selectedRoleId = id;

        $(".role-item").removeClass("active");
        $(`.role-item[data-id="${id}"]`).addClass("active");

        const role = roles.find(r => r.id === id) || {};
        setSidebarCount(role.usersCount || 0);

        // نظّف الاختيارات الحالية
        $(".perm-item").prop("checked", false).trigger("change", { bubble: false });
        $(".item-check, .parent-check").prop("checked", false);

        // فعّل الصلاحيات الخاصة بالدور (مفاتيح نصّية)
        (role.perms || []).forEach(permKey => {
            $(`.perm-item[data-id="${CSS.escape(permKey)}"]`)
                .prop("checked", true)
                .trigger("change", { bubble: false });
        });

        snapshotPerms = [...(role.perms || [])];
        $("#lastEdited").text(Utils.fmtDate(new Date()));
    }

    // -------- Save Role ----------
    async function saveRole(btn) {
        const ids = collectCheckedIds(); // مفاتيح نصّية (module.action)
        Forms.setBtnLoading(btn, true);
        try {
            const updatedRole = await apiPut(`${API.roles}/${selectedRoleId}/permissions`, { permissionIds: ids });

            const role = roles.find(r => r.id === selectedRoleId);
            if (role && updatedRole?.permissionIds) {
                role.perms = [...updatedRole.permissionIds];
                snapshotPerms = [...updatedRole.permissionIds];
            }

            Utils.toastSuccess("تم الحفظ بنجاح");
        } catch (e) {
            handleApiError?.(e);
            console.error(e);
        } finally {
            Forms.setBtnLoading(btn, false, '<i class="bi bi-save2 me-1"></i>حفظ التغييرات');
        }
    }

    // -------- Init Roles Table ----------
    function initRolesTable() {
        DTable.build("#rolesTable", {
            data: roles.map((r, i) => [
                i + 1,
                r.name,
                r.usersCount || 0,
                (r.perms || []).length,
                r.createdAt ? Utils.fmtDate(r.createdAt) : "-"
            ]),
            columns: [
                { title: "#" },
                { title: "اسم المجموعة" },
                { title: "المستخدمون" },
                { title: "عدد الصلاحيات" },
                { title: "تاريخ الإنشاء" }
            ]
        });
    }

    // -------- Bind Events ----------
    function bindEvents() {
        $("#expandAll").on("click", () => $(".perm-grid").slideDown(120));
        $("#collapseAll").on("click", () => $(".perm-grid").slideUp(120));
        $("#selectAll").on("click", () => $(".perm-item").prop("checked", true).trigger("change"));
        $("#clearAll").on("click", () => {
            $(".perm-item").prop("checked", false).trigger("change");
            $(".item-check, .parent-check").prop("checked", false);
        });

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
            } catch (e) { handleApiError?.(e); }
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
                const updated = await apiPost(`${API.roles}/${selectedRoleId}/clone`, { fromRoleId });
                const dest = roles.find(r => r.id === selectedRoleId);
                if (dest && updated?.permissionIds) {
                    dest.perms = [...updated.permissionIds];
                }
                selectRole(selectedRoleId);
                bootstrap.Modal.getInstance(document.getElementById("cloneRoleModal")).hide();
                Utils.toastSuccess("تم نسخ الصلاحيات بنجاح");
            } catch (e) {
                Utils.toastError("فشل نسخ الصلاحيات");
                console.error(e);
            }
        });

        // إعادة تسمية
        $("#renameRole").on("click", async () => {
            const r = roles.find(x => x.id === selectedRoleId);
            if (!r) return;
            const res = await Swal.fire({
                title: "إعادة تسمية",
                input: "text",
                inputValue: r.name,
                showCancelButton: true
            });
            if (res.isConfirmed && res.value?.trim()) {
                try {
                    const updated = await apiPut(API.roles + "/" + r.id, { name: res.value.trim() });
                    r.name = updated.name;
                    renderRolesList();
                    selectRole(r.id);
                    Utils.toastSuccess("تمت إعادة التسمية بنجاح");
                } catch (e) { Utils.toastError("فشل في إعادة التسمية"); }
            }
        });

        // حذف
        $("#deleteRole").on("click", async () => {
            const r = roles.find(x => x.id === selectedRoleId);
            if (!r) return;
            if (r.usersCount > 0) {
                return Swal.fire({ icon: "info", text: "لا يمكن الحذف والمجموعة مرتبطة بمستخدمين" });
            }
            const ok = await Utils.confirmDelete("هل تريد حذف هذه المجموعة؟");
            if (ok.isConfirmed) {
                try {
                    await apiDelete(API.roles + "/" + r.id);
                    roles = roles.filter(x => x.id !== r.id);
                    renderRolesList();
                    if (roles[0]) selectRole(roles[0].id);
                    Utils.toastSuccess("تم حذف المجموعة بنجاح");
                } catch (e) {
                    handleApiError?.(e);
                    Utils.toastError("فشل حذف المجموعة");
                }
            }
        });

        // عرض مستخدمي المجموعة
        $("#viewRoleUsers").on("click", async () => {
            if (!selectedRoleId) return;
            try {
                const users = await apiGet(API.roles + "/" + selectedRoleId + "/users");
                const role = roles.find(r => r.id === selectedRoleId);

                $("#roleName").text(role?.name || "غير معروف");
                setModalCount(users.length);
                $("#roleCreatedAt").text(role?.createdAt ? Utils.fmtDate(role.createdAt) : "-");

                if (role) role.usersCount = users.length;
                renderRolesList();
                selectRole(selectedRoleId);

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
                            <td><i class="bi bi-person-circle me-2 text-primary"></i>${Utils.escapeHtml(u.username)}</td>
                            <td>${Utils.escapeHtml(u.fullName || "-")}</td>
                            <td>${Utils.escapeHtml(u.email || "-")}</td>
                            <td>${Utils.escapeHtml(u.phone || "-")}</td>
                            <td>${u.lastLogin ? Utils.fmtDate(u.lastLogin) : "-"}</td>
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
            } catch (e) { handleApiError?.(e); }
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
