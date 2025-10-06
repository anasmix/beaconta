using beaconta.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class SectionYearConfiguration : IEntityTypeConfiguration<SectionYear>
{
    public void Configure(EntityTypeBuilder<SectionYear> b)
    {
        b.Property(x => x.Name).HasMaxLength(50).IsRequired();
        b.Property(x => x.Teacher).HasMaxLength(120);
        b.Property(x => x.Notes).HasMaxLength(1024);
        b.Property(x => x.Status).HasMaxLength(16);

        b.HasIndex(x => new { x.GradeYearId, x.Name }).IsUnique();
    }
}
