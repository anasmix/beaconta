using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace beaconta.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Fix_GradeYearFee_FK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GradeYearFees_GradeYears_GradeYearId1",
                table: "GradeYearFees");

            migrationBuilder.DropIndex(
                name: "IX_GradeYearFees_GradeYearId1",
                table: "GradeYearFees");

            migrationBuilder.DropColumn(
                name: "GradeYearId1",
                table: "GradeYearFees");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GradeYearId1",
                table: "GradeYearFees",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_GradeYearFees_GradeYearId1",
                table: "GradeYearFees",
                column: "GradeYearId1");

            migrationBuilder.AddForeignKey(
                name: "FK_GradeYearFees_GradeYears_GradeYearId1",
                table: "GradeYearFees",
                column: "GradeYearId1",
                principalTable: "GradeYears",
                principalColumn: "Id");
        }
    }
}
