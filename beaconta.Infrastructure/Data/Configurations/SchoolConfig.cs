using beaconta.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace beaconta.Infrastructure.Data.Configurations
{
    public class SchoolConfig : IEntityTypeConfiguration<School>
    {
        public void Configure(EntityTypeBuilder<School> b)
        {
            b.ToTable("Schools");
            b.HasKey(x => x.Id);

            b.Property(x => x.Name).HasMaxLength(200).IsRequired();
            b.Property(x => x.Code).HasMaxLength(50);
            b.Property(x => x.Status).HasMaxLength(16).HasDefaultValue("Active");
            b.Property(x => x.ColorHex).HasMaxLength(16);

            // كود فريد عند عدم كونه NULL أو ''
            b.HasIndex(x => x.Code).IsUnique()
             .HasFilter("[Code] IS NOT NULL AND [Code] <> ''");
        }
    }
}
