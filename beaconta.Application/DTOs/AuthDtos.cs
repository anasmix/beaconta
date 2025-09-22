namespace beaconta.Application.DTOs;

public class LoginRequestDto
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
}

public class LoginResponseDto
{
    public string Token { get; set; } = "";
    public DateTime ExpiresAtUtc { get; set; }
}
