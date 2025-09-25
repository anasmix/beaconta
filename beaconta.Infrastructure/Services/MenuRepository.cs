using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Services
{
    public class MenuRepository : IMenuRepository
    {
        private readonly BeacontaDb _db;
        public MenuRepository(BeacontaDb db) => _db = db;

        public async Task<List<MenuSection>> LoadFullMenuAsync(CancellationToken ct)
        {
            // ملاحظة: لا تستخدم OrderBy داخل Include، رتب أثناء الـ DTO mapping
            return await _db.MenuSections
                .AsNoTracking()
                .Include(s => s.Groups)
                    .ThenInclude(g => g.Items)
                        .ThenInclude(i => i.MenuItemPermissions)
                            .ThenInclude(ip => ip.Permission)
                .ToListAsync(ct);
        }

        public async Task<HashSet<string>> GetPermissionKeysForUserAsync(int userId, CancellationToken ct)
        {
            // Roles -> RolePermissions -> Permission.Key
            var keys = await _db.UserRoles
                .Where(ur => ur.UserId == userId)
                .SelectMany(ur => ur.Role.Permissions)
                .Select(rp => rp.Permission.Key)
                .Distinct()
                .ToListAsync(ct);

            return keys.ToHashSet(StringComparer.OrdinalIgnoreCase);
        }
    }
}
