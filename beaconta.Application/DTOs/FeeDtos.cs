// beaconta.Application/DTOs/FeeDtos.cs
namespace beaconta.Application.DTOs
{
    // كتالوج بنود الرسوم
    public record FeeItemCatalogDto(
        int Id,
        string ItemCode,
        string Name
    );

    // ملخص الحزمة (الفرونت يتوقع هذه الحقول بالضبط)
    public record FeeBundleSummaryDto(
        int Id,
        string Name,
        string? Desc,
        int ItemsCount,
        decimal Total
    );

    // عنصر داخل الحزمة
    public record FeeBundleItemDto(
        int Id,
        string ItemCode,
        string? ItemName,  // يُملأ في GetBundleAsync من كتالوج البنود
        decimal Amount,
        string Repeat,
        bool Optional,
        string? Note
    );

    // تفاصيل الحزمة
    public record FeeBundleDto(
        int Id,
        string Name,
        string? Desc,
        IReadOnlyList<FeeBundleItemDto> Items
    );
}
