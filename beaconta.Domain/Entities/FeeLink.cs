namespace beaconta.Domain.Entities
{
    public class FeeLink : BaseEntity
    {
        public int Id { get; set; }

        // المفاتيح الدنيا للمستوى
        public int GradeYearId { get; set; }
        public int SectionYearId { get; set; }

        // الربط
        public int SubjectId { get; set; }
        public int FeeBundleId { get; set; }

        public DateOnly? EffectiveFrom { get; set; }
        public string Status { get; set; } = "Draft";

        // حقول كاش للعرض السريع (اختيارية)
        public string? SchoolName { get; set; }
        public string? YearName { get; set; }
        public string? StageName { get; set; }
        public string? GradeYearName { get; set; }
        public string? SectionName { get; set; }
        public string? SubjectName { get; set; }
        public string? BundleName { get; set; }
    }
}
