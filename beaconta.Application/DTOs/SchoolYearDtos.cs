namespace beaconta.Application.DTOs
{
    public sealed class CurrentSchoolYearDto
    {
        public int SchoolId { get; init; }
        public string SchoolName { get; init; } = "";
        public int YearId { get; init; }
        public string YearName { get; init; } = "";
        public DateOnly? StartDate { get; init; }
        public DateOnly? EndDate { get; init; }
        public bool IsActive { get; init; }
        public int BranchId { get; init; }
        public string? BranchName { get; init; }
    }
}
