using System.Text.Json.Serialization;

namespace beaconta.Domain.Entities
{
    public class Permission : BaseEntity
    {
        public string Key { get; set; } = string.Empty;      // معرف منطقي ثابت (ex: Users_View)
        public string Name { get; set; } = string.Empty;     // الاسم المعروض
        public string? Category { get; set; }                // تصنيف (Users, Finance, Reports ...)

        // ↓↓↓ أضِف هذه الثلاث ↓↓↓
        public int? ParentId { get; set; }
        public Permission? Parent { get; set; }
        public ICollection<Permission> Children { get; set; } = new List<Permission>();


        // 🔹 العلاقة الوسيطة مع الأدوار
        [JsonIgnore]
        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
}
