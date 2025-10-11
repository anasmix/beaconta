using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data.Configurations;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Data
{
    public class BeacontaDb : DbContext
    {
        private readonly ICurrentUserService _currentUser;

        public BeacontaDb(DbContextOptions<BeacontaDb> options, ICurrentUserService currentUser)
            : base(options)
        {
            _currentUser = currentUser;
        }

        // ===== DbSets =====
        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();
        public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
        public DbSet<Permission> Permissions => Set<Permission>();

        public DbSet<MenuSection> MenuSections => Set<MenuSection>();
        public DbSet<MenuGroup> MenuGroups => Set<MenuGroup>();
        public DbSet<MenuItem> MenuItems => Set<MenuItem>();
        public DbSet<MenuItemPermission> MenuItemPermissions => Set<MenuItemPermission>();

        public DbSet<School> Schools => Set<School>();
        public DbSet<Branch> Branches => Set<Branch>();
        public DbSet<Stage> Stages => Set<Stage>();
        public DbSet<Grade> Grades => Set<Grade>();
        public DbSet<Year> Years => Set<Year>();

        public DbSet<TermYear> TermYears => Set<TermYear>();
        public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();

        public DbSet<GradeYear> GradeYears => Set<GradeYear>();
        public DbSet<GradeYearFee> GradeYearFees => Set<GradeYearFee>();
        public DbSet<SectionYear> SectionYears => Set<SectionYear>();

        public DbSet<Subject> Subjects => Set<Subject>();

        public DbSet<FeeItemCatalog> FeeItems => Set<FeeItemCatalog>();
        public DbSet<FeeBundle> FeeBundles => Set<FeeBundle>();
        public DbSet<FeeBundleItem> FeeBundleItems => Set<FeeBundleItem>();
        public DbSet<FeeLink> FeeLinks => Set<FeeLink>();

        public DbSet<CurriculumTemplate> CurriculumTemplates => Set<CurriculumTemplate>();
        public DbSet<CurriculumTemplateSubject> CurriculumTemplateSubjects => Set<CurriculumTemplateSubject>();
        public DbSet<CurriculumAssignment> CurriculumAssignments => Set<CurriculumAssignment>();


        // ===== Model Creating =====
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ===== Curriculum Template =====
            modelBuilder.Entity<CurriculumTemplate>(e =>
            {
                e.ToTable("CurriculumTemplates");
                e.HasKey(x => x.Id);
                e.Property(x => x.TemplateCode).IsRequired().HasMaxLength(64);
                e.Property(x => x.Name).IsRequired().HasMaxLength(256);

                // مطابق للفهرس الذي أنشأته الهجرة (Filtered Unique Index)
                e.HasIndex(x => new { x.TemplateCode, x.YearId })
                 .IsUnique()
                 .HasFilter("[YearId] IS NOT NULL");

                e.HasOne(x => x.Year)
                 .WithMany()
                 .HasForeignKey(x => x.YearId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<CurriculumTemplateSubject>(e =>
            {
                e.ToTable("CurriculumTemplateSubjects");
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.TemplateId, x.SubjectId }).IsUnique();

                e.HasOne(x => x.Template)
                 .WithMany()
                 .HasForeignKey(x => x.TemplateId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.Subject)
                 .WithMany()
                 .HasForeignKey(x => x.SubjectId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CurriculumAssignment>(e =>
            {
                e.ToTable("CurriculumAssignments");
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.GradeYearId, x.TemplateId }).IsUnique();

                e.HasOne(x => x.GradeYear)
                 .WithMany()
                 .HasForeignKey(x => x.GradeYearId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.Template)
                 .WithMany()
                 .HasForeignKey(x => x.TemplateId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // يلتقط كل IEntityTypeConfiguration<> الموجودة بالتجميع
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(BeacontaDb).Assembly);

            // صريحة (اختياري)
            modelBuilder.ApplyConfiguration(new SchoolConfig());
            // modelBuilder.ApplyConfiguration(new FeeLinkConfig());

            // ===== Precision & Monetary =====
            modelBuilder.Entity<FeeBundleItem>()
                .Property(x => x.Amount).HasPrecision(18, 2);

            modelBuilder.Entity<GradeYear>()
                .Property(x => x.Tuition).HasPrecision(18, 2);

            // GradeYearFee (تعريف العلاقة هنا فقط — لا نكررها في GradeYear)
            modelBuilder.Entity<GradeYearFee>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Amount).HasPrecision(18, 2);

                e.HasOne(x => x.GradeYear)
                 .WithMany(g => g.Fees)
                 .HasForeignKey(x => x.GradeYearId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ===== SectionYear =====
            modelBuilder.Entity<SectionYear>(e =>
            {
                e.Property(x => x.Status)
                 .HasMaxLength(20)
                 .HasDefaultValue("Active");

                e.HasIndex(x => new { x.GradeYearId, x.Name }).IsUnique();
            });

            // ===== Year =====
            modelBuilder.Entity<Year>(e =>
            {
                e.HasIndex(x => x.IsActive);
                e.HasIndex(x => x.StartDate);

                e.ToTable("Years", "dbo");
                e.HasKey(x => x.Id);

                e.Property(x => x.Code).HasMaxLength(50);
                e.Property(x => x.Name).HasMaxLength(120);
                e.Property(x => x.IsActive).HasDefaultValue(true);
                e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            // ===== TermYear =====
            modelBuilder.Entity<TermYear>(e =>
            {
                e.ToTable("TermYears");
                e.Property(x => x.Name).HasMaxLength(120).IsRequired();
                e.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("Active");
                e.Property(x => x.WeekdaysCsv).HasMaxLength(32).HasDefaultValue("0,1,2,3,4");

                e.HasOne(x => x.Year)
                 .WithMany()
                 .HasForeignKey(x => x.YearId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasIndex(x => new { x.YearId, x.StartDate, x.EndDate });
            });

            // ===== CalendarEvent =====
            modelBuilder.Entity<CalendarEvent>(e =>
            {
                e.ToTable("CalendarEvents");
                e.Property(x => x.Type).HasMaxLength(32).IsRequired();
                e.Property(x => x.Title).HasMaxLength(200).IsRequired();

                e.HasOne(x => x.Year)
                 .WithMany()
                 .HasForeignKey(x => x.YearId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasIndex(x => new { x.YearId, x.StartDate, x.EndDate });
            });

            // ===== School / Stage / GradeYear =====
            modelBuilder.Entity<School>().Property(x => x.Name).HasMaxLength(120).IsRequired();
            modelBuilder.Entity<School>().Property(x => x.Code).HasMaxLength(32);

            modelBuilder.Entity<Stage>().Property(x => x.Name).HasMaxLength(120).IsRequired();
            modelBuilder.Entity<Stage>().Property(x => x.Code).HasMaxLength(16);

            modelBuilder.Entity<GradeYear>().Property(x => x.Name).HasMaxLength(120).IsRequired();
            modelBuilder.Entity<GradeYear>().Property(x => x.Shift).HasMaxLength(16);
            modelBuilder.Entity<GradeYear>().Property(x => x.Gender).HasMaxLength(16);
            modelBuilder.Entity<GradeYear>().Property(x => x.Status).HasMaxLength(16);

            // (أُزيل التكرار هنا) — لا تعرّف العلاقة مع Fees مرة أخرى في GradeYear

            // ===== RolePermission =====
            modelBuilder.Entity<RolePermission>(e =>
            {
                e.HasKey(rp => rp.Id);

                e.HasOne(rp => rp.Role)
                 .WithMany(r => r.RolePermissions)
                 .HasForeignKey(rp => rp.RoleId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(rp => rp.Permission)
                 .WithMany(p => p.RolePermissions)
                 .HasForeignKey(rp => rp.PermissionId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasIndex(rp => new { rp.RoleId, rp.PermissionId }).IsUnique();
            });

            // ===== Permission =====
            modelBuilder.Entity<Permission>(e =>
            {
                e.Property(p => p.Key).HasMaxLength(128).IsRequired();
                e.Property(p => p.Name).HasMaxLength(200).IsRequired();
                e.Property(p => p.Category).HasMaxLength(100).IsRequired();
                e.HasIndex(p => p.Key).IsUnique();
            });

            // ===== Role =====
            modelBuilder.Entity<Role>(e =>
            {
                e.Property(r => r.Name).HasMaxLength(100).IsRequired();
                e.Property(r => r.Key).HasMaxLength(100);
                e.HasIndex(r => r.Name).IsUnique();
                e.HasIndex(r => r.Key).IsUnique();
            });

            // ===== MenuItemPermission =====
            modelBuilder.Entity<MenuItemPermission>(e =>
            {
                e.HasIndex(mip => new { mip.MenuItemId, mip.PermissionId }).IsUnique();
            });
        }

        // ===== Audit =====
        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var username = _currentUser.Username ?? "system";
            var utcNow = DateTime.UtcNow;

            var entries = ChangeTracker.Entries<BaseEntity>();
            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = utcNow;
                    entry.Entity.CreatedBy = username;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = utcNow;
                    entry.Entity.UpdatedBy = username;
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
