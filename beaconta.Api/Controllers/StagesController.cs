using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

[ApiController]
[Route("api/[controller]")]
public class StagesController : ControllerBase
{
    private readonly BeacontaDb _db;
    public StagesController(BeacontaDb db) => _db = db;

    // GET: /api/stages/stats?schoolId=&branchId=&yearId=&status=&shift=
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(
        [FromQuery] int? schoolId,
        [FromQuery] int? branchId,
        [FromQuery] int? yearId,
        [FromQuery] string? status,
        [FromQuery] string? shift,
        CancellationToken ct = default)
    {
        // ملاحظة: غيّر أسماء الكيانات/الخصائص لتطابق مشروعك
        // Stage: Id, SchoolId?, BranchId?, Status
        // Grade: Id, StageId, SchoolId?, BranchId?, YearId?, Status, Shift, SectionName?
        var stages = _db.Set<Stage>().AsNoTracking().AsQueryable();
        var grades = _db.Set<Grade>().AsNoTracking().AsQueryable();

        if (schoolId.HasValue) { stages = stages.Where(s => s.SchoolId == schoolId); grades = grades.Where(g => g.SchoolId == schoolId); }
        if (branchId.HasValue) { stages = stages.Where(s => s.BranchId == branchId); grades = grades.Where(g => g.BranchId == branchId); }
        if (yearId.HasValue) { grades = grades.Where(g => g.YearId == yearId); }
        if (!string.IsNullOrWhiteSpace(status))
        {
            var st = status.Trim();
            stages = stages.Where(s => s.Status == st);
            grades = grades.Where(g => g.Status == st);
        }
        if (!string.IsNullOrWhiteSpace(shift))
        {
            var sh = shift.Trim();
            grades = grades.Where(g => g.Shift == sh);
        }

        var stagesCount = await stages.CountAsync(ct);
        var gradesCount = await grades.CountAsync(ct);
        var sectionsCount = await grades.CountAsync(g => g.SectionName != null && g.SectionName != "", ct);

        return Ok(new { stages = stagesCount, grades = gradesCount, sections = sectionsCount });
    }
}
