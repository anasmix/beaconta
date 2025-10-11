
// beaconta.Application/Interfaces/IFeesLinksService.cs
using beaconta.Application.DTOs;

public interface IFeesLinksService
{
    Task<IReadOnlyList<FeeLinkDto>> GetLinksAsync(int schoolId, int yearId, int? stageId, int? gradeYearId, int? sectionYearId, CancellationToken ct = default);
    Task CreateLinksBulkAsync(CreateLinksBulkRequest req, CancellationToken ct = default);
    Task UpdateLinkAsync(int id, UpdateFeeLinkRequest req, CancellationToken ct = default);
    Task DeleteLinkAsync(int id, CancellationToken ct = default);
}
