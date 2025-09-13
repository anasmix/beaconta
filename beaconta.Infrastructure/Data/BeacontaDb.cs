using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
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

        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 🔹 العلاقة بين Role و RolePermission
            modelBuilder.Entity<Role>()
                .HasMany(r => r.Permissions)
                .WithOne(p => p.Role)
                .HasForeignKey(p => p.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            // 🔹 Seed Roles
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Admin", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Role { Id = 2, Name = "Teacher", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Role { Id = 3, Name = "Accountant", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" }
            );

            // 🔹 Seed Default Admin User

            // داخل OnModelCreating
            modelBuilder.Entity<User>().HasData(
    new User
    {
        Id = 1,
        FullName = "System Admin",
        Username = "admin",
        // 🚨 لا تكتب HashPassword هنا لأنه ديناميكي
        PasswordHash = "$2a$11$0DFszVYcLOyTz6o4UjD8nuhGgbLMyUZt9xkgqVpuOjQKoe/89Dw6u",
        Status = "active",
        RoleId = 1,
        CreatedAt = new DateTime(2025, 01, 01),
        CreatedBy = "system"
    }
);


            // 🔹 Seed Permissions for Admin
            modelBuilder.Entity<RolePermission>().HasData(
                new RolePermission { Id = 1, Key = "users.view", DisplayName = "عرض المستخدمين", RoleId = 1, CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new RolePermission { Id = 2, Key = "users.create", DisplayName = "إضافة مستخدم", RoleId = 1, CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new RolePermission { Id = 3, Key = "users.edit", DisplayName = "تعديل مستخدم", RoleId = 1, CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new RolePermission { Id = 4, Key = "users.delete", DisplayName = "حذف مستخدم", RoleId = 1, CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new RolePermission { Id = 5, Key = "roles.manage", DisplayName = "إدارة الأدوار", RoleId = 1, CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" }
            );

            modelBuilder.Entity<User>()
    .HasOne(u => u.Role)
    .WithMany(r => r.Users)
    .HasForeignKey(u => u.RoleId)
    .OnDelete(DeleteBehavior.Restrict);


            // ✅ Seed Permissions
            modelBuilder.Entity<Permission>().HasData(
                // الطلاب
                new Permission { Id = 1, Key = "students.view", Name = "عرض الطلاب", Category = "الطلاب", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 2, Key = "students.create", Name = "إضافة طالب", Category = "الطلاب", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 3, Key = "students.edit", Name = "تعديل طالب", Category = "الطلاب", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 4, Key = "students.delete", Name = "حذف طالب", Category = "الطلاب", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                // العقود
                new Permission { Id = 5, Key = "contracts.view", Name = "عرض العقود", Category = "العقود", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 6, Key = "contracts.create", Name = "إنشاء عقد", Category = "العقود", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 7, Key = "contracts.discount", Name = "إدارة الخصومات", Category = "العقود", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                // الحضور
                new Permission { Id = 8, Key = "attendance.view", Name = "عرض الحضور", Category = "الحضور", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 9, Key = "attendance.edit", Name = "تعديل الحضور", Category = "الحضور", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                // النظام
                new Permission { Id = 10, Key = "system.settings", Name = "الإعدادات العامة", Category = "النظام", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 11, Key = "system.backup", Name = "النسخ الاحتياطي", Category = "النظام", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 12, Key = "system.audit", Name = "سجل العمليات", Category = "النظام", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" }
            );

        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var username = _currentUser.Username ?? "system";

            var entries = ChangeTracker.Entries<BaseEntity>();
            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.CreatedBy = username;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedBy = username;
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
