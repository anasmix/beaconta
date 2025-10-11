namespace beaconta.Domain.Entities
{
    public class FeeItemCatalog : BaseEntity
    {
        public int Id { get; set; }
        public string ItemCode { get; set; } = default!;
        public string Name { get; set; } = default!;
    }
}
