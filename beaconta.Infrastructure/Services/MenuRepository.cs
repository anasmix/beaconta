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
            // جلب كل الأقسام مع المجموعات والعناصر والصلاحيات (PermissionKeys)
            return await _db.MenuSections
                .AsNoTracking()
                .Include(s => s.Groups)
                    .ThenInclude(g => g.Items)
                        .ThenInclude(i => i.MenuItemPermissions)
                .ToListAsync(ct);
        }

        public async Task<HashSet<string>> GetPermissionKeysForUserAsync(int userId, CancellationToken ct)
        {
            // Roles -> RolePermissions -> MenuItemId -> MenuItemPermissions -> PermissionKey
            var keys = await _db.UserRoles
        .Where(ur => ur.UserId == userId)
.SelectMany(ur => ur.Role.Permissions) // RolePermissions
.Join(_db.MenuItems,
      rp => rp.MenuItemId,   // 👈 صار يربط على MenuItemId
      mi => mi.Id,
      (rp, mi) => mi)
.SelectMany(mi => mi.MenuItemPermissions)
.Select(mip => mip.PermissionKey)   // 👈 نرجع المفاتيح (string)
.Distinct()
.ToListAsync(ct);

            return keys.ToHashSet(StringComparer.OrdinalIgnoreCase);
        }
    }
}
