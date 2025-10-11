using beaconta.Domain.Entities;
using beaconta.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public static class FeesPermissionsSeed
{
    private static readonly string[] KEYS = new[]
    {
        "fees.links.view","fees.links.manage",
        "fees.bundles.view","fees.bundles.manage",
        "curricula.manage"
    };

    public static async Task EnsureAsync(BeacontaDb db, CancellationToken ct = default)
    {
        var existing = await db.Permissions.AsNoTracking().Select(p => p.Key).ToListAsync(ct);
        foreach (var k in KEYS)
        {
            if (!existing.Contains(k))
            {
                db.Permissions.Add(new Permission
                {
                    Key = k,
                    Name = k,
                    Category = "Fees",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "system"
                });
            }
        }
        await db.SaveChangesAsync(ct);
    }
}
