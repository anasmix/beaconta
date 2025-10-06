using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Services
{
    public class SchoolService : ISchoolService
    {
        private readonly BeacontaDb _db;

        public SchoolService(BeacontaDb db) => _db = db;

        public async Task<IReadOnlyList<SchoolDto>> GetAllAsync()
        {
            return await _db.Schools
                .Select(s => new SchoolDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Code = s.Code,
                    Status = s.Status,
                    ColorHex = s.ColorHex,
                    Notes = s.Notes,
                    BranchesCount = s.Branches.Count
                })
                .OrderBy(s => s.Name)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<SchoolDto?> GetByIdAsync(int id)
        {
            return await _db.Schools
                .Where(s => s.Id == id)
                .Select(s => new SchoolDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Code = s.Code,
                    Status = s.Status,
                    ColorHex = s.ColorHex,
                    Notes = s.Notes,
                    BranchesCount = s.Branches.Count
                })
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }
        public async Task<SchoolDto> UpsertAsync(SchoolUpsertDto dto)
        {
            // Normalize color
            string? normColor = string.IsNullOrWhiteSpace(dto.ColorHex)
                ? null
                : dto.ColorHex.Trim().ToLowerInvariant();

            // ========= Normalize & check Code =========
            string? rawCode = dto.Code?.Trim();
            string? normCode = string.IsNullOrWhiteSpace(rawCode) ? null : rawCode.ToUpperInvariant();

            if (!string.IsNullOrWhiteSpace(normCode))
            {
                var exists = await _db.Schools
                    .AnyAsync(x =>
                        x.Id != dto.Id &&
                        x.Code != null &&
                        x.Code.ToUpper() == normCode
                    );

                if (exists)
                    throw new InvalidOperationException($"DUPLICATE_CODE:{rawCode}");
            }
            // =========================================

            School entity;
            if (dto.Id == 0)
            {
                entity = new School
                {
                    Name = dto.Name.Trim(),
                    Code = normCode ?? string.Empty,    // نخزن فارغ بدل null لو تفضّل
                    Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
                    ColorHex = normColor,
                    Notes = dto.Notes
                };
                _db.Schools.Add(entity);
            }
            else
            {
                entity = await _db.Schools.FirstOrDefaultAsync(s => s.Id == dto.Id)
                      ?? throw new KeyNotFoundException($"School #{dto.Id} not found.");

                entity.Name = dto.Name.Trim();
                entity.Code = normCode ?? string.Empty;
                entity.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim();
                entity.ColorHex = normColor;
                entity.Notes = dto.Notes;
            }

            await _db.SaveChangesAsync();
            return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Failed to read saved entity.");
        }

        // 👇 التوقيع الجديد
        public async Task<bool> DeleteAsync(int id, bool force = false)
        {
            var e = await _db.Schools
                .Include(s => s.Branches)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (e == null) return false;

            if (e.Branches.Any())
            {
                if (!force)
                    throw new InvalidOperationException("لا يمكن الحذف لوجود فروع مرتبطة. احذف/انقل الفروع أولاً.");

                await using var tx = await _db.Database.BeginTransactionAsync();
                try
                {
                    _db.Branches.RemoveRange(e.Branches);
                    await _db.SaveChangesAsync();

                    _db.Schools.Remove(e);
                    await _db.SaveChangesAsync();

                    await tx.CommitAsync();
                    return true;
                }
                catch
                {
                    await tx.RollbackAsync();
                    throw;
                }
            }

            _db.Schools.Remove(e);
            await _db.SaveChangesAsync();
            return true;
        }

        // 👇 نقل الفروع من مدرسة إلى أخرى
        public async Task<int> TransferBranchesAsync(int fromSchoolId, int toSchoolId)
        {
            if (fromSchoolId == toSchoolId)
                throw new InvalidOperationException("المدرسة الهدف يجب أن تختلف عن المصدر.");

            var from = await _db.Schools
                .Include(s => s.Branches)
                .FirstOrDefaultAsync(s => s.Id == fromSchoolId)
                ?? throw new KeyNotFoundException($"School #{fromSchoolId} not found.");

            var to = await _db.Schools
                .FirstOrDefaultAsync(s => s.Id == toSchoolId)
                ?? throw new KeyNotFoundException($"Target school #{toSchoolId} not found.");

            var branches = from.Branches.ToList();
            if (branches.Count == 0) return 0;

            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                foreach (var b in branches)
                    b.SchoolId = toSchoolId;

                await _db.SaveChangesAsync();
                await tx.CommitAsync();
                return branches.Count;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }
    }
}
