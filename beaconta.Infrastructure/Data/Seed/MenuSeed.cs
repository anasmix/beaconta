using beaconta.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Data.Seed
{
    public static class MenuSeed
    {
        // ربط عناصر القائمة بمفاتيح الصلاحيات
        private static readonly Dictionary<string, string[]> PERM_MAP = new(StringComparer.OrdinalIgnoreCase)
        {
            // System / Users / Roles
            ["user-management"] = new[] { "users.view" },
            ["role-management"] = new[] { "roles.manage" },
            ["system.audit"] = new[] { "system.audit" },

            // Students
            ["attendance"] = new[] { "attendance.view" },
            ["registration"] = new[] { "students.create" },
            ["subjects-curricula"] = new[] { "students.view" },
            ["behavior"] = new[] { "students.view" },
            ["graduation"] = new[] { "students.edit" },

            // Contracts
            ["contracts.list"] = new[] { "contracts.view" },
            ["contracts.create"] = new[] { "contracts.create" },

            // داخل PERM_MAP
            ["link-fees-curricula"] = new[] { "fees.links.view" },
            ["link-fees-curricula.manage"] = new[] { "fees.links.manage" },


        };

        public static async Task SeedMenuAsync(BeacontaDb db, CancellationToken ct = default)
        {
            // لو في أي بيانات موجودة، اعتبر أنه تم seeding سابقًا
            if (await db.MenuSections.AsNoTracking().AnyAsync(ct)) return;

            // تحسين أداء الإدراج المجمع
            var prevAutoDetect = db.ChangeTracker.AutoDetectChangesEnabled;
            db.ChangeTracker.AutoDetectChangesEnabled = false;
            try
            {
                // Cache: حمّل كل الصلاحيات مرة واحدة في الذاكرة
                var existingPerms = await db.Permissions
                    .AsNoTracking()
                    .ToDictionaryAsync(p => p.Key, p => p, StringComparer.OrdinalIgnoreCase, ct);

                // ===== Helpers =====
                static MenuSection Sec(string key, string title, string? icon, int order) => new()
                {
                    SectionKey = key,
                    Title = title,
                    Icon = icon,
                    SortOrder = order,
                    CreatedBy = "system",
                    CreatedAt = DateTime.UtcNow,
                    Groups = new List<MenuGroup>()
                };

                static MenuGroup Group(MenuSection s, string title, int order) => new()
                {
                    Section = s,
                    Title = title,
                    SortOrder = order,
                    CreatedBy = "system",
                    CreatedAt = DateTime.UtcNow,
                    Items = new List<MenuItem>()
                };

                static MenuItem Item(
                    string key,
                    string title,
                    string? icon,
                    string url,
                    int order,
                    PermissionMatchMode mm = PermissionMatchMode.RequireAny) => new()
                    {
                        ItemKey = key,
                        Title = title,
                        Icon = icon,
                        Url = url,
                        SortOrder = order,
                        MatchMode = mm,
                        CreatedBy = "system",
                        CreatedAt = DateTime.UtcNow,
                        MenuItemPermissions = new List<MenuItemPermission>()
                    };

                // يربط الصلاحيات بالعنصر، وينشئ المفقود منها في الذاكرة
                void BindPerms(MenuItem item)
                {
                    if (!PERM_MAP.TryGetValue(item.ItemKey, out var keys) || keys == null || keys.Length == 0)
                        return;

                    foreach (var key in keys)
                    {
                        if (!existingPerms.TryGetValue(key, out var perm))
                        {
                            perm = new Permission
                            {
                                Key = key,
                                Name = key,
                                Category = "Menu",
                                CreatedBy = "system",
                                CreatedAt = DateTime.UtcNow
                            };
                            // خزّنه محليًا وعلى DbSet — بدون SaveChanges الآن
                            db.Permissions.Add(perm);
                            existingPerms[key] = perm;
                        }

                        item.MenuItemPermissions.Add(new MenuItemPermission
                        {
                            Permission = perm,
                            CreatedBy = "system",
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                void AddItem(MenuGroup g, MenuItem it)
                {
                    BindPerms(it);
                    g.Items.Add(it);
                }


                var sections = new List<MenuSection>();

                // ===== Dashboard =====
                var secDashboard = Sec("dashboard", "الرئيسية", "bi-speedometer2", 1);
                {
                    var gDashboard = Group(secDashboard, "لوحة التحكم", 1);
                    AddItem(gDashboard, Item("dashboard-overview", "الرئيسية", "bi-speedometer2", "pages/dashboard.html", 1));
                    secDashboard.Groups.Add(gDashboard);
                    sections.Add(secDashboard);
                }

                // ===== School Years =====
                var secYears = Sec("schoolYears", "إدارة السنوات الدراسية", "bi-calendar-week", 2);
                {
                    var gYears = Group(secYears, "عمليات", 1);
                    AddItem(gYears, Item("new-year", "إنشاء سنة جديدة", "bi-calendar-plus", "pages/new-year.html", 1));
                    AddItem(gYears, Item("terms-calendar", "تحديد الفصول والتقويم", "bi-calendar-week", "#", 2));
                    AddItem(gYears, Item("rollover", "ترحيل الطلاب والعقود", "bi-arrows-collapse", "#", 3));
                    secYears.Groups.Add(gYears);
                    sections.Add(secYears);
                }

                // ===== Students =====
                var secStudents = Sec("students", "الطلاب", "bi-people", 3);
                {
                    var gStu = Group(secStudents, "إدارة الطلاب", 1);
                    AddItem(gStu, Item("registration", "التسجيل والملفات", "bi-person-plus", "#", 1));
                    AddItem(gStu, Item("attendance", "الحضور والغياب", "bi-calendar-check", "#", 2));
                    // أمثلة أخرى لو احتجت
                    // AddItem(gStu, Item("subjects-curricula", "المواد والمناهج", "bi-journal-bookmark", "#", 3));
                    // AddItem(gStu, Item("behavior", "السلوك والإنذارات", "bi-exclamation-octagon", "#", 4));
                    // AddItem(gStu, Item("graduation", "التخرج", "bi-mortarboard", "#", 5));
                    secStudents.Groups.Add(gStu);
                    sections.Add(secStudents);
                }

                // ===== Permissions =====
                var secPerm = Sec("permissions", "الصلاحيات", "bi-shield-lock", 4);
                {
                    var gPerm = Group(secPerm, "الصلاحيات", 1);
                    AddItem(gPerm, Item("user-management", "إدارة المستخدمين", "bi-person-lines-fill", "#", 1));
                    AddItem(gPerm, Item("role-management", "المجموعات والصلاحيات", "bi-shield-lock", "#", 2));
                    // AddItem(gPerm, Item("system.audit", "سجل النظام", "bi-clipboard-data", "#", 3));
                    secPerm.Groups.Add(gPerm);
                    sections.Add(secPerm);
                }

                db.MenuSections.AddRange(sections);
                await db.SaveChangesAsync(ct);
            }
            finally
            {
                db.ChangeTracker.AutoDetectChangesEnabled = prevAutoDetect;
            }
        }
    }
}
