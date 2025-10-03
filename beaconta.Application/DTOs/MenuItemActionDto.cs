// beaconta.Application/DTOs/MenuActionDto.cs
namespace beaconta.Application.DTOs
{
    /// </summary>
    public sealed class MenuItemActionDto
    {
        /// <summary>
        /// مفتاح الفعل المنطقي (create/update/delete/search/print/....)
        /// </summary>
        public string ActionKey { get; set; } = default!;

        /// <summary>عنوان عربي للفعل (إضافة/تعديل/حذف/استعلام/طباعة...)</summary>
        public string Title { get; set; } = default!;

        /// <summary>
        /// مفتاح الصلاحية الكامل لهذا الفعل.
        /// الصيغة القياسية: {ItemKey}.{ActionKey} مثل: "contracts.create"
        /// </summary>
        public string PermissionKey { get; set; } = default!;

        /// <summary>
        /// ترتيب عرض الأفعال داخل عنصر القائمة (اختياري).
        /// مثال ترتيب مقترح: view=0, search=1, create=2, update=3, delete=4, print=5
        /// </summary>
        public int SortOrder { get; set; }
    }
}
