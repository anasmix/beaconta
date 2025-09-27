using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace beaconta.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixUserRolesWithId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 🟢 إسقاط المفتاح الأساسي القديم (المركّب)
            migrationBuilder.DropPrimaryKey(
                name: "PK_UserRoles",
                table: "UserRoles");

            // 🟢 حذف بيانات الـ seed القديمة (بالمفتاح المركب)
            migrationBuilder.DeleteData(
                table: "UserRoles",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { 1, 1 });

            // 🟢 تعيين Id كمفتاح أساسي جديد
            migrationBuilder.AddPrimaryKey(
                name: "PK_UserRoles",
                table: "UserRoles",
                column: "Id");

            // 🟢 إدخال بيانات seed جديدة بثابتات
            migrationBuilder.InsertData(
                table: "UserRoles",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "RoleId", "UpdatedAt", "UpdatedBy", "UserId" },
                values: new object[] { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", 1, null, null, 1 });

            // 🟢 إضافة فهرس فريد فقط إذا لم يكن موجود
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes 
                    WHERE name = 'IX_UserRoles_UserId_RoleId' 
                      AND object_id = OBJECT_ID('UserRoles')
                )
                BEGIN
                    CREATE UNIQUE INDEX [IX_UserRoles_UserId_RoleId] 
                    ON [UserRoles] ([UserId], [RoleId]);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 🟢 إسقاط المفتاح Id PK
            migrationBuilder.DropPrimaryKey(
                name: "PK_UserRoles",
                table: "UserRoles");

            // 🟢 إسقاط الفهرس فقط إذا كان موجود
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 FROM sys.indexes 
                    WHERE name = 'IX_UserRoles_UserId_RoleId' 
                      AND object_id = OBJECT_ID('UserRoles')
                )
                BEGIN
                    DROP INDEX [IX_UserRoles_UserId_RoleId] 
                    ON [UserRoles];
                END
            ");

            // 🟢 حذف بيانات seed الجديدة
            migrationBuilder.DeleteData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1);

            // 🟢 إعادة المفتاح المركب القديم
            migrationBuilder.AddPrimaryKey(
                name: "PK_UserRoles",
                table: "UserRoles",
                columns: new[] { "UserId", "RoleId" });

            // 🟢 إعادة إدخال بيانات seed القديمة بشكل ثابت
            migrationBuilder.InsertData(
                table: "UserRoles",
                columns: new[] { "RoleId", "UserId", "CreatedAt", "CreatedBy", "Id", "UpdatedAt", "UpdatedBy" },
                values: new object[] { 1, 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "system", 1, null, null });
        }
    }
}
