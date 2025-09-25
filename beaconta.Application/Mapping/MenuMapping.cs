using beaconta.Application.DTOs;
using beaconta.Domain.Entities;
using System.Linq;

namespace beaconta.Application.Mapping
{
    public static class MenuMapping
    {
        public static MenuItemDto ToDto(this MenuItem e) => new MenuItemDto
        {
            ItemKey = e.ItemKey,
            Title = e.Title,
            Icon = e.Icon,
            Url = e.Url,
            SortOrder = e.SortOrder
        };

        public static MenuGroupDto ToDto(this MenuGroup e) => new MenuGroupDto
        {
            Title = e.Title,
            SortOrder = e.SortOrder,
            Items = e.Items
                         .OrderBy(i => i.SortOrder)
                         .Select(i => i.ToDto())
                         .ToList()
        };

        public static MenuSectionDto ToDto(this MenuSection e) => new MenuSectionDto
        {
            SectionKey = e.SectionKey,
            Title = e.Title,
            Icon = e.Icon,
            SortOrder = e.SortOrder,
            Groups = e.Groups
                          .OrderBy(g => g.SortOrder)
                          .Select(g => g.ToDto())
                          .ToList()
        };
    }
}
