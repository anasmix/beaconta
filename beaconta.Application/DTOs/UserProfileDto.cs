// Application/DTOs/Auth/UserProfileDto.cs
namespace beaconta.Application.DTOs.Auth
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        public string FullName { get; set; } = "";
        public string Role { get; set; } = "";
        public List<string> Permissions { get; set; } = new();
    }
}
