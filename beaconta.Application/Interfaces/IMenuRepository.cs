using beaconta.Domain.Entities;

namespace beaconta.Application.Interfaces
{
    public interface IMenuRepository
    {
        Task<List<MenuSection>> LoadFullMenuAsync(CancellationToken ct);
        Task<HashSet<string>> GetPermissionKeysForUserAsync(int userId, CancellationToken ct);
    }
}
