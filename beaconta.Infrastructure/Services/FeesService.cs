// beaconta.Infrastructure/Services/FeesService.cs
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Application.Services
{
    public class FeesService : IFeesService
    {
        private readonly BeacontaDb _db;
        public FeesService(BeacontaDb db) => _db = db;

        // يدعم q (بحث بالاسم/الكود) + take (حد أقصى للنتائج)
        public async Task<IReadOnlyList<FeeItemCatalogDto>> GetFeeItemsAsync(string? q, int take = 20, CancellationToken ct = default)
        {
            var query = _db.FeeItems.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
            {
                q = q.Trim();
                query = query.Where(x =>
                    x.Name.Contains(q) ||
                    x.ItemCode.Contains(q));
            }

            take = Math.Clamp(take, 1, 100);

            return await query
                .OrderBy(x => x.Name)
                .Take(take)
                .Select(x => new FeeItemCatalogDto(x.Id, x.ItemCode, x.Name))
                .ToListAsync(ct);
        }

        public async Task<IReadOnlyList<FeeBundleSummaryDto>> GetBundlesAsync(int? gradeYearId, CancellationToken ct = default)
        {
            var data = await _db.FeeBundles
                .AsNoTracking()
                .Select(b => new
                {
                    b.Id,
                    b.BundleCode,
                    b.Name,
                    ItemsCount = b.Items.Count,
                    Total = b.Items.Sum(i => (decimal?)i.Amount) ?? 0m
                })
                .OrderByDescending(x => x.Id)
                .ToListAsync(ct);

            return data.Select(x => new FeeBundleSummaryDto(
                x.Id,
                x.BundleCode,
                x.Name,
                x.ItemsCount,
                x.Total
            )).ToList();
        }

        public async Task<FeeBundleDto?> GetBundleAsync(int id, CancellationToken ct = default)
        {
            var bundle = await _db.FeeBundles
                .Include(b => b.Items)
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == id, ct);

            if (bundle is null) return null;

            var dict = await _db.FeeItems.AsNoTracking()
                .ToDictionaryAsync(x => x.ItemCode, x => x.Name, ct);

            var items = bundle.Items
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
                .AsReadOnly();

            return new FeeBundleDto(
                bundle.Id,
                bundle.BundleCode,
                bundle.Name,
                bundle.Desc,
                items
            );
        }
    }
}
