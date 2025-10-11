using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]                   // => api/grades
    [Authorize(Policy = "grades.view")]           // حماية القراءة افتراضياً
    public class GradesController : ControllerBase
    {
        private readonly BeacontaDb _db;
        public GradesController(BeacontaDb db) => _db = db;

        // ===== DTOs =====
        public record GradeRowDto(
            int id, int schoolId, int stageId, int yearId,
            string gradeName, string shift, string gender,
            int capacity, int available, decimal feesTotal,
            int sectionsCount, string status,
            List<string> sectionsPreview
        );

        public record FeeItemDto(string type, string? name, decimal amount);

        public record GradeDetailDto(
            int id, int schoolId, int stageId, int yearId,
            string gradeName, string shift, string gender,
            int capacity, decimal tuition, int sortOrder,
            string status, string? notes, List<FeeItemDto> fees
        );

        public record SaveReq(
            int yearId, int schoolId, int stageId,
            string name, string shift, string gender,
            int capacity, decimal tuition, int sortOrder,
            string status, string? notes, List<FeeReq>? fees
        );
        public record FeeReq(string type, string? name, decimal amount);

        // ===== GET /api/grades =====
        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] int? schoolId,
            [FromQuery] int? stageId,
            [FromQuery] int? yearId,
            [FromQuery] string? status,
            [FromQuery] string? shift,
            [FromQuery] string? gender,
            [FromQuery] string? q,
            CancellationToken ct = default)
        {
            var qry = _db.GradeYears
                .AsNoTracking()
                .Include(g => g.Sections)
                .Include(g => g.Fees)
                .AsQueryable();

            if (schoolId is int sid) qry = qry.Where(g => g.SchoolId == sid);
            if (stageId is int stg) qry = qry.Where(g => g.StageId == stg);
            if (yearId is int yid) qry = qry.Where(g => g.YearId == yid);
            if (!string.IsNullOrWhiteSpace(status)) qry = qry.Where(g => g.Status == status);
            if (!string.IsNullOrWhiteSpace(shift)) qry = qry.Where(g => g.Shift == shift);
            if (!string.IsNullOrWhiteSpace(gender)) qry = qry.Where(g => g.Gender == gender);

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();
                qry = qry.Where(g =>
                    g.Name.Contains(term) ||
                    (g.Notes ?? "").Contains(term) ||
                    g.Sections.Any(s => s.Name.Contains(term)) ||
                    g.Sections.Any(s => (s.Teacher ?? "").Contains(term)));
            }

            var rows = await qry
                .OrderBy(g => g.StageId)
                .ThenBy(g => g.SortOrder)
                .ThenBy(g => g.Name)
                .Select(g => new GradeRowDto(
                    g.Id,
                    g.SchoolId,
                    g.StageId,
                    g.YearId,
                    g.Name,
                    g.Shift,
                    g.Gender,
                    g.Capacity,
                    g.Capacity - (_db.SectionYears.Where(s => s.GradeYearId == g.Id).Sum(s => (int?)s.Capacity) ?? 0),
                    _db.GradeYearFees.Where(f => f.GradeYearId == g.Id).Sum(f => (decimal?)f.Amount) ?? 0m,
                    _db.SectionYears.Count(s => s.GradeYearId == g.Id),
                    g.Status,
                    _db.SectionYears
                        .Where(s => s.GradeYearId == g.Id)
                        .OrderBy(s => s.Name)
                        .Select(s => s.Name)
                        .ToList()
                ))
                .ToListAsync(ct);

            return Ok(rows);
        }

        // ===== GET /api/grades/{id} =====
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById([FromRoute] int id, CancellationToken ct = default)
        {
            var g = await _db.GradeYears
                .AsNoTracking()
                .Include(x => x.Fees)
                .FirstOrDefaultAsync(x => x.Id == id, ct);

            if (g is null) return NotFound();

            var dto = new GradeDetailDto(
                g.Id, g.SchoolId, g.StageId, g.YearId, g.Name,
                g.Shift, g.Gender, g.Capacity, g.Tuition, g.SortOrder,
                g.Status, g.Notes,
                g.Fees.Select(f => new FeeItemDto(f.Type, f.Name, f.Amount)).ToList()
            );

            return Ok(dto);
        }

        // ===== GET /api/grades/{id}/sections  👈 مضاف (تكافؤ مع /gradeyears/{id}/sections)
        [HttpGet("{id:int}/sections")]
        public async Task<IActionResult> GetSections([FromRoute] int id, CancellationToken ct = default)
        {
            var exists = await _db.GradeYears.AsNoTracking().AnyAsync(g => g.Id == id, ct);
            if (!exists) return NotFound(new { message = $"GradeYear #{id} غير موجود." });

            var sections = await _db.SectionYears
                .AsNoTracking()
                .Where(s => s.GradeYearId == id)
                .OrderBy(s => s.Name)
                .Select(s => new
                {
                    id = s.Id,
                    name = s.Name,
                    capacity = s.Capacity,
                    status = s.Status
                })
                .ToListAsync(ct);

            return Ok(sections);
        }

        // ===== تغييرات الحالة (تحتاج صلاحية تحديث) =====
        [HttpPatch("{id:int}/lock")]
        [Authorize(Policy = "grades.update")]
        public async Task<IActionResult> LockGrade([FromRoute] int id, CancellationToken ct)
        {
            var g = await _db.GradeYears.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (g is null) return NotFound();
            g.Status = "Inactive";
            g.UpdatedAt = System.DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpPatch("{id:int}/unlock")]
        [Authorize(Policy = "grades.update")]
        public async Task<IActionResult> UnlockGrade([FromRoute] int id, CancellationToken ct)
        {
            var g = await _db.GradeYears.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (g is null) return NotFound();
            g.Status = "Active";
            g.UpdatedAt = System.DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // ===== POST /api/grades =====
        [HttpPost]
        [Authorize(Policy = "grades.create")]
        public async Task<IActionResult> Create([FromBody] SaveReq req, CancellationToken ct)
        {
            var dup = await _db.GradeYears.AnyAsync(g =>
                g.YearId == req.yearId &&
                g.SchoolId == req.schoolId &&
                g.StageId == req.stageId &&
                g.Name == req.name, ct);

            if (dup)
                return Conflict(new { code = "DUPLICATE_GRADE", message = "Grade already exists in this year/stage/school." });

            var g = new GradeYear
            {
                YearId = req.yearId,
                SchoolId = req.schoolId,
                StageId = req.stageId,
                Name = req.name.Trim(),
                Shift = req.shift,
                Gender = req.gender,
                Capacity = req.capacity,
                Tuition = req.tuition,
                SortOrder = req.sortOrder,
                Status = req.status,
                Notes = req.notes,
                UpdatedAt = System.DateTime.UtcNow
            };
            _db.GradeYears.Add(g);
            await _db.SaveChangesAsync(ct);

            if (req.fees?.Count > 0)
            {
                _db.GradeYearFees.AddRange(req.fees.Select(f => new GradeYearFee
                {
                    GradeYearId = g.Id,
                    Type = f.type,
                    Name = f.name,
                    Amount = f.amount
                }));
                await _db.SaveChangesAsync(ct);
            }

            return CreatedAtAction(nameof(GetById), new { id = g.Id }, new { id = g.Id });
        }

        // ===== PUT /api/grades/{id} =====
        [HttpPut("{id:int}")]
        [Authorize(Policy = "grades.update")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] SaveReq req, CancellationToken ct)
        {
            var g = await _db.GradeYears.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (g is null) return NotFound();

            var dup = await _db.GradeYears.AnyAsync(x =>
                x.Id != id &&
                x.YearId == req.yearId &&
                x.SchoolId == req.schoolId &&
                x.StageId == req.stageId &&
                x.Name == req.name, ct);

            if (dup)
                return Conflict(new { code = "DUPLICATE_GRADE", message = "Grade already exists in this year/stage/school." });

            g.YearId = req.yearId;
            g.SchoolId = req.schoolId;
            g.StageId = req.stageId;
            g.Name = req.name.Trim();
            g.Shift = req.shift;
            g.Gender = req.gender;
            g.Capacity = req.capacity;
            g.Tuition = req.tuition;
            g.SortOrder = req.sortOrder;
            g.Status = req.status;
            g.Notes = req.notes;
            g.UpdatedAt = System.DateTime.UtcNow;

            var oldFees = _db.GradeYearFees.Where(f => f.GradeYearId == id);
            _db.GradeYearFees.RemoveRange(oldFees);

            if (req.fees?.Count > 0)
            {
                _db.GradeYearFees.AddRange(req.fees.Select(f => new GradeYearFee
                {
                    GradeYearId = id,
                    Type = f.type,
                    Name = f.name,
                    Amount = f.amount
                }));
            }

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // ===== DELETE /api/grades/{id} =====
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "grades.delete")]
        public async Task<IActionResult> Delete([FromRoute] int id, CancellationToken ct)
        {
            var g = await _db.GradeYears.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (g is null) return NotFound();

            _db.GradeYears.Remove(g);
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
