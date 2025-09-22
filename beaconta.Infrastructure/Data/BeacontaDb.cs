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
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
        public DbSet<Permission> Permissions => Set<Permission>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 🔹 العلاقة بين Role و RolePermission
            modelBuilder.Entity<Role>()
                .HasMany(r => r.Permissions)
                .WithOne(rp => rp.Role)
                .HasForeignKey(rp => rp.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RolePermission>()
                .HasOne(rp => rp.Permission)
                .WithMany()
                .HasForeignKey(rp => rp.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);

            // 🔹 Seed Roles
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Admin", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Role { Id = 2, Name = "Teacher", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Role { Id = 3, Name = "Accountant", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" }
            );

            // 🔹 Seed Default Admin User
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    FullName = "System Admin",
                    Username = "admin",
                    PasswordHash = "$2a$11$0DFszVYcLOyTz6o4UjD8nuhGgbLMyUZt9xkgqVpuOjQKoe/89Dw6u", // bcrypt
                    Status = "active",
                    RoleId = 1,
                    CreatedAt = new DateTime(2025, 01, 01),
                    CreatedBy = "system"
                }
            );

            // ✅ Seed Permissions
            modelBuilder.Entity<Permission>().HasData(
                // المستخدمين
                new Permission { Id = 1, Key = "users.view", Name = "عرض المستخدمين", Category = "المستخدمين", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 2, Key = "users.create", Name = "إضافة مستخدم", Category = "المستخدمين", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 3, Key = "users.edit", Name = "تعديل مستخدم", Category = "المستخدمين", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 4, Key = "users.delete", Name = "حذف مستخدم", Category = "المستخدمين", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 5, Key = "roles.manage", Name = "إدارة الأدوار", Category = "الأدوار", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },

                // الطلاب
                new Permission { Id = 6, Key = "students.view", Name = "عرض الطلاب", Category = "الطلاب", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 7, Key = "students.create", Name = "إضافة طالب", Category = "الطلاب", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 8, Key = "students.edit", Name = "تعديل طالب", Category = "الطلاب", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 9, Key = "students.delete", Name = "حذف طالب", Category = "الطلاب", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },

                // العقود
                new Permission { Id = 10, Key = "contracts.view", Name = "عرض العقود", Category = "العقود", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 11, Key = "contracts.create", Name = "إنشاء عقد", Category = "العقود", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 12, Key = "contracts.discount", Name = "إدارة الخصومات", Category = "العقود", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },

                // الحضور
                new Permission { Id = 13, Key = "attendance.view", Name = "عرض الحضور", Category = "الحضور", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 14, Key = "attendance.edit", Name = "تعديل الحضور", Category = "الحضور", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },

                // النظام
                new Permission { Id = 15, Key = "system.settings", Name = "الإعدادات العامة", Category = "النظام", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 16, Key = "system.backup", Name = "النسخ الاحتياطي", Category = "النظام", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
                new Permission { Id = 17, Key = "system.audit", Name = "سجل العمليات", Category = "النظام", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" }
            );

            // ✅ Seed RolePermissions (Admin = كل الصلاحيات الأولى 1..5)
            modelBuilder.Entity<RolePermission>().HasData(
                new RolePermission { Id = 1, RoleId = 1, PermissionId = 1 },
                new RolePermission { Id = 2, RoleId = 1, PermissionId = 2 },
                new RolePermission { Id = 3, RoleId = 1, PermissionId = 3 },
                new RolePermission { Id = 4, RoleId = 1, PermissionId = 4 },
                new RolePermission { Id = 5, RoleId = 1, PermissionId = 5 }
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
