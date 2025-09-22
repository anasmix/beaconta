using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace beaconta.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleAndPermissionKeyColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // أضف العمود فقط إذا مش موجود مسبقًا
            migrationBuilder.AddColumn<string>(
                name: "Key",
                table: "RolePermissions",
                type: "nvarchar(100)",
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Key",
                table: "RolePermissions");

            // لا تحذف من Roles إذا أصلاً كان موجود قبل
        }

    }
}
