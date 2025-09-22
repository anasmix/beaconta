using beaconta.Application.DTOs;

namespace beaconta.Application.Interfaces
{
    public interface IRoleService
    {
        Task<IEnumerable<RoleDto>> GetAllAsync();
        Task<RoleDto?> GetByIdAsync(int id);
        Task<RoleDto> CreateAsync(string name);

        // ✨ عدلنا هنا
        Task<RoleDto?> UpdateNameAsync(int id, string newName);

        Task<bool> DeleteAsync(int id);
        Task<RoleDto?> UpdatePermissionsAsync(UpdateRolePermissionsDto dto);
        Task<bool> ClonePermissionsAsync(int fromRoleId, int toRoleId);
        Task<List<UserDto>> GetUsersByRoleIdAsync(int roleId);
    }
}
