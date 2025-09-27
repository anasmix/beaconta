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

            // ✅ العلاقة مع MenuItem
            b.HasOne(x => x.MenuItem)
                .WithMany(i => i.MenuItemPermissions)
                .HasForeignKey(x => x.MenuItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ العلاقة الجديدة مع Permission
            b.HasOne(x => x.Permission)
                .WithMany()
                .HasForeignKey(x => x.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ منع التكرار على نفس العنصر ونفس الصلاحية
            b.HasIndex(x => new { x.MenuItemId, x.PermissionId }).IsUnique();
        }
    }
}
