using beaconta.Application.DTOs;

namespace beaconta.Application.Interfaces;

public interface IStageService
{
    Task<List<StageDto>> GetAllAsync();
    Task<StageDto?> GetByIdAsync(int id);
    Task<StageDto> UpsertAsync(StageUpsertDto dto);
    Task<bool> DeleteAsync(int id);

    Task<bool> ToggleStatusAsync(int id);

    Task<int> BulkActivateAsync(List<int> ids);
    Task<int> BulkDeactivateAsync(List<int> ids);
    Task<int> BulkDeleteAsync(List<int> ids);

    // اختياري للتصدير
    Task<byte[]> ExportAsync(string? q, string? status, int? schoolId);
}
