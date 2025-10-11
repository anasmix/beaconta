// SubjectConfiguration.cs
using beaconta.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> e)
    {
        e.ToTable("Subjects");
        e.Property(x => x.Code).HasMaxLength(16).IsRequired();
        e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        e.Property(x => x.Note).HasMaxLength(400);
        e.HasIndex(x => x.Code).IsUnique();
    }
}

// FeeItemCatalogConfiguration.cs
public class FeeItemCatalogConfiguration : IEntityTypeConfiguration<FeeItemCatalog>
{
    public void Configure(EntityTypeBuilder<FeeItemCatalog> e)
    {
        e.ToTable("FeeItemCatalog");
        e.Property(x => x.ItemCode).HasMaxLength(16).IsRequired();
        e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        e.HasIndex(x => x.ItemCode).IsUnique();
    }
}

// FeeBundleConfiguration.cs
public class FeeBundleConfiguration : IEntityTypeConfiguration<FeeBundle>
{
    public void Configure(EntityTypeBuilder<FeeBundle> e)
    {
        e.ToTable("FeeBundles");
        e.Property(x => x.BundleCode).HasMaxLength(16).IsRequired();
        e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        e.Property(x => x.Desc).HasMaxLength(400);
        e.HasIndex(x => x.BundleCode).IsUnique();

        e.HasMany(x => x.Items)
         .WithOne(i => i.Bundle)
         .HasForeignKey(i => i.FeeBundleId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}

public class FeeBundleItemConfiguration : IEntityTypeConfiguration<FeeBundleItem>
{
    public void Configure(EntityTypeBuilder<FeeBundleItem> e)
    {
        e.ToTable("FeeBundleItems");
        e.Property(x => x.ItemCode).HasMaxLength(16).IsRequired();
        e.Property(x => x.Repeat).HasMaxLength(16).HasDefaultValue("once");
        e.Property(x => x.Note).HasMaxLength(400);
    }
}

public class CurriculumTemplateConfiguration : IEntityTypeConfiguration<CurriculumTemplate>
{
    public void Configure(EntityTypeBuilder<CurriculumTemplate> e)
    {
        e.ToTable("CurriculumTemplates");
        e.Property(x => x.TemplateCode).HasMaxLength(32).IsRequired();
        e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        e.HasIndex(x => x.TemplateCode).IsUnique();

        e.HasOne(x => x.Year)
         .WithMany()
         .HasForeignKey(x => x.YearId)
         .OnDelete(DeleteBehavior.SetNull);
    }
}

public class FeeLinkConfiguration : IEntityTypeConfiguration<FeeLink>
{
    public void Configure(EntityTypeBuilder<FeeLink> e)
    {
        e.ToTable("FeeLinks");
        e.Property(x => x.Status).HasMaxLength(16).HasDefaultValue("Draft");

        e.Property(x => x.SchoolName).HasMaxLength(200);
        e.Property(x => x.YearName).HasMaxLength(120);
        e.Property(x => x.StageName).HasMaxLength(120);
        e.Property(x => x.GradeYearName).HasMaxLength(120);
        e.Property(x => x.SectionName).HasMaxLength(120);
        e.Property(x => x.SubjectName).HasMaxLength(200);
        e.Property(x => x.BundleName).HasMaxLength(200);

        // منع تكرار نفس الربط على نفس المستوى والمادة
        e.HasIndex(x => new { x.GradeYearId, x.SectionYearId, x.SubjectId }).IsUnique();
    }
}
