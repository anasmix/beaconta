// =========================
// Forms helpers (global)
// =========================
(function (global) {
    // تحميل/فكّ تحميل زر مع سبنر
    function setBtnLoading(btn, isLoading, labelWhenDone) {
        const $btn = $(btn);
        if (isLoading) {
            if (!$btn.data("orig-html")) $btn.data("orig-html", $btn.html());
            $btn.prop("disabled", true)
                .html('<span class="spinner-border spinner-border-sm me-1"></span> جارِ التنفيذ…');
        } else {
            // رجّع النص الأصلي أو النص الممرَّر
            const html = labelWhenDone ?? $btn.data("orig-html") ?? "حفظ";
            $btn.prop("disabled", false).html(html);
        }
    }

    // فحص كلمتي المرور
    function validatePasswords(p1, p2) {
        if (p1 && p1.length < 6) return 'كلمة المرور قصيرة جداً';
        if (p1 !== p2) return 'تأكيد كلمة المرور غير مطابق';
        return null;
    }

    // أدوات إظهار/إخفاء وتوليد كلمة مرور
    function attachPasswordTools($input, $toggleBtn, $genBtn) {
        $toggleBtn.on('click', () => {
            const isPwd = $input.attr('type') === 'password';
            $input.attr('type', isPwd ? 'text' : 'password');
            $toggleBtn.find('i').attr('class', isPwd ? 'bi bi-eye-slash' : 'bi bi-eye');
        });
        $genBtn.on('click', () => {
            // مولّد بسيط، عدّل بحسب احتياجك
            $input.val(Math.random().toString(36).slice(-10) + 'A1').trigger('input');
        });
    }

    // Simple CSV parser (supports quoted fields)
    function parseCsv(text) {
        // تخلّص من BOM لو موجود
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

        const rows = [];
        let i = 0, field = '', row = [], inQuotes = false;

        function pushField() { row.push(field); field = ''; }
        function pushRow() { if (row.length) rows.push(row); row = []; }

        while (i < text.length) {
            const c = text[i];
            if (inQuotes) {
                if (c === '"') {
                    if (text[i + 1] === '"') { field += '"'; i++; }
                    else inQuotes = false;
                } else field += c;
            } else {
                if (c === '"') inQuotes = true;
                else if (c === ',') pushField();
                else if (c === '\n' || c === '\r') {
                    pushField(); pushRow();
                    if (c === '\r' && text[i + 1] === '\n') i++;
                } else field += c;
            }
            i++;
        }
        if (field.length || row.length) { pushField(); pushRow(); }

        // نتوقع 6 أعمدة بالترتيب: FullName, Username, Email, Phone, RoleId, Status
        return rows
            .map(cols => cols.map(s => s.trim()))
            .filter(cols => cols.length >= 6 && cols.some(x => x)) // تجاهل السطور الفارغة
            .map(([FullName, Username, Email, Phone, RoleId, Status]) => ({
                fullName: FullName || '',
                username: Username || '',
                email: Email || '',
                phone: Phone || '',
                roleId: Number(RoleId || 0),
                status: (Status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active'
            }));
    }

    // كشف عام
    global.Forms = {
        setBtnLoading,
        validatePasswords,
        attachPasswordTools,
        parseCsv
    };
})(window);
