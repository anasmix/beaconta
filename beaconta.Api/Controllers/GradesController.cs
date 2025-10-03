// Controllers/GradesController.cs
using beaconta.Infrastructure.Data;
using beaconta.Domain.Entities;          // تأكد منه لو الكيان عندك
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class GradesController : ControllerBase
{
    private readonly BeacontaDb _db;
    public GradesController(BeacontaDb db) => _db = db;

    // GET /api/grades?schoolId=&branchId=&stageId=&yearId=&status=&shift=&q=
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int? schoolId,
        [FromQuery] int? branchId,
        [FromQuery] int? stageId,
        [FromQuery] int? yearId,
        [FromQuery] string? status,
        [FromQuery] string? shift,
        [FromQuery] string? q,
        CancellationToken ct = default)
    {
        // ملاحظة: بدّل Grade/Stage وحقولها لتطابق سكيماك
        var grades = _db.Grades.AsNoTracking().AsQueryable();

        if (schoolId is int sid) grades = grades.Where(g => g.SchoolId == sid);
        if (branchId is int bid) grades = grades.Where(g => g.BranchId == bid);
        if (stageId is int stg) grades = grades.Where(g => g.StageId == stg);
        if (yearId is int yid) grades = grades.Where(g => g.YearId == yid);

        if (!string.IsNullOrWhiteSpace(status))
        {
            // لو عندك IsActive(bool) بدّل للسطر التالي:
            // var isOn = status.Equals("Active", StringComparison.OrdinalIgnoreCase);
            // grades = grades.Where(g => g.IsActive == isOn);
            grades = grades.Where(g => g.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(shift))
            grades = grades.Where(g => g.Shift == shift);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            grades = grades.Where(g =>
                (g.GradeName != null && g.GradeName.Contains(term)) ||
                (g.SectionName != null && g.SectionName.Contains(term)) ||
                (g.Code != null && g.Code.Contains(term)));
        }

        // إسقاط إلى DTO خفيف يطابق واجهتك
        var list = await grades
            .OrderBy(g => g.StageId).ThenBy(g => g.GradeName).ThenBy(g => g.SectionName)
            .Select(g => new {
                id = g.Id,
                schoolId = g.SchoolId,
                branchId = g.BranchId,
                stageId = g.StageId,
                yearId = g.YearId,

                schoolName = "",  // عبّئها لاحقًا بانضمام/عرض
                branchName = "",
                stageName = "",

                gradeName = g.GradeName,
                sectionName = g.SectionName,
                code = g.Code,
                shift = g.Shift,
                status = g.Status,        // أو IsActive
                capacity = g.Capacity,
                homeroomTeacherName = "", // لو عندك علاقة معلّم فصل
            })
            .ToListAsync(ct);

        return Ok(list);
    }
}
