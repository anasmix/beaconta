using System.Linq;
using System.Collections.Generic;
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

        // GET: /api/grades/{gradeYearId}/sections
        [HttpGet]
        [Authorize(Policy = "grades.view")]
        public async Task<IActionResult> List([FromRoute] int gradeYearId, CancellationToken ct)
            => Ok(await _svc.GetByGradeYearAsync(gradeYearId, ct)); // ✅ تأكد أن الخدمة تُرجع Status

        // POST: /api/grades/{gradeYearId}/sections
        [HttpPost]
        [Authorize(Policy = "grades.update")]
        public async Task<IActionResult> Create([FromRoute] int gradeYearId, [FromBody] SectionYearUpsertDto dto, CancellationToken ct)
        {
            dto.GradeYearId = gradeYearId; // ✅ route wins

            if (_validator is not null)
            {
                var vr = await _validator.ValidateAsync(dto, ct);
                if (!vr.IsValid)
                {
                    var ms = new ModelStateDictionary();
                    foreach (var e in vr.Errors)
                        ms.AddModelError(e.PropertyName, e.ErrorMessage);
                    return ValidationProblem(ms);
                }
            }

            var created = await _svc.UpsertAsync(dto, ct);
            return CreatedAtAction(nameof(List), new { gradeYearId = created.GradeYearId }, created);
        }

        // PUT: /api/grades/{gradeYearId}/sections/{id}
        [HttpPut("{id:int}")]
        [Authorize(Policy = "grades.update")]
        public async Task<IActionResult> Update([FromRoute] int gradeYearId, [FromRoute] int id, [FromBody] SectionYearUpsertDto dto, CancellationToken ct)
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
                    foreach (var e in vr.Errors)
                        ms.AddModelError(e.PropertyName, e.ErrorMessage);
                    return ValidationProblem(ms);
                }
            }

            var saved = await _svc.UpsertAsync(dto, ct); // ✅ سيحفظ Status لو تم تمريره
            return Ok(saved);
        }

        // DELETE: /api/grades/{gradeYearId}/sections/{id}
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "grades.update")]
        public async Task<IActionResult> Delete([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct)
            => (await _svc.DeleteAsync(id, ct)) ? NoContent() : NotFound();

        // POST: /api/grades/{gradeYearId}/sections/bulk
        [HttpPost("bulk")]
        [Authorize(Policy = "grades.update")]
        public async Task<IActionResult> Bulk([FromRoute] int gradeYearId, [FromBody] List<SectionYearUpsertDto> dtos, CancellationToken ct)
        {
            dtos ??= new();
            foreach (var d in dtos) d.GradeYearId = gradeYearId;

            if (_validator is not null)
            {
                foreach (var d in dtos)
                {
                    var vr = await _validator.ValidateAsync(d, ct);
                    if (!vr.IsValid)
                    {
                        var ms = new ModelStateDictionary();
                        foreach (var e in vr.Errors)
                            ms.AddModelError(e.PropertyName, e.ErrorMessage);
                        return ValidationProblem(ms);
                    }
                }
            }

            var count = await _svc.BulkCreateAsync(gradeYearId, dtos, ct);
            return Ok(new { created = count });
        }

        [HttpPatch("{id:int}/lock")]
        public async Task<IActionResult> Lock([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct)
        {
            var ok = await _svc.SetStatusAsync(gradeYearId, id, "Inactive", ct);
            return ok ? NoContent() : NotFound();
        }

        [HttpPatch("{id:int}/unlock")]
        public async Task<IActionResult> Unlock([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct)
        {
            var ok = await _svc.SetStatusAsync(gradeYearId, id, "Active", ct);
            return ok ? NoContent() : NotFound();
        }
    }
}
