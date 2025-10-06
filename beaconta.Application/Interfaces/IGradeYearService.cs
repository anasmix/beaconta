using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using beaconta.Application.DTOs;

namespace beaconta.Application.Interfaces
{
    public interface IGradeYearService
    {
        Task<List<GradeYearDto>> GetAllAsync(int yearId, int? schoolId, int? stageId, string? q, CancellationToken ct);
        Task<GradeYearDto?> GetByIdAsync(int id, CancellationToken ct);
        Task<GradeYearDto> UpsertAsync(GradeYearUpsertDto dto, string? userName, CancellationToken ct);
        Task<bool> DeleteAsync(int id, CancellationToken ct);
        Task<bool> ToggleStatusAsync(int id, CancellationToken ct);
        Task<byte[]> ExportAsync(int yearId, int? schoolId, int? stageId, string? q, string? format, CancellationToken ct);

        // ✅ التصحيح هنا: إرجاع CompareResponseDto بدل object
        Task<CompareResponseDto> CompareAsync(int yearA, int yearB, CancellationToken ct);
    }

    public interface ISectionYearService
    {
        Task<List<SectionYearDto>> GetByGradeYearAsync(int gradeYearId, CancellationToken ct);
        Task<SectionYearDto> UpsertAsync(SectionYearUpsertDto dto, CancellationToken ct);
        Task<int> BulkCreateAsync(int gradeYearId, IEnumerable<SectionYearUpsertDto> dtos, CancellationToken ct);
        Task<bool> DeleteAsync(int id, CancellationToken ct);
        
        // ✅ جديد: تبديل الحالة
        Task<bool> SetStatusAsync(int gradeYearId, int id, string status, CancellationToken ct); // "Active"/"Inactive"
    }
}
