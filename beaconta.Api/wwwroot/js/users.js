// =========================
// Users screen logic (RBAC)
// =========================
$(async function () {
    // ---- صلاحيات شاشة إدارة المستخدمين ----
    const PERMS = {
        view: 'user-management.view',
        search: 'user-management.search',
        create: 'user-management.create',
        update: 'user-management.update',
        delete: 'user-management.delete',
        resetPassword: 'user-management.resetPassword',
        assignRoles: 'user-management.assignRoles',
        toggleStatus: 'user-management.toggleStatus',
        importCsv: 'user-management.importCsv'
    };

    // حمّل صلاحيات المستخدم إن توفرت وحدة Authorize
    if (window.Authorize && typeof Authorize.load === 'function') {
        try { await Authorize.load(); }
        catch (e) { console.error('Failed to load permissions', e); }
    } else {
        console.warn('Authorize module not found — skipping UI filtering.');
    }

    let dt, users = [], roles = [];
    const rolesMap = new Map();

    // ---------- Helpers ----------
    function ensurePerm(key) {
        if (!(window.Authorize && typeof Authorize.has === 'function')) return true; // لا تنكسر لو الوحدة غايبة
        if (!Authorize.has(key)) {
            Utils.toastError('ليست لديك صلاحية لتنفيذ هذا الإجراء.');
            return false;
        }
        return true;
    }
    function applyAuth(root = document) {
        if (window.Authorize && typeof Authorize.applyWithin === 'function') {
            Authorize.applyWithin(root);
        }
    }

    // ---------- Load Roles ----------
    function loadAllRoles() {
        return apiGet(API.roles).then(data => {
            roles = data || [];
            rolesMap.clear();

            $("#roles, #bulkRoleSelect, #filterRole").empty();
            $("#filterRole").append(new Option("كل الأدوار", ""));

            roles.forEach(r => {
                rolesMap.set(r.id, r.name);
                $("#roles").append(new Option(r.name, r.id));
                $("#bulkRoleSelect").append(new Option(r.name, r.id));
                $("#filterRole").append(new Option(r.name, r.id));
            });

            // Select2 init
            $("#roles").select2({
                theme: "bootstrap-5",
                width: "100%",
                placeholder: "اختر الأدوار",
                allowClear: true
            });
            $("#bulkRoleSelect").select2({ theme: "bootstrap-5", width: "100%" });
            $("#filterRole").select2({
                theme: "bootstrap-5",
                width: "100%",
                allowClear: true,
                placeholder: "كل الأدوار"
            });
        }).catch(Utils.handleApiError);
    }

    // ---------- Build Table ----------
    function buildTable() {
        dt = buildDataTable("#tblUsers", {
            data: users,
            rowId: "id",
            columns: [
                {
                    data: null, orderable: false, className: "text-center",
                    render: row => `<input type="checkbox" class="row-check" data-id="${row.id}" aria-label="select">`
                },
                { data: "username", render: d => `<span class="fw-bold">${Utils.escapeHtml(d)}</span>` },
                { data: "fullName", render: d => Utils.escapeHtml(d || '') },
                { data: "email", render: d => Utils.escapeHtml(d || '—') },
                {
                    data: "roles",
                    render: arr => {
                        if (!arr || !arr.length) return "—";
                        return arr.map(r => `<span class="badge bg-info me-1">${Utils.escapeHtml(r)}</span>`).join("");
                    }
                },
                { data: "status", className: "text-center", render: s => Utils.statusBadge(s) },
                { data: "lastLogin", render: Utils.fmtDate },
                {
                    data: null, orderable: false, className: "text-nowrap",
                    render: (row) => {
                        const isActive = String(row.status).toLowerCase() === 'active';
                        return `
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-primary"
                                  data-action="details"
                                  data-perm="${PERMS.view}"
                                  onclick="openDetails(${row.id})"
                                  title="تفاصيل">
                            <i class="bi bi-card-text"></i>
                          </button>

                          <button class="btn btn-outline-warning"
                                  data-action="edit"
                                  data-perm="${PERMS.update}"
                                  onclick="editUser(${row.id})"
                                  title="تعديل">
                            <i class="bi bi-pencil"></i>
                          </button>

                          <button class="btn btn-outline-secondary"
                                  data-action="reset"
                                  data-perm="${PERMS.resetPassword}"
                                  onclick="resetPassword(${row.id})"
                                  title="إعادة كلمة المرور">
                            <i class="bi bi-key"></i>
                          </button>

                          <button class="btn btn-outline-${isActive ? 'warning' : 'success'}"
                                  data-action="toggle"
                                  data-perm="${PERMS.toggleStatus}"
                                  onclick="toggleStatus(${row.id})"
                                  title="${isActive ? 'تعطيل' : 'تفعيل'}">
                            <i class="bi bi-toggle2-${isActive ? 'off' : 'on'}"></i>
                          </button>

                          <button class="btn btn-outline-danger"
                                  data-action="delete"
                                  data-perm="${PERMS.delete}"
                                  onclick="deleteUser(${row.id})"
                                  title="حذف">
                            <i class="bi bi-trash3"></i>
                          </button>
                        </div>`;
                    }
                }
            ],
            order: [[1, "asc"]]
        });

        // طبّق التفويض على الجدول عند كل draw
        dt.on('draw', function () {
            applyAuth(document.getElementById('tblUsers'));
        });

        // Filters
        $("#txtSearch").on("input", Utils.debounce(() => dt.search($("#txtSearch").val()).draw(), 250));
        $("#filterStatus").on("change", function () {
            const v = this.value;
            dt.column(5).search(v ? (v === 'active' ? 'نشط' : 'موقوف') : '', true, false).draw();
        });
        $("#filterRole").on("change", function () {
            const ids = ($(this).val() || []).map(Number);
            if (!ids.length) { dt.column(4).search('', true, false).draw(); return; }
            const names = ids.map(id => rolesMap.get(id)).filter(Boolean);
            const regex = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            dt.column(4).search(regex, true, false).draw();
        });

        // Select all
        $("#chkAll").on("change", function () {
            $(".row-check").prop("checked", this.checked).trigger("change");
        });
        $("#tblUsers tbody").on("change", ".row-check", function () {
            const selected = $(".row-check:checked").length;
            $("#bulkCount").text(selected);
            $("#bulkToolbar").toggleClass("bulk-toolbar", selected === 0);
            applyAuth(document.getElementById('bulkToolbar'));
        });

        // تطبيق التفويض على كامل الصفحة بعد البناء الأول
        applyAuth(document);
    }

    function reloadTable() {
        reloadDataTable(dt, users);
        Utils.updateStats(users);
        $("#chkAll").prop("checked", false);
        $(".row-check").prop("checked", false);
        $("#bulkToolbar").addClass("bulk-toolbar");
    }

    // ---------- Load Users ----------
    function normalizeUser(u) {
        return {
            ...u,
            roles: Array.isArray(u.roles) ? u.roles : [],
            roleIds: Array.isArray(u.roleIds) ? u.roleIds : []
        };
    }

    function loadUsers() {
        return apiGet(API.users).then(data => {
            users = (data || []).map(normalizeUser);
            if (dt) {
                reloadTable();
            } else {
                buildTable();
                Utils.updateStats(users);
            }
        }).catch(Utils.handleApiError);
    }

    // ---------- Details ----------
    window.openDetails = function (id) {
        if (!ensurePerm(PERMS.view)) return;
        const u = users.find(x => x.id === id);
        if (!u) return;
        const html = `
          <div class="d-flex align-items-center gap-3 mb-3">
            <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style="width:56px;height:56px">
              <i class="bi bi-person fs-3"></i>
            </div>
            <div>
              <div class="h5 mb-0">${Utils.escapeHtml(Utils.fmt(u.fullName))}</div>
              <div class="text-muted small">@${Utils.escapeHtml(Utils.fmt(u.username))} · ${Utils.statusBadge(u.status)}</div>
            </div>
          </div>
          <div class="row g-2">
            <div class="col-12">${(u.roles || []).map(r => Utils.roleChip(r)).join(" ")}</div>
            <div class="col-12"><hr></div>
            <div class="col-6"><div class="text-muted small">البريد</div><div class="fw-semibold">${Utils.escapeHtml(Utils.fmt(u.email))}</div></div>
            <div class="col-6"><div class="text-muted small">الهاتف</div><div class="fw-semibold">${Utils.escapeHtml(Utils.fmt(u.phone))}</div></div>
            <div class="col-6"><div class="text-muted small">آخر دخول</div><div class="fw-semibold">${Utils.fmtDate(u.lastLogin)}</div></div>
            <div class="col-6"><div class="text-muted small">الملاحظات</div><div class="fw-semibold">${Utils.escapeHtml(Utils.fmt(u.notes))}</div></div>
            <div class="col-6"><div class="text-muted small">أُضيف</div><div class="fw-semibold">${Utils.fmtDate(u.createdAt)}</div></div>
            <div class="col-6"><div class="text-muted small">آخر تحديث</div><div class="fw-semibold">${Utils.fmtDate(u.updatedAt)}</div></div>
          </div>
          <hr>
          <div class="d-flex gap-2">
            <button class="btn btn-warning" data-perm="${PERMS.update}" onclick="editUser(${u.id})"><i class="bi bi-pencil me-1"></i>تعديل</button>
            <button class="btn btn-secondary" data-perm="${PERMS.resetPassword}" onclick="resetPassword(${u.id})"><i class="bi bi-key me-1"></i>إعادة كلمة المرور</button>
            <button class="btn btn-${u.status === 'active' ? 'outline-warning' : 'outline-success'}"
                    data-perm="${PERMS.toggleStatus}"
                    onclick="toggleStatus(${u.id})">
              <i class="bi bi-toggle2-${u.status === 'active' ? 'off' : 'on'} me-1"></i>${u.status === 'active' ? 'تعطيل' : 'تفعيل'}
            </button>
          </div>`;
        $("#userProfile").html(html);
        applyAuth(document.getElementById('userDetails'));
        new bootstrap.Offcanvas('#userDetails').show();
    };

    // ---------- Add / Edit ----------
    $("#btnAddUser")
        .attr('data-perm', PERMS.create)
        .on("click", function () {
            if (!ensurePerm(PERMS.create)) return;
            $("#userModalTitle").text("إضافة مستخدم");
            $("#frmUser")[0].reset();
            $("#userId").val("");
            $("#password,#password2").val("");
            $("#forceReset").prop("checked", false);
            loadAllRoles().then(() => {
                $("#roles").val([]).trigger('change');
                const modalEl = document.getElementById('userModal');
                new bootstrap.Modal(modalEl).show();
                applyAuth(modalEl);
            });
        });

    window.editUser = function (id) {
        if (!ensurePerm(PERMS.update)) return;
        const u = users.find(x => x.id === id);
        if (!u) return;
        $("#userModalTitle").text("تعديل مستخدم");
        $("#userId").val(u.id);
        $("#fullName").val(u.fullName);
        $("#username").val(u.username);
        $("#email").val(u.email);
        $("#phone").val(u.phone);
        $("#status").val(u.status);
        $("#notes").val(u.notes || '');
        $("#password,#password2").val("");
        $("#forceReset").prop("checked", false);
        loadAllRoles().then(() => {
            $("#roles").val(u.roleIds || []).trigger('change');
            const modalEl = document.getElementById('userModal');
            new bootstrap.Modal(modalEl).show();
            applyAuth(modalEl);
        });
    };

    $("#btnSaveUser").on("click", function () {
        const isEdit = !!Number($('#userId').val() || 0);
        if (isEdit) {
            if (!ensurePerm(PERMS.update)) return;
        } else {
            if (!ensurePerm(PERMS.create)) return;
        }

        const form = document.getElementById('frmUser');
        const p1 = $('#password').val() || '';
        const p2 = $('#password2').val() || '';
        const pwdError = Forms.validatePasswords(p1, p2);
        if (pwdError) {
            if (p1.length && p1.length < 6) $('#password')[0].setCustomValidity('short');
            if (p1 !== p2) $('#password2')[0].setCustomValidity('mismatch');
        }
        if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
        $('#password')[0].setCustomValidity(''); $('#password2')[0].setCustomValidity('');

        const dto = {
            id: Number($('#userId').val() || 0),
            fullName: $('#fullName').val(),
            username: $('#username').val(),
            email: $('#email').val(),
            phone: $('#phone').val(),
            status: $('#status').val(),
            notes: $('#notes').val(),
            password: p1 || undefined,
            forceReset: $('#forceReset').is(':checked'),
            roleIds: ($('#roles').val() || []).map(Number)
        };

        const req = isEdit ? apiPut(`${API.users}/${dto.id}`, dto) : apiPost(API.users, dto);
        req.then(() => {
            bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
            loadUsers();
            Utils.toastSuccess('تم الحفظ');
        }).catch(Utils.handleApiError);
    });

    // ---------- Single actions ----------
    window.toggleStatus = id => {
        if (!ensurePerm(PERMS.toggleStatus)) return;
        $.post({ url: `${API.users}/${id}/toggle-status`, headers: { Authorization: "Bearer " + getToken() } })
            .then(loadUsers).catch(Utils.handleApiError);
    };

    window.deleteUser = id => {
        if (!ensurePerm(PERMS.delete)) return;
        Utils.confirmDelete('هل تريد حذف المستخدم؟').then(r => {
            if (!r.isConfirmed) return;
            apiDelete(`${API.users}/${id}`)
                .then(() => { loadUsers(); Utils.toastSuccess('تم الحذف'); })
                .catch(Utils.handleApiError);
        });
    };

    window.resetPassword = id => {
        if (!ensurePerm(PERMS.resetPassword)) return;
        const u = users.find(x => x.id === id);
        if (!u) return;
        Swal.fire({
            icon: 'question',
            title: `إعادة تعيين كلمة المرور لـ ${Utils.escapeHtml(u.fullName)}`,
            input: 'password',
            inputLabel: 'أدخل كلمة مرور جديدة (اختياري، اتركه فارغًا للتوليد)',
            showCancelButton: true,
            confirmButtonText: 'تعيين',
            preConfirm: val => val || (Math.random().toString(36).slice(-8) + 'Aa1')
        }).then(res => {
            if (res.isConfirmed) {
                $.ajax({
                    url: `${API.users}/${id}/reset-password`,
                    method: "POST",
                    headers: { Authorization: "Bearer " + getToken(), "Content-Type": "application/json" },
                    data: JSON.stringify(res.value)
                }).then(() => Swal.fire({ icon: 'success', title: 'تم تحديث كلمة المرور' }))
                    .catch(Utils.handleApiError);
            }
        });
    };

    // ---------- Bulk toolbar ----------
    $('#bulkActivate').attr('data-perm', PERMS.toggleStatus).on('click', function () {
        if (!ensurePerm(PERMS.toggleStatus)) return;
        // TODO: تفعيل جماعي
    });
    $('#bulkDeactivate').attr('data-perm', PERMS.toggleStatus).on('click', function () {
        if (!ensurePerm(PERMS.toggleStatus)) return;
        // TODO: تعطيل جماعي
    });
    $('#bulkDelete').attr('data-perm', PERMS.delete).on('click', function () {
        if (!ensurePerm(PERMS.delete)) return;
        // TODO: حذف جماعي
    });
    $('#bulkRole').attr('data-perm', PERMS.assignRoles).on('click', function () {
        if (!ensurePerm(PERMS.assignRoles)) return;
        new bootstrap.Modal('#bulkRoleModal').show();
        applyAuth(document.getElementById('bulkRoleModal'));
    });

    // زر الاستيراد (إن موجود)
    $('#btnImport').attr('data-perm', PERMS.importCsv).on('click', function () {
        if (!ensurePerm(PERMS.importCsv)) return;
        new bootstrap.Modal('#importModal').show();
        applyAuth(document.getElementById('importModal'));
    });

    // ---------- Init ----------
    applyAuth(document);          // إخفِ الأزرار غير المصرح بها مباشرة
    loadAllRoles().then(loadUsers);
});
