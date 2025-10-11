using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]               // => api/gradeyears
    public class GradeYearsController : ControllerBase
    {
        private readonly IGradeYearService _svc;
        private readonly BeacontaDb _db;

        public GradeYearsController(IGradeYearService svc, BeacontaDb db)
        {
            _svc = svc;
            _db = db;
        }

        // GET: api/gradeyears?yearId=<Year.Id>&schoolId=&stageId=&q=
        // NOTE: yearId هنا هو Year.Id من جدول Years (معرّف السنة)
        [HttpGet]
        [Authorize(Policy = "grades.view")]
        public async Task<IActionResult> GetAll(
            [FromQuery] int yearId,
            [FromQuery] int? schoolId,
            [FromQuery] int? stageId,
            [FromQuery] string? q,
            CancellationToken ct)
        {
            if (yearId <= 0)
                return BadRequest("yearId يجب أن يكون معرف Year صالح (من جدول Years).");

            var exists = await _db.Years.AsNoTracking().AnyAsync(y => y.Id == yearId, ct);
            if (!exists)
                return BadRequest($"لا يوجد Year بالمعرف {yearId}. استخدم القيمة المعادة من /api/school-years.");

            var list = await _svc.GetAllAsync(yearId, schoolId, stageId, q, ct);
            return Ok(list);
        }

        // GET: api/gradeyears/{id}
        [HttpGet("{id:int}")]
        [Authorize(Policy = "grades.view")]
        public async Task<IActionResult> GetById([FromRoute] int id, CancellationToken ct)
        {
            var dto = await _svc.GetByIdAsync(id, ct);
            return dto is null ? NotFound() : Ok(dto);
        }

        // GET: api/gradeyears/{id}/sections   👈 مضاف لحل مشكلة جلب الشُعب
        [HttpGet("{id:int}/sections")]
        [Authorize(Policy = "grades.view")]
        public async Task<IActionResult> GetSectionsByGradeYearId([FromRoute] int id, CancellationToken ct)
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

        // POST: api/gradeyears
        // Body: GradeYearUpsertDto (YearId = Year.Id)
        [HttpPost]
        [Authorize(Policy = "grades.create")]
        public async Task<IActionResult> Create([FromBody] GradeYearUpsertDto dto, CancellationToken ct)
        {
            if (dto is null) return BadRequest("Body مطلوب.");
            if (dto.YearId <= 0) return BadRequest("YearId يجب أن يكون معرف Year صحيح (من /api/school-years).");

            var yearExists = await _db.Years.AsNoTracking().AnyAsync(y => y.Id == dto.YearId, ct);
            if (!yearExists) return BadRequest($"لا يوجد Year بالمعرف {dto.YearId}.");

            var saved = await _svc.UpsertAsync(dto, User?.Identity?.Name, ct);
            return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved);
        }

        // PUT: api/gradeyears/{id}
        [HttpPut("{id:int}")]
        [Authorize(Policy = "grades.update")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] GradeYearUpsertDto dto, CancellationToken ct)
        {
            if (dto is null) return BadRequest("Body مطلوب.");
            if (id != dto.Id) return BadRequest("Id mismatch.");
            if (dto.YearId <= 0) return BadRequest("YearId يجب أن يكون معرف Year صحيح (من /api/school-years).");

            var yearExists = await _db.Years.AsNoTracking().AnyAsync(y => y.Id == dto.YearId, ct);
            if (!yearExists) return BadRequest($"لا يوجد Year بالمعرف {dto.YearId}.");

            var saved = await _svc.UpsertAsync(dto, User?.Identity?.Name, ct);
            return Ok(saved);
        }

        // DELETE: api/gradeyears/{id}
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "grades.delete")]
        public async Task<IActionResult> Delete([FromRoute] int id, CancellationToken ct)
        {
            var ok = await _svc.DeleteAsync(id, ct);
            return ok ? NoContent() : NotFound();
        }

        // POST: api/gradeyears/{id}/toggle-status
        [HttpPost("{id:int}/toggle-status")]
        [Authorize(Policy = "grades.update")]
        public async Task<IActionResult> ToggleStatus([FromRoute] int id, CancellationToken ct)
        {
            var ok = await _svc.ToggleStatusAsync(id, ct);
            return ok ? Ok() : NotFound();
        }

        // GET: api/gradeyears/export?yearId=<Year.Id>&schoolId=&stageId=&q=&format=csv
        [HttpGet("export")]
        [Authorize(Policy = "grades.export")]
        public async Task<IActionResult> Export(
            [FromQuery] int yearId,
            [FromQuery] int? schoolId,
            [FromQuery] int? stageId,
            [FromQuery] string? q,
            [FromQuery] string format,
            CancellationToken ct)
        {
            if (yearId <= 0)
                return BadRequest("yearId يجب أن يكون معرف Year صالح.");

            var exists = await _db.Years.AsNoTracking().AnyAsync(y => y.Id == yearId, ct);
            if (!exists) return BadRequest($"لا يوجد Year بالمعرف {yearId}.");

            var bytes = await _svc.ExportAsync(yearId, schoolId, stageId, q, format, ct);
            var mime = "text/csv";
            var name = $"grades-{yearId}.csv";
            return File(bytes, mime, name);
        }

        // GET: api/gradeyears/compare?yearA=<Year.Id>&yearB=<Year.Id>
        [HttpGet("compare")]
        [Authorize(Policy = "grades.view")]
        public async Task<IActionResult> Compare([FromQuery] int yearA, [FromQuery] int yearB, CancellationToken ct)
        {
            if (yearA <= 0 || yearB <= 0)
                return BadRequest("yearA و yearB يجب أن يكونا معرفي Years صالحين.");

            var aExists = await _db.Years.AsNoTracking().AnyAsync(y => y.Id == yearA, ct);
            var bExists = await _db.Years.AsNoTracking().AnyAsync(y => y.Id == yearB, ct);
            if (!aExists || !bExists)
                return BadRequest("قيمة yearA أو yearB لا تشير إلى Year موجود.");

            var res = await _svc.CompareAsync(yearA, yearB, ct);
            return Ok(res);
        }
    }
}
