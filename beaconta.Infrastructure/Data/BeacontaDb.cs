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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Seed Roles
            modelBuilder.Entity<Role>().HasData(
          new Role { Id = 1, Name = "Admin", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
          new Role { Id = 2, Name = "Teacher", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" },
          new Role { Id = 3, Name = "Accountant", CreatedAt = new DateTime(2025, 01, 01), CreatedBy = "system" }
      );

            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    FullName = "System Admin",
                    Username = "admin",
                    PasswordHash = "123456", // ⚠️ للتجربة فقط
                    Status = "active",
                    RoleId = 1,
                    CreatedAt = new DateTime(2025, 01, 01),
                    CreatedBy = "system"
                }
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
