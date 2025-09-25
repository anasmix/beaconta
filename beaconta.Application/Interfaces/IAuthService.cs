// beaconta.Application/Interfaces/IAuthService.cs
using beaconta.Application.DTOs;

namespace beaconta.Application.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(string username, string password);
    }
}
