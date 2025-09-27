using System.Collections.Generic;

namespace beaconta.Domain.Entities
{
    public enum PermissionMatchMode { RequireAny = 0, RequireAll = 1 }

    public class MenuSection : BaseEntity
    {
        public string SectionKey { get; set; } = default!; // مثال: students, contracts, finance
        public string Title { get; set; } = default!;
        public string? Icon { get; set; }
        public int SortOrder { get; set; } = 0;

        public ICollection<MenuGroup> Groups { get; set; } = new List<MenuGroup>();
    }

    public class MenuGroup : BaseEntity
    {
        public int SectionId { get; set; }
        public MenuSection Section { get; set; } = default!;
        public string Title { get; set; } = default!;
        public int SortOrder { get; set; } = 0;

        public ICollection<MenuItem> Items { get; set; } = new List<MenuItem>();
    }

    public class MenuItem : BaseEntity
    {
        public int GroupId { get; set; }
        public MenuGroup Group { get; set; } = default!;

        public string ItemKey { get; set; } = default!;   // معرف منطقي للعنصر (يُستخدم في الفرونت)
        public string Title { get; set; } = default!;
        public string? Icon { get; set; }
        public string Url { get; set; } = "#";
        public int SortOrder { get; set; } = 0;

        public PermissionMatchMode MatchMode { get; set; } = PermissionMatchMode.RequireAny;

        public ICollection<MenuItemPermission> MenuItemPermissions { get; set; } = new List<MenuItemPermission>();
    }

    public class MenuItemPermission : BaseEntity
    {
        public int MenuItemId { get; set; }
        public MenuItem MenuItem { get; set; } = default!;

        public int PermissionId { get; set; }   // موجود في جدول DB
        public Permission Permission { get; set; } = default!;
    }



}
