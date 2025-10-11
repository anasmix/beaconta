using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace beaconta.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CurriculumTemplatesSubjectsAndAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserRoles_UserId_RoleId",
                table: "UserRoles");

            migrationBuilder.CreateTable(
                name: "CurriculumAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GradeYearId = table.Column<int>(type: "int", nullable: false),
                    TemplateId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CurriculumAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CurriculumAssignments_CurriculumTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "CurriculumTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CurriculumAssignments_GradeYears_GradeYearId",
                        column: x => x.GradeYearId,
                        principalTable: "GradeYears",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CurriculumTemplateSubjects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TemplateId = table.Column<int>(type: "int", nullable: false),
                    SubjectId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CurriculumTemplateSubjects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CurriculumTemplateSubjects_CurriculumTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "CurriculumTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CurriculumTemplateSubjects_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_UserId",
                table: "UserRoles",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FeeLinks_EffectiveFrom",
                table: "FeeLinks",
                column: "EffectiveFrom");

            migrationBuilder.CreateIndex(
                name: "IX_FeeLinks_GradeYearId_SectionYearId",
                table: "FeeLinks",
                columns: new[] { "GradeYearId", "SectionYearId" });

            migrationBuilder.CreateIndex(
                name: "IX_FeeLinks_Status",
                table: "FeeLinks",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_CurriculumTemplates_TemplateCode_YearId",
                table: "CurriculumTemplates",
                columns: new[] { "TemplateCode", "YearId" },
                unique: true,
                filter: "[YearId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CurriculumAssignments_GradeYearId_TemplateId",
                table: "CurriculumAssignments",
                columns: new[] { "GradeYearId", "TemplateId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CurriculumAssignments_TemplateId",
                table: "CurriculumAssignments",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_CurriculumTemplateSubjects_SubjectId",
                table: "CurriculumTemplateSubjects",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_CurriculumTemplateSubjects_TemplateId_SubjectId",
                table: "CurriculumTemplateSubjects",
                columns: new[] { "TemplateId", "SubjectId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CurriculumAssignments");

            migrationBuilder.DropTable(
                name: "CurriculumTemplateSubjects");

            migrationBuilder.DropIndex(
                name: "IX_UserRoles_UserId",
                table: "UserRoles");

            migrationBuilder.DropIndex(
                name: "IX_FeeLinks_EffectiveFrom",
                table: "FeeLinks");

            migrationBuilder.DropIndex(
                name: "IX_FeeLinks_GradeYearId_SectionYearId",
                table: "FeeLinks");

            migrationBuilder.DropIndex(
                name: "IX_FeeLinks_Status",
                table: "FeeLinks");

            migrationBuilder.DropIndex(
                name: "IX_CurriculumTemplates_TemplateCode_YearId",
                table: "CurriculumTemplates");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_UserId_RoleId",
                table: "UserRoles",
                columns: new[] { "UserId", "RoleId" },
                unique: true);
        }
    }
}
