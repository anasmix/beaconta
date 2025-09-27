using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace beaconta.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SwitchRolePermissionToMenuItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 9, 27, 17, 32, 30, 841, DateTimeKind.Utc).AddTicks(3968));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 9, 27, 17, 20, 51, 349, DateTimeKind.Utc).AddTicks(9608));
        }
    }
}
