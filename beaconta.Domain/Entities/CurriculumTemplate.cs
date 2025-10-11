namespace beaconta.Domain.Entities
{
    public class CurriculumTemplate : BaseEntity
    {
        public int Id { get; set; }
        public string TemplateCode { get; set; } = default!;
        public string Name { get; set; } = default!;
        public int? YearId { get; set; }
        public Year? Year { get; set; }   // ← هذه السطر يحل خطأ Year navigation
    }
}
