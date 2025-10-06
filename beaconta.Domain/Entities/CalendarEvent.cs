namespace beaconta.Domain.Entities;

public class CalendarEvent
{
    public int Id { get; set; }

    // FK إلى Year
    public int YearId { get; set; }
    public Year Year { get; set; } = null!;

    // Holiday | Exam | Orientation | Activity
    public string Type { get; set; } = "Holiday";
    public string Title { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
