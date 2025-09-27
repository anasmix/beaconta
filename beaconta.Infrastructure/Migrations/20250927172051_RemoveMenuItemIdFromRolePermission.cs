using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace beaconta.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveMenuItemIdFromRolePermission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MenuItemPermissions_Permissions_PermissionId",
                table: "MenuItemPermissions");

            migrationBuilder.DropForeignKey(
                name: "FK_RolePermissions_Permissions_PermissionId",
                table: "RolePermissions");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropIndex(
                name: "IX_MenuItemPermissions_PermissionId",
                table: "MenuItemPermissions");

            migrationBuilder.DropColumn(
                name: "PermissionId",
                table: "MenuItemPermissions");

            migrationBuilder.RenameColumn(
                name: "PermissionId",
                table: "RolePermissions",
                newName: "MenuItemId");

            migrationBuilder.RenameIndex(
                name: "IX_RolePermissions_PermissionId",
                table: "RolePermissions",
                newName: "IX_RolePermissions_MenuItemId");

            migrationBuilder.AddColumn<string>(
                name: "PermissionKey",
                table: "MenuItemPermissions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 9, 27, 17, 20, 51, 349, DateTimeKind.Utc).AddTicks(9608));

            migrationBuilder.AddForeignKey(
                name: "FK_RolePermissions_MenuItems_MenuItemId",
                table: "RolePermissions",
                column: "MenuItemId",
                principalTable: "MenuItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RolePermissions_MenuItems_MenuItemId",
                table: "RolePermissions");

            migrationBuilder.DropColumn(
                name: "PermissionKey",
                table: "MenuItemPermissions");

            migrationBuilder.RenameColumn(
                name: "MenuItemId",
                table: "RolePermissions",
                newName: "PermissionId");

            migrationBuilder.RenameIndex(
                name: "IX_RolePermissions_MenuItemId",
                table: "RolePermissions",
                newName: "IX_RolePermissions_PermissionId");

            migrationBuilder.AddColumn<int>(
                name: "PermissionId",
                table: "MenuItemPermissions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissions", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 9, 25, 20, 23, 2, 134, DateTimeKind.Utc).AddTicks(129));

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

            migrationBuilder.AddForeignKey(
                name: "FK_RolePermissions_Permissions_PermissionId",
                table: "RolePermissions",
                column: "PermissionId",
                principalTable: "Permissions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
