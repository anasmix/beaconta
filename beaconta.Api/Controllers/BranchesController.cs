using System.Net.Mime;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces(MediaTypeNames.Application.Json)]
public class BranchesController : ControllerBase
{
    private readonly IBranchService _svc;
    public BranchesController(IBranchService svc) => _svc = svc;

    // GET: api/branches?schoolId=&status=Active|Inactive&city=&capMin=&capMax=
    [HttpGet]
    [Authorize(Policy = "branches.view")]
    [ProducesResponseType(typeof(IEnumerable<BranchDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? schoolId,
        [FromQuery] string? status,
        [FromQuery] string? city,
        [FromQuery] int? capMin,
        [FromQuery] int? capMax,
        CancellationToken ct)
    {
        var all = await _svc.GetAllAsync(ct);

        // فلاتر متوافقة مع الواجهة
        if (schoolId is not null)
            all = all.Where(b => b.SchoolId == schoolId.Value).ToList();

        if (!string.IsNullOrWhiteSpace(status))
            all = all.Where(b => string.Equals(b.Status, status, StringComparison.OrdinalIgnoreCase)).ToList();

        if (!string.IsNullOrWhiteSpace(city))
        {
            var c = city.Trim().ToLowerInvariant();
            all = all.Where(b => (b.City ?? "").ToLowerInvariant().Contains(c)).ToList();
        }

        if (capMin is not null)
            all = all.Where(b => (b.Capacity ?? 0) >= capMin.Value).ToList();

        if (capMax is not null)
            all = all.Where(b => (b.Capacity ?? 0) <= capMax.Value).ToList();

        return Ok(all);
    }

    // GET: api/branches/5
    [HttpGet("{id:int}")]
    [Authorize(Policy = "branches.view")]
    [ProducesResponseType(typeof(BranchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var branch = await _svc.GetByIdAsync(id, ct);
        return branch is null ? NotFound() : Ok(branch);
    }

    // GET: api/branches/stats?schoolId=
    [HttpGet("stats")]
    [Authorize(Policy = "branches.view")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats([FromQuery] int? schoolId, CancellationToken ct)
    {
        var all = await _svc.GetAllAsync(ct);

        if (schoolId is not null)
            all = all.Where(b => b.SchoolId == schoolId.Value).ToList();

        var total = all.Count;
        var active = all.Count(x => string.Equals(x.Status, "Active", StringComparison.OrdinalIgnoreCase));
        var inactive = total - active;

        return Ok(new { total, active, inactive });
    }

    // POST: api/branches  (Create)
    [HttpPost]
    [Authorize(Policy = "branches.create")]
    [ProducesResponseType(typeof(BranchDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] BranchUpsertDto dto, CancellationToken ct)
    {
        if (dto is null) return BadRequest("Payload is required.");

        // ملاحظة: [ApiController] سيتكفّل بإرجاع 400 عند فشل ModelState تلقائياً
        var saved = await _svc.UpsertAsync(dto, ct);  // أو CreateAsync(dto) إن وُجد
        return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved);
    }

    // PUT: api/branches/5  (Update)
    [HttpPut("{id:int}")]
    [Authorize(Policy = "branches.update")]
    [ProducesResponseType(typeof(BranchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(int id, [FromBody] BranchUpsertDto dto, CancellationToken ct)
    {
        if (dto is null) return BadRequest("Payload is required.");
        if (id != dto.Id) return BadRequest("Route id and body id mismatch.");

        var saved = await _svc.UpsertAsync(dto, ct);  // أو UpdateAsync(dto)
        return Ok(saved);
    }

    // DELETE: api/branches/5
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "branches.delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await _svc.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}
