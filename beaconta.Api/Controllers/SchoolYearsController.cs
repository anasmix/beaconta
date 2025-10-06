using beaconta.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace beaconta.Api.Controllers;

[ApiController]
[Route("api/school-years")]
public class SchoolYearsController : ControllerBase
{
    private readonly BeacontaDb _db;
    public SchoolYearsController(BeacontaDb db) => _db = db;

    // ما تتوقعه الواجهة (أسماء الحقول):
    public record YearDto(
        int id,
        string? yearCode,
        string? name,
        int branchId,
        DateTime? startDate,
        DateTime? endDate,
        string status,              // نص (Open | ClosedAcademic | Closed | Archived)
        string? colorHex,
        bool isActive,
        int? financeBackPostDays,
        bool allowPaymentsOnClosedAcademic,
        string? notes
    );

    // DTO الحفظ/التحديث كما ترسله الواجهة
    public record UpsertDto(
        int? id,
        [Required] string yearCode,
        [Required] string name,
        [Required] int branchId,
        DateTime? startDate,
        DateTime? endDate,
        string status,              // نص
        string? colorHex,
        bool isActive,
        int? financeBackPostDays,
        bool allowPaymentsOnClosedAcademic,
        string? notes
    );

    private static YearDto MapYear(beaconta.Domain.Entities.Year y) =>
        new(
            y.Id,
            y.Code,
            y.Name,
            y.BranchId,
            y.StartDate,
            y.EndDate,
            y.Status.ToString(),
            y.ColorHex,
            y.IsActive,
            y.FinanceBackPostDays,
            y.AllowPaymentsOnClosedAcademic,
            y.Notes
        );

    private static bool TryParseStatus(string? s, out beaconta.Domain.Entities.YearStatus status)
        => Enum.TryParse(s, ignoreCase: true, out status);

    // ===================== LIST =====================
    // GET /api/school-years?branchId=&status=&isActive=&q=
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId, [FromQuery] string? status, [FromQuery] bool? isActive, [FromQuery] string? q, CancellationToken ct)
    {
        var query = _db.Years.AsNoTracking().AsQueryable();

        if (branchId.HasValue) query = query.Where(y => y.BranchId == branchId.Value);
        if (isActive.HasValue) query = query.Where(y => y.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(status) && TryParseStatus(status, out var st))
            query = query.Where(y => y.Status == st);

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(y =>
                (y.Name ?? "").Contains(q) ||
                (y.Code ?? "").Contains(q) ||
                (y.Notes ?? "").Contains(q));

        // 1) مادّة خام بأنواعها الأصلية (بدون ToString/MapYear أثناء SQL)
        var raw = await query
            .OrderByDescending(y => y.IsActive)
            .ThenByDescending(y => y.StartDate)
            .ThenByDescending(y => y.Id)
            .Select(y => new
            {
                y.Id,
                y.Code,
                y.Name,
                y.BranchId,
                y.StartDate,
                y.EndDate,
                y.Status, // enum (int)
                y.ColorHex,
                y.IsActive,
                y.FinanceBackPostDays,
                y.AllowPaymentsOnClosedAcademic,
                y.Notes
            })
            .ToListAsync(ct);

        // 2) التحويل إلى DTO في الذاكرة بأمان
        var list = raw.Select(y => new YearDto(
            y.Id,
            y.Code,
            y.Name,
            y.BranchId,
            y.StartDate,
            y.EndDate,
            y.Status.ToString(), // الآن على الذاكرة
            y.ColorHex,
            y.IsActive,
            y.FinanceBackPostDays,
            y.AllowPaymentsOnClosedAcademic,
            y.Notes
        )).ToList();

        return Ok(list);
    }

    // ===================== GET BY ID =====================
    // GET /api/school-years/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById([FromRoute] int id, CancellationToken ct)
    {
        // نقرأ الكيان بأنواعه الأصلية أولًا
        var y = await _db.Years.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (y is null) return NotFound();
        return Ok(MapYear(y)); // التحويل يتم في الذاكرة
    }

    // ===================== CURRENT =====================
    // GET /api/school-years/current?branchId=
    [HttpGet("current")]
    public async Task<IActionResult> Current([FromQuery] int? branchId, CancellationToken ct)
    {
        var q = _db.Years.AsNoTracking().AsQueryable();
        if (branchId.HasValue) q = q.Where(y => y.BranchId == branchId.Value);

        var cur = await q
            .OrderByDescending(y => y.IsActive)
            .ThenByDescending(y => y.StartDate)
            .ThenByDescending(y => y.Id)
            .FirstOrDefaultAsync(ct);

        return cur is null ? NotFound() : Ok(MapYear(cur));
    }

    // ===================== CREATE =====================
    // POST /api/school-years
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertDto dto, CancellationToken ct)
    {
        if (!TryParseStatus(dto.status, out var st))
            return BadRequest("Invalid status value.");

        var entity = new beaconta.Domain.Entities.Year
        {
            Code = dto.yearCode,
            Name = dto.name,
            BranchId = dto.branchId,
            StartDate = dto.startDate,
            EndDate = dto.endDate,
            Status = st,
            ColorHex = dto.colorHex,
            IsActive = dto.isActive,
            FinanceBackPostDays = dto.financeBackPostDays,
            AllowPaymentsOnClosedAcademic = dto.allowPaymentsOnClosedAcademic,
            Notes = dto.notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // إن تم إنشاؤها كـ Active: فعّل واحدة فقط لكل فرع
        if (entity.IsActive)
        {
            await _db.Years.Where(y => y.BranchId == entity.BranchId && y.IsActive)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsActive, false), ct);
        }

        _db.Years.Add(entity);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, MapYear(entity));
    }

    // ===================== UPDATE =====================
    // PUT /api/school-years/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update([FromRoute] int id, [FromBody] UpsertDto dto, CancellationToken ct)
    {
        var y = await _db.Years.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (y is null) return NotFound();

        if (!TryParseStatus(dto.status, out var st))
            return BadRequest("Invalid status value.");

        y.Code = dto.yearCode;
        y.Name = dto.name;
        y.BranchId = dto.branchId;
        y.StartDate = dto.startDate;
        y.EndDate = dto.endDate;
        y.Status = st;
        y.ColorHex = dto.colorHex;
        y.FinanceBackPostDays = dto.financeBackPostDays;
        y.AllowPaymentsOnClosedAcademic = dto.allowPaymentsOnClosedAcademic;
        y.Notes = dto.notes;

        // إدارة الفعّالية
        if (dto.isActive && !y.IsActive)
        {
            await _db.Years.Where(a => a.BranchId == dto.branchId && a.IsActive)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsActive, false), ct);
            y.IsActive = true;
        }
        else if (!dto.isActive && y.IsActive)
        {
            y.IsActive = false;
        }

        y.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(MapYear(y));
    }

    // ===================== DELETE =====================
    // DELETE /api/school-years/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete([FromRoute] int id, CancellationToken ct)
    {
        var y = await _db.Years.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (y is null) return NotFound();

        _db.Years.Remove(y);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ===================== SET ACTIVE =====================
    // POST /api/school-years/set-active   body: { branchId, yearId }
    public record SetActiveReq(int branchId, int yearId);

    [HttpPost("set-active")]
    public async Task<IActionResult> SetActive([FromBody] SetActiveReq req, CancellationToken ct)
    {
        var exists = await _db.Years.AnyAsync(y => y.Id == req.yearId && y.BranchId == req.branchId, ct);
        if (!exists) return NotFound("Year not found for the specified branch.");

        await _db.Years.Where(y => y.BranchId == req.branchId && y.IsActive)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsActive, false), ct);

        await _db.Years.Where(y => y.Id == req.yearId)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsActive, true), ct);

        return NoContent();
    }

    // ===================== OVERLAPS =====================
    // POST /api/school-years/overlaps   body: { id?, branchId, startDate, endDate }
    public record OverlapReq(int? id, int branchId, DateTime? startDate, DateTime? endDate);

    [HttpPost("overlaps")]
    public async Task<IActionResult> Overlaps([FromBody] OverlapReq req, CancellationToken ct)
    {
        if (req.startDate is null || req.endDate is null)
            return BadRequest("startDate and endDate are required.");

        var has = await _db.Years.AnyAsync(y =>
            y.BranchId == req.branchId &&
            (req.id == null || y.Id != req.id.Value) &&
            y.StartDate != null && y.EndDate != null &&
            y.StartDate <= req.endDate && req.startDate <= y.EndDate,
            ct);

        return Ok(new { hasOverlap = has });
    }
}
