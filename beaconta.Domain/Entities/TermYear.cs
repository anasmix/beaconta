namespace beaconta.Domain.Entities;

public class TermYear
{
    public int Id { get; set; }

    // FK إلى Year (السنة الأكاديمية)
    public int YearId { get; set; }
    public Year Year { get; set; } = null!;

    public string Name { get; set; } = null!;     // "الفصل الأول" .. إلخ
    public DateTime StartDate { get; set; }       // تاريخ البداية (DateOnly لو مشروعك يعتمدها)
    public DateTime EndDate { get; set; }         // تاريخ النهاية
    public string Status { get; set; } = "Active"; // Active | Inactive

    // أيام الدراسة الأسبوعية 0..6 محفوظة CSV "0,1,2,3,4"
    public string WeekdaysCsv { get; set; } = "0,1,2,3,4";

    // فترة الاختبارات النهائية (اختياري)
    public DateTime? ExamStart { get; set; }
    public DateTime? ExamEnd { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
