using System.Text.Json.Serialization;

namespace beaconta.Domain.Entities
{
    public class Role : BaseEntity
    {
        public int Id { get; set; }

        // الاسم للعرض (قابل للتعديل من الواجهة)
        public string Name { get; set; } = string.Empty;

        // المفتاح ثابت (يُستخدم داخليًا في الكود والـ JWT)
        public string Key { get; set; } = string.Empty;

        [JsonIgnore]
        public ICollection<User> Users { get; set; } = new List<User>();

        public ICollection<RolePermission> Permissions { get; set; } = new List<RolePermission>();
    }

    public class RolePermission : BaseEntity
    {
        public int Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;

        public int RoleId { get; set; }
        [JsonIgnore]
        public Role? Role { get; set; }
    }
}
