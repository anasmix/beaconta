//FeeLinkDto
public record SubjectDto(int Id, string Code, string Name, int Hours, string? Note);
    public record FeeItemCatalogDto(int Id, string ItemCode, string Name);

    public record FeeBundleItemDto(int Id, string ItemCode, string? ItemName, decimal Amount, string Repeat, bool Optional, string? Note);
    public record FeeBundleSummaryDto(int Id, string BundleCode, string Name, int ItemsCount, decimal Total);
    public record FeeBundleDto(int Id, string BundleCode, string Name, string? Desc, IReadOnlyList<FeeBundleItemDto> Items);

    public record CurriculumTemplateDto(int Id, string TemplateCode, string Name, int? YearId);

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

public record SaveFeeBundleItemDto(
      string ItemCode,
      decimal Amount,
      string Repeat,     // "once" | "monthly" | "term" | "yearly"
      bool Optional,
      string? Note
  );

public record SaveFeeBundleDto(
    string Name,
    string? Desc,
    IReadOnlyList<SaveFeeBundleItemDto> Items
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
