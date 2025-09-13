using beaconta.Application.DTOs;

namespace beaconta.Application.Interfaces
{
    public interface IRoleService
    {
        Task<IEnumerable<RoleDto>> GetAllAsync();
        Task<RoleDto?> GetByIdAsync(int id);
        Task<RoleDto> CreateAsync(string name);
        Task<bool> UpdateNameAsync(int id, string newName);
        Task<bool> DeleteAsync(int id);
        Task<bool> UpdatePermissionsAsync(UpdateRolePermissionsDto dto);
        Task<bool> ClonePermissionsAsync(int fromRoleId, int toRoleId);

        // ✅ جديد: إرجاع المستخدمين حسب الدور
        Task<List<UserDto>> GetUsersByRoleIdAsync(int roleId);
    }
}
