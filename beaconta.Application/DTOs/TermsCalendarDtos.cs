namespace beaconta.Application.DTOs;

// ===== Year (للمواءمة مع الواجهة الحالية) =====
public record YearMinDto(int Id, string Name, int BranchId, string? ColorHex, bool IsActive, DateTime? StartDate, DateTime? EndDate);

// ===== Term =====
public record TermYearDto(
    int Id, int YearId, string Name, DateTime StartDate, DateTime EndDate,
    string WeekdaysCsv, string Status, DateTime? ExamStart, DateTime? ExamEnd, string? Notes);

public record TermYearUpsertDto
{
    public int? Id { get; set; }
    public int YearId { get; set; }
    public string Name { get; set; } = "";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string WeekdaysCsv { get; set; } = "0,1,2,3,4";
    public string Status { get; set; } = "Active";
    public DateTime? ExamStart { get; set; }
    public DateTime? ExamEnd { get; set; }
    public string? Notes { get; set; }
}

// ===== Event =====
public record CalendarEventDto(int Id, int YearId, string Type, string Title, DateTime StartDate, DateTime EndDate, string? Notes);

public record CalendarEventUpsertDto
{
    public int? Id { get; set; }
    public int YearId { get; set; }
    public string Type { get; set; } = "Holiday";
    public string Title { get; set; } = "";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Notes { get; set; }
}
