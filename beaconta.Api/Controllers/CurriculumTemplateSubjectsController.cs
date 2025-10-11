// Api/Controllers/CurriculumTemplateSubjectsController.cs
using beaconta.Infrastructure.Data;
using beaconta.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/curriculumtemplates/{templateId:int}/subjects")]
    public class CurriculumTemplateSubjectsController : ControllerBase
    {
        private readonly BeacontaDb _db;
        public CurriculumTemplateSubjectsController(BeacontaDb db) => _db = db;

        // GET: /api/curriculumtemplates/{templateId}/subjects
        [HttpGet]
        [Authorize(Policy = "subjects-curricula.view")]
        public async Task<IActionResult> Get([FromRoute] int templateId, CancellationToken ct)
        {
            var ok = await _db.CurriculumTemplates.AsNoTracking().AnyAsync(t => t.Id == templateId, ct);
            if (!ok) return NotFound();

            var ids = await _db.CurriculumTemplateSubjects.AsNoTracking()
                .Where(x => x.TemplateId == templateId)
                .Select(x => x.SubjectId)
                .ToListAsync(ct);

            return Ok(ids);
        }

        public class MapReq { public List<int> SubjectIds { get; set; } = new(); }

        // POST: /api/curriculumtemplates/{templateId}/subjects
        // Body: { "subjectIds": [1,2,3] }
        [HttpPost]
        [Authorize(Policy = "subjects-curricula.update")]
        public async Task<IActionResult> Map([FromRoute] int templateId, [FromBody] MapReq req, CancellationToken ct)
        {
            var tmpl = await _db.CurriculumTemplates.FirstOrDefaultAsync(t => t.Id == templateId, ct);
            if (tmpl is null) return NotFound();

            var current = await _db.CurriculumTemplateSubjects.Where(x => x.TemplateId == templateId).ToListAsync(ct);
            _db.CurriculumTemplateSubjects.RemoveRange(current);

            if (req?.SubjectIds?.Count > 0)
            {
                var rows = req.SubjectIds.Distinct().Select(sid => new CurriculumTemplateSubject
                {
                    TemplateId = templateId,
                    SubjectId = sid
                });
                await _db.CurriculumTemplateSubjects.AddRangeAsync(rows, ct);
            }

            await _db.SaveChangesAsync(ct);
            return Ok(new { templateId, count = req?.SubjectIds?.Count ?? 0 });
        }
    }
}
