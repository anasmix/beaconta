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

            // ✅ استخدم Id من BaseEntity كمفتاح أساسي
            b.HasKey(x => x.Id);

            b.Property(x => x.PermissionKey)
                .IsRequired()
                .HasMaxLength(200);

            // ✅ منع التكرار على نفس العنصر ونفس المفتاح
            b.HasIndex(x => new { x.MenuItemId, x.PermissionKey }).IsUnique();

            b.HasOne(x => x.MenuItem)
                .WithMany(i => i.MenuItemPermissions)
                .HasForeignKey(x => x.MenuItemId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
