// beaconta.Domain/Entities/MenuAction.cs
namespace beaconta.Domain.Entities
{
    public class MenuAction : BaseEntity
    {
        public int MenuItemId { get; set; }
        public MenuItem MenuItem { get; set; } = default!;
        public string ActionKey { get; set; } = default!;    // مثل: create, update, delete, search, print
        public string Title { get; set; } = default!;        // نص عربي: إضافة، تعديل...
        public int SortOrder { get; set; } = 0;
    }
}
