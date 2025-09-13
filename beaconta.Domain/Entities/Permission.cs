namespace beaconta.Domain.Entities
{
    public class Permission : BaseEntity
    { 
        public string Key { get; set; } = string.Empty;      // مثل: students.view
        public string Name { get; set; } = string.Empty;     // مثل: عرض الطلاب
        public string Category { get; set; } = string.Empty; // مثل: الطلاب
    }
}
