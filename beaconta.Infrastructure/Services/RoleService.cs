using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Services
{
    public class RoleService : IRoleService
    {
        private readonly BeacontaDb _context;

        public RoleService(BeacontaDb context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RoleDto>> GetAllAsync()
        {
            return await _context.Roles
                .Include(r => r.Permissions)
                .Select(r => new RoleDto
                {
                    Id = r.Id,
                    Key = r.Key,
                    Name = r.Name,
                    UsersCount = _context.UserRoles.Count(ur => ur.RoleId == r.Id),
                    PermissionIds = r.Permissions.Select(p => p.PermissionId).ToList(),
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<RoleDto?> GetByIdAsync(int id)
        {
            var role = await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return null;

            return new RoleDto
            {
                Id = role.Id,
                Key = role.Key,
                Name = role.Name,
                UsersCount = await _context.UserRoles.CountAsync(ur => ur.RoleId == id),
                PermissionIds = role.Permissions.Select(p => p.PermissionId).ToList(),
                CreatedAt = role.CreatedAt
            };
        }

        public async Task<RoleDto> CreateAsync(string name)
        {
            var role = new Role
            {
                Name = name,
                Key = Guid.NewGuid().ToString("N"),
                CreatedAt = DateTime.UtcNow
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            return new RoleDto
            {
                Id = role.Id,
                Key = role.Key,
                Name = role.Name,
                UsersCount = 0,
                PermissionIds = new List<int>(),
                CreatedAt = role.CreatedAt
            };
        }

        public async Task<RoleDto?> UpdateNameAsync(int id, string newName)
        {
            var role = await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return null;

            role.Name = newName;
            role.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new RoleDto
            {
                Id = role.Id,
                Key = role.Key,
                Name = role.Name,
                UsersCount = await _context.UserRoles.CountAsync(ur => ur.RoleId == id),
                PermissionIds = role.Permissions.Select(p => p.PermissionId).ToList(),
                CreatedAt = role.CreatedAt
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var role = await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return false;

            // تحقق إذا مرتبط بمستخدمين
            bool hasUsers = await _context.UserRoles.AnyAsync(ur => ur.RoleId == id);
            if (hasUsers) return false;

            _context.RolePermissions.RemoveRange(role.Permissions);
            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<RoleDto?> UpdatePermissionsAsync(UpdateRolePermissionsDto dto)
        {
            var role = await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == dto.RoleId);

            if (role == null) return null;

            _context.RolePermissions.RemoveRange(role.Permissions);

            var permissions = await _context.Permissions
                .Where(p => dto.PermissionIds.Contains(p.Id))
                .ToListAsync();

            role.Permissions = permissions.Select(p => new RolePermission
            {
                RoleId = role.Id,
                PermissionId = p.Id,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "system"
            }).ToList();

            await _context.SaveChangesAsync();

            return new RoleDto
            {
                Id = role.Id,
                Key = role.Key,
                Name = role.Name,
                UsersCount = await _context.UserRoles.CountAsync(ur => ur.RoleId == role.Id),
                PermissionIds = role.Permissions.Select(rp => rp.PermissionId).ToList(),
                CreatedAt = role.CreatedAt
            };
        }

        public async Task<bool> ClonePermissionsAsync(int fromRoleId, int toRoleId)
        {
            var fromRole = await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == fromRoleId);

            var toRole = await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == toRoleId);

            if (fromRole == null || toRole == null) return false;

            _context.RolePermissions.RemoveRange(toRole.Permissions);

            toRole.Permissions = fromRole.Permissions.Select(p => new RolePermission
            {
                RoleId = toRoleId,
                PermissionId = p.PermissionId,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "system"
            }).ToList();

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<UserDto>> GetUsersByRoleIdAsync(int roleId)
        {
            return await _context.UserRoles
                .Where(ur => ur.RoleId == roleId)
                .Include(ur => ur.User)
                .Select(ur => new UserDto
                {
                    Id = ur.User.Id,
                    Username = ur.User.Username,
                    FullName = ur.User.FullName,
                    Email = ur.User.Email,
                    Phone = ur.User.Phone,
                    Status = ur.User.Status,
                    LastLogin = ur.User.LastLogin,
                    Roles = ur.User.UserRoles.Select(r => r.Role.Name).ToList() // ✅ هنا
                })
                .ToListAsync();
        }

    }
}
