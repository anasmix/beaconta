namespace beaconta.Application.DTOs
{
    public class UpdateRolePermissionsDto
    {
        public int RoleId { get; set; }
        public List<int> PermissionIds { get; set; } = new();
    }
}
