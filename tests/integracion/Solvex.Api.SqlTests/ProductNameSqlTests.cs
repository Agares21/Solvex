using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Solvex.Api.Data;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;
using Xunit;

namespace Solvex.Api.SqlTests;

public sealed class ProductNameSqlTests
{
    private static SolvexDbContext Db() => new(new DbContextOptionsBuilder<SolvexDbContext>().UseSqlServer(
        Environment.GetEnvironmentVariable("SOLVEX_SQL_TEST_CONNECTION") ?? throw new InvalidOperationException("Configura SOLVEX_SQL_TEST_CONNECTION.")).Options);
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Database_RejectsCaseAndWhitespaceDuplicates(bool inactive)
    {
        await using var db = Db(); await using var tx = await db.Database.BeginTransactionAsync();
        var key = Guid.NewGuid().ToString("N");
        var original = new Product { Code = "A-" + key, Name = "CUADERNO " + key, IsActive = !inactive };
        db.Products.Add(original); await db.SaveChangesAsync();
        Assert.True(await new ProductRepository(db).NameExistsAsync(" cuaderno " + key + " ", null, default));
        Assert.False(await new ProductRepository(db).NameExistsAsync(original.Name, original.Id, default));
        db.Products.Add(new() { Code = "B-" + key, Name = "  cuaderno " + key + "  " });
        var error = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Contains("IX_Products_NormalizedName", Assert.IsType<SqlException>(error.InnerException).Message);
        // No commit: el producto temporal también se revierte al finalizar el caso.
    }
    [Fact]
    public async Task Database_RejectsUpdatingToAnotherName()
    {
        await using var db = Db(); await using var tx = await db.Database.BeginTransactionAsync();
        var key = Guid.NewGuid().ToString("N");
        var first = new Product { Code = "A-" + key, Name = "Cuaderno " + key };
        var second = new Product { Code = "B-" + key, Name = "Regla " + key };
        db.AddRange(first, second); await db.SaveChangesAsync();
        second.Name = " " + first.Name.ToUpperInvariant() + " ";
        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }
}
