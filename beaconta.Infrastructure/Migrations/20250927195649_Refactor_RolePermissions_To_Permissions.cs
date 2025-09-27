using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace beaconta.Infrastructure.Migrations
{
    public partial class Refactor_RolePermissions_To_Permissions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ✅ 1) تأكد إن الجدول Permissions مش موجود قبل الإنشاء
            // (هنا نتخطى إنشاء الجدول لو كان موجود أصلاً)
            // ملاحظة: EF Core ما يدعم IF NOT EXISTS مباشرة، لذا احذف السطر أدناه إذا الجدول أنشئ يدويًا
            /*
            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Key = table.Column<string>(maxLength: 100, nullable: false),
                    Name = table.Column<string>(maxLength: 200, nullable: false),
                    Category = table.Column<string>(maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false, defaultValueSql: "GETDATE()"),
                    CreatedBy = table.Column<string>(nullable: false, defaultValue: "seed"),
                    UpdatedAt = table.Column<DateTime>(nullable: true),
                    UpdatedBy = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissions", x => x.Id);
                    table.UniqueConstraint("AK_Permissions_Key", x => x.Key);
                });
            */

            // 2) ربط RolePermissions مع Permissions
            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_PermissionId",
                table: "RolePermissions",
                column: "PermissionId");

            migrationBuilder.AddForeignKey(
                name: "FK_RolePermissions_Permissions_PermissionId",
                table: "RolePermissions",
                column: "PermissionId",
                principalTable: "Permissions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // 3) تعديل MenuItemPermissions: استبدال PermissionKey بـ PermissionId
            migrationBuilder.DropColumn(
                name: "PermissionKey",
                table: "MenuItemPermissions");

            migrationBuilder.AddColumn<int>(
                name: "PermissionId",
                table: "MenuItemPermissions",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemPermissions_PermissionId",
                table: "MenuItemPermissions",
                column: "PermissionId");

            migrationBuilder.AddForeignKey(
                name: "FK_MenuItemPermissions_Permissions_PermissionId",
                table: "MenuItemPermissions",
                column: "PermissionId",
                principalTable: "Permissions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // إزالة العلاقات
            migrationBuilder.DropForeignKey("FK_RolePermissions_Permissions_PermissionId", "RolePermissions");
            migrationBuilder.DropForeignKey("FK_MenuItemPermissions_Permissions_PermissionId", "MenuItemPermissions");

            // ⚠️ لا نحذف الجدول Permissions لأنه تم إنشاؤه يدويًا
            // migrationBuilder.DropTable("Permissions");

            migrationBuilder.DropIndex("IX_MenuItemPermissions_PermissionId", "MenuItemPermissions");
            migrationBuilder.DropColumn("PermissionId", "MenuItemPermissions");

            migrationBuilder.AddColumn<string>(
                name: "PermissionKey",
                table: "MenuItemPermissions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.DropIndex("IX_RolePermissions_PermissionId", "RolePermissions");
            migrationBuilder.DropForeignKey("FK_RolePermissions_Permissions_PermissionId", "RolePermissions");
        }
    }
}
