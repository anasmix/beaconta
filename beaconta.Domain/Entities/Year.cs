// Domain/Entities/Year.cs
namespace beaconta.Domain.Entities
{
    public enum YearStatus { Open, ClosedAcademic, Closed, Archived }

    public class Year : BaseEntity
    {
        public int Id { get; set; }
        public string? Code { get; set; }
        public string? Name { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; }

        public int BranchId { get; set; }
        public YearStatus Status { get; set; } = YearStatus.Open;
        public string? ColorHex { get; set; }
        public string? Notes { get; set; }
        public int? FinanceBackPostDays { get; set; }
        public bool AllowPaymentsOnClosedAcademic { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
    }
}
