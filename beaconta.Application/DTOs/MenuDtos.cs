namespace beaconta.Application.DTOs
{
    public sealed class MenuItemDto
    {
        public string ItemKey { get; set; } = default!;
        public string Title { get; set; } = default!;
        public string? Icon { get; set; }
        public string Url { get; set; } = "#";
        public int SortOrder { get; set; }
    }

    public sealed class MenuGroupDto
    {
        public string Title { get; set; } = default!;
        public int SortOrder { get; set; }
        public List<MenuItemDto> Items { get; set; } = new();
    }

    public sealed class MenuSectionDto
    {
        public string SectionKey { get; set; } = default!;
        public string Title { get; set; } = default!;
        public string? Icon { get; set; }
        public int SortOrder { get; set; }
        public List<MenuGroupDto> Groups { get; set; } = new();
    }
}
