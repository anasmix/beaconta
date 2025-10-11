using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using beaconta.Application.DTOs;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // المصادقة لازمة لكل الأفعال هنا
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
        // ملاحظة: إن كان لديك سياسة عرض مخصصة أضفها هنا (اختياري)
        // [Authorize(Policy = "curricula.view")]
        public async Task<IActionResult> Templates([FromQuery] int? yearId, CancellationToken ct = default)
        {
            var q = _db.CurriculumTemplates.AsNoTracking().AsQueryable();
            if (yearId.HasValue) q = q.Where(t => t.YearId == yearId.Value);

            var list = await q
                .ProjectTo<CurriculumTemplateDto>(_map.ConfigurationProvider)
                .ToListAsync(ct);

            return Ok(list);
        }

        // Controllers/CurriculaController.cs (المقطع الخاص بالإنشاء)
        [HttpPost("templates")]
        [Authorize(Policy = "curricula.manage")]
        public async Task<IActionResult> Create([FromBody] CurriculumTemplateCreateDto dto, CancellationToken ct = default)
        {
            if (dto is null) return BadRequest("Payload is required.");
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name is required.");
            if (dto.YearId <= 0) return BadRequest("YearId is required.");

            // ✅ توليد TemplateCode إذا لم يُرسل أو كان فارغًا
            var templateCode = string.IsNullOrWhiteSpace(dto.TemplateCode)
                ? $"TMP-{DateTime.UtcNow:yyyyMMddHHmmssfff}"
                : dto.TemplateCode.Trim();

            var entity = new CurriculumTemplate
            {
                TemplateCode = templateCode,  // لو العمود NOT NULL فهذا يضمن القيمة
                Name = dto.Name.Trim(),
                YearId = dto.YearId
            };

            _db.CurriculumTemplates.Add(entity);

            try
            {
                await _db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                // لو عندك قيود فريدة على TemplateCode أو (YearId, Name)
                return Conflict("Template already exists or violates a unique constraint.");
            }

            var savedDto = new CurriculumTemplateDto(entity.Id, entity.TemplateCode, entity.Name, entity.YearId);
            return CreatedAtAction(nameof(Templates), new { yearId = entity.YearId }, savedDto);
        }

    }
}
