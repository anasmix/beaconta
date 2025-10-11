namespace beaconta.Domain.Entities
{
    public class FeeBundle : BaseEntity
    {
        public int Id { get; set; }
        public string BundleCode { get; set; } = default!;
        public string Name { get; set; } = default!;
        public string? Desc { get; set; }
        public ICollection<FeeBundleItem> Items { get; set; } = new List<FeeBundleItem>();
    }

    public class FeeBundleItem : BaseEntity
    {
        public int Id { get; set; }
        public int FeeBundleId { get; set; }
        public FeeBundle Bundle { get; set; } = default!;
        public string ItemCode { get; set; } = default!;  // FK منطقي لـ FeeItemCatalog.ItemCode
        public decimal Amount { get; set; }
        public string Repeat { get; set; } = "once";      // once/monthly/term/yearly
        public bool Optional { get; set; }
        public string? Note { get; set; }
    }
}
