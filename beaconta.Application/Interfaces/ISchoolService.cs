using beaconta.Application.DTOs;

namespace beaconta.Application.Interfaces
{
    public interface ISchoolService
    {
        Task<IReadOnlyList<SchoolDto>> GetAllAsync();
        Task<SchoolDto?> GetByIdAsync(int id);
        Task<SchoolDto> UpsertAsync(SchoolUpsertDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
