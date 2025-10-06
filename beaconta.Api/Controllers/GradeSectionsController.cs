using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/grades/{gradeYearId:int}/sections")]
    public class GradeSectionsController : ControllerBase
    {
        private readonly ISectionYearService _svc;
        private readonly IValidator<SectionYearUpsertDto>? _validator;

        public GradeSectionsController(ISectionYearService svc, IValidator<SectionYearUpsertDto>? validator = null)
        {
            _svc = svc;
            _validator = validator;
        }

        // ======================= GET: list =======================
        // GET /api/grades/{gradeYearId}/sections
        [HttpGet(Name = "Sections_List")]
        [Authorize(Policy = "grades.view")]
        [ProducesResponseType(typeof(List<SectionYearDto>), 200)]
        public async Task<IActionResult> List([FromRoute] int gradeYearId, CancellationToken ct = default)
            => Ok(await _svc.GetByGradeYearAsync(gradeYearId, ct)); // الخدمة تُرجع Status ضمن DTO

        // ======================= GET: by id =======================
        // GET /api/grades/{gradeYearId}/sections/{id}
        [HttpGet("{id:int}", Name = "Sections_GetById")]
        [Authorize(Policy = "grades.view")]
        [ProducesResponseType(typeof(SectionYearDto), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetById([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct = default)
        {
            var list = await _svc.GetByGradeYearAsync(gradeYearId, ct);
            var item = list.FirstOrDefault(x => x.Id == id);
            return item is null ? NotFound() : Ok(item);
        }

        // ======================= POST: create =======================
        // POST /api/grades/{gradeYearId}/sections
        [HttpPost(Name = "Sections_Create")]
        [Authorize(Policy = "grades.update")]
        [ProducesResponseType(typeof(SectionYearDto), 201)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Create([FromRoute] int gradeYearId, [FromBody] SectionYearUpsertDto dto, CancellationToken ct = default)
        {
            dto.GradeYearId = gradeYearId; // route wins

            if (_validator is not null)
            {
                var vr = await _validator.ValidateAsync(dto, ct);
                if (!vr.IsValid)
                {
                    var ms = new ModelStateDictionary();
                    foreach (var e in vr.Errors) ms.AddModelError(e.PropertyName, e.ErrorMessage);
                    return ValidationProblem(ms);
                }
            }

            var created = await _svc.UpsertAsync(dto, ct);
            return CreatedAtRoute("Sections_GetById", new { gradeYearId = created.GradeYearId, id = created.Id }, created);
        }

        // ======================= PUT: update =======================
        // PUT /api/grades/{gradeYearId}/sections/{id}
        [HttpPut("{id:int}", Name = "Sections_Update")]
        [Authorize(Policy = "grades.update")]
        [ProducesResponseType(typeof(SectionYearDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Update([FromRoute] int gradeYearId, [FromRoute] int id, [FromBody] SectionYearUpsertDto dto, CancellationToken ct = default)
        {
            if (dto.Id != 0 && dto.Id != id) return BadRequest("Id mismatch.");

            dto.Id = id;
            dto.GradeYearId = gradeYearId;

            if (_validator is not null)
            {
                var vr = await _validator.ValidateAsync(dto, ct);
                if (!vr.IsValid)
                {
                    var ms = new ModelStateDictionary();
                    foreach (var e in vr.Errors) ms.AddModelError(e.PropertyName, e.ErrorMessage);
                    return ValidationProblem(ms);
                }
            }

            // Upsert: لو الخدمة تفشل عندما لا يوجد السجل، ارجع 404
            var saved = await _svc.UpsertAsync(dto, ct);
            return Ok(saved);
        }

        // ======================= DELETE: single =======================
        // DELETE /api/grades/{gradeYearId}/sections/{id}
        [HttpDelete("{id:int}", Name = "Sections_Delete")]
        [Authorize(Policy = "grades.update")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Delete([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct = default)
            => (await _svc.DeleteAsync(id, ct)) ? NoContent() : NotFound();

        // ======================= POST: bulk create =======================
        // POST /api/grades/{gradeYearId}/sections/bulk-create
        [HttpPost("bulk-create", Name = "Sections_BulkCreate")]
        [Authorize(Policy = "grades.update")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> BulkCreate([FromRoute] int gradeYearId, [FromBody] List<SectionYearUpsertDto> dtos, CancellationToken ct = default)
        {
            dtos ??= new();
            foreach (var d in dtos) d.GradeYearId = gradeYearId;

            if (_validator is not null)
            {
                var ms = new ModelStateDictionary();
                foreach (var d in dtos)
                {
                    var vr = await _validator.ValidateAsync(d, ct);
                    if (!vr.IsValid)
                    {
                        foreach (var e in vr.Errors) ms.AddModelError($"{d.Name}.{e.PropertyName}", e.ErrorMessage);
                        return ValidationProblem(ms);
                    }
                }
            }

            var count = await _svc.BulkCreateAsync(gradeYearId, dtos, ct);
            return Ok(new { created = count });
        }

        // ======================= PATCH: status lock/unlock =======================
        // PATCH /api/grades/{gradeYearId}/sections/{id}/lock
        [HttpPatch("{id:int}/lock", Name = "Sections_Lock")]
        [Authorize(Policy = "grades.update")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Lock([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct = default)
        {
            var ok = await _svc.SetStatusAsync(gradeYearId, id, "Inactive", ct);
            return ok ? NoContent() : NotFound();
        }

        // PATCH /api/grades/{gradeYearId}/sections/{id}/unlock
        [HttpPatch("{id:int}/unlock", Name = "Sections_Unlock")]
        [Authorize(Policy = "grades.update")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Unlock([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct = default)
        {
            var ok = await _svc.SetStatusAsync(gradeYearId, id, "Active", ct);
            return ok ? NoContent() : NotFound();
        }
    }
}
