using beaconta.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Infrastructure.Data.Seed
{
    public static class MenuSeed
    {
        // خريطة ربط عناصر القائمة بمفاتيح الصلاحيات الموجودة لديك
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

            // Attendance section already covered above
            // Finance / HR / Transport ... إلخ: اتركها بدون صلاحيات لتظهر للجميع أو أضف لاحقاً مفاتيحك
        };

        public static async Task SeedMenuAsync(BeacontaDb db)
        {
            if (await db.MenuSections.AnyAsync()) return;

            var sections = new List<MenuSection>();

            // ===== Helpers =====
            MenuSection Sec(string key, string title, string? icon, int order) => new()
            {
                SectionKey = key,
                Title = title,
                Icon = icon,
                SortOrder = order,
                CreatedBy = "system"
            };

            MenuGroup Group(MenuSection s, string title, int order) => new()
            {
                Section = s,
                Title = title,
                SortOrder = order,
                CreatedBy = "system"
            };

            MenuItem Item(string key, string title, string? icon, string url, int order,
                          PermissionMatchMode mm = PermissionMatchMode.RequireAny)
                => new()
                {
                    ItemKey = key,
                    Title = title,
                    Icon = icon,
                    Url = url,
                    SortOrder = order,
                    MatchMode = mm,
                    CreatedBy = "system"
                };

            void BindPerms(MenuItem item)
            {
                if (!PERM_MAP.TryGetValue(item.ItemKey, out var keys) || keys is null || keys.Length == 0)
                    return;

                // اربط فقط ما هو موجود فعلاً في DB.Permissions
                var permIds = db.Permissions
                                .Where(p => keys.Contains(p.Key))
                                .Select(p => p.Id)
                                .ToList();

                foreach (var pid in permIds)
                    item.MenuItemPermissions.Add(new MenuItemPermission { PermissionId = pid });
            }

            void AddItem(MenuGroup g, MenuItem it)
            {
                BindPerms(it);
                g.Items.Add(it);
            }

            // ===== Dashboard =====
            var secDashboard = Sec("dashboard", "الرئيسية", "bi-speedometer2", 1);
            var gDashboard = Group(secDashboard, "لوحة التحكم", 1);
            AddItem(gDashboard, Item("dashboard-overview", "الرئيسية", "bi-speedometer2", "pages/dashboard.html", 1));
            secDashboard.Groups.Add(gDashboard);
            sections.Add(secDashboard);

            // ===== School Years =====
            var secYears = Sec("schoolYears", "إدارة السنوات الدراسية", "bi-calendar-week", 2);
            var gYears = Group(secYears, "عمليات", 1);
            AddItem(gYears, Item("new-year", "إنشاء سنة جديدة", "bi-calendar-plus", "pages/new-year.html", 1));
            AddItem(gYears, Item("terms-calendar", "تحديد الفصول والتقويم", "bi-calendar-week", "#", 2));
            AddItem(gYears, Item("rollover", "ترحيل الطلاب والعقود", "bi-arrows-collapse", "#", 3));
            AddItem(gYears, Item("link-fees-curricula", "ربط الرسوم والمناهج", "bi-link-45deg", "#", 4));
            AddItem(gYears, Item("annual-reports", "تقارير سنوية", "bi-file-earmark-bar-graph", "#", 5));
            secYears.Groups.Add(gYears);
            sections.Add(secYears);

            // ===== Schools =====
            var secSchools = Sec("schools", "إدارة المدارس", "bi-building", 3);
            var gSchools = Group(secSchools, "المدارس والمراحل", 1);
            AddItem(gSchools, Item("manage-schools", "المدارس", "bi-building", "pages/schools.html", 1));
            AddItem(gSchools, Item("manage-stages", "المراحل والصفوف", "bi-diagram-3", "pages/stages.html", 2));
            secSchools.Groups.Add(gSchools);
            sections.Add(secSchools);

            // ===== Students =====
            var secStudents = Sec("students", "الطلاب", "bi-people", 4);
            var gStu1 = Group(secStudents, "إدارة الطلاب", 1);
            AddItem(gStu1, Item("registration", "التسجيل والملفات", "bi-person-plus", "#", 1));
            AddItem(gStu1, Item("attendance", "الحضور والغياب", "bi-calendar-check", "#", 2));
            AddItem(gStu1, Item("subjects-curricula", "الأداء الأكاديمي", "bi-bar-chart-line", "#", 3));
            AddItem(gStu1, Item("behavior", "السلوك والأنشطة", "bi-emoji-smile", "#", 4));
            AddItem(gStu1, Item("graduation", "التخرج والتحويل", "bi-person-check", "#", 5));
            secStudents.Groups.Add(gStu1);

            var gStu2 = Group(secStudents, "الكتب الرسمية", 2);
            AddItem(gStu2, Item("certificate-transfer", "شهادة انتقال", "bi-file-earmark-text", "#", 1));
            AddItem(gStu2, Item("certificate-proof", "شهادة إثبات طالب", "bi-file-earmark-text", "#", 2));
            AddItem(gStu2, Item("phase-completion", "شهادة إنهاء مرحلة", "bi-file-earmark-text", "#", 3));
            AddItem(gStu2, Item("good-conduct", "شهادة حسن سلوك", "bi-file-earmark-text", "#", 4));
            secStudents.Groups.Add(gStu2);

            var gStu3 = Group(secStudents, "إدارة وثائق الطلاب", 3);
            AddItem(gStu3, Item("docs-checklist", "قائمة الوثائق المطلوبة", "bi-card-checklist", "#", 1));
            AddItem(gStu3, Item("docs-entry", "إدخال واستلام الوثائق", "bi-inbox", "#", 2));
            AddItem(gStu3, Item("docs-upload", "رفع نسخ إلكترونية وربطها بالطالب", "bi-upload", "#", 3));
            AddItem(gStu3, Item("docs-store", "مستودع الوثائق الأصلية", "bi-box", "#", 4));
            AddItem(gStu3, Item("docs-alerts", "تنبيهات النواقص + تقارير متابعة", "bi-bell", "#", 5));
            secStudents.Groups.Add(gStu3);
            sections.Add(secStudents);

            // ===== Academia =====
            var secAcademia = Sec("academia", "الأكاديمية", "bi-journal-bookmark", 5);
            var gAc = Group(secAcademia, "الأكاديمية ", 1);
            AddItem(gAc, Item("subjects-curricula", "المواد والمناهج", "bi-journal-bookmark", "#", 1));
            AddItem(gAc, Item("weekly-plans", "الخطط الأسبوعية", "bi-calendar3-week", "#", 2));
            AddItem(gAc, Item("exams", "الامتحانات", "bi-pencil-square", "#", 3));
            AddItem(gAc, Item("e-learning", "التعليم الإلكتروني", "bi-laptop", "#", 4));
            AddItem(gAc, Item("automatic-schedules", "الجداول الآلية", "bi-table", "#", 5));
            AddItem(gAc, Item("performance-reports", "تقارير الأداء", "bi-bar-chart", "#", 6));
            secAcademia.Groups.Add(gAc);
            sections.Add(secAcademia);

            // ===== Contracts =====
            var secContracts = Sec("contracts", "العقود", "bi-file-earmark-text", 6);
            var gCon = Group(secContracts, "أنواع العقود", 1);
            AddItem(gCon, Item("parent-contracts", "عقود أولياء الأمور", "bi-file-earmark-text", "#", 1));
            AddItem(gCon, Item("staff-contracts", "عقود الموظفين", "bi-file-earmark-text", "#", 2));
            AddItem(gCon, Item("supplier-contracts", "عقود الموردين", "bi-file-earmark-text", "#", 3));
            secContracts.Groups.Add(gCon);
            sections.Add(secContracts);

            // ===== Finance =====
            var secFinance = Sec("finance", "المالية", "bi-receipt", 7);
            var gFin1 = Group(secFinance, "المالية", 1);
            AddItem(gFin1, Item("installments-bills", "الأقساط والفواتير", "bi-receipt", "#", 1));
            AddItem(gFin1, Item("payment-vouchers", "سندات القبض", "bi-cash-coin", "#", 2));
            AddItem(gFin1, Item("budget-reports", "الميزانية والتقارير", "bi-file-earmark-bar-graph", "#", 3));
            AddItem(gFin1, Item("national-billing", "الربط مع الفوترة الوطنية", "bi-link-45deg", "#", 4));
            secFinance.Groups.Add(gFin1);

            var gFin2 = Group(secFinance, "التحصيل القانوني", 2);
            AddItem(gFin2, Item("follow-defaulters", "متابعة المتأخرين", "bi-clock-history", "#", 1));
            AddItem(gFin2, Item("warnings", "الإنذارات", "bi-exclamation-triangle", "#", 2));
            AddItem(gFin2, Item("cases-courts", "القضايا والمحاكم", "bi-gavel", "#", 3));
            AddItem(gFin2, Item("payment-status", "تحديث حالة السداد", "bi-check-circle", "#", 4));
            secFinance.Groups.Add(gFin2);
            sections.Add(secFinance);

            // ===== HR =====
            var secHr = Sec("hr", "شؤون الموظفين", "bi-person-badge", 8);
            var gHr1 = Group(secHr, "شؤون الموظفين", 1);
            AddItem(gHr1, Item("personal-files", "الملفات الشخصية", "bi-person-badge", "#", 1));
            AddItem(gHr1, Item("salaries-advances", "الرواتب والسلف", "bi-cash-stack", "#", 2));
            AddItem(gHr1, Item("rewards-sanctions", "المكافآت والعقوبات", "bi-gift", "#", 3));
            AddItem(gHr1, Item("leaves-promotions", "الإجازات والترقيات", "bi-arrow-up-right-circle", "#", 4));
            AddItem(gHr1, Item("attendance-shifts", "الحضور والانصراف + المناوبات", "bi-clock", "#", 5));
            secHr.Groups.Add(gHr1);

            var gHr2 = Group(secHr, "التوظيف", 2);
            AddItem(gHr2, Item("vacancy-announcement", "الإعلان عن الشواغر", "bi-megaphone", "#", 1));
            AddItem(gHr2, Item("application-receipt", "استقبال الطلبات", "bi-envelope-open", "#", 2));
            AddItem(gHr2, Item("screening-interviews", "فرز ومقابلات", "bi-clipboard-check", "#", 3));
            AddItem(gHr2, Item("convert-to-employee", "التحويل إلى موظف", "bi-person-check", "#", 4));
            secHr.Groups.Add(gHr2);
            sections.Add(secHr);

            // ===== Transport =====
            var secTransport = Sec("transport", "المواصلات", "bi-bus-front", 9);
            var gTr = Group(secTransport, "المواصلات", 1);
            AddItem(gTr, Item("buses-drivers", "إدارة الباصات والسائقين", "bi-bus-front", "#", 1));
            AddItem(gTr, Item("routes", "الجولات والمسارات", "bi-map", "#", 2));
            AddItem(gTr, Item("gps-tracking", "تتبع GPS", "bi-geo-alt", "#", 3));
            AddItem(gTr, Item("parent-notifications", "إشعارات أولياء الأمور", "bi-bell", "#", 4));
            secTransport.Groups.Add(gTr);
            sections.Add(secTransport);

            // ===== Warehouses =====
            var secWh = Sec("warehouses", "المستودعات", "bi-journal", 10);
            var gWh1 = Group(secWh, "المستودعات", 1);
            AddItem(gWh1, Item("book-management", "إدارة الكتب", "bi-journal", "#", 1));
            AddItem(gWh1, Item("uniform-management", "إدارة الزي", "bi-shirt", "#", 2));
            AddItem(gWh1, Item("pos-students", "البيع (POS للطلاب)", "bi-bag", "#", 3));
            AddItem(gWh1, Item("inventory-alerts", "الجرد والتنبيهات", "bi-exclamation-circle", "#", 4));
            secWh.Groups.Add(gWh1);

            var gWh2 = Group(secWh, "المشتريات", 2);
            AddItem(gWh2, Item("purchase-requests", "طلبات الشراء", "bi-file-earmark-plus", "#", 1));
            AddItem(gWh2, Item("price-offers", "عروض الأسعار", "bi-tags", "#", 2));
            AddItem(gWh2, Item("purchase-orders", "أوامر الشراء", "bi-cart", "#", 3));
            AddItem(gWh2, Item("receiving", "استلام وربط بالمستودع", "bi-box-arrow-in-down", "#", 4));
            AddItem(gWh2, Item("finance-link", "الربط مع المالية", "bi-link-45deg", "#", 5));
            secWh.Groups.Add(gWh2);

            var gWh3 = Group(secWh, "المقصف الذكي", 3);
            AddItem(gWh3, Item("canteen-products", "قائمة المنتجات والمخزون", "bi-list-ul", "#", 1));
            AddItem(gWh3, Item("canteen-pos", "نقطة البيع (POS)", "bi-credit-card", "#", 2));
            AddItem(gWh3, Item("student-wallet", "الدفع بمحفظة الطالب / بطاقة NFC", "bi-wallet", "#", 3));
            AddItem(gWh3, Item("parent-notifications-canteen", "إشعارات لولي الأمر", "bi-bell", "#", 4));
            AddItem(gWh3, Item("sales-reports", "تقارير المبيعات والأرباح", "bi-graph-up-arrow", "#", 5));
            AddItem(gWh3, Item("healthy-options", "خيارات التغذية الصحية", "bi-heart", "#", 6));
            secWh.Groups.Add(gWh3);
            sections.Add(secWh);

            // ===== Archiving =====
            var secArch = Sec("archiving", "الأرشفة", "bi-folder", 11);
            var gArch = Group(secArch, "الأرشفة", 1);
            AddItem(gArch, Item("student-files-archive", "ملفات الطلاب", "bi-folder", "#", 1));
            AddItem(gArch, Item("contracts-archive", "العقود", "bi-file-earmark-zip", "#", 2));
            AddItem(gArch, Item("admin-documents", "الوثائق الإدارية", "bi-file-earmark-richtext", "#", 3));
            AddItem(gArch, Item("outgoing-incoming-books", "الكتب الصادرة والواردة", "bi-journal-arrow-down", "#", 4));
            AddItem(gArch, Item("official-copies", "نسخ الكتب الرسمية + الوثائق", "bi-journal-arrow-up", "#", 5));
            secArch.Groups.Add(gArch);
            sections.Add(secArch);

            // ===== Notes =====
            var secNotes = Sec("notes", "الملاحظات والقضايا", "bi-chat-dots", 12);
            var gNotes = Group(secNotes, "الملاحظات والقضايا", 1);
            AddItem(gNotes, Item("parents-complaints", "شكاوى أولياء الأمور", "bi-chat-dots", "#", 1));
            AddItem(gNotes, Item("student-cases", "قضايا الطلاب", "bi-people", "#", 2));
            AddItem(gNotes, Item("staff-cases", "قضايا الموظفين", "bi-person", "#", 3));
            secNotes.Groups.Add(gNotes);
            sections.Add(secNotes);

            // ===== Circulars =====
            var secCirc = Sec("circulars", "التعاميم الإدارية", "bi-send", 13);
            var gCirc = Group(secCirc, "التعاميم الإدارية", 1);
            AddItem(gCirc, Item("issue-circulars", "إصدار التعاميم", "bi-send", "#", 1));
            AddItem(gCirc, Item("follow-implementation", "متابعة التنفيذ", "bi-check2-square", "#", 2));
            secCirc.Groups.Add(gCirc);
            sections.Add(secCirc);

            // ===== Permissions (Users & Roles) =====
            var secPerm = Sec("permissions", "الصلاحيات", "bi-shield-lock", 14);
            var gPerm = Group(secPerm, "الصلاحيات", 1);
            AddItem(gPerm, Item("user-management", "إدارة المستخدمين", "bi-person-lines-fill", "#", 1));
            AddItem(gPerm, Item("role-management", "المجموعات والصلاحيات التفصيلية", "bi-shield-lock", "#", 2));
            secPerm.Groups.Add(gPerm);
            sections.Add(secPerm);

            // ===== Monitoring =====
            var secMon = Sec("monitoring", "المراقبة", "bi-hdd-network", 15);
            var gMon = Group(secMon, "المراقبة", 1);
            AddItem(gMon, Item("logs-tracking", "تتبع العمليات (Logs)", "bi-hdd-network", "#", 1));
            AddItem(gMon, Item("performance-reports-mon", "تقارير الأداء", "bi-bar-chart-line", "#", 2));
            secMon.Groups.Add(gMon);
            sections.Add(secMon);

            // ===== Central Reports =====
            var secCR = Sec("centralReports", "نظام التقارير المركزي", "bi-file-earmark-bar-graph", 16);
            var gCR = Group(secCR, "نظام التقارير المركزي", 1);
            AddItem(gCR, Item("student-reports", "تقارير الطلاب", "bi-file-earmark-bar-graph", "#", 1));
            AddItem(gCR, Item("academia-reports", "تقارير الأكاديميا", "bi-file-earmark-bar-graph", "#", 2));
            AddItem(gCR, Item("contracts-reports", "تقارير العقود", "bi-file-earmark-bar-graph", "#", 3));
            AddItem(gCR, Item("finance-reports", "تقارير المالية", "bi-file-earmark-bar-graph", "#", 4));
            AddItem(gCR, Item("hr-reports", "تقارير الموظفين", "bi-file-earmark-bar-graph", "#", 5));
            AddItem(gCR, Item("transport-reports", "تقارير المواصلات", "bi-file-earmark-bar-graph", "#", 6));
            AddItem(gCR, Item("warehouses-reports", "تقارير المستودعات والمقصف", "bi-file-earmark-bar-graph", "#", 7));
            AddItem(gCR, Item("archiving-reports", "تقارير الأرشفة", "bi-file-earmark-bar-graph", "#", 8));
            AddItem(gCR, Item("notes-reports", "تقارير الملاحظات والقضايا", "bi-file-earmark-bar-graph", "#", 9));
            AddItem(gCR, Item("management-reports", "تقارير الإدارة العليا (KPIs + AI + What-if)", "bi-file-earmark-bar-graph", "#", 10));
            secCR.Groups.Add(gCR);
            sections.Add(secCR);

            // ===== Upper Management =====
            var secUM = Sec("upperManagement", "الإدارة العليا", "bi-speedometer2", 17);
            var gUM = Group(secUM, "الإدارة العليا", 1);
            AddItem(gUM, Item("executive-dashboard", "Executive Dashboard", "bi-speedometer2", "#", 1));
            AddItem(gUM, Item("kpi", "مؤشرات الأداء KPIs", "bi-bar-chart", "#", 2));
            AddItem(gUM, Item("strategic-reports", "تقارير استراتيجية", "bi-file-earmark-bar-graph", "#", 3));
            secUM.Groups.Add(gUM);
            sections.Add(secUM);

            // ===== Save =====
            db.MenuSections.AddRange(sections);
            await db.SaveChangesAsync();
        }
    }
}
