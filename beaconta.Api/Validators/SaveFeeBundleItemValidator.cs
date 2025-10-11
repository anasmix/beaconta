// beaconta.Api/Validators/FeeBundlesValidators.cs
using beaconta.Application.DTOs;
using FluentValidation;

namespace beaconta.Api.Validators
{
    public class SaveFeeBundleItemValidator : AbstractValidator<SaveFeeBundleItemDto>
    {
        public SaveFeeBundleItemValidator()
        {
            RuleFor(x => x.ItemCode).NotEmpty().MaximumLength(50);
            RuleFor(x => x.Amount).NotEqual(0).WithMessage("القيمة يجب ألا تكون صفرًا.");
            RuleFor(x => x.Repeat)
                .Must(r => new[] { "once", "monthly", "term", "yearly" }.Contains((r ?? "").ToLower()))
                .WithMessage("قيمة التكرار يجب أن تكون: once/monthly/term/yearly");
            RuleFor(x => x.Note).MaximumLength(200).When(x => !string.IsNullOrEmpty(x.Note));
        }
    }

    public class SaveFeeBundleValidator : AbstractValidator<SaveFeeBundleDto>
    {
        public SaveFeeBundleValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
            RuleFor(x => x.Desc).MaximumLength(200).When(x => !string.IsNullOrEmpty(x.Desc));
            RuleFor(x => x.Items).NotEmpty().WithMessage("يجب إضافة بند واحد على الأقل.");
            RuleForEach(x => x.Items).SetValidator(new SaveFeeBundleItemValidator());
        }
    }
}
