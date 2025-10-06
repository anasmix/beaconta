using beaconta.Application.DTOs;
using FluentValidation;

namespace beaconta.Api.Validators
{
    public class TermYearUpsertValidator : AbstractValidator<TermYearUpsertDto>
    {
        public TermYearUpsertValidator()
        {
            RuleFor(x => x.YearId).GreaterThan(0);
            RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
            RuleFor(x => x.StartDate).LessThanOrEqualTo(x => x.EndDate);
            RuleFor(x => x.WeekdaysCsv).NotEmpty().Matches(@"^[0-6](,[0-6])*$");
            RuleFor(x => x.Status).Must(s => s is "Active" or "Inactive");
            When(x => x.ExamStart.HasValue || x.ExamEnd.HasValue, () =>
            {
                RuleFor(x => x.ExamStart).NotNull();
                RuleFor(x => x.ExamEnd).NotNull();
                RuleFor(x => x.ExamEnd!.Value).GreaterThanOrEqualTo(x => x.ExamStart!.Value);
                RuleFor(x => x).Must(x => x.ExamStart >= x.StartDate && x.ExamEnd <= x.EndDate)
                    .WithMessage("Exam period must be inside term range.");
            });
        }
    }

    public class CalendarEventUpsertValidator : AbstractValidator<CalendarEventUpsertDto>
    {
        public CalendarEventUpsertValidator()
        {
            RuleFor(x => x.YearId).GreaterThan(0);
            RuleFor(x => x.Type).NotEmpty().MaximumLength(32);
            RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
            RuleFor(x => x.StartDate).LessThanOrEqualTo(x => x.EndDate);
        }
    }
}



