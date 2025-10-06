// Api/Controllers/SectionYearsController.cs
using beaconta.Application.DTOs;
using beaconta.Infrastructure.Data;
using beaconta.Domain.Entities;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class SectionYearsController : ControllerBase
{
    private readonly BeacontaDb _db;
    private readonly IMapper _mapper;

    public SectionYearsController(BeacontaDb db, IMapper mapper)
    {
        _db = db; _mapper = mapper;
    }

    [HttpGet("by-grade/{gradeYearId:int}")]
    public async Task<IActionResult> ByGrade(int gradeYearId, CancellationToken ct)
    {
        var list = await _db.SectionYears
            .AsNoTracking()
            .Where(s => s.GradeYearId == gradeYearId)
            .OrderBy(s => s.Name)
            .ToListAsync(ct);

        return Ok(_mapper.Map<List<SectionYearDto>>(list));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SectionYearUpsertDto dto, CancellationToken ct)
    {
        var entity = _mapper.Map<SectionYear>(dto);
        _db.SectionYears.Add(entity);
        await _db.SaveChangesAsync(ct);
        var saved = await _db.SectionYears.AsNoTracking().FirstAsync(x => x.Id == entity.Id, ct);
        return CreatedAtAction(nameof(GetById), new { id = saved.Id }, _mapper.Map<SectionYearDto>(saved));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var s = await _db.SectionYears.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return s == null ? NotFound() : Ok(_mapper.Map<SectionYearDto>(s));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SectionYearUpsertDto dto, CancellationToken ct)
    {
        var entity = await _db.SectionYears.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity == null) return NotFound();
        if (!string.IsNullOrWhiteSpace(dto.Name)) entity.Name = dto.Name;
        if (dto.Capacity >= 0) entity.Capacity = dto.Capacity;
        entity.Teacher = dto.Teacher;
        entity.Notes = dto.Notes;
        await _db.SaveChangesAsync(ct);
        return Ok(_mapper.Map<SectionYearDto>(entity));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.SectionYears.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity == null) return NotFound();
        _db.SectionYears.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // Bulk اختياري
    public class BulkDto { public string Op { get; set; } = "delete"; public List<int> Ids { get; set; } = new(); }

    [HttpPut("bulk")]
    public async Task<IActionResult> Bulk([FromBody] BulkDto dto, CancellationToken ct)
    {
        if (dto.Op == "delete" && dto.Ids.Any())
        {
            var items = await _db.SectionYears.Where(s => dto.Ids.Contains(s.Id)).ToListAsync(ct);
            _db.SectionYears.RemoveRange(items);
            await _db.SaveChangesAsync(ct);
        }
        return Ok();
    }
}
