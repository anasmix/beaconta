using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly BeacontaDb _context;

        public PermissionService(BeacontaDb context)
        {
            _context = context;
        }

        // ✅ إرجاع كل MenuItems كـ "Permissions"
        public async Task<IEnumerable<PermissionDto>> GetAllAsync()
        {
            return await _context.MenuItems
                .Include(mi => mi.Group)
                    .ThenInclude(g => g.Section)
                .OrderBy(mi => mi.Group.Section.SortOrder)
                .ThenBy(mi => mi.Group.SortOrder)
                .ThenBy(mi => mi.SortOrder)
                .Select(mi => new PermissionDto
                {
                    Id = mi.Id,
                    Key = mi.ItemKey,               // 🔴 ItemKey بدل Permission.Key
                    Name = mi.Title,                // 🔴 Title بدل Permission.Name
                    Category = mi.Group.Section.Title // 🔴 Section كـ Category
                })
                .ToListAsync();
        }

        // ✅ إرجاع MenuItems حسب Section.Category
        public async Task<IEnumerable<PermissionDto>> GetByCategoryAsync(string category)
        {
            return await _context.MenuItems
                .Include(mi => mi.Group)
                    .ThenInclude(g => g.Section)
                .Where(mi => mi.Group.Section.Title == category)
                .OrderBy(mi => mi.Group.SortOrder)
                .ThenBy(mi => mi.SortOrder)
                .Select(mi => new PermissionDto
                {
                    Id = mi.Id,
                    Key = mi.ItemKey,
                    Name = mi.Title,
                    Category = mi.Group.Section.Title
                })
                .ToListAsync();
        }
    }
}
