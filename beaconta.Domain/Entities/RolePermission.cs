using beaconta.Domain.Entities;
using System.Text.Json.Serialization;

public class RolePermission : BaseEntity
{
    public int RoleId { get; set; }
    public int MenuItemId { get; set; }   // 👈 FK

    [JsonIgnore]
    public Role Role { get; set; } = null!;

    [JsonIgnore]
    public MenuItem MenuItem { get; set; } = null!; 
}
