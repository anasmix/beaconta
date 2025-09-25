namespace beaconta.Domain.Entities
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }

        // لا تعطيها قيمة افتراضية هنا نهائيًا!
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;

        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
    }
}
