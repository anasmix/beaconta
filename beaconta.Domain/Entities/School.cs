using beaconta.Domain.Entities;

namespace beaconta.Domain.Entities
{
    public class School : BaseEntity
    {
        public string Name { get; set; } = default!;
        public string Code { get; set; } = default!;
        public string Status { get; set; } = "Active";  // Active / Inactive
        public string? ColorHex { get; set; }
        public string? Notes { get; set; }
        public ICollection<Branch> Branches { get; set; } = new List<Branch>();

    }
}
