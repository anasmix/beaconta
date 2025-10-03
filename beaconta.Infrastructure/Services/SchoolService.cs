using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Services
{
    public class SchoolService : ISchoolService
    {
        private readonly BeacontaDb _db;
        public SchoolService(BeacontaDb db) => _db = db;

        public async Task<IReadOnlyList<SchoolDto>> GetAllAsync()
        {
            return await _db.Schools
                .Select(s => new SchoolDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Code = s.Code,
                    Status = s.Status,
                    ColorHex = s.ColorHex,
                    Notes = s.Notes
                })
                .ToListAsync();
        }

        public async Task<SchoolDto?> GetByIdAsync(int id)
        {
            return await _db.Schools
                .Where(s => s.Id == id)
                .Select(s => new SchoolDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Code = s.Code,
                    Status = s.Status,
                    ColorHex = s.ColorHex,
                    Notes = s.Notes
                })
                .FirstOrDefaultAsync();
        }

        public async Task<SchoolDto> UpsertAsync(SchoolUpsertDto dto)
        {
            School entity;
            if (dto.Id == 0)
            {
                entity = new School
                {
                    Name = dto.Name,
                    Code = dto.Code,
                    Status = dto.Status,
                    ColorHex = dto.ColorHex,
                    Notes = dto.Notes
                };
                _db.Schools.Add(entity);
            }
            else
            {
                entity = await _db.Schools.FindAsync(dto.Id)
                         ?? throw new KeyNotFoundException("School not found");
                entity.Name = dto.Name;
                entity.Code = dto.Code;
                entity.Status = dto.Status;
                entity.ColorHex = dto.ColorHex;
                entity.Notes = dto.Notes;
            }

            await _db.SaveChangesAsync();

            return new SchoolDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Code = entity.Code,
                Status = entity.Status,
                ColorHex = entity.ColorHex,
                Notes = entity.Notes
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _db.Schools.FindAsync(id);
            if (entity == null) return false;

            _db.Schools.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
