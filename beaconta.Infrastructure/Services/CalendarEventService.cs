using AutoMapper;
using AutoMapper.QueryableExtensions;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Services
{
    public class CalendarEventService : ICalendarEventService
    {
        private readonly BeacontaDb _db;
        private readonly IMapper _mapper;

        public CalendarEventService(BeacontaDb db, IMapper mapper) { _db = db; _mapper = mapper; }

        public Task<List<CalendarEventDto>> GetByYearAsync(int yearId, CancellationToken ct) =>
            _db.CalendarEvents.AsNoTracking()
               .Where(e => e.YearId == yearId)
               .OrderBy(e => e.StartDate)
               .ProjectTo<CalendarEventDto>(_mapper.ConfigurationProvider)
               .ToListAsync(ct);

        public async Task<CalendarEventDto?> GetByIdAsync(int id, CancellationToken ct)
        {
            var e = await _db.CalendarEvents.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
            return e is null ? null : _mapper.Map<CalendarEventDto>(e);
        }

        public async Task<CalendarEventDto> UpsertAsync(CalendarEventUpsertDto dto, CancellationToken ct)
        {
            var yearExists = await _db.Years.AnyAsync(y => y.Id == dto.YearId, ct);
            if (!yearExists) throw new KeyNotFoundException("Year not found.");
            if (dto.EndDate < dto.StartDate) throw new InvalidOperationException("RANGE_INVALID");

            CalendarEvent entity;
            if (dto.Id is > 0)
            {
                entity = await _db.CalendarEvents.FirstOrDefaultAsync(x => x.Id == dto.Id.Value, ct)
                         ?? throw new KeyNotFoundException("Event not found.");
                _mapper.Map(dto, entity);
                entity.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                entity = _mapper.Map<CalendarEvent>(dto);
                _db.CalendarEvents.Add(entity);
            }

            await _db.SaveChangesAsync(ct);
            return _mapper.Map<CalendarEventDto>(entity);
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken ct)
        {
            var e = await _db.CalendarEvents.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (e is null) return false;
            _db.CalendarEvents.Remove(e);
            await _db.SaveChangesAsync(ct);
            return true;
        }
    }
}
