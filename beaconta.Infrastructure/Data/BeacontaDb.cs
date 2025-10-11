//using beaconta.Application.Interfaces;
//using beaconta.Domain.Entities;
//using beaconta.Infrastructure.Data.Configurations;
//using Microsoft.EntityFrameworkCore;

//namespace beaconta.Infrastructure.Data
//{
//    public class BeacontaDb : DbContext
//    {
//        private readonly ICurrentUserService _currentUser;

//        public BeacontaDb(DbContextOptions<BeacontaDb> options, ICurrentUserService currentUser)
//            : base(options)
//        {
//            _currentUser = currentUser;
//        }

//        public DbSet<User> Users => Set<User>();
//        public DbSet<Role> Roles => Set<Role>();
//        public DbSet<UserRole> UserRoles => Set<UserRole>(); 
//        public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

//        public DbSet<MenuSection> MenuSections => Set<MenuSection>();
//        public DbSet<MenuGroup> MenuGroups => Set<MenuGroup>();
//        public DbSet<MenuItem> MenuItems => Set<MenuItem>();
//        public DbSet<MenuItemPermission> MenuItemPermissions => Set<MenuItemPermission>();
//        public DbSet<Permission> Permissions { get; set; }
//        public DbSet<School> Schools { get; set; }
//        public DbSet<Stage> Stages => Set<Stage>();
//        public DbSet<Grade> Grades => Set<Grade>();
//        public DbSet<Year> Years => Set<Year>();   // 👈 هذا المطلوب
//        public DbSet<Branch> Branches => Set<Branch>();

//        public DbSet<TermYear> TermYears => Set<TermYear>();
//        public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
//        public DbSet<GradeYear> GradeYears => Set<GradeYear>();
//        public DbSet<GradeYearFee> GradeYearFees => Set<GradeYearFee>();
//        public DbSet<SectionYear> SectionYears => Set<SectionYear>();


//        public DbSet<Subject> Subjects => Set<Subject>();
//        public DbSet<FeeItemCatalog> FeeItems => Set<FeeItemCatalog>();
//        public DbSet<FeeBundle> FeeBundles => Set<FeeBundle>();
//        public DbSet<FeeBundleItem> FeeBundleItems => Set<FeeBundleItem>();
//        public DbSet<CurriculumTemplate> CurriculumTemplates => Set<CurriculumTemplate>();
//        public DbSet<FeeLink> FeeLinks => Set<FeeLink>();



//        protected override void OnModelCreating(ModelBuilder modelBuilder)
//        {
//            base.OnModelCreating(modelBuilder);

//            modelBuilder.ApplyConfigurationsFromAssembly(typeof(BeacontaDb).Assembly);

//            modelBuilder.ApplyConfiguration(new SchoolConfig());

//            // ------- UserRole -------
//            modelBuilder.Entity<UserRole>()
//                .HasKey(ur => ur.Id);

//            modelBuilder.Entity<UserRole>()
//                .HasOne(ur => ur.User)
//                .WithMany(u => u.UserRoles)
//                .HasForeignKey(ur => ur.UserId);

//            modelBuilder.Entity<UserRole>()
//                .HasOne(ur => ur.Role)
//                .WithMany(r => r.UserRoles)
//                .HasForeignKey(ur => ur.RoleId);

//            modelBuilder.Entity<UserRole>()
//                .HasIndex(ur => new { ur.UserId, ur.RoleId })
//                .IsUnique();


//            // BeacontaDb.OnModelCreating
//            modelBuilder.Entity<FeeBundleItem>()
//                .Property(x => x.Amount)
//                .HasPrecision(18, 2);

//            modelBuilder.Entity<GradeYear>()
//                .Property(x => x.Tuition)
//                .HasPrecision(18, 2);

//            modelBuilder.Entity<GradeYearFee>()
//                .Property(x => x.Amount)
//                .HasPrecision(18, 2);


//            modelBuilder.Entity<SectionYear>(e =>
//            {
//                e.Property(x => x.Status)
//                 .HasMaxLength(20)
//                 .HasDefaultValue("Active"); // قيمة افتراضية في قاعدة البيانات
//            });

//            // داخل OnModelCreating(ModelBuilder b)
//            modelBuilder.Entity<Year>(e =>
//            {
//                e.HasIndex(x => x.IsActive);
//                e.HasIndex(x => x.StartDate);
//            });

//            modelBuilder.Entity<TermYear>(e =>
//            {
//                e.ToTable("TermYears");
//                e.Property(x => x.Name).HasMaxLength(120).IsRequired();
//                e.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("Active");
//                e.Property(x => x.WeekdaysCsv).HasMaxLength(32).HasDefaultValue("0,1,2,3,4");
//                e.HasOne(x => x.Year).WithMany().HasForeignKey(x => x.YearId).OnDelete(DeleteBehavior.Cascade);

//                // فهرس يساعد على كشف/منع التعارض ضمن نفس العام
//                e.HasIndex(x => new { x.YearId, x.StartDate, x.EndDate });
//            });

//            modelBuilder.Entity<CalendarEvent>(e =>
//            {
//                e.ToTable("CalendarEvents");
//                e.Property(x => x.Type).HasMaxLength(32).IsRequired();
//                e.Property(x => x.Title).HasMaxLength(200).IsRequired();
//                e.HasOne(x => x.Year).WithMany().HasForeignKey(x => x.YearId).OnDelete(DeleteBehavior.Cascade);
//                e.HasIndex(x => new { x.YearId, x.StartDate, x.EndDate });
//            });

//            modelBuilder.Entity<Year>().Property(x => x.Code).HasMaxLength(32);
//            modelBuilder.Entity<Year>().Property(x => x.Name).HasMaxLength(64);

//            modelBuilder.Entity<School>().Property(x => x.Name).HasMaxLength(120).IsRequired();
//            modelBuilder.Entity<School>().Property(x => x.Code).HasMaxLength(32);

//            modelBuilder.Entity<Stage>().Property(x => x.Name).HasMaxLength(120).IsRequired();
//            modelBuilder.Entity<Stage>().Property(x => x.Code).HasMaxLength(16);

//            modelBuilder.Entity<GradeYear>().Property(x => x.Name).HasMaxLength(120).IsRequired();
//            modelBuilder.Entity<GradeYear>().Property(x => x.Shift).HasMaxLength(16);
//            modelBuilder.Entity<GradeYear>().Property(x => x.Gender).HasMaxLength(16);
//            modelBuilder.Entity<GradeYear>().Property(x => x.Status).HasMaxLength(16);

//            modelBuilder.Entity<GradeYear>()
//                .HasMany(g => g.Fees)
//                .WithOne()
//                .HasForeignKey(f => f.GradeYearId)
//                .OnDelete(DeleteBehavior.Cascade);

//            modelBuilder.Entity<SectionYear>()
//                .HasIndex(x => new { x.GradeYearId, x.Name })
//                .IsUnique();

//            modelBuilder.Entity<Year>(b =>
//            {
//                b.ToTable("Years", "dbo");           // اسم الجدول
//                b.HasKey(x => x.Id);

//                b.Property(x => x.Code).HasMaxLength(50);
//                b.Property(x => x.Name).HasMaxLength(120);
//                b.Property(x => x.IsActive).HasDefaultValue(true);
//                b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
//            });

//            // ------- RolePermission (PK = Id + UniqueIndex) -------
//            modelBuilder.Entity<RolePermission>(e =>
//            {
//                e.HasKey(rp => rp.Id); // ← لا تستخدم مفتاحًا مركبًا
//                                       // لا تضع .Ignore(rp => rp.Id)

//                e.HasOne(rp => rp.Role)
//                    .WithMany(r => r.RolePermissions)
//                    .HasForeignKey(rp => rp.RoleId)
//                    .OnDelete(DeleteBehavior.Cascade);

//                e.HasOne(rp => rp.Permission)
//                    .WithMany(p => p.RolePermissions)
//                    .HasForeignKey(rp => rp.PermissionId)
//                    .OnDelete(DeleteBehavior.Cascade);

//                e.HasIndex(rp => new { rp.RoleId, rp.PermissionId }).IsUnique();
//            });

//            // ------- Permission (بدون Parent/ParentId) -------
//            modelBuilder.Entity<Permission>(e =>
//            {
//                e.Property(p => p.Key).HasMaxLength(128).IsRequired(); // ← 128 ليتطابق مع Snapshot
//                e.Property(p => p.Name).HasMaxLength(200).IsRequired();
//                e.Property(p => p.Category).HasMaxLength(100).IsRequired();
//                e.HasIndex(p => p.Key).IsUnique();
//                // لا تذكر Parent/ParentId هنا إطلاقًا
//            });

//            // ------- Role -------
//            modelBuilder.Entity<Role>(e =>
//            {
//                e.Property(r => r.Name).HasMaxLength(100).IsRequired();
//                e.Property(r => r.Key).HasMaxLength(100);
//                e.HasIndex(r => r.Name).IsUnique();
//                e.HasIndex(r => r.Key).IsUnique();
//            });

//            // ------- MenuItemPermission -------
//            modelBuilder.Entity<MenuItemPermission>(e =>
//            {
//                e.HasIndex(mip => new { mip.MenuItemId, mip.PermissionId }).IsUnique();
//            });

//            // ⚠️ لا HasData لـ Role/User/UserRole هنا
//        }


//        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
//        {
//            var username = _currentUser.Username ?? "system";

//            var entries = ChangeTracker.Entries<BaseEntity>();
//            foreach (var entry in entries)
//            {
//                if (entry.State == EntityState.Added)
//                {
//                    entry.Entity.CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
//                    entry.Entity.CreatedBy = username;
//                }
//                else if (entry.State == EntityState.Modified)
//                {
//                    entry.Entity.UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
//                    entry.Entity.UpdatedBy = username;
//                }
//            }

//            return base.SaveChangesAsync(cancellationToken);
//        }
//    }
//}


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

        // ===== Model Creating =====
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // يلتقط كل IEntityTypeConfiguration<> الموجودة بالمشروع (مثال: FeeLinkConfig, SchoolConfig, ...)
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(BeacontaDb).Assembly);

            // صريحة (اختياري): إن أردت فرض تضمين تهيئات معيّنة
            modelBuilder.ApplyConfiguration(new SchoolConfig());
            // modelBuilder.ApplyConfiguration(new FeeLinkConfig()); // موجودة عبر ApplyConfigurationsFromAssembly

            // --------- Precision & Monetary ---------
            modelBuilder.Entity<FeeBundleItem>()
                .Property(x => x.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<GradeYear>()
                .Property(x => x.Tuition)
                .HasPrecision(18, 2);

            modelBuilder.Entity<GradeYearFee>()
                .Property(x => x.Amount)
                .HasPrecision(18, 2);

            // --------- SectionYear ---------
            modelBuilder.Entity<SectionYear>(e =>
            {
                e.Property(x => x.Status)
                 .HasMaxLength(20)
                 .HasDefaultValue("Active");

                e.HasIndex(x => new { x.GradeYearId, x.Name }).IsUnique();
            });

            // --------- Year ---------
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

            // --------- TermYear ---------
            modelBuilder.Entity<TermYear>(e =>
            {
                e.ToTable("TermYears");
                e.Property(x => x.Name).HasMaxLength(120).IsRequired();
                e.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("Active");
                e.Property(x => x.WeekdaysCsv).HasMaxLength(32).HasDefaultValue("0,1,2,3,4");
                e.HasOne(x => x.Year).WithMany().HasForeignKey(x => x.YearId).OnDelete(DeleteBehavior.Cascade);

                e.HasIndex(x => new { x.YearId, x.StartDate, x.EndDate });
            });

            // --------- CalendarEvent ---------
            modelBuilder.Entity<CalendarEvent>(e =>
            {
                e.ToTable("CalendarEvents");
                e.Property(x => x.Type).HasMaxLength(32).IsRequired();
                e.Property(x => x.Title).HasMaxLength(200).IsRequired();
                e.HasOne(x => x.Year).WithMany().HasForeignKey(x => x.YearId).OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => new { x.YearId, x.StartDate, x.EndDate });
            });

            // --------- School/Stage/GradeYear ---------
            modelBuilder.Entity<School>().Property(x => x.Name).HasMaxLength(120).IsRequired();
            modelBuilder.Entity<School>().Property(x => x.Code).HasMaxLength(32);

            modelBuilder.Entity<Stage>().Property(x => x.Name).HasMaxLength(120).IsRequired();
            modelBuilder.Entity<Stage>().Property(x => x.Code).HasMaxLength(16);

            modelBuilder.Entity<GradeYear>().Property(x => x.Name).HasMaxLength(120).IsRequired();
            modelBuilder.Entity<GradeYear>().Property(x => x.Shift).HasMaxLength(16);
            modelBuilder.Entity<GradeYear>().Property(x => x.Gender).HasMaxLength(16);
            modelBuilder.Entity<GradeYear>().Property(x => x.Status).HasMaxLength(16);

            modelBuilder.Entity<GradeYear>()
                .HasMany(g => g.Fees)
                .WithOne()
                .HasForeignKey(f => f.GradeYearId)
                .OnDelete(DeleteBehavior.Cascade);

            // --------- RolePermission (PK = Id + UniqueIndex) ---------
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

            // --------- Permission ---------
            modelBuilder.Entity<Permission>(e =>
            {
                e.Property(p => p.Key).HasMaxLength(128).IsRequired();
                e.Property(p => p.Name).HasMaxLength(200).IsRequired();
                e.Property(p => p.Category).HasMaxLength(100).IsRequired();
                e.HasIndex(p => p.Key).IsUnique();
            });

            // --------- Role ---------
            modelBuilder.Entity<Role>(e =>
            {
                e.Property(r => r.Name).HasMaxLength(100).IsRequired();
                e.Property(r => r.Key).HasMaxLength(100);
                e.HasIndex(r => r.Name).IsUnique();
                e.HasIndex(r => r.Key).IsUnique();
            });

            // --------- MenuItemPermission ---------
            modelBuilder.Entity<MenuItemPermission>(e =>
            {
                e.HasIndex(mip => new { mip.MenuItemId, mip.PermissionId }).IsUnique();
            });

            // ملاحظة: لا يوجد HasData للمستخدم/الدور هنا (تجنّبًا للتصادم مع الهجرات)
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
