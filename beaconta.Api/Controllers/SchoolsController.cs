using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers;

[ApiController]
[Route("api/[controller]")] // => api/schools
public class SchoolsController : ControllerBase
{
    private readonly ISchoolService _svc;
    public SchoolsController(ISchoolService svc) => _svc = svc;

    // GET: api/schools?simple=true|false&q=&status=Active|Inactive&color=blue|green|purple|orange|red|gray|other
    [HttpGet]
    [Authorize(Policy = "schools.view")]
    [ProducesResponseType(typeof(IEnumerable<SchoolDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool? simple,
        [FromQuery] string? q,
        [FromQuery] string? status,
        [FromQuery] string? color)
    {
        var all = await _svc.GetAllAsync();

        // واجهة grades-sections.js تطلب /api/schools?simple=true لإرجاع {id,name,colorHex}
        if (simple == true)
        {
            var min = all
                .OrderBy(s => s.Name)
                .Select(s => new { id = s.Id, name = s.Name, colorHex = s.ColorHex });
            return Ok(min);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var qq = q.Trim().ToLowerInvariant();
            all = all.Where(s =>
                (s.Name ?? string.Empty).ToLowerInvariant().Contains(qq) ||
                (s.Code ?? string.Empty).ToLowerInvariant().Contains(qq) ||
                (s.Notes ?? string.Empty).ToLowerInvariant().Contains(qq)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            all = all.Where(s =>
                string.Equals(s.Status, status, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(color))
        {
            static string norm(string? c) => (c ?? string.Empty).Trim().ToLowerInvariant();

            var blue = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "#0d6efd", "#0ea5e9", "#1d4ed8" };
            var green = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "#198754", "#10b981", "#16a34a" };
            var purple = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "#8b5cf6", "#6f42c1" };
            var orange = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "#f59e0b", "#fd7e14" };
            var red = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "#dc3545", "#ef4444" };
            var gray = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "#6c757d", "#64748b" };

            all = color.ToLowerInvariant() switch
            {
                "blue" => all.Where(s => blue.Contains(norm(s.ColorHex))).ToList(),
                "green" => all.Where(s => green.Contains(norm(s.ColorHex))).ToList(),
                "purple" => all.Where(s => purple.Contains(norm(s.ColorHex))).ToList(),
                "orange" => all.Where(s => orange.Contains(norm(s.ColorHex))).ToList(),
                "red" => all.Where(s => red.Contains(norm(s.ColorHex))).ToList(),
                "gray" => all.Where(s => gray.Contains(norm(s.ColorHex))).ToList(),
                "other" => all.Where(s => {
                    var set = blue.Concat(green).Concat(purple).Concat(orange).Concat(red).Concat(gray)
                                  .ToHashSet(StringComparer.OrdinalIgnoreCase);
                    return !set.Contains(norm(s.ColorHex));
                }).ToList(),
                _ => all
            };
        }

        return Ok(all);
    }

    // GET: api/schools/5
    [HttpGet("{id:int}")]
    [Authorize(Policy = "schools.view")]
    [ProducesResponseType(typeof(SchoolDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var school = await _svc.GetByIdAsync(id);
        return school == null ? NotFound() : Ok(school);
    }

    // GET: api/schools/min  -> { id, name } فقط
    [HttpGet("min")]
    [Authorize(Policy = "schools.view")]
    [ProducesResponseType(typeof(IEnumerable<IdNameDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMin()
    {
        var all = await _svc.GetAllAsync();
        var min = all.Select(s => new IdNameDto(s.Id, s.Name ?? $"School #{s.Id}"))
                     .OrderBy(s => s.Name)
                     .ToList();
        return Ok(min);
    }

    public record IdNameDto(int Id, string Name);

    // GET: api/schools/stats
    [HttpGet("stats")]
    [Authorize(Policy = "schools.view")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats()
    {
        var all = await _svc.GetAllAsync();
        var total = all.Count;
        var active = all.Count(x => string.Equals(x.Status, "Active", StringComparison.OrdinalIgnoreCase));
        var inactive = total - active;
        return Ok(new { total, active, inactive });
    }

    // POST: api/schools/{id}/transfer-branches  (اختياري)
    public record TransferDto(int ToSchoolId);

    [HttpPost("{id:int}/transfer-branches")]
    [Authorize(Policy = "schools.update")]
    public async Task<IActionResult> TransferBranches(int id, [FromBody] TransferDto dto)
    {
        if (dto == null || dto.ToSchoolId <= 0) return BadRequest("ToSchoolId مطلوب.");
        try
        {
            var moved = await _svc.TransferBranchesAsync(id, dto.ToSchoolId);
            return Ok(new { moved });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    // POST: api/schools
    [HttpPost]
    [Authorize(Policy = "schools.create")]
    public async Task<IActionResult> Create([FromBody] SchoolUpsertDto dto)
    {
        if (dto is null) return BadRequest("Payload is required.");
        try
        {
            dto.Id = 0;
            var saved = await _svc.UpsertAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved);
        }
        catch (InvalidOperationException ex) when (ex.Message.StartsWith("DUPLICATE_CODE:"))
        {
            var code = ex.Message.Split(':', 2)[1];
            return Conflict(new { code = "DUPLICATE_CODE", message = $"Code '{code}' is already used." });
        }
    }

    // GET: api/schools/check-code?code=T.J&id=5   (id اختياري لتجاهل السجل الحالي)
    [HttpGet("check-code")]
    [Authorize(Policy = "schools.view")]
    public async Task<IActionResult> CheckCode([FromQuery] string code, [FromQuery] int? id = null)
    {
        if (string.IsNullOrWhiteSpace(code)) return Ok(new { available = true });
        var norm = code.Trim().ToUpperInvariant();
        var exists = await _svc.GetAllAsync();
        var taken = exists.Any(s => s.Id != (id ?? 0) &&
                                    !string.IsNullOrWhiteSpace(s.Code) &&
                                    s.Code.Trim().ToUpperInvariant() == norm);
        return Ok(new { available = !taken });
    }

    // PUT: api/schools/{id}
    [HttpPut("{id:int}")]
    [Authorize(Policy = "schools.update")]
    public async Task<IActionResult> Update(int id, [FromBody] SchoolUpsertDto dto)
    {
        if (dto is null) return BadRequest("Payload is required.");
        if (id != dto.Id) return BadRequest("Route id and body id mismatch.");
        try
        {
            var saved = await _svc.UpsertAsync(dto);
            return Ok(saved);
        }
        catch (InvalidOperationException ex) when (ex.Message.StartsWith("DUPLICATE_CODE:"))
        {
            var code = ex.Message.Split(':', 2)[1];
            return Conflict(new { code = "DUPLICATE_CODE", message = $"Code '{code}' is already used." });
        }
    }

    // DELETE: api/schools/{id}?force=true|false
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "schools.delete")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool force = false)
    {
        try
        {
            var ok = await _svc.DeleteAsync(id, force);
            return ok ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            // مدرسة لديها فروع: رجّع 409 مع كود واضح يلتقطه الفرونت
            return Conflict(new
            {
                code = "HAS_BRANCHES",
                message = ex.Message
            });
        }
    }
}
