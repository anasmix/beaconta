
// beaconta.Application/Interfaces/ISubjectsService.cs
using beaconta.Application.DTOs;

public interface ISubjectsService
{
    Task<IReadOnlyList<SubjectDto>> GetSubjectsAsync(int? gradeYearId, int? yearId, CancellationToken ct = default);
}