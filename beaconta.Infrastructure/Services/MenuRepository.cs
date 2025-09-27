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
            // جلب كل الأقسام مع المجموعات والعناصر والصلاحيات (Permissions)
            return await _db.MenuSections
                .AsNoTracking()
                .Include(s => s.Groups)
                    .ThenInclude(g => g.Items)
                        .ThenInclude(i => i.MenuItemPermissions)
                            .ThenInclude(mip => mip.Permission) // ✅ نضمن جلب Permission بدل PermissionKey
                .ToListAsync(ct);
        }

        public async Task<HashSet<string>> GetPermissionKeysForUserAsync(int userId, CancellationToken ct)
        {
            var keys = await _db.UserRoles
                .Where(ur => ur.UserId == userId)
                .SelectMany(ur => ur.Role.RolePermissions)
                .Include(rp => rp.Permission)      // ✅ جلب Permission
                .Select(rp => rp.Permission.Key)  // ✅ نرجع الـ Key من جدول Permissions
                .Distinct()
                .ToListAsync(ct);

            return keys.ToHashSet(StringComparer.OrdinalIgnoreCase);
        }
    }
}
