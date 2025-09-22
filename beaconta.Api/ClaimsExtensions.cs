using System.Security.Claims;

namespace beaconta.Api
{
    public static class ClaimsExtensions
    {
        public static string? GetUserId(this ClaimsPrincipal user)
            => user.FindFirst(ClaimTypes.NameIdentifier)?.Value
               ?? user.FindFirst("sub")?.Value;

        public static string? GetUsername(this ClaimsPrincipal user)
            => user.Identity?.Name
               ?? user.FindFirst(ClaimTypes.Name)?.Value;

        public static string? GetRole(this ClaimsPrincipal user)
            => user.FindFirst(ClaimTypes.Role)?.Value;
    }
}
