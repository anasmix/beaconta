using beaconta.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


[ApiController]
[Route("api/[controller]")]
public class YearsController : ControllerBase
{
    private readonly BeacontaDb _db;
    public YearsController(BeacontaDb db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? active, CancellationToken ct = default)
    {
        var q = _db.Years.AsNoTracking();
        if (active.HasValue) q = q.Where(y => y.IsActive == active.Value);

        var list = await q.OrderByDescending(y => y.StartDate)
            .Select(y => new {
                id = y.Id,
                name = y.Name ?? (
                    y.StartDate != null && y.EndDate != null
                      ? $"{y.StartDate:yyyy}/{y.EndDate:yyyy}" : y.Code
                ),
                code = y.Code,
                isActive = y.IsActive
            }).ToListAsync(ct);

        return Ok(list);
    }
}
