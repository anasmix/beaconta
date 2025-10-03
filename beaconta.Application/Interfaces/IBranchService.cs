// beaconta.Application/Interfaces/IBranchService.cs
using beaconta.Application.DTOs;

namespace beaconta.Application.Interfaces;

public interface IBranchService
{
    Task<List<BranchDto>> GetAllAsync(CancellationToken ct = default);
    Task<BranchDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<BranchDto> UpsertAsync(BranchUpsertDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
