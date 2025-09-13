namespace beaconta.Application.DTOs
{
    public class UserUpdateDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Status { get; set; } = "active";
        public int RoleId { get; set; }
    }
}
