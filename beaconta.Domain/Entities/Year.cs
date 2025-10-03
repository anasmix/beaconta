namespace beaconta.Domain.Entities
{
    public class Year : BaseEntity
    {
        public int Id { get; set; }
        public string? Code { get; set; }          // مثل Y2026
        public string? Name { get; set; }          // مثل 2025/2026
        public DateTime? StartDate { get; set; }   // اختياري
        public DateTime? EndDate { get; set; }     // اختياري
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
    }
}
