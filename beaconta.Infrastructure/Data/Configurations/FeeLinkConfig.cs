using beaconta.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace beaconta.Infrastructure.Data.Configurations
{
    public class FeeLinkConfig : IEntityTypeConfiguration<FeeLink>
    {
        public void Configure(EntityTypeBuilder<FeeLink> e)
        {
            e.ToTable("FeeLinks", "dbo");
            e.HasKey(x => x.Id);

            e.Property(x => x.Status)
             .HasMaxLength(20)
             .HasDefaultValue("Draft");

            // DateOnly? <-> date
            e.Property(x => x.EffectiveFrom)
             .HasConversion(
                 v => v.HasValue ? v.Value.ToDateTime(TimeOnly.MinValue) : (DateTime?)null,
                 v => v.HasValue ? DateOnly.FromDateTime(v.Value) : (DateOnly?)null
             )
             .HasColumnType("date");

            e.HasIndex(x => new { x.GradeYearId, x.SectionYearId });
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.EffectiveFrom);
        }
    }
}
