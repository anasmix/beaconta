// Validators/CurriculumTemplateCreateValidator.cs
using FluentValidation;
using beaconta.Application.DTOs;

public class CurriculumTemplateCreateValidator : AbstractValidator<CurriculumTemplateCreateDto>
{
    public CurriculumTemplateCreateValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.YearId).GreaterThan(0);
        // لا تضف RuleFor(x => x.TemplateCode).NotEmpty()
    }
}
