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

        public async Task<IEnumerable<PermissionDto>> GetAllAsync()
        {
            return await _context.Permissions
                .Select(p => new PermissionDto
                {
                    Id = p.Id,
                    Key = p.Key,
                    Name = p.Name,
                    Category = p.Category
                }).ToListAsync();
        }

        public async Task<IEnumerable<PermissionDto>> GetByCategoryAsync(string category)
        {
            return await _context.Permissions
                .Where(p => p.Category == category)
                .Select(p => new PermissionDto
                {
                    Id = p.Id,
                    Key = p.Key,
                    Name = p.Name,
                    Category = p.Category
                }).ToListAsync();
        }
    }
}
