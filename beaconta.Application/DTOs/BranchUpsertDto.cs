using System.ComponentModel.DataAnnotations;

namespace beaconta.Application.DTOs;

public class BranchUpsertDto
{
    public int Id { get; set; }

    [Required]
    public int SchoolId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    [MaxLength(50)]
    public string? Code { get; set; }

    [Required, MaxLength(20)]
    public string Status { get; set; } = "Active";

    [MaxLength(120)]
    public string? City { get; set; }

    [MaxLength(120)]
    public string? District { get; set; }

    [MaxLength(40)]
    public string? Phone { get; set; }

    [MaxLength(120)]
    public string? ManagerName { get; set; }

    public int? Capacity { get; set; }
    public int? CurrentStudents { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}
