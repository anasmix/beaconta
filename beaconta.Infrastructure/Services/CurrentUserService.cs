using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace beaconta.Infrastructure.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _http;

        public CurrentUserService(IHttpContextAccessor http)
        {
            _http = http;
        }

        public bool IsAuthenticated =>
            _http.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

        public string? UserId =>
            IsAuthenticated ? _http.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value : null;

        public string? Username =>
            IsAuthenticated ? _http.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value : null;

        public string? Role =>
            IsAuthenticated ? _http.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value : null;
    }
}
