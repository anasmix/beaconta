using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class StageService : IStageService
{
    private readonly BeacontaDb _db;

    public StageService(BeacontaDb db) => _db = db;

    public async Task<List<StageDto>> GetAllAsync()
    {
        // لو عندك جدول Schools:
        var stages = await _db.Set<Stage>()
            .AsNoTracking()
            .Select(s => new StageDto
            {
                Id = s.Id,
                Name = s.Name,
                Code = s.Code,
                SortOrder = s.SortOrder,
                Status = s.Status,
                Notes = s.Notes,
                SchoolId = s.SchoolId,
                // ColorHex <-> Color
                ColorHex = s.Color,
                // Optional: SchoolName
                SchoolName = _db.Schools.Where(x => x.Id == s.SchoolId)
                                         .Select(x => x.Name).FirstOrDefault()
            })
            .OrderBy(s => s.SchoolId).ThenBy(s => s.SortOrder).ThenBy(s => s.Id)
            .ToListAsync();

        return stages;
    }

    public async Task<StageDto?> GetByIdAsync(int id)
    {
        return await _db.Set<Stage>()
            .Where(s => s.Id == id)
            .Select(s => new StageDto
            {
                Id = s.Id,
                Name = s.Name,
                Code = s.Code,
                SortOrder = s.SortOrder,
                Status = s.Status,
                Notes = s.Notes,
                SchoolId = s.SchoolId,
                ColorHex = s.Color,
                SchoolName = _db.Schools.Where(x => x.Id == s.SchoolId)
                                         .Select(x => x.Name).FirstOrDefault()
            })
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }

    public async Task<StageDto> UpsertAsync(StageUpsertDto dto)
    {
        Stage entity;
        if (dto.Id > 0)
        {
            entity = await _db.Set<Stage>().FirstOrDefaultAsync(x => x.Id == dto.Id)
                     ?? throw new KeyNotFoundException("Stage not found");
        }
        else
        {
            entity = new Stage();
            _db.Set<Stage>().Add(entity);
        }

        entity.SchoolId = dto.SchoolId;
        entity.Code = dto.Code?.Trim();
        entity.Name = dto.Name?.Trim() ?? throw new ArgumentException("Name is required");
        entity.SortOrder = dto.SortOrder;
        entity.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status!;
        entity.Notes = dto.Notes;
        entity.Color = dto.ColorHex; // mapping

        await _db.SaveChangesAsync();

        return new StageDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Code = entity.Code,
            SortOrder = entity.SortOrder,
            Status = entity.Status,
            Notes = entity.Notes,
            SchoolId = entity.SchoolId,
            ColorHex = entity.Color
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var e = await _db.Set<Stage>().FirstOrDefaultAsync(x => x.Id == id);
        if (e == null) return false;
        _db.Remove(e);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleStatusAsync(int id)
    {
        var e = await _db.Set<Stage>().FirstOrDefaultAsync(x => x.Id == id);
        if (e == null) return false;
        e.Status = (e.Status == "Active") ? "Inactive" : "Active";
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> BulkActivateAsync(List<int> ids)
    {
        var rows = await _db.Set<Stage>().Where(x => ids.Contains(x.Id)).ToListAsync();
        rows.ForEach(r => r.Status = "Active");
        await _db.SaveChangesAsync();
        return rows.Count;
    }

    public async Task<int> BulkDeactivateAsync(List<int> ids)
    {
        var rows = await _db.Set<Stage>().Where(x => ids.Contains(x.Id)).ToListAsync();
        rows.ForEach(r => r.Status = "Inactive");
        await _db.SaveChangesAsync();
        return rows.Count;
    }

    public async Task<int> BulkDeleteAsync(List<int> ids)
    {
        var rows = await _db.Set<Stage>().Where(x => ids.Contains(x.Id)).ToListAsync();
        _db.RemoveRange(rows);
        await _db.SaveChangesAsync();
        return rows.Count;
    }

    public async Task<byte[]> ExportAsync(string? q, string? status, int? schoolId)
    {
        // اختصار: رجّع CSV/Excel. هنا بنرجّع Excel بسيط لاحقًا إن حبيت،
        // الآن مؤقتًا ملف CSV:
        var all = await GetAllAsync();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var qq = q.Trim().ToLowerInvariant();
            all = all.Where(s => (s.Name ?? "").ToLower().Contains(qq)
                              || (s.Code ?? "").ToLower().Contains(qq)
                              || (s.SchoolName ?? "").ToLower().Contains(qq)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(status))
            all = all.Where(s => string.Equals(s.Status, status, StringComparison.OrdinalIgnoreCase)).ToList();
        if (schoolId.HasValue)
            all = all.Where(s => s.SchoolId == schoolId).ToList();

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("School,Code,Stage,Color,SortOrder,Status,Notes");
        string Csv(string? s) => $"\"{(s ?? "").Replace("\"", "\"\"")}\"";
        foreach (var r in all)
            sb.AppendLine(string.Join(",", new[]{
                Csv(r.SchoolName), Csv(r.Code), Csv(r.Name), Csv(r.ColorHex),
                (r.SortOrder).ToString(), Csv(r.Status), Csv(r.Notes)
            }));
        return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
    }
}
