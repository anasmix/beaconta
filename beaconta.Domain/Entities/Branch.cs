// beaconta.Domain/Entities/Branch.cs
namespace beaconta.Domain.Entities;

public class Branch
{
    public int Id { get; set; }

    // FK
    public int SchoolId { get; set; }

    // أساسية
    public string Name { get; set; } = default!;
    public string? Code { get; set; }
    public string Status { get; set; } = "Active";  // Active/Inactive
    public string? ColorHex { get; set; }           // مثل "#0d6efd"

    // عنوان وموقع
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public double? Latitude { get; set; }           // موقع اختياري
    public double? Longitude { get; set; }

    // تشغيل
    public string? Phone { get; set; }
    public string? ManagerName { get; set; }

    // سعة وطلبة
    public int? Capacity { get; set; }              // الطاقة الاستيعابية
    public int? CurrentStudents { get; set; }       // عدد الطلاب الحاليين

    public string? Notes { get; set; }

    // طوابع زمنية
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public School? School { get; set; }
}
