// Subject.cs
namespace beaconta.Domain.Entities
{
    public class Subject : BaseEntity
    {
        public int Id { get; set; }
        public string Code { get; set; } = default!;
        public string Name { get; set; } = default!;
        public int Hours { get; set; }
        public string? Note { get; set; }
    }
}
