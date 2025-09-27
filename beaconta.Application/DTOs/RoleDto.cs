namespace beaconta.Application.DTOs
{
    public class RoleDto
    {
        public int Id { get; set; }

        // المفتاح الثابت
        public string Key { get; set; } = string.Empty;

        // الاسم للعرض
        public string Name { get; set; } = string.Empty;

        public int UsersCount { get; set; }

        // بدل strings → IDs
        public List<string> PermissionIds { get; set; } = new(); // 🔴 strings

        public DateTime CreatedAt { get; set; }
    }

}
