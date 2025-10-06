namespace beaconta.Application.DTOs;

public class StageUpsertDto
{
    public int Id { get; set; }                // 0 = create
    public string? Name { get; set; }
    public string? Code { get; set; }
    public int SortOrder { get; set; }
    public string? Status { get; set; }        // "Active" | "Inactive"
    public string? Notes { get; set; }
    public int? SchoolId { get; set; }

    // لو أردت دعم اللون مستقبلاً
    public string? ColorHex { get; set; }
}
