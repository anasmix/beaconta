using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace beaconta.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Add_Years_Columns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowPaymentsOnClosedAcademic",
                schema: "dbo",
                table: "Years",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                schema: "dbo",
                table: "Years",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ColorHex",
                schema: "dbo",
                table: "Years",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FinanceBackPostDays",
                schema: "dbo",
                table: "Years",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                schema: "dbo",
                table: "Years",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                schema: "dbo",
                table: "Years",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowPaymentsOnClosedAcademic",
                schema: "dbo",
                table: "Years");

            migrationBuilder.DropColumn(
                name: "BranchId",
                schema: "dbo",
                table: "Years");

            migrationBuilder.DropColumn(
                name: "ColorHex",
                schema: "dbo",
                table: "Years");

            migrationBuilder.DropColumn(
                name: "FinanceBackPostDays",
                schema: "dbo",
                table: "Years");

            migrationBuilder.DropColumn(
                name: "Notes",
                schema: "dbo",
                table: "Years");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "dbo",
                table: "Years");
        }
    }
}
