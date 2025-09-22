namespace beaconta.Application.DTOs
{
    public class RoleListItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public int UsersCount { get; set; }
        public int PermissionsCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class RoleUserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        public string FullName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Status { get; set; } = "";
        public DateTime? LastLogin { get; set; }
    }
}
