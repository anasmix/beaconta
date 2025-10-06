using beaconta.Application.DTOs;

namespace beaconta.Application.Interfaces
{
    public interface ISchoolService
    {
        Task<IReadOnlyList<SchoolDto>> GetAllAsync();
        Task<SchoolDto?> GetByIdAsync(int id);
        Task<SchoolDto> UpsertAsync(SchoolUpsertDto dto);

        // حذف المدرسة:
        // force=false  => يمنع الحذف إن وُجدت فروع ويرمي InvalidOperationException
        // force=true   => يحذف الفروع ثم يحذف المدرسة داخل ترانزاكشن
        Task<bool> DeleteAsync(int id, bool force = false);

        // نقل كل الفروع من مدرسة إلى أخرى ثم يمكنك حذف المصدر
        // يعيد عدد الفروع التي تم نقلها
        Task<int> TransferBranchesAsync(int fromSchoolId, int toSchoolId);
    }
}
