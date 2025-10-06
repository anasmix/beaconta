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
                        // لا Include مع ProjectTo
                        .Where(g => g.YearId == yearId);

            if (schoolId is int sid) qry = qry.Where(g => g.SchoolId == sid);
            if (stageId is int stg) qry = qry.Where(g => g.StageId == stg);

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();
                // LIKE %term% (غير حساس لحالة الأحرف غالبًا حسب collation)
                qry = qry.Where(g => EF.Functions.Like(g.Name, $"%{term}%"));
            }

            return await qry
                .OrderBy(g => g.StageId).ThenBy(g => g.SortOrder).ThenBy(g => g.Name).ThenBy(g => g.Id)
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

            try
            {
                if (dto.Id == 0)
                {
                    var entity = new GradeYear
                    {
                        YearId = dto.YearId,
                        SchoolId = dto.SchoolId,
                        StageId = dto.StageId,
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
                        Fees = new List<GradeYearFee>()
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
                    entity.StageId = dto.StageId;
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

                    // حذف الرسوم التي أزيلت
                    var incomingIds = incomingFees.Where(f => f.Id > 0).Select(f => f.Id).ToHashSet();
                    foreach (var fee in entity.Fees.ToList())
                        if (fee.Id > 0 && !incomingIds.Contains(fee.Id))
                            _db.GradeYearFees.Remove(fee);

                    // إضافة/تحديث الرسوم
                    var map = entity.Fees.ToDictionary(f => f.Id);
                    foreach (var f in incomingFees)
                    {
                        if (f.Id > 0 && map.TryGetValue(f.Id, out var ex))
                        {
                            ex.Type = f.Type;
                            ex.Name = f.Name;
                            ex.Amount = f.Amount;
                            ex.UpdatedAt = DateTime.UtcNow;
                            ex.UpdatedBy = userName;
                        }
                        else
                        {
                            entity.Fees.Add(new GradeYearFee
                            {
                                Type = f.Type,
                                Name = f.Name,
                                Amount = f.Amount,
                                CreatedAt = DateTime.UtcNow,
                                CreatedBy = userName
                            });
                        }
                    }

                    await _db.SaveChangesAsync(ct);
                    return _mapper.Map<GradeYearDto>(entity);
                }
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message?.Contains("UNIQUE", System.StringComparison.OrdinalIgnoreCase) == true)
            {
                // مثال: لو عندك فهرس فريد على (YearId, SchoolId, StageId, Name)
                throw new InvalidOperationException("DUPLICATE_GRADE_NAME", ex);
            }
        }

        //public async Task<bool> DeleteAsync(int id, CancellationToken ct)
        //{
        //    var e = await _db.GradeYears.FirstOrDefaultAsync(g => g.Id == id, ct);
        //    if (e is null) return false;

        //    _db.SectionYears.RemoveRange(_db.SectionYears.Where(s => s.GradeYearId == id));
        //    _db.GradeYearFees.RemoveRange(_db.GradeYearFees.Where(f => f.GradeYearId == id));
        //    _db.GradeYears.Remove(e);
        //    await _db.SaveChangesAsync(ct);
        //    return true;
        //}
        public async Task<bool> DeleteAsync(int id, CancellationToken ct)
        {
            var e = await _db.GradeYears.FirstOrDefaultAsync(g => g.Id == id, ct);
            if (e is null) return false;

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

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("YearId,SchoolId,StageId,Name,Shift,Gender,Capacity,Tuition,SortOrder,Status,FeesCount");

            var inv = System.Globalization.CultureInfo.InvariantCulture;
            foreach (var g in list)
            {
                string Esc(string? s) => $"\"{(s ?? string.Empty).Replace("\"", "\"\"")}\"";
                sb.Append(g.YearId.ToString(inv)).Append(',')
                  .Append(g.SchoolId.ToString(inv)).Append(',')
                  .Append(g.StageId.ToString(inv)).Append(',')
                  .Append(Esc(g.Name)).Append(',')
                  .Append(Esc(g.Shift)).Append(',')
                  .Append(Esc(g.Gender)).Append(',')
                  .Append(g.Capacity.ToString(inv)).Append(',')
                  .Append(g.Tuition.ToString(inv)).Append(',')
                  .Append(g.SortOrder.ToString(inv)).Append(',')
                  .Append(Esc(g.Status)).Append(',')
                  .AppendLine((g.Fees?.Count ?? 0).ToString(inv));
            }

            return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
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
