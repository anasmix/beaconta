// ===============================
// Services/SubjectsService.cs
// ===============================
using AutoMapper;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Application.Services;

public class SubjectsService : ISubjectsService
{
    private readonly BeacontaDb _db;
    private readonly IMapper _map;

    public SubjectsService(BeacontaDb db, IMapper map)
    {
        _db = db; _map = map;
    }

    // مبدئياً: جميع المواد (إمكان ربطها لاحقاً بـ GradeYear عبر جدول وسيط)
    public async Task<IReadOnlyList<SubjectDto>> GetSubjectsAsync(
        int? gradeYearId, int? yearId, CancellationToken ct = default)
    {
        // الآن نستخدم Map بدلاً من ProjectTo لتفادي أعطال لو نُسيت الخرائط.
        var list = await _db.Subjects.AsNoTracking()
            .OrderBy(s => s.Name)
            .ToListAsync(ct);

        return list.Select(s => _map.Map<SubjectDto>(s)).ToList();
    }
}
