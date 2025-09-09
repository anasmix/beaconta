using System.Data;

namespace beaconta.Domain.Entities
{
    public class User : BaseEntity
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Status { get; set; } = "active"; // active | inactive
        public string Notes { get; set; } = string.Empty;

        public DateTime? LastLogin { get; set; }

        // علاقة مع Role
        public int RoleId { get; set; }
        public Role Role { get; set; } = null!;
    }
}
