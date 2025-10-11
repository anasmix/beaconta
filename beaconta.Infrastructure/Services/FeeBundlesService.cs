// beaconta.Infrastructure/Services/FeeBundlesService.cs
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Services
{
    public class FeeBundlesService : IFeeBundlesService
    {
        private readonly BeacontaDb _db;
        public FeeBundlesService(BeacontaDb db) => _db = db;

        private static string NewBundleCode()
            => $"BND-{DateTime.UtcNow:yyMMdd}-{Random.Shared.Next(100, 999)}";

        public async Task<FeeBundleDto> CreateAsync(SaveFeeBundleDto dto, CancellationToken ct = default)
        {
            // تحقق من وجود الأكواد في كتالوج البنود
            var codes = dto.Items
                           .Select(i => (i.ItemCode ?? "").Trim())
                           .Where(s => s.Length > 0)
                           .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var exists = await _db.FeeItems
                                  .AsNoTracking()
                                  .Where(x => codes.Contains(x.ItemCode))
                                  .Select(x => x.ItemCode)
                                  .ToListAsync(ct);

            var missing = codes.Except(exists, StringComparer.OrdinalIgnoreCase).ToList();
            if (missing.Count > 0)
                throw new InvalidOperationException($"أكواد غير موجودة في الكتالوج: {string.Join(", ", missing)}");

            // توليد كود الحزمة بشكل فريد
            string bundleCode = NewBundleCode();
            while (await _db.FeeBundles.AnyAsync(b => b.BundleCode == bundleCode, ct))
                bundleCode = NewBundleCode();

            using var tx = await _db.Database.BeginTransactionAsync(ct);

            var bundle = new FeeBundle
            {
                BundleCode = bundleCode,
                Name = dto.Name.Trim(),
                Desc = string.IsNullOrWhiteSpace(dto.Desc) ? null : dto.Desc!.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _db.FeeBundles.Add(bundle);
            await _db.SaveChangesAsync(ct);

            var items = dto.Items.Select(i => new FeeBundleItem
            {
                FeeBundleId = bundle.Id,
                ItemCode = i.ItemCode.Trim(),
                Amount = i.Amount,
                Repeat = (i.Repeat ?? "once").Trim().ToLower(),
                Optional = i.Optional,
                Note = string.IsNullOrWhiteSpace(i.Note) ? null : i.Note!.Trim()
            }).ToList();

            _db.FeeBundleItems.AddRange(items);
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            // جلب أسماء البنود للعرض (حول لقائمة ثم Dictionary بالمقارن الحرفي)
            var namesList = await _db.FeeItems
                                     .AsNoTracking()
                                     .Where(x => codes.Contains(x.ItemCode))
                                     .Select(x => new { x.ItemCode, x.Name })
                                     .ToListAsync(ct);

            var nameMap = namesList.ToDictionary(x => x.ItemCode, x => x.Name,
                                                 StringComparer.OrdinalIgnoreCase);

            var dtoItems = items
                .OrderBy(x => x.Id)
                .Select(x => new FeeBundleItemDto(
                    x.Id,
                    x.ItemCode,
                    nameMap.TryGetValue(x.ItemCode, out var nm) ? nm : null,
                    x.Amount,
                    x.Repeat,
                    x.Optional,
                    x.Note))
                .ToList()
                .AsReadOnly();

            return new FeeBundleDto(bundle.Id, bundle.BundleCode, bundle.Name, bundle.Desc, dtoItems);
        }

        public async Task<FeeBundleDto> UpdateAsync(int id, SaveFeeBundleDto dto, CancellationToken ct = default)
        {
            var bundle = await _db.FeeBundles.FirstOrDefaultAsync(b => b.Id == id, ct);
            if (bundle is null)
                throw new KeyNotFoundException("الحزمة غير موجودة.");

            var codes = dto.Items
                           .Select(i => (i.ItemCode ?? "").Trim())
                           .Where(s => s.Length > 0)
                           .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var exists = await _db.FeeItems
                                  .AsNoTracking()
                                  .Where(x => codes.Contains(x.ItemCode))
                                  .Select(x => x.ItemCode)
                                  .ToListAsync(ct);

            var missing = codes.Except(exists, StringComparer.OrdinalIgnoreCase).ToList();
            if (missing.Count > 0)
                throw new InvalidOperationException($"أكواد غير موجودة في الكتالوج: {string.Join(", ", missing)}");

            using var tx = await _db.Database.BeginTransactionAsync(ct);

            bundle.Name = dto.Name.Trim();
            bundle.Desc = string.IsNullOrWhiteSpace(dto.Desc) ? null : dto.Desc!.Trim();
            bundle.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            // استبدال العناصر بالكامل
            var old = await _db.FeeBundleItems.Where(i => i.FeeBundleId == bundle.Id).ToListAsync(ct);
            _db.FeeBundleItems.RemoveRange(old);
            await _db.SaveChangesAsync(ct);

            var items = dto.Items.Select(i => new FeeBundleItem
            {
                FeeBundleId = bundle.Id,
                ItemCode = i.ItemCode.Trim(),
                Amount = i.Amount,
                Repeat = (i.Repeat ?? "once").Trim().ToLower(),
                Optional = i.Optional,
                Note = string.IsNullOrWhiteSpace(i.Note) ? null : i.Note!.Trim()
            }).ToList();

            _db.FeeBundleItems.AddRange(items);
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            var namesList = await _db.FeeItems
                                     .AsNoTracking()
                                     .Where(x => codes.Contains(x.ItemCode))
                                     .Select(x => new { x.ItemCode, x.Name })
                                     .ToListAsync(ct);

            var nameMap = namesList.ToDictionary(x => x.ItemCode, x => x.Name,
                                                 StringComparer.OrdinalIgnoreCase);

            var dtoItems = items
                .OrderBy(x => x.Id)
                .Select(x => new FeeBundleItemDto(
                    x.Id,
                    x.ItemCode,
                    nameMap.TryGetValue(x.ItemCode, out var nm) ? nm : null,
                    x.Amount,
                    x.Repeat,
                    x.Optional,
                    x.Note))
                .ToList()
                .AsReadOnly();

            return new FeeBundleDto(bundle.Id, bundle.BundleCode, bundle.Name, bundle.Desc, dtoItems);
        }

        public async Task DeleteAsync(int id, CancellationToken ct = default)
        {
            var bundle = await _db.FeeBundles.FirstOrDefaultAsync(b => b.Id == id, ct);
            if (bundle is null) return;

            var anyLinked = await _db.FeeLinks.AnyAsync(l => l.FeeBundleId == id, ct);
            if (anyLinked)
                throw new InvalidOperationException("لا يمكن حذف الحزمة لأنها مستخدمة في روابط رسوم.");

            _db.FeeBundles.Remove(bundle);
            await _db.SaveChangesAsync(ct);
        }

        public Task<FeeBundleDto?> GetAsync(int id, CancellationToken ct = default)
        {
            throw new NotImplementedException();
        }
    }
}
