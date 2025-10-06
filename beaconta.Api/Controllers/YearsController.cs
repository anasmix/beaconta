//using beaconta.Infrastructure.Data;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;

//[ApiController]
//[Route("api/[controller]")]
//public class YearsController : ControllerBase
//{
//    private readonly BeacontaDb _db;
//    public YearsController(BeacontaDb db) => _db = db;

//    // GET: api/years?active=true|false
//    [HttpGet]
//    public async Task<IActionResult> GetAll([FromQuery] bool? active, CancellationToken ct = default)
//    {
//        var q = _db.Years.AsNoTracking();
//        if (active.HasValue) q = q.Where(y => y.IsActive == active.Value);

//        var list = await q
//            .OrderByDescending(y => y.StartDate)  // رئيسي
//            .ThenByDescending(y => y.Id)          // ثانوي
//            .Select(y => new {
//                id = y.Id,
//                name = y.Name
//                    ?? (y.StartDate != null && y.EndDate != null
//                        ? $"{y.StartDate:yyyy}/{y.EndDate:yyyy}"
//                        : (y.Code ?? y.Id.ToString())),     // Fallback نهائي
//                code = y.Code,
//                isActive = y.IsActive
//            })
//            .ToListAsync(ct);

//        return Ok(list);
//    }

//    // GET: api/years/current
//    [HttpGet("current")]
//    public async Task<IActionResult> Current(CancellationToken ct = default)
//    {
//        var cur = await _db.Years.AsNoTracking()
//            .Where(y => y.IsActive)
//            .OrderByDescending(y => y.StartDate)
//            .ThenByDescending(y => y.Id)
//            .Select(y => new {
//                id = y.Id,
//                name = y.Name
//                    ?? (y.StartDate != null && y.EndDate != null
//                        ? $"{y.StartDate:yyyy}/{y.EndDate:yyyy}"
//                        : (y.Code ?? y.Id.ToString())),
//                code = y.Code,
//                isActive = y.IsActive,

//                // خصائص افتراضية لتوافق بعض الواجهات (حتى لو ما عندك أعمدة)
//                isLocked = false,
//                isDraft = false
//            })
//            .FirstOrDefaultAsync(ct);

//        return cur is null ? NotFound() : Ok(cur);
//    }

//    // GET: api/years/5
//    [HttpGet("{id:int}")]
//    public async Task<IActionResult> GetById(int id, CancellationToken ct = default)
//    {
//        var y = await _db.Years.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
//        if (y is null) return NotFound();

//        var dto = new
//        {
//            id = y.Id,
//            name = y.Name
//                ?? (y.StartDate != null && y.EndDate != null
//                    ? $"{y.StartDate:yyyy}/{y.EndDate:yyyy}"
//                    : (y.Code ?? y.Id.ToString())),
//            code = y.Code,
//            startDate = y.StartDate,
//            endDate = y.EndDate,
//            isActive = y.IsActive,
//            isLocked = false,  // افتراضي
//            isDraft = false   // افتراضي
//        };
//        return Ok(dto);
//    }
//}
