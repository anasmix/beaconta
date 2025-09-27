namespace beaconta.Application.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
        public DateTime? LastLogin { get; set; }

        // 🔹 بدال RoleName
        public List<string> Roles { get; set; } = new();
        // معرفات الأدوار (للاستخدام في شاشة التعديل)
        public List<int> RoleIds { get; set; } = new();
    
    }
}
