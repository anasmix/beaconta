using AutoMapper;
using AutoMapper.QueryableExtensions;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Services
{
    public class GradeYearService : IGradeYearService
    {
        private readonly BeacontaDb _db;
        private readonly IMapper _mapper;
        public GradeYearService(BeacontaDb db, IMapper mapper) { _db = db; _mapper = mapper; }

        public async Task<List<GradeYearDto>> GetAllAsync(int yearId, int? schoolId, int? stageId, string? q, CancellationToken ct)
        {
            var qry = _db.GradeYears.AsNoTracking()
                        .Include(g => g.Fees)
                        .Where(g => g.YearId == yearId);

            if (schoolId is int sid) qry = qry.Where(g => g.SchoolId == sid);
            if (stageId is int stg) qry = qry.Where(g => g.StageId == stg);
            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();
                qry = qry.Where(g => g.Name.Contains(term));
            }

            return await qry.OrderBy(g => g.StageId).ThenBy(g => g.SortOrder).ThenBy(g => g.Name)
                            .ProjectTo<GradeYearDto>(_mapper.ConfigurationProvider)
                            .ToListAsync(ct);
        }

        public async Task<GradeYearDto?> GetByIdAsync(int id, CancellationToken ct)
        {
            var e = await _db.GradeYears.Include(g => g.Fees).AsNoTracking()
                        .FirstOrDefaultAsync(g => g.Id == id, ct);
            return e is null ? null : _mapper.Map<GradeYearDto>(e);
        }

        public async Task<GradeYearDto> UpsertAsync(GradeYearUpsertDto dto, string? userName, CancellationToken ct)
        {
            var incomingFees = (dto.Fees ?? new()).Where(f => f.Amount > 0).ToList();

            if (dto.Id == 0)
            {
                var entity = new GradeYear
                {
                    YearId = dto.YearId,
                    SchoolId = dto.SchoolId,
                    StageId = dto.StageId,   // 👈 يتخزّن
                    Name = dto.Name,
                    Shift = dto.Shift,
                    Gender = dto.Gender,
                    Capacity = dto.Capacity,
                    Tuition = dto.Tuition,
                    SortOrder = dto.SortOrder,
                    Status = dto.Status,
                    Notes = dto.Notes,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userName,
                    Fees = new List<GradeYearFee>() // 👈 مهم لتجنّب null
                };

                foreach (var f in incomingFees)
                    entity.Fees.Add(new GradeYearFee { Type = f.Type, Name = f.Name, Amount = f.Amount, CreatedAt = DateTime.UtcNow, CreatedBy = userName });

                _db.GradeYears.Add(entity);
                await _db.SaveChangesAsync(ct);
                return _mapper.Map<GradeYearDto>(entity);
            }
            else
            {
                var entity = await _db.GradeYears.Include(g => g.Fees).FirstOrDefaultAsync(g => g.Id == dto.Id, ct)
                             ?? throw new KeyNotFoundException("GradeYear not found.");

                entity.YearId = dto.YearId;
                entity.SchoolId = dto.SchoolId;
                entity.StageId = dto.StageId; // 👈
                entity.Name = dto.Name;
                entity.Shift = dto.Shift;
                entity.Gender = dto.Gender;
                entity.Capacity = dto.Capacity;
                entity.Tuition = dto.Tuition;
                entity.SortOrder = dto.SortOrder;
                entity.Status = dto.Status;
                entity.Notes = dto.Notes;
                entity.UpdatedAt = DateTime.UtcNow;
                entity.UpdatedBy = userName;

                // حذف الرسوم المزالة (Id>0 فقط) — إصلاح استثناء "temporary value"
                var incomingIds = incomingFees.Where(f => f.Id > 0).Select(f => f.Id).ToHashSet();
                foreach (var fee in entity.Fees.ToList())
                    if (fee.Id > 0 && !incomingIds.Contains(fee.Id))
                        _db.GradeYearFees.Remove(fee);

                // إضافة/تحديث
                var map = entity.Fees.ToDictionary(f => f.Id);
                foreach (var f in incomingFees)
                {
                    if (f.Id > 0 && map.TryGetValue(f.Id, out var ex))
                    {
                        ex.Type = f.Type; ex.Name = f.Name; ex.Amount = f.Amount; ex.UpdatedAt = DateTime.UtcNow; ex.UpdatedBy = userName;
                    }
                    else
                    {
                        entity.Fees.Add(new GradeYearFee { Type = f.Type, Name = f.Name, Amount = f.Amount, CreatedAt = DateTime.UtcNow, CreatedBy = userName });
                    }
                }

                await _db.SaveChangesAsync(ct);
                return _mapper.Map<GradeYearDto>(entity);
            }
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken ct)
        {
            var e = await _db.GradeYears.FirstOrDefaultAsync(g => g.Id == id, ct);
            if (e is null) return false;

            _db.SectionYears.RemoveRange(_db.SectionYears.Where(s => s.GradeYearId == id));
            _db.GradeYearFees.RemoveRange(_db.GradeYearFees.Where(f => f.GradeYearId == id));
            _db.GradeYears.Remove(e);
            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> ToggleStatusAsync(int id, CancellationToken ct)
        {
            var e = await _db.GradeYears.FirstOrDefaultAsync(g => g.Id == id, ct);
            if (e is null) return false;
            e.Status = e.Status == "Active" ? "Inactive" : "Active";
            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<byte[]> ExportAsync(int yearId, int? schoolId, int? stageId, string? q, string? format, CancellationToken ct)
        {
            var list = await GetAllAsync(yearId, schoolId, stageId, q, ct);
            var lines = new List<string> { "YearId,SchoolId,StageId,Name,Shift,Gender,Capacity,Tuition,SortOrder,Status,FeesCount" };
            foreach (var g in list)
                lines.Add(string.Join(",", g.YearId, g.SchoolId, g.StageId, Quote(g.Name), g.Shift, g.Gender, g.Capacity, g.Tuition, g.SortOrder, g.Status, g.Fees?.Count ?? 0));
            return System.Text.Encoding.UTF8.GetBytes(string.Join("\n", lines));
            static string Quote(string s) => $"\"{(s ?? "").Replace("\"", "\"\"")}\"";
        }

        public async Task<CompareResponseDto> CompareAsync(int yearA, int yearB, CancellationToken ct)
        {
            var A = await Totals(yearA, ct);
            var B = await Totals(yearB, ct);
            return new CompareResponseDto { A = A, B = B };
        }

        private async Task<CompareResponseDto.TotalsDto> Totals(int yearId, CancellationToken ct)
        {
            var grades = await _db.GradeYears.AsNoTracking().Where(g => g.YearId == yearId).ToListAsync(ct);
            var gIds = grades.Select(g => g.Id).ToList();

            var sectionsCount = await _db.SectionYears.AsNoTracking().Where(s => gIds.Contains(s.GradeYearId)).CountAsync(ct);
            var feesSum = await _db.GradeYearFees.AsNoTracking().Where(f => gIds.Contains(f.GradeYearId)).SumAsync(f => (decimal?)f.Amount, ct) ?? 0m;

            return new CompareResponseDto.TotalsDto
            {
                Grades = grades.Count,
                Sections = sectionsCount,
                Capacity = grades.Sum(g => g.Capacity),
                Fees = feesSum
            };
        }
    }
}
