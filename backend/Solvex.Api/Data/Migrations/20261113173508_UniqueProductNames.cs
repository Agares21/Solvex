using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Solvex.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class UniqueProductNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (SELECT 1 FROM Products
                    GROUP BY UPPER(LTRIM(RTRIM(Name))) COLLATE Latin1_General_100_CI_AS
                    HAVING COUNT(*) > 1)
                    THROW 51002, 'Hay nombres duplicados. Revisar y ejecutar scripts/sql/prepare-unique-product-names.sql antes de migrar.', 1;
                """);
            migrationBuilder.AddColumn<string>(
                name: "NormalizedName",
                table: "Products",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                computedColumnSql: "UPPER(LTRIM(RTRIM([Name]))) COLLATE Latin1_General_100_CI_AS",
                stored: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_NormalizedName",
                table: "Products",
                column: "NormalizedName",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_NormalizedName",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "NormalizedName",
                table: "Products");
        }
    }
}
