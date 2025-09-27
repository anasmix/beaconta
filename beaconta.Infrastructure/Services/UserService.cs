using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly BeacontaDb _context;

        public UserService(BeacontaDb context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Username = u.Username,
                    Email = u.Email,
                    Phone = u.Phone,
                    Status = u.Status,
                    LastLogin = u.LastLogin,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList(),
                    RoleIds = u.UserRoles.Select(ur => ur.RoleId).ToList()
                })
                .ToListAsync();
        }

        public async Task<UserDto?> GetByIdAsync(int id)
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Where(u => u.Id == id)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Username = u.Username,
                    Email = u.Email,
                    Phone = u.Phone,
                    Status = u.Status,
                    LastLogin = u.LastLogin,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList(),
                    RoleIds = u.UserRoles.Select(ur => ur.RoleId).ToList()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<UserDto> CreateAsync(UserCreateDto dto)
        {
            var user = new User
            {
                FullName = dto.FullName,
                Username = dto.Username,
                Email = dto.Email,
                Phone = dto.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Status = "active" // 👈 دايمًا lowercase
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // ربط المستخدم بالأدوار
            if (dto.RoleIds != null && dto.RoleIds.Any())
            {
                foreach (var roleId in dto.RoleIds)
                {
                    _context.UserRoles.Add(new UserRole
                    {
                        UserId = user.Id,
                        RoleId = roleId,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "system"
                    });
                }
                await _context.SaveChangesAsync();
            }

            return await GetByIdAsync(user.Id) ?? throw new Exception("User not created");
        }

        public async Task<UserDto?> UpdateAsync(UserUpdateDto dto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == dto.Id);

            if (user == null) return null;

            user.FullName = dto.FullName;
            user.Email = dto.Email;
            user.Phone = dto.Phone;
            user.Status = dto.Status.ToLower() == "inactive" ? "inactive" : "active"; // 👈 تأكيد lowercase
            user.UpdatedAt = DateTime.UtcNow;

            // تحديث الأدوار
            _context.UserRoles.RemoveRange(user.UserRoles);
            if (dto.RoleIds != null && dto.RoleIds.Any())
            {
                foreach (var roleId in dto.RoleIds)
                {
                    _context.UserRoles.Add(new UserRole
                    {
                        UserId = user.Id,
                        RoleId = roleId,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "system"
                    });
                }
            }

            await _context.SaveChangesAsync();
            return await GetByIdAsync(user.Id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return false;

            _context.UserRoles.RemoveRange(user.UserRoles);
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleStatusAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            // 👈 التبديل يعتمد lowercase
            user.Status = user.Status == "active" ? "inactive" : "active";

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ResetPasswordAsync(int id, string newPassword)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
