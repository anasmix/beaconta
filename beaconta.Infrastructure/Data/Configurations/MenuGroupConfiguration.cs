using beaconta.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace beaconta.Infrastructure.Data.Configurations
{
    public class MenuGroupConfiguration : IEntityTypeConfiguration<MenuGroup>
    {
        public void Configure(EntityTypeBuilder<MenuGroup> b)
        {
            b.ToTable("MenuGroups");
            b.HasKey(x => x.Id);

            b.Property(x => x.Title).HasMaxLength(200).IsRequired();
            b.Property(x => x.SortOrder).HasDefaultValue(0);

            b.HasMany(x => x.Items)
             .WithOne(i => i.Group)
             .HasForeignKey(i => i.GroupId)
             .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
