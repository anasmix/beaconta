using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace beaconta.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixAdminPasswordHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Key = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissions", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Category", "CreatedAt", "CreatedBy", "Key", "Name", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { 1, "الطلاب", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", "students.view", "عرض الطلاب", null, null },
                    { 2, "الطلاب", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", "students.create", "إضافة طالب", null, null },
                    { 3, "الطلاب", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", "students.edit", "تعديل طالب", null, null },
                    { 4, "الطلاب", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", "students.delete", "حذف طالب", null, null },
                    { 5, "العقود", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", "contracts.view", "عرض العقود", null, null },
                    { 6, "العقود", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", "contracts.create", "إنشاء عقد", null, null },
                    { 7, "العقود", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", "contracts.discount", "إدارة الخصومات", null, null },
                    { 8, "الحضور", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", "attendance.view", "عرض الحضور", null, null },
                    { 9, "الحضور", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", "attendance.edit", "تعديل الحضور", null, null },
                    { 10, "النظام", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", "system.settings", "الإعدادات العامة", null, null },
                    { 11, "النظام", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", "system.backup", "النسخ الاحتياطي", null, null },
                    { 12, "النظام", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", "system.audit", "سجل العمليات", null, null }
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$OPwOB9mvmFXpQ8QzSI5H..24D2yIec3sTvNR/YeUENTRiEavFlwT.");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "123456");
        }
    }
}
