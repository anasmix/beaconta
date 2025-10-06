// Infrastructure/Data/Configurations/YearConfiguration.cs
using beaconta.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class YearConfiguration : IEntityTypeConfiguration<Year>
{
    public void Configure(EntityTypeBuilder<Year> b)
    {
        b.Property(x => x.Code).HasMaxLength(32);
        b.Property(x => x.Name).HasMaxLength(128);
        b.Property(x => x.ColorHex).HasMaxLength(9); // #RRGGBBAA
        b.Property(x => x.Notes).HasMaxLength(1024);

        // خزن الحالة كنص لتقليل الالتباس
        // b.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        b.Property(x => x.Status);


        // فهارس
        b.HasIndex(x => new { x.BranchId, x.IsActive });
        b.HasIndex(x => new { x.BranchId, x.StartDate, x.EndDate });

        // اختياري: كود فريد لكل فرع
        b.HasIndex(x => new { x.BranchId, x.Code }).IsUnique().HasFilter("[Code] IS NOT NULL");

        // *مهم*: سنة فعالة واحدة لكل فرع — Unique Filtered Index (SQL Server):
        b.HasIndex(x => new { x.BranchId, x.IsActive })
         .IsUnique()
         .HasFilter("[IsActive] = 1");
    }
}
