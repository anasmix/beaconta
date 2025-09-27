using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace beaconta.Domain.Entities
{
    public abstract class BaseEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
         
        public int Id { get; set; }

        // لا تعطيها قيمة افتراضية هنا نهائيًا!
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;

        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
    }
}
