// Api/Controllers/CurriculumTemplatesController.cs
using beaconta.Application.DTOs;
using beaconta.Infrastructure.Data;
using beaconta.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/curriculumtemplates")]                     // ✅ مسار صريح جمع
    public class CurriculumTemplatesController : ControllerBase
    {
        private readonly BeacontaDb _db;
        public CurriculumTemplatesController(BeacontaDb db) => _db = db;

        // GET /api/curriculumtemplates?yearId=&q=
        [HttpGet]
        [Authorize(Policy = "subjects-curricula.view")]
        public async Task<IActionResult> List(
            [FromQuery] int? yearId,
            [FromQuery] string? q,
            CancellationToken ct)
        {
            var qry = _db.CurriculumTemplates.AsNoTracking().AsQueryable();
            if (yearId is int y) qry = qry.Where(t => t.YearId == y);
            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();
                qry = qry.Where(t =>
                    t.TemplateCode.Contains(term) ||
                    t.Name.Contains(term));
            }

            var rows = await qry
      .OrderBy(t => t.TemplateCode)
      .ThenBy(t => t.Name)
      .Select(t => new CurriculumTemplateDto(
          t.Id,
          t.TemplateCode,
          t.Name,
          t.YearId
      ))
      .ToListAsync(ct);

            return Ok(rows);
 
        }

        // GET /api/curriculumtemplates/{id}
        [HttpGet("{id:int}")]
        [Authorize(Policy = "subjects-curricula.view")]
        public async Task<IActionResult> GetById([FromRoute] int id, CancellationToken ct)
        {
            var t = await _db.CurriculumTemplates.AsNoTracking()
      .FirstOrDefaultAsync(x => x.Id == id, ct);
            if (t is null) return NotFound();

            var dto = new CurriculumTemplateDto(
                t.Id,
                t.TemplateCode,
                t.Name,
                t.YearId
            );
            return Ok(dto);

        }

        [HttpPost]
        [Authorize(Policy = "subjects-curricula.create")]
        public async Task<IActionResult> Create([FromBody] CurriculumTemplateDto dto, CancellationToken ct)
        {
            if (dto is null) return BadRequest("Body مطلوب.");

            var dup = await _db.CurriculumTemplates.AnyAsync(x =>
                x.TemplateCode == dto.TemplateCode && x.YearId == dto.YearId, ct);
            if (dup) return Conflict(new { code = "DUPLICATE_TEMPLATE", message = "TemplateCode موجود لنفس السنة." });

            var entity = new CurriculumTemplate
            {
                TemplateCode = dto.TemplateCode.Trim(),
                Name = dto.Name.Trim(),
                YearId = dto.YearId
            };
            _db.CurriculumTemplates.Add(entity);
            await _db.SaveChangesAsync(ct);

            var result = new CurriculumTemplateDto(
                entity.Id,
                entity.TemplateCode,
                entity.Name,
                entity.YearId
            );
            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, result);
        }


        [HttpPut("{id:int}")]
        [Authorize(Policy = "subjects-curricula.update")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] CurriculumTemplateDto dto, CancellationToken ct)
        {
            if (dto is null) return BadRequest("Body مطلوب.");
            if (dto.Id != 0 && dto.Id != id) return BadRequest("Id mismatch.");

            var entity = await _db.CurriculumTemplates.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity is null) return NotFound();

            var dup = await _db.CurriculumTemplates.AnyAsync(x =>
                x.Id != id &&
                x.TemplateCode == dto.TemplateCode &&
                x.YearId == dto.YearId, ct);
            if (dup) return Conflict(new { code = "DUPLICATE_TEMPLATE", message = "TemplateCode موجود لنفس السنة." });

            entity.TemplateCode = dto.TemplateCode.Trim();
            entity.Name = dto.Name.Trim();
            entity.YearId = dto.YearId;

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }


        // DELETE /api/curriculumtemplates/{id}
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "subjects-curricula.delete")]
        public async Task<IActionResult> Delete([FromRoute] int id, CancellationToken ct)
        {
            var entity = await _db.CurriculumTemplates.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity is null) return NotFound();

            _db.CurriculumTemplates.Remove(entity);
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
