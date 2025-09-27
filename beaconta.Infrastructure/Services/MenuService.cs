using System.Security.Cryptography;
using System.Text;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Application.Mapping;
using beaconta.Domain.Entities;
using Microsoft.Extensions.Caching.Memory;

namespace beaconta.Infrastructure.Services
{
    public class MenuService : IMenuService
    {
        private readonly IMenuRepository _repo;
        private readonly ICurrentUserService _current;
        private readonly IMemoryCache _cache;

        public MenuService(IMenuRepository repo, ICurrentUserService current, IMemoryCache cache)
        {
            _repo = repo;
            _current = current;
            _cache = cache;
        }

        // ✅ القائمة المفلترة حسب المستخدم
        public async Task<IReadOnlyList<MenuSectionDto>> GetMenuForCurrentUserAsync(CancellationToken ct = default)
        {
            var userIdStr = _current.UserId ?? throw new InvalidOperationException("No current user.");
            if (!int.TryParse(userIdStr, out var userId))
                throw new InvalidOperationException($"Invalid UserId format: {userIdStr}");

            // 🔹 هنا نجيب PermissionKeys من RolePermissions/Permissions
            var userKeys = await _repo.GetPermissionKeysForUserAsync(userId, ct);

            var stamp = ComputeHash(string.Join("|", userKeys.OrderBy(x => x)));
            var cacheKey = $"menu:{userId}:{stamp}";

            if (_cache.TryGetValue(cacheKey, out IReadOnlyList<MenuSectionDto>? cached) && cached is not null)
                return cached;

            var full = await _repo.LoadFullMenuAsync(ct);
            var filtered = Filter(full, userKeys)
                .Select(s => s.ToDto())
                .OrderBy(s => s.SortOrder)
                .ToList()
                .AsReadOnly();

            _cache.Set(cacheKey, filtered, TimeSpan.FromMinutes(30));

            Console.WriteLine("🔑 User Perm Keys: " + string.Join(",", userKeys));

            return filtered;
        }

        // ✅ الكاتالوج الكامل (غير مفلتر)
        public async Task<IReadOnlyList<MenuSectionDto>> GetMenuCatalogAsync(CancellationToken ct = default)
        {
            var full = await _repo.LoadFullMenuAsync(ct);
            return full
                .Select(s => s.ToDto())
                .OrderBy(s => s.SortOrder)
                .ToList()
                .AsReadOnly();
        }

        public Task InvalidateCacheForUserAsync(int userId)
        {
            return Task.CompletedTask; // الكاش مبني على بصمة الصلاحيات
        }

        // ✅ الفلترة حسب صلاحيات المستخدم
        private static IEnumerable<MenuSection> Filter(IEnumerable<MenuSection> all, HashSet<string> userPerms)
        {
            foreach (var s in all)
            {
                var sec = new MenuSection
                {
                    Id = s.Id,
                    SectionKey = s.SectionKey,
                    Title = s.Title,
                    Icon = s.Icon,
                    SortOrder = s.SortOrder,
                    CreatedAt = s.CreatedAt,
                    CreatedBy = s.CreatedBy,
                    UpdatedAt = s.UpdatedAt,
                    UpdatedBy = s.UpdatedBy
                };

                foreach (var g in s.Groups)
                {
                    var grp = new MenuGroup
                    {
                        Id = g.Id,
                        SectionId = sec.Id,
                        Title = g.Title,
                        SortOrder = g.SortOrder,
                        CreatedAt = g.CreatedAt,
                        CreatedBy = g.CreatedBy,
                        UpdatedAt = g.UpdatedAt,
                        UpdatedBy = g.UpdatedBy
                    };

                    foreach (var it in g.Items)
                    {
                        // 👇 الآن نعتمد على ItemKey نفسه كمفتاح صلاحية
                        var requiredKey = it.ItemKey;

                        var allowed = !string.IsNullOrWhiteSpace(requiredKey) &&
                                      userPerms.Contains(requiredKey);

                        if (!allowed) continue;

                        grp.Items.Add(new MenuItem
                        {
                            Id = it.Id,
                            GroupId = grp.Id,
                            ItemKey = it.ItemKey,
                            Title = it.Title,
                            Icon = it.Icon,
                            Url = it.Url,
                            SortOrder = it.SortOrder,
                            MatchMode = it.MatchMode,
                            CreatedAt = it.CreatedAt,
                            CreatedBy = it.CreatedBy,
                            UpdatedAt = it.UpdatedAt,
                            UpdatedBy = it.UpdatedBy
                        });
                    }

                    if (grp.Items.Count > 0) sec.Groups.Add(grp);
                }

                if (sec.Groups.Count > 0) yield return sec;
            }
        }

        private static string ComputeHash(string input)
        {
            using var sha = SHA256.Create();
            return Convert.ToHexString(sha.ComputeHash(Encoding.UTF8.GetBytes(input)));
        }
    }
}
