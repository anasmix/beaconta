// Api/Controllers/AssignmentsController.cs
using beaconta.Infrastructure.Data;
using beaconta.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // => /api/assignments
    public class AssignmentsController : ControllerBase
    {
        private readonly BeacontaDb _db;
        public AssignmentsController(BeacontaDb db) => _db = db;

        public record AssignmentDto(int Id, int GradeYearId, int TemplateId);
        public record SaveReq(int GradeYearId, int TemplateId);

        [HttpGet]
        [Authorize(Policy = "subjects-curricula.view")]
        public async Task<IActionResult> List(CancellationToken ct)
        {
            var rows = await _db.CurriculumAssignments.AsNoTracking()
                .OrderBy(x => x.Id)
                .Select(x => new AssignmentDto(x.Id, x.GradeYearId, x.TemplateId))
                .ToListAsync(ct);
            return Ok(rows);
        }

        [HttpPost]
        [Authorize(Policy = "subjects-curricula.update")]
        public async Task<IActionResult> Create([FromBody] SaveReq req, CancellationToken ct)
        {
            var dup = await _db.CurriculumAssignments.AnyAsync(x =>
                x.GradeYearId == req.GradeYearId && x.TemplateId == req.TemplateId, ct);
            if (dup) return Conflict(new { code = "DUPLICATE_ASSIGN", message = "الإسناد موجود مسبقًا." });

            var row = new CurriculumAssignment { GradeYearId = req.GradeYearId, TemplateId = req.TemplateId };
            _db.CurriculumAssignments.Add(row);
            await _db.SaveChangesAsync(ct);

            return CreatedAtAction(nameof(List), new { id = row.Id }, new AssignmentDto(row.Id, row.GradeYearId, row.TemplateId));
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = "subjects-curricula.update")]
        public async Task<IActionResult> Delete([FromRoute] int id, CancellationToken ct)
        {
            var entity = await _db.CurriculumAssignments.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity is null) return NotFound();
            _db.CurriculumAssignments.Remove(entity);
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
