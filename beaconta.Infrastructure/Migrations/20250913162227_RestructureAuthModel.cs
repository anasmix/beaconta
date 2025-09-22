using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace beaconta.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RestructureAuthModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Roles.PermissionsVersion: أضِف فقط إذا غير موجود
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.Roles','PermissionsVersion') IS NULL
BEGIN
  ALTER TABLE dbo.Roles
    ADD PermissionsVersion INT NOT NULL CONSTRAINT DF_Roles_PermissionsVersion DEFAULT(1);
END
");

            // RolePermissions.PermissionId: أضِف فقط إذا غير موجود
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.RolePermissions','PermissionId') IS NULL
BEGIN
  ALTER TABLE dbo.RolePermissions ADD PermissionId INT NULL;
END
");

            // إن كان العمود القديم [Key] موجودًا، اربط منه
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.RolePermissions','Key') IS NOT NULL
BEGIN
  UPDATE rp SET rp.PermissionId = p.Id
  FROM dbo.RolePermissions rp
  JOIN dbo.Permissions p ON p.[Key] = rp.[Key]
  WHERE rp.PermissionId IS NULL;
END
");

            // تنظيف بيانات غير صالحة وتكرارات
            migrationBuilder.Sql(@"
DELETE rp
FROM dbo.RolePermissions rp
LEFT JOIN dbo.Permissions p ON p.Id = rp.PermissionId
WHERE rp.PermissionId IS NULL OR rp.PermissionId = 0 OR p.Id IS NULL;

;WITH d AS (
  SELECT Id, RoleId, PermissionId,
         ROW_NUMBER() OVER (PARTITION BY RoleId, PermissionId ORDER BY Id) rn
  FROM dbo.RolePermissions
  WHERE PermissionId IS NOT NULL
)
DELETE FROM d WHERE rn > 1;
");

            // اجعل PermissionId NOT NULL + FK + فهرس فريد
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.RolePermissions') AND name = 'PermissionId')
BEGIN
  IF EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE PermissionId IS NULL)
      RAISERROR('RolePermissions has NULL PermissionId',16,1);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_RolePermissions_Permissions_PermissionId')
  BEGIN
    ALTER TABLE dbo.RolePermissions WITH CHECK
      ADD CONSTRAINT FK_RolePermissions_Permissions_PermissionId
      FOREIGN KEY (PermissionId) REFERENCES dbo.Permissions(Id) ON DELETE CASCADE;
  END;

  IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RolePermissions_RoleId_PermissionId' AND object_id = OBJECT_ID('dbo.RolePermissions'))
      DROP INDEX IX_RolePermissions_RoleId_PermissionId ON dbo.RolePermissions;

  CREATE UNIQUE INDEX IX_RolePermissions_RoleId_PermissionId ON dbo.RolePermissions(RoleId, PermissionId);
END
");

            // تخلّص من الأعمدة القديمة إن وجدت
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.RolePermissions','Key') IS NOT NULL
  ALTER TABLE dbo.RolePermissions DROP COLUMN [Key];
IF COL_LENGTH('dbo.RolePermissions','DisplayName') IS NOT NULL
  ALTER TABLE dbo.RolePermissions DROP COLUMN [DisplayName];
");

            // تأكيد مفاتيح الأدوار
            migrationBuilder.Sql(@"
UPDATE dbo.Roles SET [Key] = 'Admin'      WHERE Id = 1 AND ( [Key] IS NULL OR [Key] = '' );
UPDATE dbo.Roles SET [Key] = 'Teacher'    WHERE Id = 2 AND ( [Key] IS NULL OR [Key] = '' );
UPDATE dbo.Roles SET [Key] = 'Accountant' WHERE Id = 3 AND ( [Key] IS NULL OR [Key] = '' );
");
        }

        // Down يمكنك تركه فارغًا أو تعكس التغييرات بحسب حاجتك

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RolePermissions_Permissions_PermissionId",
                table: "RolePermissions");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_Username",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Roles_Key",
                table: "Roles");

            migrationBuilder.DropIndex(
                name: "IX_RolePermissions_PermissionId",
                table: "RolePermissions");

            migrationBuilder.DropIndex(
                name: "IX_RolePermissions_RoleId_PermissionId",
                table: "RolePermissions");

            migrationBuilder.DropIndex(
                name: "IX_Permissions_Key",
                table: "Permissions");

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DropColumn(
                name: "PermissionsVersion",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "PermissionId",
                table: "RolePermissions");

            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Key",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "RolePermissions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Key",
                table: "RolePermissions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Key",
                table: "Permissions",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DisplayName", "Key" },
                values: new object[] { "عرض المستخدمين", "users.view" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DisplayName", "Key" },
                values: new object[] { "إضافة مستخدم", "users.create" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DisplayName", "Key" },
                values: new object[] { "تعديل مستخدم", "users.edit" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "DisplayName", "Key" },
                values: new object[] { "حذف مستخدم", "users.delete" });

            migrationBuilder.UpdateData(
                table: "RolePermissions",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "DisplayName", "Key" },
                values: new object[] { "إدارة الأدوار", "roles.manage" });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "Key",
                value: "");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "Key",
                value: "");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 3,
                column: "Key",
                value: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "Status",
                value: "active");

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_RoleId",
                table: "RolePermissions",
                column: "RoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
