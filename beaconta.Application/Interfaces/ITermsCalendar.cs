using beaconta.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace beaconta.Application.Interfaces
{
    public interface ITermYearService
    {
        Task<List<TermYearDto>> GetByYearAsync(int yearId, CancellationToken ct);
        Task<TermYearDto?> GetByIdAsync(int id, CancellationToken ct);
        Task<TermYearDto> UpsertAsync(TermYearUpsertDto dto, CancellationToken ct);
        Task<bool> DeleteAsync(int id, CancellationToken ct);
        Task<bool> HasOverlapAsync(int yearId, DateTime start, DateTime end, int? ignoreId, CancellationToken ct);
    }

    public interface ICalendarEventService
    {
        Task<List<CalendarEventDto>> GetByYearAsync(int yearId, CancellationToken ct);
        Task<CalendarEventDto?> GetByIdAsync(int id, CancellationToken ct);
        Task<CalendarEventDto> UpsertAsync(CalendarEventUpsertDto dto, CancellationToken ct);
        Task<bool> DeleteAsync(int id, CancellationToken ct);
    }
}
