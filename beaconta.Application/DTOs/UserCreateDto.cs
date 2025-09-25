 



namespace beaconta.Application.DTOs
{
    public class UserCreateDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        // 🔗 المستخدم ممكن ينتمي لأكثر من دور
        public List<int> RoleIds { get; set; } = new();
    }
}
