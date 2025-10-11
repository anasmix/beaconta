public interface ISubjectsService
{
    Task<IReadOnlyList<SubjectDto>> GetSubjectsAsync(int? gradeYearId, int? yearId, CancellationToken ct = default);
}

public interface IFeesService
{
    Task<IReadOnlyList<FeeItemCatalogDto>> GetFeeItemsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<FeeBundleSummaryDto>> GetBundlesAsync(int? gradeYearId, CancellationToken ct = default);
    Task<FeeBundleDto?> GetBundleAsync(int id, CancellationToken ct = default);
}

public interface IFeesLinksService
{
    Task<IReadOnlyList<FeeLinkDto>> GetLinksAsync(int schoolId, int yearId, int? stageId, int? gradeYearId, int? sectionYearId, CancellationToken ct = default);
    Task CreateLinksBulkAsync(CreateLinksBulkRequest req, CancellationToken ct = default);
    Task UpdateLinkAsync(int id, UpdateFeeLinkRequest req, CancellationToken ct = default);
    Task DeleteLinkAsync(int id, CancellationToken ct = default);
}
