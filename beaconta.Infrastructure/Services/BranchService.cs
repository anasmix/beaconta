using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data; 
using Microsoft.EntityFrameworkCore;
using System;

namespace beaconta.Infrastructure.Services;

public class BranchService : IBranchService
{
    private readonly BeacontaDb _db;

    public BranchService(BeacontaDb db) => _db = db;

    public async Task<List<BranchDto>> GetAllAsync(CancellationToken ct)
    {
        return await _db.Branches
            .AsNoTracking()
            .Include(b => b.School)
            .OrderBy(b => b.Name)
            .Select(b => new BranchDto
            {
                Id = b.Id,
                SchoolId = b.SchoolId,
                SchoolName = b.School!.Name,
                Name = b.Name,
                Code = b.Code,
                Status = b.Status,
                City = b.City,
                District = b.District,
                Phone = b.Phone,
                ManagerName = b.ManagerName,
                Capacity = b.Capacity,
                CurrentStudents = b.CurrentStudents,
                Latitude = b.Latitude,
                Longitude = b.Longitude,
                Notes = b.Notes
            })
            .ToListAsync(ct);
    }

    public async Task<BranchDto?> GetByIdAsync(int id, CancellationToken ct)
    {
        return await _db.Branches
            .AsNoTracking()
            .Include(b => b.School)
            .Where(b => b.Id == id)
            .Select(b => new BranchDto
            {
                Id = b.Id,
                SchoolId = b.SchoolId,
                SchoolName = b.School!.Name,
                Name = b.Name,
                Code = b.Code,
                Status = b.Status,
                City = b.City,
                District = b.District,
                Phone = b.Phone,
                ManagerName = b.ManagerName,
                Capacity = b.Capacity,
                CurrentStudents = b.CurrentStudents,
                Latitude = b.Latitude,
                Longitude = b.Longitude,
                Notes = b.Notes
            })
            .FirstOrDefaultAsync(ct);
    }

    public async Task<BranchDto> UpsertAsync(BranchUpsertDto dto, CancellationToken ct)
    {
        Branch entity;
        var isNew = dto.Id == 0;

        if (isNew)
        {
            entity = new Branch
            {
                SchoolId = dto.SchoolId,
                Name = dto.Name.Trim(),
                Code = dto.Code?.Trim(),
                Status = NormalizeStatus(dto.Status),
                City = dto.City?.Trim(),
                District = dto.District?.Trim(),
                Phone = dto.Phone?.Trim(),
                ManagerName = dto.ManagerName?.Trim(),
                Capacity = dto.Capacity,
                CurrentStudents = dto.CurrentStudents,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Notes = dto.Notes?.Trim()
            };
            await _db.Branches.AddAsync(entity, ct);
        }
        else
        {
            entity = await _db.Branches.FirstOrDefaultAsync(x => x.Id == dto.Id, ct)
                     ?? throw new KeyNotFoundException("Branch not found.");

            entity.SchoolId = dto.SchoolId;
            entity.Name = dto.Name.Trim();
            entity.Code = dto.Code?.Trim();
            entity.Status = NormalizeStatus(dto.Status);
            entity.City = dto.City?.Trim();
            entity.District = dto.District?.Trim();
            entity.Phone = dto.Phone?.Trim();
            entity.ManagerName = dto.ManagerName?.Trim();
            entity.Capacity = dto.Capacity;
            entity.CurrentStudents = dto.CurrentStudents;
            entity.Latitude = dto.Latitude;
            entity.Longitude = dto.Longitude;
            entity.Notes = dto.Notes?.Trim();
            entity.UpdatedAt = DateTime.UtcNow;

            _db.Branches.Update(entity);
        }

        await _db.SaveChangesAsync(ct);

        // أعِد DTO موحّد
        var schoolName = await _db.Schools
            .Where(s => s.Id == entity.SchoolId)
            .Select(s => s.Name)
            .FirstOrDefaultAsync(ct);

        return new BranchDto
        {
            Id = entity.Id,
            SchoolId = entity.SchoolId,
            SchoolName = schoolName,
            Name = entity.Name,
            Code = entity.Code,
            Status = entity.Status,
            City = entity.City,
            District = entity.District,
            Phone = entity.Phone,
            ManagerName = entity.ManagerName,
            Capacity = entity.Capacity,
            CurrentStudents = entity.CurrentStudents,
            Latitude = entity.Latitude,
            Longitude = entity.Longitude,
            Notes = entity.Notes
        };
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct)
    {
        var entity = await _db.Branches.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return false;

        _db.Branches.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static string NormalizeStatus(string? status)
    {
        var s = (status ?? "Active").Trim();
        return s.Equals("Inactive", StringComparison.OrdinalIgnoreCase) ? "Inactive" : "Active";
    }
}
