using beaconta.Application.Interfaces;
using beaconta.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
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

        public async Task<string?> LoginAsync(string username, string password)
        {
            var user = await _context.Users
                                     .Include(u => u.Role) // ⬅️ مهم عشان تجيب اسم الدور
                                     .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null || user.PasswordHash != password) // ⚠️ للتجربة فقط
                return null;

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role.Name) // ⬅️ استخدم اسم الدور
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(int.Parse(_config["Jwt:ExpireMinutes"]!)),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
