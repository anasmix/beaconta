using System.Text.Json.Serialization;

namespace beaconta.Domain.Entities
{
    public class Role : BaseEntity
    {
        public string Name { get; set; } = string.Empty; // اسم العرض
        public string Key { get; set; } = string.Empty;  // مفتاح ثابت (JWT, backend logic)

        [JsonIgnore]
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

        [JsonIgnore]
        public ICollection<RolePermission> Permissions { get; set; } = new List<RolePermission>();
    }
}
