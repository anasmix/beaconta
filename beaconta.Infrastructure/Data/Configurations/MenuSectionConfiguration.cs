using beaconta.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace beaconta.Infrastructure.Data.Configurations
{
    public class MenuSectionConfiguration : IEntityTypeConfiguration<MenuSection>
    {
        public void Configure(EntityTypeBuilder<MenuSection> b)
        {
            b.ToTable("MenuSections");
            b.HasKey(x => x.Id);

            b.Property(x => x.SectionKey).HasMaxLength(100).IsRequired();
            b.HasIndex(x => x.SectionKey).IsUnique();

            b.Property(x => x.Title).HasMaxLength(200).IsRequired();
            b.Property(x => x.Icon).HasMaxLength(100);
            b.Property(x => x.SortOrder).HasDefaultValue(0);

            b.HasMany(x => x.Groups)
             .WithOne(g => g.Section)
             .HasForeignKey(g => g.SectionId)
             .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
