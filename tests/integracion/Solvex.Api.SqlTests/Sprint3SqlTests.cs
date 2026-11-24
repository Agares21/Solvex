using Microsoft.EntityFrameworkCore;
using Solvex.Api.Data;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;
using Solvex.Api.Services;
using Xunit;

namespace Solvex.Api.SqlTests;

// Requiere una base SQL Server de desarrollo con la migración Sprint3CustomersOrdersMockups aplicada.
// No crea/elimina bases ni elimina datos; cada caso conserva sus registros identificados con GUID.
public sealed class Sprint3SqlTests
{
    private static SolvexDbContext Db()
    {
        var connection = Environment.GetEnvironmentVariable("SOLVEX_SQL_TEST_CONNECTION")
            ?? throw new InvalidOperationException("Configura SOLVEX_SQL_TEST_CONNECTION para ejecutar pruebas reales contra una base de desarrollo migrada.");
        return new(new DbContextOptionsBuilder<SolvexDbContext>().UseSqlServer(connection).Options);
    }
    private static OrderService Orders(SolvexDbContext db) => new(new OrderRepository(db));
    private static MockupService Mockups(SolvexDbContext db) => new(new MockupRepository(db));
    private static async Task<(int CustomerId, int ProductId)> SeedAsync()
    {
        await using var db = Db();
        var key = Guid.NewGuid().ToString("N");
        var customer = new Customer { Name = "Cliente Sprint3 " + key[..8] };
        var product = new Product { Code = "S3-" + key, Name = "Producto Sprint3 " + key, Price = 12.50m };
        db.AddRange(customer, product); await db.SaveChangesAsync();
        return (customer.Id, product.Id);
    }
    [Fact]
    public async Task OrderAndMockup_PersistAmountsWithoutChangingStock()
    {
        var seed = await SeedAsync();
        int orderId; int mockupId;
        await using (var db = Db())
        {
            var order = await Orders(db).CreateAsync(new() { CustomerId = seed.CustomerId, Details = [new() { ProductId = seed.ProductId, Quantity = 2 }], Observations = "Prueba SQL" });
            orderId = order.Id;
            Assert.Equal(25m, order.Total);
            Assert.Equal(0, await db.Products.Where(p => p.Id == seed.ProductId).Select(p => p.Stock).SingleAsync());
        }
        await using (var db = Db())
        {
            var mockup = await Mockups(db).CreateAsync(new() { CustomerId = seed.CustomerId, Institution = "Colegio de prueba", Type = "Educativa", Size = "Mediana", DeliveryAt = DateTimeOffset.UtcNow.AddDays(3), AgreedPrice = 100m });
            mockupId = mockup.Id;
            var paid = await Mockups(db).AddPaymentAsync(mockupId, new() { Amount = 40m, Note = "Anticipo" });
            Assert.Equal(60m, paid.PendingBalance);
        }
        await using (var verify = Db())
        {
            Assert.Single(await verify.OrderDetails.Where(d => d.OrderId == orderId).ToListAsync());
            Assert.Equal(40m, await verify.MockupPayments.Where(p => p.MockupId == mockupId).SumAsync(p => p.Amount));
            Assert.Equal(0, await verify.Products.Where(p => p.Id == seed.ProductId).Select(p => p.Stock).SingleAsync());
        }
    }
}
