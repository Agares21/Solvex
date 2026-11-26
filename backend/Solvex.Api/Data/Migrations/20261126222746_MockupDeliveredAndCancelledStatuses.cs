using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Solvex.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class MockupDeliveredAndCancelledStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Mockups_Status",
                table: "Mockups");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Mockups_Status",
                table: "Mockups",
                sql: "[Status] IN ('Requested', 'InProgress', 'Completed', 'Delivered', 'Cancelled')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Mockups_Status",
                table: "Mockups");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Mockups_Status",
                table: "Mockups",
                sql: "[Status] IN ('Requested', 'InProgress', 'Completed')");
        }
    }
}
