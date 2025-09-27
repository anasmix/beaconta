using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace beaconta.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly BeacontaDb _context;
        private readonly IConfiguration _config;

        public AuthService(BeacontaDb context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public async Task<LoginResponseDto?> LoginAsync(string username, string password)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.Permissions)
                            .ThenInclude(rp => rp.MenuItem) // 🔴 بدل Permission
                .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());

            if (user == null)
                return null;

            // التحقق من كلمة السر
            if (!BCrypt.Net.BCrypt.Verify(password ?? "", user.PasswordHash))
                return null;

            // ✅ الكلايمز الأساسية
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim("FullName", user.FullName ?? "")
            };

            // ✅ إضافة جميع الأدوار (Key + Name)
            foreach (var role in user.UserRoles.Select(ur => ur.Role))
            {
                claims.Add(new Claim(ClaimTypes.Role, role.Key));  // "admin"
                claims.Add(new Claim("role_name", role.Name));     // "Admin"
            }

            // ✅ إضافة جميع الصلاحيات (ItemKey من MenuItem)
            var permissions = user.UserRoles
                .SelectMany(ur => ur.Role.Permissions)
                .Select(rp => rp.MenuItem.ItemKey) // 🔴 بدل Permission.Key
                .Distinct();

            foreach (var perm in permissions)
            {
                claims.Add(new Claim("permission", perm));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expire = DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:ExpireMinutes"]!));

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: expire,
                signingCredentials: creds
            );

            return new LoginResponseDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                ExpiresAtUtc = expire
            };
        }
    }
}
