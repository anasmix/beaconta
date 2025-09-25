using beaconta.Application.DTOs;

namespace beaconta.Application.Interfaces
{
    public interface IMenuService
    {
        Task<IReadOnlyList<MenuSectionDto>> GetMenuForCurrentUserAsync(CancellationToken ct = default);
        Task InvalidateCacheForUserAsync(int userId);
    }
}
