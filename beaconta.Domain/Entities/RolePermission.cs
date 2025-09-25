using System.Text.Json.Serialization;

namespace beaconta.Domain.Entities
{
    public class RolePermission : BaseEntity
    {
        public int RoleId { get; set; }
        public int PermissionId { get; set; }

        [JsonIgnore]
        public Role Role { get; set; } = null!;

        [JsonIgnore]
        public Permission Permission { get; set; } = null!;
    }
}
