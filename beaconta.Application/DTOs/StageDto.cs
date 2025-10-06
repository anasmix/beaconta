namespace beaconta.Application.DTOs;

public class StageDto
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Code { get; set; }
    public int SortOrder { get; set; }
    public string? Status { get; set; }  // "Active" | "Inactive"
    public string? Notes { get; set; }
    public int? SchoolId { get; set; }

    // اختيارية للواجهة: إن لم تكن موجودة في الـEntity تترك null
    public string? SchoolName { get; set; }
    public string? ColorHex { get; set; }
}
