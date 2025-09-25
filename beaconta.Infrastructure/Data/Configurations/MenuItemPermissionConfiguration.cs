using beaconta.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace beaconta.Infrastructure.Data.Configurations
{
    public class MenuItemPermissionConfiguration : IEntityTypeConfiguration<MenuItemPermission>
    {
        public void Configure(EntityTypeBuilder<MenuItemPermission> b)
        {
            b.ToTable("MenuItemPermissions");
            b.HasKey(x => new { x.MenuItemId, x.PermissionId });
        }
    }
}
