namespace beaconta.Application.DTOs
{
    public class UpdateRolePermissionsDto
    {
        public int RoleId { get; set; }
        public List<string> Permissions { get; set; } = new();
    }
}
