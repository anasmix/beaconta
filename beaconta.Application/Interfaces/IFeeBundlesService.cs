// beaconta.Application/Interfaces/IFeeBundlesService.cs
using beaconta.Application.DTOs;

namespace beaconta.Application.Interfaces
{
    public interface IFeeBundlesService
    {
        Task<FeeBundleDto> CreateAsync(SaveFeeBundleDto dto, CancellationToken ct = default);
        Task<FeeBundleDto> UpdateAsync(int id, SaveFeeBundleDto dto, CancellationToken ct = default);
        Task DeleteAsync(int id, CancellationToken ct = default);
        Task<FeeBundleDto?> GetAsync(int id, CancellationToken ct = default);

    }
}
