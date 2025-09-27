using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace beaconta.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CleanRolePermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 🔹 حذف العمود PermissionKey إذا موجود
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns 
           WHERE Name = N'PermissionKey' 
           AND Object_ID = Object_ID(N'MenuItemPermissions'))
BEGIN
    ALTER TABLE [MenuItemPermissions] DROP COLUMN [PermissionKey];
END
");

            // 🔹 إعادة تسمية العمود MenuItemId إلى PermissionId إذا موجود
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns 
           WHERE Name = N'MenuItemId' 
           AND Object_ID = Object_ID(N'RolePermissions'))
BEGIN
    EXEC sp_rename N'RolePermissions.MenuItemId', N'PermissionId', 'COLUMN';
END
");

            // 🔹 إعادة تسمية الـ Index إذا موجود
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RolePermissions_MenuItemId')
BEGIN
    EXEC sp_rename N'RolePermissions.IX_RolePermissions_MenuItemId', N'IX_RolePermissions_PermissionId', N'INDEX';
END
");

            // 🔹 إضافة العمود PermissionId لجدول MenuItemPermissions (إذا مش موجود)
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.columns 
               WHERE Name = N'PermissionId' 
               AND Object_ID = Object_ID(N'MenuItemPermissions'))
BEGIN
    ALTER TABLE [MenuItemPermissions] ADD [PermissionId] INT NOT NULL DEFAULT(0);
END
");

            // 🔹 إنشاء جدول Permissions إذا مش موجود
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Permissions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Permissions](
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Key] NVARCHAR(MAX) NOT NULL,
        [Name] NVARCHAR(MAX) NOT NULL,
        [Category] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [CreatedBy] NVARCHAR(MAX) NOT NULL,
        [UpdatedAt] DATETIME2 NULL,
        [UpdatedBy] NVARCHAR(MAX) NULL
    );
END
");

            // 🔹 تحديث بيانات النظام (محمي بشرط وجود الصفوف)
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM Roles WHERE Id = 1)
    UPDATE Roles SET CreatedAt = '2025-01-01', CreatedBy = 'system' WHERE Id = 1;
");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM Users WHERE Id = 1)
    UPDATE Users SET CreatedAt = '2025-01-01', CreatedBy = 'system' WHERE Id = 1;
");

            // 🔹 إنشاء Index على PermissionId
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MenuItemPermissions_PermissionId')
BEGIN
    CREATE INDEX [IX_MenuItemPermissions_PermissionId] 
    ON [MenuItemPermissions]([PermissionId]);
END
");

            // 🔹 إضافة العلاقات (FKs) بشرط عدم وجودها
            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_MenuItemPermissions_Permissions_PermissionId'
)
BEGIN
    ALTER TABLE [MenuItemPermissions] 
    ADD CONSTRAINT [FK_MenuItemPermissions_Permissions_PermissionId]
    FOREIGN KEY ([PermissionId]) REFERENCES [Permissions]([Id]) ON DELETE CASCADE;
END
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_RolePermissions_Permissions_PermissionId'
)
BEGIN
    ALTER TABLE [RolePermissions] 
    ADD CONSTRAINT [FK_RolePermissions_Permissions_PermissionId]
    FOREIGN KEY ([PermissionId]) REFERENCES [Permissions]([Id]) ON DELETE CASCADE;
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // هنا ممكن تتركها فاضية أو تعمل Rollback بسيط حسب الحاجة
            // لكن غالبًا rollback الكامل غير مطلوب بظل التضارب القديم
        }
    }
}
