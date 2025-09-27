using beaconta.Domain.Entities;
using System.Text.Json.Serialization;

public class RolePermission : BaseEntity
{
    public int RoleId { get; set; }
    public int PermissionId { get; set; }   // ✅ الربط مع Permission

    [JsonIgnore]
    public Role Role { get; set; } = null!;

    [JsonIgnore]
    public Permission Permission { get; set; } = null!;
}
