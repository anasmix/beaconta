using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Services
{
    public class SectionYearService : ISectionYearService
    {
        private readonly BeacontaDb _db;
        public SectionYearService(BeacontaDb db) => _db = db;

        public async Task<List<SectionYearDto>> GetByGradeYearAsync(int gradeYearId, CancellationToken ct)
        {
            return await _db.SectionYears.AsNoTracking()
                .Where(s => s.GradeYearId == gradeYearId)
                .OrderBy(s => s.Name)
                .Select(s => new SectionYearDto
                {
                    Id = s.Id,
                    GradeYearId = s.GradeYearId,
                    Name = s.Name,
                    Capacity = s.Capacity,
                    Teacher = s.Teacher,
                    Notes = s.Notes,
                    Status = s.Status ?? "Active" // ✅ إرجاع الحالة
                })
                .ToListAsync(ct);
        }

        public async Task<SectionYearDto> UpsertAsync(SectionYearUpsertDto dto, CancellationToken ct)
        {
            // تأكيد وجود الصف الأب
            var exists = await _db.GradeYears.AnyAsync(g => g.Id == dto.GradeYearId, ct);
            if (!exists) throw new KeyNotFoundException("Parent GradeYear not found.");

            if (dto.Id == 0)
            {
                var entity = new SectionYear
                {
                    GradeYearId = dto.GradeYearId,
                    Name = dto.Name.Trim(),
                    Capacity = dto.Capacity,
                    Teacher = dto.Teacher,
                    Notes = dto.Notes,
                    Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status, // ✅ جديد
                    CreatedAt = DateTime.UtcNow
                };
                _db.SectionYears.Add(entity);
                await _db.SaveChangesAsync(ct);

                return new SectionYearDto
                {
                    Id = entity.Id,
                    GradeYearId = entity.GradeYearId,
                    Name = entity.Name,
                    Capacity = entity.Capacity,
                    Teacher = entity.Teacher,
                    Notes = entity.Notes,
                    Status = entity.Status ?? "Active" // ✅
                };
            }
            else
            {
                var entity = await _db.SectionYears.FirstOrDefaultAsync(s => s.Id == dto.Id, ct)
                             ?? throw new KeyNotFoundException("SectionYear not found.");

                // تأمين التوافق لو غُيّر GradeYearId بالواجهة
                entity.GradeYearId = dto.GradeYearId;
                entity.Name = dto.Name.Trim();
                entity.Capacity = dto.Capacity;
                entity.Teacher = dto.Teacher;
                entity.Notes = dto.Notes;

                // ✅ تحديث الحالة إن تم إرسالها (وإلا احتفظ بالحالية)
                if (!string.IsNullOrWhiteSpace(dto.Status))
                    entity.Status = dto.Status;

                entity.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);

                return new SectionYearDto
                {
                    Id = entity.Id,
                    GradeYearId = entity.GradeYearId,
                    Name = entity.Name,
                    Capacity = entity.Capacity,
                    Teacher = entity.Teacher,
                    Notes = entity.Notes,
                    Status = entity.Status ?? "Active" // ✅
                };
            }
        }

        public async Task<int> BulkCreateAsync(int gradeYearId, IEnumerable<SectionYearUpsertDto> dtos, CancellationToken ct)
        {
            var list = (dtos ?? Enumerable.Empty<SectionYearUpsertDto>())
                .Where(x => x != null && x.Id == 0 && !string.IsNullOrWhiteSpace(x.Name))
                .Select(x => new SectionYear
                {
                    GradeYearId = gradeYearId,
                    Name = x.Name!.Trim(),
                    Capacity = x.Capacity,
                    Teacher = x.Teacher,
                    Notes = x.Notes,
                    Status = string.IsNullOrWhiteSpace(x.Status) ? "Active" : x.Status, // ✅
                    CreatedAt = DateTime.UtcNow
                }).ToList();

            if (list.Count == 0) return 0;
            await _db.SectionYears.AddRangeAsync(list, ct);
            return await _db.SaveChangesAsync(ct);
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken ct)
        {
            var e = await _db.SectionYears.FirstOrDefaultAsync(s => s.Id == id, ct);
            if (e is null) return false;
            _db.SectionYears.Remove(e);
            await _db.SaveChangesAsync(ct);
            return true;
        }

        // ✅ جديد: تبديل الحالة من الكنترولر (lock/unlock)
        public async Task<bool> SetStatusAsync(int gradeYearId, int id, string status, CancellationToken ct)
        {
            // توكيد الانتماء لنفس الصف-السنة ولضبط الأداء
            var e = await _db.SectionYears
                .Where(s => s.Id == id && s.GradeYearId == gradeYearId)
                .FirstOrDefaultAsync(ct);

            if (e is null) return false;

            // فقط Active/Inactive
            var normalized = (status ?? "").Trim();
            if (normalized != "Active" && normalized != "Inactive")
                throw new ArgumentException("Status must be 'Active' or 'Inactive'.");

            e.Status = normalized;
            e.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return true;
        }
    }
}
