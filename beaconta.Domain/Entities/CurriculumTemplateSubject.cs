// Domain/Entities/CurriculumTemplateSubject.cs
namespace beaconta.Domain.Entities
{
    public class CurriculumTemplateSubject : BaseEntity
    {
        public int Id { get; set; }        // يمكن جعله مركّب (TemplateId+SubjectId) إذا رغبت
        public int TemplateId { get; set; }
        public int SubjectId { get; set; }

        public CurriculumTemplate Template { get; set; } = null!;
        public Subject Subject { get; set; } = null!;
    }
}

// Domain/Entities/CurriculumAssignment.cs
namespace beaconta.Domain.Entities
{
    public class CurriculumAssignment : BaseEntity
    {
        public int Id { get; set; }
        public int GradeYearId { get; set; }
        public int TemplateId { get; set; }

        public GradeYear GradeYear { get; set; } = null!;
        public CurriculumTemplate Template { get; set; } = null!;
    }
}
