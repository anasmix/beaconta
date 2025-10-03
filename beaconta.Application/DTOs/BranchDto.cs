namespace beaconta.Application.DTOs;

public class BranchDto
{
    public int Id { get; set; }
    public int SchoolId { get; set; }
    public string? SchoolName { get; set; }

    public string Name { get; set; } = default!;
    public string? Code { get; set; }
    public string Status { get; set; } = "Active";

    public string? City { get; set; }
    public string? District { get; set; }
    public string? Phone { get; set; }
    public string? ManagerName { get; set; }

    public int? Capacity { get; set; }
    public int? CurrentStudents { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public string? Notes { get; set; }
}
