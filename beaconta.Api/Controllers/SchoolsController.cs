using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SchoolsController : ControllerBase
{
    private readonly ISchoolService _svc;
    public SchoolsController(ISchoolService svc) => _svc = svc;

    // GET: api/schools?q=&status=Active|Inactive&color=blue|green|red|other
    [HttpGet]
    [Authorize(Policy = "schools.view")]
    [ProducesResponseType(typeof(IEnumerable<SchoolDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? q,
        [FromQuery] string? status,
        [FromQuery] string? color)
    {
        var all = await _svc.GetAllAsync();

        // فلاتر بسيطة متوافقة مع الواجهة
        if (!string.IsNullOrWhiteSpace(q))
        {
            var qq = q.Trim().ToLowerInvariant();
            all = all.Where(s =>
                (s.Name ?? string.Empty).ToLowerInvariant().Contains(qq) ||
                (s.Code ?? string.Empty).ToLowerInvariant().Contains(qq)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            all = all.Where(s =>
                string.Equals(s.Status, status, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(color))
        {
            static string norm(string? c) => (c ?? string.Empty).Trim().ToLowerInvariant();
            all = color.ToLowerInvariant() switch
            {
                "blue" => all.Where(s => norm(s.ColorHex) == "#0d6efd").ToList(),
                "green" => all.Where(s => norm(s.ColorHex) == "#198754").ToList(),
                "red" => all.Where(s => norm(s.ColorHex) == "#dc3545").ToList(),
                "other" => all.Where(s => !new[] { "#0d6efd", "#198754", "#dc3545" }.Contains(norm(s.ColorHex))).ToList(),
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

    // POST: api/schools   (Create)
    [HttpPost]
    [Authorize(Policy = "schools.create")]
    [ProducesResponseType(typeof(SchoolDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] SchoolUpsertDto dto)
    {
        if (dto is null) return BadRequest("Payload is required.");
        var saved = await _svc.UpsertAsync(dto); // أو CreateAsync(dto) لو متاح
        return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved);
    }

    // PUT: api/schools/5  (Update)
    [HttpPut("{id:int}")]
    [Authorize(Policy = "schools.update")]
    [ProducesResponseType(typeof(SchoolDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(int id, [FromBody] SchoolUpsertDto dto)
    {
        if (dto is null) return BadRequest("Payload is required.");
        if (id != dto.Id) return BadRequest("Route id and body id mismatch.");
        var saved = await _svc.UpsertAsync(dto); // أو UpdateAsync(dto)
        return Ok(saved);
    }

    // DELETE: api/schools/5
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "schools.delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _svc.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
