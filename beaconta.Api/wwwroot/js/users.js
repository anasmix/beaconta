// =========================
// Users screen logic (SoC)
// =========================
$(function () {
    let dt, users = [], roles = [];
    const rolesMap = new Map();

    // ---------- Load Roles ----------
    function loadAllRoles() {
        return apiGet(API.roles).then(data => {
            roles = data || [];
            rolesMap.clear();

            $("#role, #bulkRoleSelect, #filterRole").empty();
            $("#filterRole").append(new Option("كل الأدوار", ""));

            roles.forEach(r => {
                rolesMap.set(r.id, r.name);
                $("#role").append(new Option(r.name, r.id));
                $("#bulkRoleSelect").append(new Option(r.name, r.id));
                $("#filterRole").append(new Option(r.name, r.id));
            });

            // Select2 init
            $("#role").select2({ theme: "bootstrap-5", width: "100%" });
            $("#bulkRoleSelect").select2({ theme: "bootstrap-5", width: "100%" });
            $("#filterRole").select2({ theme: "bootstrap-5", width: "100%", allowClear: true, placeholder: "كل الأدوار" });
        }).catch(handleApiError);
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
                { data: "username", render: d => `<span class="fw-bold">${escapeHtml(d)}</span>` },
                { data: "fullName", render: d => escapeHtml(d || '') },
                { data: "email", render: d => escapeHtml(d || '—') },
                { data: "roleName", render: d => roleChip(d) },
                // نعرض Badge بالعربي لكن نبقي قيمة البحث على النص العربي أيضًا
                { data: "status", className: "text-center", render: s => statusBadge(s) },
                { data: "lastLogin", render: fmtDate },
                {
                    data: null, orderable: false, className: "text-nowrap",
                    render: (row) => `
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" onclick="openDetails(${row.id})" title="تفاصيل"><i class="bi bi-card-text"></i></button>
              <button class="btn btn-outline-warning" onclick="editUser(${row.id})" title="تعديل"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-outline-secondary" onclick="resetPassword(${row.id})" title="إعادة كلمة المرور"><i class="bi bi-key"></i></button>
              <button class="btn btn-outline-${row.status === 'active' ? 'warning' : 'success'}" onclick="toggleStatus(${row.id})" title="${row.status === 'active' ? 'تعطيل' : 'تفعيل'}"><i class="bi bi-toggle2-${row.status === 'active' ? 'off' : 'on'}"></i></button>
              <button class="btn btn-outline-danger" onclick="deleteUser(${row.id})" title="حذف"><i class="bi bi-trash3"></i></button>
            </div>`
                }
            ],
            order: [[1, "asc"]]
        });

        // Search
        $("#txtSearch").on("input", debounce(function () {
            dt.search(this.value).draw();
        }, 250));

        // Status filter (نطابق الكلمات التي تظهر داخل الـ Badge)
        $("#filterStatus").on("change", function () {
            const v = this.value; // '' | 'active' | 'inactive'
            if (!v) { dt.column(5).search('', true, false).draw(); return; }
            // نفترض أن statusBadge يعرض "نشط" و"موقوف"
            const term = v === 'active' ? 'نشط' : 'موقوف';
            dt.column(5).search(term, true, false).draw();
        });

        // Role filter
        $("#filterRole").on("change", function () {
            const ids = ($(this).val() || []).map(Number);
            if (ids.length === 0) { dt.column(4).search('', true, false).draw(); return; }
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
            // أظهر شريط الدُفعة عند وجود تحديد
            $("#bulkToolbar").toggleClass("bulk-toolbar", selected === 0);
        });
    }

    function reloadTable() {
        reloadDataTable(dt, users);
        updateStats(users);
        $("#chkAll").prop("checked", false);
        $(".row-check").prop("checked", false);
        $("#bulkToolbar").addClass("bulk-toolbar");
    }

    // ---------- Load Users ----------
    function normalizeUser(u) {
        const roleName = u.role?.name || u.roleName || rolesMap.get(u.roleId) || '';
        return { ...u, roleName };
    }
    function loadUsers() {
        return apiGet(API.users).then(data => {
            users = (data || []).map(normalizeUser);
            if (dt) { reloadTable(); } else { buildTable(); updateStats(users); }
        }).catch(handleApiError);
    }

    // ---------- Details ----------
    window.openDetails = function (id) {
        const u = users.find(x => x.id === id);
        if (!u) return;
        const html = `
      <div class="d-flex align-items-center gap-3 mb-3">
        <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style="width:56px;height:56px">
          <i class="bi bi-person fs-3"></i>
        </div>
        <div>
          <div class="h5 mb-0">${escapeHtml(fmt(u.fullName))}</div>
          <div class="text-muted small">@${escapeHtml(fmt(u.username))} · ${statusBadge(u.status)}</div>
        </div>
      </div>
      <div class="row g-2">
        <div class="col-12">${roleChip(u.roleName)}</div>
        <div class="col-12"><hr></div>
        <div class="col-6"><div class="text-muted small">البريد</div><div class="fw-semibold">${escapeHtml(fmt(u.email))}</div></div>
        <div class="col-6"><div class="text-muted small">الهاتف</div><div class="fw-semibold">${escapeHtml(fmt(u.phone))}</div></div>
        <div class="col-6"><div class="text-muted small">آخر دخول</div><div class="fw-semibold">${fmtDate(u.lastLogin)}</div></div>
        <div class="col-6"><div class="text-muted small">الملاحظات</div><div class="fw-semibold">${escapeHtml(fmt(u.notes))}</div></div>
        <div class="col-6"><div class="text-muted small">أُضيف</div><div class="fw-semibold">${fmtDate(u.createdAt)}</div></div>
        <div class="col-6"><div class="text-muted small">آخر تحديث</div><div class="fw-semibold">${fmtDate(u.updatedAt)}</div></div>
      </div>
      <hr>
      <div class="d-flex gap-2">
        <button class="btn btn-warning" onclick="editUser(${u.id})"><i class="bi bi-pencil me-1"></i>تعديل</button>
        <button class="btn btn-secondary" onclick="resetPassword(${u.id})"><i class="bi bi-key me-1"></i>إعادة كلمة المرور</button>
        <button class="btn btn-${u.status === 'active' ? 'outline-warning' : 'outline-success'}" onclick="toggleStatus(${u.id})">
          <i class="bi bi-toggle2-${u.status === 'active' ? 'off' : 'on'} me-1"></i>${u.status === 'active' ? 'تعطيل' : 'تفعيل'}
        </button>
      </div>
    `;
        $("#userProfile").html(html);
        new bootstrap.Offcanvas('#userDetails').show();
    };

    // ---------- Add / Edit ----------
    $("#btnAddUser").on("click", function () {
        $("#userModalTitle").text("إضافة مستخدم");
        $("#frmUser")[0].reset();
        $("#userId").val("");
        $("#password,#password2").val("");
        $("#forceReset").prop("checked", false);
        loadAllRoles().then(() => {
            $("#role").val('').trigger('change');
            new bootstrap.Modal('#userModal').show();
        });
    });

    window.editUser = function (id) {
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
            $("#role").val(u.role?.id || u.roleId).trigger('change');
            new bootstrap.Modal('#userModal').show();
        });
    };

    $("#btnSaveUser").on("click", function () {
        const form = document.getElementById('frmUser');
        const p1 = $('#password').val() || '';
        const p2 = $('#password2').val() || '';
        const pwdError = Forms.validatePasswords(p1, p2);   // ✅ استدعِ من Forms
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
            roleId: Number($('#role').val()),
            status: $('#status').val(),
            notes: $('#notes').val(),
            password: p1 || undefined,
            forceReset: $('#forceReset').is(':checked')
        };

        const isEdit = !!dto.id;
        const req = isEdit ? apiPut(API.users + '/' + dto.id, dto) : apiPost(API.users, dto);
        req.then(() => {
            bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
            loadUsers();
            toastSuccess('تم الحفظ');
        }).catch(handleApiError);
    });

    // أدوات كلمة المرور (من Forms)
    Forms.attachPasswordTools($('#password'), $('#btnShowPass'), $('#btnGenPass')); // ✅

    // ---------- Single actions ----------
    window.toggleStatus = function (id) {
        const u = users.find(x => x.id === id);
        if (!u) return;
        $.ajax({
            url: `${API.users}/${id}/toggle-status`,
            method: "POST",
            headers: { Authorization: "Bearer " + getToken() }
        }).then(() => loadUsers()).catch(handleApiError);
    };

    window.deleteUser = function (id) {
        confirmDelete('هل تريد حذف المستخدم؟').then(r => {
            if (!r.isConfirmed) return;
            apiDelete(`${API.users}/${id}`)
                .then(() => { loadUsers(); toastSuccess('تم الحذف'); })
                .catch(handleApiError);
        });
    };

    window.resetPassword = function (id) {
        const u = users.find(x => x.id === id);
        if (!u) return;
        Swal.fire({
            icon: 'question',
            title: `إعادة تعيين كلمة المرور لـ ${escapeHtml(u.fullName)}`,
            input: 'password',
            inputLabel: 'أدخل كلمة مرور جديدة (اختياري، اتركه فارغًا للتوليد)',
            showCancelButton: true,
            confirmButtonText: 'تعيين',
            preConfirm: (val) => val || (Math.random().toString(36).slice(-8) + 'Aa1')
        }).then(res => {
            if (res.isConfirmed) {
                $.ajax({
                    url: `${API.users}/${id}/reset-password`,
                    method: "POST",
                    headers: { Authorization: "Bearer " + getToken(), "Content-Type": "application/json" },
                    data: JSON.stringify(res.value)
                }).then(() => Swal.fire({ icon: 'success', title: 'تم تحديث كلمة المرور' }))
                    .catch(handleApiError);
            }
        });
    };

    // ---------- Bulk actions ----------
    function getSelectedIds() { return $('.row-check:checked').map((_, el) => Number($(el).data('id'))).get(); }

    $('#bulkActivate').on('click', () => bulkActivate(true));
    $('#bulkDeactivate').on('click', () => bulkActivate(false));
    $('#bulkDelete').on('click', bulkDelete);
    $('#bulkRole').on('click', () => {
        if (!getSelectedIds().length) { return Swal.fire({ icon: 'info', title: 'لم يتم تحديد مستخدمين' }); }
        loadAllRoles().then(() => new bootstrap.Modal('#bulkRoleModal').show());
    });
    $('#btnApplyBulkRole').on('click', () => {
        const r = $('#bulkRoleSelect').val();
        if (!r) { return Swal.fire({ icon: 'info', title: 'اختر دورًا' }); }
        bulkAssignRole(r);
        bootstrap.Modal.getInstance(document.getElementById('bulkRoleModal')).hide();
    });

    function bulkActivate(state) {
        const ids = getSelectedIds();
        if (!ids.length) return toastInfo('لم يتم تحديد مستخدمين');

        const toToggle = users
            .filter(u => ids.includes(u.id) && ((state && u.status !== 'active') || (!state && u.status !== 'inactive')))
            .map(u => u.id);

        if (!toToggle.length) { return Swal.fire({ icon: 'info', title: 'لا شيء لتحديثه' }); }

        Promise.allSettled(toToggle.map(id =>
            $.ajax({ url: `${API.users}/${id}/toggle-status`, method: "POST", headers: { Authorization: "Bearer " + getToken() } })
        )).then(() => { loadUsers(); toastSuccess('تم التحديث'); })
            .catch(handleApiError);
    }

    function bulkDelete() {
        const ids = getSelectedIds();
        if (!ids.length) return toastInfo('لم يتم تحديد مستخدمين');
        confirmDelete(`حذف ${ids.length} مستخدم؟`).then(r => {
            if (!r.isConfirmed) return;
            Promise.allSettled(ids.map(id => apiDelete(`${API.users}/${id}`)))
                .then(() => { loadUsers(); toastSuccess('تم الحذف'); })
                .catch(handleApiError);
        });
    }

    function bulkAssignRole(roleId) {
        const ids = getSelectedIds();
        if (!ids.length) return;
        const updates = users.filter(u => ids.includes(u.id)).map(u => {
            const dto = {
                id: u.id,
                fullName: u.fullName,
                username: u.username,
                email: u.email,
                phone: u.phone,
                roleId: Number(roleId),
                status: u.status,
                notes: u.notes
            };
            return apiPut(`${API.users}/${u.id}`, dto);
        });
        Promise.allSettled(updates)
            .then(() => { loadUsers(); toastSuccess('تم تعيين الدور'); })
            .catch(handleApiError);
    }

    // ---------- Import CSV ----------
    $('#btnImport').on('click', () => new bootstrap.Modal('#importModal').show());
    $('#btnImportCsv').on('click', () => {
        const f = $('#csvFile')[0].files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = e => {
            const rows = Forms.parseCsv(e.target.result); // ✅
            if (!rows.length) { Swal.fire({ icon: 'info', title: 'لا توجد بيانات صالحة' }); return; }
            Promise.allSettled(rows.map(r => apiPost(API.users, r)))
                .then(results => {
                    const ok = results.filter(x => x.status === 'fulfilled').length;
                    const fail = results.length - ok;
                    loadUsers();
                    Swal.fire({ icon: 'success', title: `تم الاستيراد`, text: `ناجح: ${ok} | فشل: ${fail}` });
                })
                .catch(handleApiError);
        };
        reader.readAsText(f, 'utf-8');
        bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();
    });

    // ---------- Init ----------
    loadAllRoles().then(loadUsers);
});
