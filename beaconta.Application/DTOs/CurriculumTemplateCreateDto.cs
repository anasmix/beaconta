// Application/DTOs/CurriculumTemplateCreateDto.cs
namespace beaconta.Application.DTOs
{
    public record CurriculumTemplateCreateDto(
        string? TemplateCode,   // اختياري
        string Name,
        int YearId
    );
}
