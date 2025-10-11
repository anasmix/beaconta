 using beaconta.Application.DTOs;

public interface IFeesService
{
    Task<IReadOnlyList<FeeItemCatalogDto>> GetFeeItemsAsync(string? q, int take = 20, CancellationToken ct = default);
    Task<IReadOnlyList<FeeBundleSummaryDto>> GetBundlesAsync(int? gradeYearId, CancellationToken ct = default);
    Task<FeeBundleDto?> GetBundleAsync(int id, CancellationToken ct = default);
}
