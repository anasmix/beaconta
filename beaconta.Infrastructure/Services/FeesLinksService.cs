using AutoMapper;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Application.Services;

public class FeesLinksService : IFeesLinksService
{
    private readonly BeacontaDb _db;
    private readonly IMapper _map;

    public FeesLinksService(BeacontaDb db, IMapper map)
    {
        _db = db; _map = map;
    }

    public async Task<IReadOnlyList<FeeLinkDto>> GetLinksAsync(
        int schoolId, int yearId, int? stageId, int? gradeYearId, int? sectionYearId, CancellationToken ct = default)
    {
        var q =
            from l in _db.FeeLinks.AsNoTracking()
            join gy in _db.GradeYears.AsNoTracking() on l.GradeYearId equals gy.Id
            join y in _db.Years.AsNoTracking() on gy.YearId equals y.Id
            join s in _db.Stages.AsNoTracking() on gy.StageId equals s.Id
            join subj in _db.Subjects.AsNoTracking() on l.SubjectId equals subj.Id
            join fb in _db.FeeBundles.AsNoTracking() on l.FeeBundleId equals fb.Id
            where gy.SchoolId == schoolId && y.Id == yearId
            select new { l, gy, y, s, subj, fb };

        if (stageId.HasValue) q = q.Where(t => t.s.Id == stageId.Value);
        if (gradeYearId.HasValue) q = q.Where(t => t.gy.Id == gradeYearId.Value);
        if (sectionYearId.HasValue) q = q.Where(t => t.l.SectionYearId == sectionYearId.Value);

        var raw = await q.ToListAsync(ct);

        // حمّل عناصر الحزم لحساب ItemsCount/Total بكفاءة
        var bundleIds = raw.Select(t => t.fb.Id).Distinct().ToList();
        var bundles = await _db.FeeBundles
            .Include(b => b.Items)
            .AsNoTracking()
            .Where(b => bundleIds.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, ct);

        var list = raw.Select(t =>
        {
            var l = t.l;
            var b = bundles.GetValueOrDefault(t.fb.Id);
            var itemsCount = b?.Items.Count ?? 0;
            var total = b?.Items.Sum(i => i.Amount) ?? 0m;

            return new FeeLinkDto(
                Id: l.Id,
                SchoolId: t.gy.SchoolId,
                YearId: t.y.Id,
                StageId: t.s.Id,
                GradeYearId: l.GradeYearId,
                SectionYearId: l.SectionYearId,
                SubjectId: l.SubjectId,
                SubjectName: l.SubjectName ?? t.subj.Name,
                FeeBundleId: l.FeeBundleId,
                BundleName: l.BundleName ?? (b?.Name ?? t.fb.Name),
                ItemsCount: itemsCount,
                Total: total,
                EffectiveFrom: l.EffectiveFrom,
                Status: l.Status,
                SchoolName: l.SchoolName ?? "",   // يمكن لاحقًا جلبها من جدول Schools لو أردت
                YearName: l.YearName ?? (t.y.Name ?? ""),
                StageName: l.StageName ?? t.s.Name,
                GradeYearName: l.GradeYearName ?? t.gy.Name,
                SectionName: l.SectionName ?? ""  // أو انضمام لاسم الشعبة لو لزم
            );
        })
        .OrderByDescending(x => x.Id)
        .ToList();

        return list;
    }

    public async Task CreateLinksBulkAsync(CreateLinksBulkRequest req, CancellationToken ct = default)
    {
        var gy = await _db.GradeYears.AsNoTracking()
            .Where(g => g.Id == req.GradeYearId
                     && g.SchoolId == req.SchoolId
                     && g.YearId == req.YearId
                     && g.StageId == req.StageId)
            .Select(g => new { g.Id, g.Name, g.SchoolId, g.YearId, g.StageId })
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("GradeYear mismatch.");

        var yName = await _db.Years.AsNoTracking()
            .Where(y => y.Id == req.YearId)
            .Select(y => y.Name)
            .FirstOrDefaultAsync(ct) ?? "";

        var sName = await _db.Stages.AsNoTracking()
            .Where(s => s.Id == req.StageId)
            .Select(s => s.Name)
            .FirstOrDefaultAsync(ct) ?? "";

        var sec = await _db.SectionYears.AsNoTracking()
            .Where(s => s.Id == req.SectionYearId)
            .Select(s => new { s.Id, s.Name })
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("SectionYear not found.");

        var bundle = await _db.FeeBundles.AsNoTracking()
            .Where(b => b.Id == req.FeeBundleId)
            .Select(b => new { b.Id, b.Name })
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("Bundle not found.");

        var subs = await _db.Subjects.AsNoTracking()
            .Where(s => req.SubjectIds.Contains(s.Id))
            .Select(s => new { s.Id, s.Name })
            .ToListAsync(ct);

        var toAdd = new List<FeeLink>();
        foreach (var sub in subs.DistinctBy(x => x.Id))
        {
            var exists = await _db.FeeLinks.AnyAsync(x =>
                x.GradeYearId == gy.Id &&
                x.SectionYearId == sec.Id &&
                x.SubjectId == sub.Id, ct);

            if (exists) continue;

            toAdd.Add(new FeeLink
            {
                GradeYearId = gy.Id,
                SectionYearId = sec.Id,
                SubjectId = sub.Id,
                FeeBundleId = bundle.Id,
                EffectiveFrom = req.EffectiveFrom,
                Status = string.IsNullOrWhiteSpace(req.Status) ? "Draft" : req.Status,
                // Cache
                YearName = yName,
                StageName = sName,
                GradeYearName = gy.Name,
                SectionName = sec.Name,
                SubjectName = sub.Name,
                BundleName = bundle.Name
            });
        }

        if (toAdd.Count > 0)
        {
            _db.FeeLinks.AddRange(toAdd);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task UpdateLinkAsync(int id, UpdateFeeLinkRequest req, CancellationToken ct = default)
    {
        var link = await _db.FeeLinks.FirstOrDefaultAsync(l => l.Id == id, ct)
                   ?? throw new KeyNotFoundException("Link not found");

        if (req.Status is not null) link.Status = req.Status;
        if (req.EffectiveFrom.HasValue) link.EffectiveFrom = req.EffectiveFrom;

        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteLinkAsync(int id, CancellationToken ct = default)
    {
        var stub = new FeeLink { Id = id };
        _db.Attach(stub);
        _db.Remove(stub);
        await _db.SaveChangesAsync(ct);
    }
}
