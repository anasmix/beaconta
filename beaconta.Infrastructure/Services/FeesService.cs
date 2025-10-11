// ===============================
// Services/FeesService.cs (fixed to match your DTO signatures)
// ===============================
using AutoMapper;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Application.Services;

public class FeesService : IFeesService
{
    private readonly BeacontaDb _db;
    private readonly IMapper _map;

    public FeesService(BeacontaDb db, IMapper map)
    {
        _db = db; _map = map;
    }

    public async Task<IReadOnlyList<FeeItemCatalogDto>> GetFeeItemsAsync(CancellationToken ct = default)
    {
        return await _db.FeeItems.AsNoTracking()
            .OrderBy(x => x.ItemCode)
            .Select(x => new FeeItemCatalogDto(x.Id, x.ItemCode, x.Name))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<FeeBundleSummaryDto>> GetBundlesAsync(int? gradeYearId, CancellationToken ct = default)
    {
        // رتّب أولاً على b.Id (أو أي عمود آخر)، ثم أسقِط إلى DTO
        var data = await _db.FeeBundles
            .AsNoTracking()
            .OrderByDescending(b => b.Id) // <-- مهم: الترتيب على العمود نفسه
            .Select(b => new
            {
                b.Id,
                b.BundleCode,
                b.Name,
                ItemsCount = b.Items.Count,
                Total = b.Items.Sum(i => (decimal?)i.Amount) ?? 0m
            })
            .ToListAsync(ct);

        // إسقاط إلى FeeBundleSummaryDto بعد خروجك للذاكرة
        return data
            .Select(x => new FeeBundleSummaryDto(
                x.Id,
                x.BundleCode,
                x.Name,
                x.ItemsCount,
                x.Total
            ))
            .ToList();
    }


    public async Task<FeeBundleDto?> GetBundleAsync(int id, CancellationToken ct = default)
    {
        var b = await _db.FeeBundles
            .Include(x => x.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (b is null) return null;

        var dict = await _db.FeeItems.AsNoTracking()
            .ToDictionaryAsync(x => x.ItemCode, x => x.Name, ct);

        var items = b.Items
            .OrderBy(i => i.Id)
            .Select(it => new FeeBundleItemDto(
                it.Id,
                it.ItemCode,
                dict.TryGetValue(it.ItemCode, out var nm) ? nm : null,
                it.Amount,
                it.Repeat,
                it.Optional,
                it.Note
            ))
            .ToList()
            .AsReadOnly(); // IReadOnlyList<FeeBundleItemDto>

        // matches: FeeBundleDto(int Id, string BundleCode, string Name, string? Desc, IReadOnlyList<FeeBundleItemDto> Items)
        return new FeeBundleDto(
            b.Id,
            b.BundleCode,
            b.Name,
            b.Desc,
            items
        );
    }
}
