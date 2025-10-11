// beaconta.Application/DTOs/FeeDtos.cs
namespace beaconta.Application.DTOs
{
    // === Subjects / Curriculum ===
    public record SubjectDto(int Id, string Code, string Name, int Hours, string? Note);
    public record CurriculumTemplateDto(int Id, string TemplateCode, string Name, int? YearId);

    // === Fee Items & Bundles ===
    public record FeeItemCatalogDto(int Id, string ItemCode, string Name);

    public record FeeBundleItemDto(
        int Id,
        string ItemCode,
        string? ItemName,
        decimal Amount,
        string Repeat,
        bool Optional,
        string? Note
    );

    // للقائمة المختصرة (اسم + إجمالي + عدد عناصر)
    public record FeeBundleSummaryDto(
        int Id,
        string BundleCode,
        string Name,
        int ItemsCount,
        decimal Total
    );

    // للتفاصيل (تُرجعها /api/fees/bundles/{id})
    public record FeeBundleDto(
        int Id,
        string BundleCode,
        string Name,
        string? Desc,
        IReadOnlyList<FeeBundleItemDto> Items
    );

    // === Fees Links ===
    public record FeeLinkDto(
        int Id,
        int SchoolId, int YearId, int StageId, int GradeYearId, int SectionYearId,
        int SubjectId, string SubjectName,
        int FeeBundleId, string BundleName,
        int ItemsCount, decimal Total,
        DateOnly? EffectiveFrom,
        string Status,
        string SchoolName, string YearName, string StageName, string GradeYearName, string SectionName
    );

    public record CreateLinksBulkRequest(
        int SchoolId, int YearId, int StageId, int GradeYearId, int SectionYearId,
        int FeeBundleId,
        IReadOnlyList<int> SubjectIds,
        DateOnly? EffectiveFrom,
        string Status,
        bool EnableSiblingDiscount
    );

    public record UpdateFeeLinkRequest(string? Status, DateOnly? EffectiveFrom);
}
