// =========================
// DataTable builder + helpers
// =========================
function buildDataTable(selector, options) {
    return $(selector).DataTable($.extend(true, {
        responsive: true,
        language: {
            emptyTable: "لا توجد بيانات",
            info: "إظهار _START_ إلى _END_ من أصل _TOTAL_ سجل",
            infoEmpty: "لا توجد سجلات",
            infoFiltered: "(مصفاة من _MAX_ سجل)",
            lengthMenu: "إظهار _MENU_",
            loadingRecords: "جار التحميل...",
            search: "بحث:",
            zeroRecords: "لا نتائج مطابقة",
            paginate: { first: "الأول", last: "الأخير", next: "التالي", previous: "السابق" }
        },
        dom: 'Bfrtip',
        buttons: [
            { extend: 'excelHtml5', text: 'تصدير Excel', className: 'btn btn-light border' },
            { extend: 'csvHtml5', text: 'تصدير CSV', className: 'btn btn-light border' },
            { extend: 'print', text: 'طباعة', className: 'btn btn-light border' }
        ]
    }, options));
}

function reloadDataTable(dt, data) {
    dt.clear().rows.add(data).draw(false);
}

// ✅ خلي DTable كـ object فيه دالة build
var DTable = {
    build: function (selector, options) {
        return buildDataTable(selector, options);
    }
};
