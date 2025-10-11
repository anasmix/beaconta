using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;            // ← ضروري لـ ProjectTo
using beaconta.Application.DTOs;                // ← DTOs
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;            // ← ضروري لـ AsNoTracking, ToListAsync

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CurriculaController : ControllerBase
    {
        private readonly BeacontaDb _db;
        private readonly IMapper _map;

        public CurriculaController(BeacontaDb db, IMapper map)
        {
            _db = db; _map = map;
        }

        // GET: /api/curricula/templates?yearId=123
        [HttpGet("templates")]
        public async Task<IActionResult> Templates([FromQuery] int? yearId, CancellationToken ct)
        {
            var q = _db.CurriculumTemplates.AsNoTracking().AsQueryable();
            if (yearId.HasValue) q = q.Where(t => t.YearId == yearId.Value);

            var list = await q
                .ProjectTo<CurriculumTemplateDto>(_map.ConfigurationProvider)
                .ToListAsync(ct);

            return Ok(list);
        }

        // POST: /api/curricula/templates
        [HttpPost("templates")]
        [Authorize(Policy = "curricula.manage")]
        public async Task<IActionResult> Create([FromBody] CurriculumTemplateDto dto, CancellationToken ct)
        {
            if (dto is null) return BadRequest("Payload is required.");

            var entity = new CurriculumTemplate
            {
                TemplateCode = dto.TemplateCode,
                Name = dto.Name,
                YearId = dto.YearId
            };

            _db.CurriculumTemplates.Add(entity);
            await _db.SaveChangesAsync(ct);

            // اختياري: إرجاع 201 مع الكيان الجديد
            var savedDto = new CurriculumTemplateDto(entity.Id, entity.TemplateCode, entity.Name, entity.YearId);
            return CreatedAtAction(nameof(Templates), new { yearId = entity.YearId }, savedDto);
        }
    }
}
