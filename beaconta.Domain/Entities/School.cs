using System.ComponentModel.DataAnnotations;

namespace beaconta.Domain.Entities
{
    public class School : BaseEntity
    {
        [MaxLength(200)]
        public string Name { get; set; } = default!;

        [MaxLength(50)]
        public string Code { get; set; } = default!;   // فريد اختياري

        [MaxLength(16)]
        public string Status { get; set; } = "Active"; // Active / Inactive

        [MaxLength(16)]
        public string? ColorHex { get; set; }

        public string? Notes { get; set; }

        public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    }
}
