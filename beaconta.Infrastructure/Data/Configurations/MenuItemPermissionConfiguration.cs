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

            // المفتاح الأساسي: MenuItemId + PermissionKey
            b.HasKey(x => new { x.MenuItemId, x.PermissionKey });

            b.Property(x => x.PermissionKey)
                .IsRequired()
                .HasMaxLength(200);
        }
    }
}
