namespace beaconta.Domain.Entities
{
    public class Grade
    {
        public int Id { get; set; }
        public int? SchoolId { get; set; }
        public int? BranchId { get; set; }

        public int StageId { get; set; }
        public string GradeName { get; set; } = null!;
        public string? SectionName { get; set; }   // شعبة
        public string? Code { get; set; }

        public string? Shift { get; set; }         // Morning/Evening/Full
        public int? YearId { get; set; }

        public string Status { get; set; } = "Active"; // أو IsActive = bool
        public int Capacity { get; set; } = 0;

        public int? HomeroomTeacherId { get; set; }
        public int? SupervisorId { get; set; }
        public string? Notes { get; set; }
    }
}
