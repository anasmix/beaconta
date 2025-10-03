namespace beaconta.Domain.Entities
{
    public class Stage
    {
        public int Id { get; set; }
        public int? SchoolId { get; set; }
        public int? BranchId { get; set; }
        public string Name { get; set; } = null!;
        public string? Code { get; set; }
        public string? Color { get; set; }
        public int SortOrder { get; set; }
        public string Status { get; set; } = "Active"; // أو بدّلها لـ IsActive = bool إذا سكيماك كذا
        public string? Shift { get; set; }             // Morning/Evening/Full
        public string? Notes { get; set; }
    }
}
