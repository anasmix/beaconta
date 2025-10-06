using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class GradeYearsController : ControllerBase
{
    private readonly IGradeYearService _svc;
    public GradeYearsController(IGradeYearService svc) => _svc = svc;

    // GET: api/gradeyears?yearId=2024&schoolId=&stageId=&q=
    [HttpGet]
    [Authorize(Policy = "grades.view")]
    public async Task<IActionResult> GetAll([FromQuery] int yearId, [FromQuery] int? schoolId, [FromQuery] int? stageId, [FromQuery] string? q, CancellationToken ct)
        => Ok(await _svc.GetAllAsync(yearId, schoolId, stageId, q, ct));

    [HttpGet("{id:int}")]
    [Authorize(Policy = "grades.view")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
        => (await _svc.GetByIdAsync(id, ct)) is { } dto ? Ok(dto) : NotFound();

    [HttpPost]
    [Authorize(Policy = "grades.create")]
    public async Task<IActionResult> Create([FromBody] GradeYearUpsertDto dto, CancellationToken ct)
    {
        var saved = await _svc.UpsertAsync(dto, User?.Identity?.Name, ct);
        return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "grades.update")]
    public async Task<IActionResult> Update(int id, [FromBody] GradeYearUpsertDto dto, CancellationToken ct)
    {
        if (id != dto.Id) return BadRequest("Id mismatch.");
        return Ok(await _svc.UpsertAsync(dto, User?.Identity?.Name, ct));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "grades.delete")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => (await _svc.DeleteAsync(id, ct)) ? NoContent() : NotFound();

    [HttpPost("{id:int}/toggle-status")]
    [Authorize(Policy = "grades.update")]
    public async Task<IActionResult> ToggleStatus(int id, CancellationToken ct)
        => (await _svc.ToggleStatusAsync(id, ct)) ? Ok() : NotFound();

    // GET: api/gradeyears/export?yearId=2024&schoolId=&stageId=&q=&format=csv|xlsx(غير مفعل)
    [HttpGet("export")]
    [Authorize(Policy = "grades.export")]
    public async Task<IActionResult> Export([FromQuery] int yearId, [FromQuery] int? schoolId, [FromQuery] int? stageId, [FromQuery] string? q, [FromQuery] string format, CancellationToken ct)
    {
        var bytes = await _svc.ExportAsync(yearId, schoolId, stageId, q, format, ct);
        var mime = "text/csv";
        var name = $"grades-{yearId}.csv";
        return File(bytes, mime, name);
    }

    // GET: api/gradeyears/compare?yearA=2024&yearB=2025
    [HttpGet("compare")]
    [Authorize(Policy = "grades.view")]
    public async Task<IActionResult> Compare([FromQuery] int yearA, [FromQuery] int yearB, CancellationToken ct)
        => Ok(await _svc.CompareAsync(yearA, yearB, ct));
}
