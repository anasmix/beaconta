using beaconta.Application.DTOs;
using FluentValidation;

public class GradeYearUpsertValidator : AbstractValidator<GradeYearUpsertDto>
{
    public GradeYearUpsertValidator()
    {
        RuleFor(x => x.YearId).GreaterThan(0);
        RuleFor(x => x.SchoolId).GreaterThan(0);
        RuleFor(x => x.StageId).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Shift).Must(s => new[] { "Morning", "Evening" }.Contains(s));
        RuleFor(x => x.Gender).Must(g => new[] { "Mixed", "Boys", "Girls" }.Contains(g));
        RuleFor(x => x.Status).Must(s => new[] { "Active", "Inactive" }.Contains(s));
        RuleForEach(x => x.Fees).ChildRules(f => {
            f.RuleFor(y => y.Type).NotEmpty().MaximumLength(32);
            f.RuleFor(y => y.Amount).GreaterThanOrEqualTo(0);
        });
    }
}

public class SectionYearUpsertValidator : AbstractValidator<SectionYearUpsertDto>
{
    public SectionYearUpsertValidator()
    {
        RuleFor(x => x.GradeYearId).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Capacity).GreaterThanOrEqualTo(0);
    }
}
