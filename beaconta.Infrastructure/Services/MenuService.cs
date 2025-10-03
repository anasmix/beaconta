using System.Security.Cryptography;
using System.Text;
using beaconta.Application.DTOs;
using beaconta.Application.Interfaces;
using beaconta.Domain.Entities;
using Microsoft.Extensions.Caching.Memory;
using System.Linq;

namespace beaconta.Infrastructure.Services
{
    /// <summary>
    /// خدمة بناء قائمة القوائم (Menu) سواء كـكتالوج كامل أو مفلترة حسب المستخدم.
    /// - الأفعال (Actions) ديناميكية تُشتق من Permissions المرتبطة بكل MenuItem عبر MenuItemPermission.
    /// - عنوان الفعل يُؤخذ من Permission.Name مباشرة.
    /// - ActionKey هو الجزء بعد "ItemKey." من Permission.Key (أيًا كان).
    /// - ترتيب الأفعال افتراضيًا بحسب الاسم ثم المفتاح (ويمكن لاحقًا دعم SortOrder من DB).
    /// </summary>
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

        // ✅ القائمة المفلترة حسب المستخدم (وتتضمن Actions ديناميكية)
        public async Task<IReadOnlyList<MenuSectionDto>> GetMenuForCurrentUserAsync(CancellationToken ct = default)
        {
            var userIdStr = _current.UserId ?? throw new InvalidOperationException("No current user.");
            if (!int.TryParse(userIdStr, out var userId))
                throw new InvalidOperationException($"Invalid UserId format: {userIdStr}");

            // مفاتيح صلاحيات المستخدم (strings)، مثل: ["contracts.view","contracts.create","contracts.approve", ...]
            var userKeys = await _repo.GetPermissionKeysForUserAsync(userId, ct);
            var userKeySet = new HashSet<string>(userKeys ?? Enumerable.Empty<string>(), StringComparer.OrdinalIgnoreCase);

            // 🧠 استخدم بصمة الصلاحيات كمفتاح للكاش
            var stamp = ComputeHash(string.Join("|", userKeySet.OrderBy(x => x, StringComparer.OrdinalIgnoreCase)));
            var cacheKey = $"menu:{userId}:{stamp}";

            if (_cache.TryGetValue(cacheKey, out IReadOnlyList<MenuSectionDto>? cached) && cached is not null)
                return cached;

            // تحميل القائمة كاملة (مع العلاقات: Groups -> Items -> MenuItemPermissions -> Permission)
            var full = await _repo.LoadFullMenuAsync(ct);

            // فلترة حسب الصلاحيات
            var filteredSections = FilterSectionsByPermissions(full, userKeySet).ToList();

            // إسقاط إلى DTO مع بناء Actions لكل Item (ديناميكي)
            var dto = MapToDtoWithActions(filteredSections)
                .OrderBy(s => s.SortOrder)
                .ToList()
                .AsReadOnly();

            _cache.Set(cacheKey, dto, TimeSpan.FromMinutes(30));
            return dto;
        }

        // ✅ الكاتالوج الكامل (غير مفلتر) ويتضمن Actions ديناميكية
        public async Task<IReadOnlyList<MenuSectionDto>> GetMenuCatalogAsync(CancellationToken ct = default)
        {
            var full = await _repo.LoadFullMenuAsync(ct);

            var dto = MapToDtoWithActions(full)
                .OrderBy(s => s.SortOrder)
                .ToList()
                .AsReadOnly();

            return dto;
        }

        public Task InvalidateCacheForUserAsync(int userId)
        {
            // الكاش مبني على بصمة الصلاحيات (stamp) وبالتالي سيسقط تلقائياً عند تغير الصلاحيات.
            return Task.CompletedTask;
        }

        #region Filtering

        /// <summary>
        /// فلترة الأقسام/المجموعات/العناصر بحسب مفاتيح صلاحيات المستخدم.
        /// منطق السماح لعنصر القائمة (MenuItem):
        /// - إذا لا يوجد له Permissions مرتبطة: يُسمح فقط إن كان لدى المستخدم مفتاح مباشر ItemKey أو ItemKey.view (توافقاً مع القديم).
        /// - إذا يوجد Permissions مرتبطة:
        ///   * RequireAny: يكفي أن يمتلك المستخدم أي Permission من Permissions العنصر.
        ///   * RequireAll: يجب أن يمتلك المستخدم جميع Permissions العنصر.
        /// </summary>
        private static IEnumerable<MenuSection> FilterSectionsByPermissions(IEnumerable<MenuSection> all, HashSet<string> userPerms)
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

                foreach (var g in s.Groups.OrderBy(x => x.SortOrder))
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

                    foreach (var it in g.Items.OrderBy(x => x.SortOrder))
                    {
                        if (!IsItemAllowed(it, userPerms))
                            continue;

                        // انسخ العنصر مع علاقات الـ Permissions (لنستخدمها لاحقاً عند الإسقاط إلى DTO وبناء Actions)
                        var clonedItem = new MenuItem
                        {
                            Id = it.Id,
                            GroupId = grp.Id,
                            Group = grp,
                            ItemKey = it.ItemKey,
                            Title = it.Title,
                            Icon = it.Icon,
                            Url = it.Url,
                            SortOrder = it.SortOrder,
                            MatchMode = it.MatchMode,
                            CreatedAt = it.CreatedAt,
                            CreatedBy = it.CreatedBy,
                            UpdatedAt = it.UpdatedAt,
                            UpdatedBy = it.UpdatedBy,
                            MenuItemPermissions = it.MenuItemPermissions?.Select(mip => new MenuItemPermission
                            {
                                Id = mip.Id,
                                MenuItemId = it.Id,
                                PermissionId = mip.PermissionId,
                                Permission = mip.Permission, // نحتاج المفتاح والاسم لاحقاً
                                CreatedAt = mip.CreatedAt,
                                CreatedBy = mip.CreatedBy,
                                UpdatedAt = mip.UpdatedAt,
                                UpdatedBy = mip.UpdatedBy
                                // ملاحظة: إن أضفت SortOrder مستقبلاً هنا، اقرأه في MapToDtoWithActions
                            }).ToList() ?? new List<MenuItemPermission>()
                        };

                        grp.Items.Add(clonedItem);
                    }

                    if (grp.Items.Count > 0)
                        sec.Groups.Add(grp);
                }

                if (sec.Groups.Count > 0)
                    yield return sec;
            }
        }

        private static bool IsItemAllowed(MenuItem it, HashSet<string> userPerms)
        {
            var itemKey = it.ItemKey?.Trim();
            if (string.IsNullOrWhiteSpace(itemKey))
                return false;

            var boundPerms = (it.MenuItemPermissions ?? Enumerable.Empty<MenuItemPermission>())
                .Select(p => p.Permission?.Key)
                .Where(k => !string.IsNullOrWhiteSpace(k))
                .Select(k => k!.Trim())
                .ToList();

            // لا يوجد Permissions مرتبطة: ارجع للمنطق القديم (مفتاح العنصر نفسه أو view)
            if (boundPerms.Count == 0)
            {
                // دعم نمطين قديمين: "contracts" أو "contracts.view"
                return userPerms.Contains(itemKey) || userPerms.Contains($"{itemKey}.view");
            }

            // يوجد Permissions مرتبطة: طبّق المود
            if (it.MatchMode == PermissionMatchMode.RequireAll)
            {
                // يحتاج كل الصلاحيات المرتبطة بهذا العنصر
                return boundPerms.All(userPerms.Contains);
            }
            else
            {
                // يكفي أي صلاحية
                return boundPerms.Any(userPerms.Contains)
                       // دعم إضافي: لو عنده المفتاح العام أو view نسمح
                       || userPerms.Contains(itemKey)
                       || userPerms.Contains($"{itemKey}.view");
            }
        }

        #endregion

        #region Mapping to DTO (Dynamic Actions)

        /// <summary>
        /// إسقاط كائنات الدومين إلى DTOs مع تضمين Actions لكل عنصر.
        /// الأفعال تُشتق من Permissions المرتبطة بالعنصر:
        /// - ActionKey = الجزء بعد "ItemKey."
        /// - Title = Permission.Name (ديناميكي بالكامل)
        /// - PermissionKey = Permission.Key (كما هو)
        /// - SortOrder: افتراضيًا حسب Title ثم Key (ويدعم مستقبلاً حقلاً مخصصًا إن أُضيف للـ DB).
        /// </summary>
        private static IReadOnlyList<MenuSectionDto> MapToDtoWithActions(IEnumerable<MenuSection> sections)
        {
            var result = new List<MenuSectionDto>();

            foreach (var s in sections)
            {
                var sDto = new MenuSectionDto
                {
                    SectionKey = s.SectionKey,
                    Title = s.Title,
                    Icon = s.Icon,
                    SortOrder = s.SortOrder
                };

                foreach (var g in s.Groups.OrderBy(x => x.SortOrder))
                {
                    var gDto = new MenuGroupDto
                    {
                        Title = g.Title,
                        SortOrder = g.SortOrder
                    };

                    foreach (var it in g.Items.OrderBy(x => x.SortOrder))
                    {
                        var iDto = new MenuItemDto
                        {
                            ItemKey = it.ItemKey,
                            Title = it.Title,
                            Icon = it.Icon,
                            Url = it.Url,
                            SortOrder = it.SortOrder
                        };

                        // 🟢 Actions ديناميكية من DB:
                        var actions = BuildActionsFromPermissions(it);

                        if (actions.Count > 0)
                        {
                            // ترتيب افتراضي مرن: بالاسم ثم المفتاح
                            iDto.Actions = actions
                                .OrderBy(a => a.Title, StringComparer.OrdinalIgnoreCase)
                                .ThenBy(a => a.PermissionKey, StringComparer.OrdinalIgnoreCase)
                                .ToList();

                            // إن أحببت لاحقًا: استبدل الترتيب بقراءة SortOrder من MenuItemPermission أو Permission.
                        }

                        gDto.Items.Add(iDto);
                    }

                    sDto.Groups.Add(gDto);
                }

                result.Add(sDto);
            }

            return result;
        }

        /// <summary>
        /// يبني Actions للعنصر من الصلاحيات المرتبطة به.
        /// لا يوجد قواميس ثابتة هنا؛ كل شيء يُستمد من Permission (Key, Name).
        /// </summary>
        private static List<MenuItemActionDto> BuildActionsFromPermissions(MenuItem item)
        {
            var list = new List<MenuItemActionDto>();
            var itemKey = item.ItemKey?.Trim() ?? "";

            if (string.IsNullOrWhiteSpace(itemKey))
                return list;

            var perms = (item.MenuItemPermissions ?? Enumerable.Empty<MenuItemPermission>())
                .Select(mip => mip.Permission)
                .Where(p => p != null && !string.IsNullOrWhiteSpace(p!.Key))
                .Select(p => new { p!.Key, p!.Name })
                .DistinctBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
                .Where(x => x.Key.StartsWith(itemKey + ".", StringComparison.OrdinalIgnoreCase))
                .ToList();

            foreach (var p in perms)
            {
                var actionKey = p.Key.Substring(itemKey.Length + 1); // كل ما بعد "itemKey."
                list.Add(new MenuItemActionDto
                {
                    ActionKey = actionKey,          // أيًا كان: approve/assignTeacher/exportPdf/...
                    Title = string.IsNullOrWhiteSpace(p.Name) ? actionKey : p.Name!, // العنوان من Permission.Name
                    PermissionKey = p.Key,
                    // SortOrder: اتركه 0 افتراضيًا أو اقرأه مستقبلاً إن أضفته في DB
                    SortOrder = 0
                });
            }

            return list;
        }

        #endregion

        private static string ComputeHash(string input)
        {
            using var sha = SHA256.Create();
            return Convert.ToHexString(sha.ComputeHash(Encoding.UTF8.GetBytes(input)));
        }
    }

    // امتداد DistinctBy بسيط إن لم تكن على .NET يدعمها أصلاً
    internal static class LinqExtensions
    {
        public static IEnumerable<TSource> DistinctBy<TSource, TKey>(
            this IEnumerable<TSource> source,
            Func<TSource, TKey> keySelector,
            IEqualityComparer<TKey>? comparer = null)
        {
            var seen = new HashSet<TKey>(comparer);
            foreach (var element in source)
            {
                if (seen.Add(keySelector(element)))
                    yield return element;
            }
        }
    }
}
