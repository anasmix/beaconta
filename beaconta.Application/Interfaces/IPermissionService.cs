using beaconta.Application.DTOs;

namespace beaconta.Application.Interfaces
{
    public interface IPermissionService
    {
        Task<IEnumerable<PermissionDto>> GetAllAsync();
        Task<IEnumerable<PermissionDto>> GetByCategoryAsync(string category);
    }
}
