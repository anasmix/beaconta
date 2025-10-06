using beaconta.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class GradeYearConfiguration : IEntityTypeConfiguration<GradeYear>
{
    public void Configure(EntityTypeBuilder<GradeYear> b)
    {
        b.Property(x => x.Name).HasMaxLength(120).IsRequired();
        b.Property(x => x.Shift).HasMaxLength(16);
        b.Property(x => x.Gender).HasMaxLength(16);
        b.Property(x => x.Status).HasMaxLength(16);

        b.HasIndex(x => new { x.YearId, x.SchoolId, x.StageId, x.Name }).IsUnique();

        b.HasMany(x => x.Sections)
         .WithOne(s => s.GradeYear!)
         .HasForeignKey(s => s.GradeYearId)
         .OnDelete(DeleteBehavior.Cascade);

        b.HasMany(x => x.Fees)
         .WithOne(f => f.GradeYear!)
         .HasForeignKey(f => f.GradeYearId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}
