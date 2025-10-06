// Domain/Entities/GradeYear.cs
namespace beaconta.Domain.Entities
{
    public class GradeYear : BaseEntity
    {
        public int Id { get; set; }
        public int YearId { get; set; }
        public int SchoolId { get; set; }
        public int StageId { get; set; }

        public string Name { get; set; } = string.Empty; // اسم الصف
        public string Shift { get; set; } = "Morning";   // Morning/Evening
        public string Gender { get; set; } = "Mixed";    // Mixed/Boys/Girls

        public int Capacity { get; set; } = 0;
        public decimal Tuition { get; set; } = 0m;

        public int SortOrder { get; set; } = 0;
        public string Status { get; set; } = "Active";   // Active/Inactive
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }

        public ICollection<GradeYearFee> Fees { get; set; } = new List<GradeYearFee>();
        public ICollection<SectionYear> Sections { get; set; } = new List<SectionYear>();
    }

    public class GradeYearFee : BaseEntity
    {
        public int Id { get; set; }
        public int GradeYearId { get; set; }
        public string Type { get; set; } = "Tuition"; // Tuition/Books/Transport/...
        public string? Name { get; set; }
        public decimal Amount { get; set; } = 0m;

        public GradeYear? GradeYear { get; set; }
    }

    public class SectionYear : BaseEntity
    {
        public int Id { get; set; }
        public int GradeYearId { get; set; }

        public string Name { get; set; } = string.Empty; // أ/ب/ج ...
        public int Capacity { get; set; } = 0;
        public string? Teacher { get; set; }
        public string? Notes { get; set; }

        public GradeYear? GradeYear { get; set; }
        public string Status { get; set; } = "Active"; // Active | Inactive
        public DateTime? UpdatedAt { get; set; }

    }
}
