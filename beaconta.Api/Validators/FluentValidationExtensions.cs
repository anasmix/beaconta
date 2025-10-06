using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace beaconta.Api.Validators
{
    public static class FluentValidationExtensions
    {
        public static ModelStateDictionary ToModelState(this ValidationResult vr)
        {
            var ms = new ModelStateDictionary();
            foreach (var e in vr.Errors)
                ms.AddModelError(e.PropertyName, e.ErrorMessage);
            return ms;
        }
    }
}
