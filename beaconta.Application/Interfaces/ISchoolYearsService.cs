using beaconta.Application.DTOs;

namespace beaconta.Application.Interfaces
{
    public interface ISchoolYearsService
    {
        Task<CurrentSchoolYearDto?> GetCurrentForBranchAsync(int branchId, CancellationToken ct = default);
        // اختياري: لو أردت الاستعلام مباشرةً بالمدرسة
        Task<CurrentSchoolYearDto?> GetCurrentForSchoolAsync(int schoolId, CancellationToken ct = default);
    }
}
