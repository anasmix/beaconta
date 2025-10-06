using AutoMapper;
using AutoMapper.QueryableExtensions;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace beaconta.Infrastructure.Services
{
    public class TermYearService : ITermYearService
    {
        private readonly BeacontaDb _db;
        private readonly IMapper _mapper;

        public TermYearService(BeacontaDb db, IMapper mapper) { _db = db; _mapper = mapper; }

        public Task<List<TermYearDto>> GetByYearAsync(int yearId, CancellationToken ct) =>
            _db.TermYears.AsNoTracking()
                .Where(t => t.YearId == yearId)
                .OrderBy(t => t.StartDate)
                .ProjectTo<TermYearDto>(_mapper.ConfigurationProvider)
                .ToListAsync(ct);

        public async Task<TermYearDto?> GetByIdAsync(int id, CancellationToken ct)
        {
            var e = await _db.TermYears.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
            return e is null ? null : _mapper.Map<TermYearDto>(e);
        }

        public async Task<TermYearDto> UpsertAsync(TermYearUpsertDto dto, CancellationToken ct)
        {
            // تحقق وجود السنة
            var yearExists = await _db.Years.AnyAsync(y => y.Id == dto.YearId, ct);
            if (!yearExists) throw new KeyNotFoundException("Year not found.");

            // منع التعارض داخل نفس السنة
            var overlap = await HasOverlapAsync(dto.YearId, dto.StartDate, dto.EndDate, dto.Id, ct);
            if (overlap) throw new InvalidOperationException("TERM_OVERLAP");

            TermYear entity;
            if (dto.Id is > 0)
            {
                entity = await _db.TermYears.FirstOrDefaultAsync(x => x.Id == dto.Id.Value, ct)
                         ?? throw new KeyNotFoundException("Term not found.");
                _mapper.Map(dto, entity);
                entity.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                entity = _mapper.Map<TermYear>(dto);
                _db.TermYears.Add(entity);
            }

            await _db.SaveChangesAsync(ct);
            return _mapper.Map<TermYearDto>(entity);
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken ct)
        {
            var e = await _db.TermYears.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (e is null) return false;
            _db.TermYears.Remove(e);
            await _db.SaveChangesAsync(ct);
            return true;
        }

        public Task<bool> HasOverlapAsync(int yearId, DateTime start, DateTime end, int? ignoreId, CancellationToken ct)
        {
            return _db.TermYears.AnyAsync(t =>
                t.YearId == yearId &&
                (ignoreId == null || t.Id != ignoreId.Value) &&
                t.StartDate <= end && start <= t.EndDate, ct);
        }
    }
}
