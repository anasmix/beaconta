// Api/DTOs/GradeYearDtos.cs
namespace beaconta.Application.DTOs
{
    public class GradeYearFeeDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = "Tuition";
        public string? Name { get; set; }
        public decimal Amount { get; set; }
    }

    public class GradeYearDto
    {
        public int Id { get; set; }
        public int YearId { get; set; }
        public int SchoolId { get; set; }
        public int StageId { get; set; }
        public string Name { get; set; } = "";
        public string Shift { get; set; } = "Morning";
        public string Gender { get; set; } = "Mixed";
        public int Capacity { get; set; }
        public decimal Tuition { get; set; }
        public int SortOrder { get; set; }
        public string Status { get; set; } = "Active";
        public string? Notes { get; set; }
        public List<GradeYearFeeDto> Fees { get; set; } = new();
    }

    public class GradeYearUpsertDto
    {
        public int Id { get; set; } // 0 عند الإنشاء
        public int YearId { get; set; }
        public int SchoolId { get; set; }
        public int StageId { get; set; }
        public string Name { get; set; } = "";
        public string Shift { get; set; } = "Morning";
        public string Gender { get; set; } = "Mixed";
        public int Capacity { get; set; }
        public decimal Tuition { get; set; }
        public int SortOrder { get; set; }
        public string Status { get; set; } = "Active";
        public string? Notes { get; set; }
        public List<GradeYearFeeDto> Fees { get; set; } = new();
    }

    public class SectionYearDto
    {
        public int Id { get; set; }
        public int GradeYearId { get; set; }
        public string Name { get; set; } = "";
        public int Capacity { get; set; }
        public string? Teacher { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = "Active"; // Active/Inactive

    }

    public class SectionYearUpsertDto
    {
        public int Id { get; set; } // 0 عند الإنشاء
        public int GradeYearId { get; set; }
        public string Name { get; set; } = "";
        public int Capacity { get; set; }
        public string? Teacher { get; set; }
        public string? Notes { get; set; }

        public string Status { get; set; } = "Active";
    }

    public class CompareResponseDto
    {
        public TotalsDto A { get; set; } = new();
        public TotalsDto B { get; set; } = new();

        public class TotalsDto
        {
            public int Grades { get; set; }
            public int Sections { get; set; }
            public int Capacity { get; set; }
            public decimal Fees { get; set; }
        }
    }
}
