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
        public List<string> Permissions { get; set; } = new();

        public DateTime CreatedAt { get; set; }   // ✅ للعرض في الواجهة
    }
}
