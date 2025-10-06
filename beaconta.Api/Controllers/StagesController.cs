using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace beaconta.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StagesController : ControllerBase
{
    private readonly IStageService _svc;
    public StagesController(IStageService svc) => _svc = svc;

    // GET: api/stages?q=&status=Active|Inactive&schoolId=123
    [HttpGet]
    [Authorize(Policy = "stages.view")]
    [ProducesResponseType(typeof(IEnumerable<StageDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? q,
        [FromQuery] string? status,
        [FromQuery] int? schoolId)
    {
        // مبدئياً نعتمد الخدمة لإرجاع الكل، ثم فلاتر بسيطة توافق واجهتك
        var all = await _svc.GetAllAsync();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var qq = q.Trim().ToLowerInvariant();
            all = all.Where(s =>
                (s.Name ?? string.Empty).ToLowerInvariant().Contains(qq) ||
                (s.Code ?? string.Empty).ToLowerInvariant().Contains(qq))
            .ToList();
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            all = all.Where(s =>
                string.Equals(s.Status, status, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (schoolId is not null)
        {
            all = all.Where(s => s.SchoolId == schoolId).ToList();
        }

        // ملاحظة: StageDto قد لا يحوي SchoolName/ColorHex؛ الواجهة تتعايش مع غيابها
        return Ok(all);
    }

    // GET: api/stages/5
    [HttpGet("{id:int}")]
    [Authorize(Policy = "stages.view")]
    [ProducesResponseType(typeof(StageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    // GET: api/stages/stats
    [HttpGet("stats")]
    [Authorize(Policy = "stages.view")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats()
    {
        var all = await _svc.GetAllAsync();
        var total = all.Count;
        var active = all.Count(x => string.Equals(x.Status, "Active", StringComparison.OrdinalIgnoreCase));
        var inactive = total - active;
        return Ok(new { total, active, inactive });
    }

    // POST: api/stages   (Create)
    [HttpPost]
    [Authorize(Policy = "stages.create")]
    [ProducesResponseType(typeof(StageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] StageUpsertDto dto)
    {
        if (dto is null) return BadRequest("Payload is required.");
        var saved = await _svc.UpsertAsync(dto); // أو CreateAsync(dto) لو خدمتك تفصل بينهما
        return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved);
    }

    // PUT: api/stages/5  (Update)
    [HttpPut("{id:int}")]
    [Authorize(Policy = "stages.update")]
    [ProducesResponseType(typeof(StageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(int id, [FromBody] StageUpsertDto dto)
    {
        if (dto is null) return BadRequest("Payload is required.");
        if (id != dto.Id) return BadRequest("Route id and body id mismatch.");
        var saved = await _svc.UpsertAsync(dto); // أو UpdateAsync(dto)
        return Ok(saved);
    }

    // DELETE: api/stages/5
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "stages.delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _svc.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    // POST: api/stages/5/toggle-status
    [HttpPost("{id:int}/toggle-status")]
    [Authorize(Policy = "stages.update")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var ok = await _svc.ToggleStatusAsync(id);
        return ok ? Ok() : NotFound();
    }

    // PUT: api/stages/bulk   body: { ids: [..], op: "activate"|"deactivate"|"delete" }
    public record BulkRequest(List<int> Ids, string Op);

    [HttpPut("bulk")]
    [Authorize(Policy = "stages.update")] // و"stages.delete" ضمنيًا لعملية delete
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Bulk([FromBody] BulkRequest req)
    {
        if (req?.Ids == null || req.Ids.Count == 0) return BadRequest("No ids.");
        var op = (req.Op ?? "").Trim().ToLowerInvariant();

        return op switch
        {
            "activate" => Ok(new { affected = await _svc.BulkActivateAsync(req.Ids) }),
            "deactivate" => Ok(new { affected = await _svc.BulkDeactivateAsync(req.Ids) }),
            "delete" => Ok(new { affected = await _svc.BulkDeleteAsync(req.Ids) }),
            _ => BadRequest("Invalid op.")
        };
    }

    // (اختياري) GET: api/stages/export?...  لو عندك صلاحية وتحتاج زر التصدير في الواجهة
    [HttpGet("export")]
    [Authorize(Policy = "stages.export")]
    public async Task<IActionResult> Export([FromQuery] string? q, [FromQuery] string? status, [FromQuery] int? schoolId)
    {
        var bytes = await _svc.ExportAsync(q, status, schoolId); // ارجع Excel/CSV من الخدمة
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "stages-export.xlsx");
    }
}
