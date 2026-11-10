using Microsoft.EntityFrameworkCore;
using Solvex.Api.Data;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;
using Solvex.Api.Services;
using Xunit;

namespace Solvex.Api.SqlTests;

// Requiere una base SQL Server de desarrollo ya migrada. No crea/elimina bases ni datos previos.
// Cada caso crea sus propios registros con códigos únicos y los conserva para inspección.
public sealed class PurchaseSqlTests
{
    private static SolvexDbContext Db()
    {
        var connection = Environment.GetEnvironmentVariable("SOLVEX_SQL_TEST_CONNECTION")
            ?? throw new InvalidOperationException("Configura SOLVEX_SQL_TEST_CONNECTION para ejecutar pruebas reales contra una base de desarrollo migrada.");
        return new(new DbContextOptionsBuilder<SolvexDbContext>().UseSqlServer(connection).Options);
    }
    private static PurchaseService Service(SolvexDbContext db) => new(new PurchaseRepository(db, new InventoryRepository(db)));
    private static async Task<(int Supplier, int First, int Second)> SeedAsync()
    {
        await using var db = Db();
        var key = Guid.NewGuid().ToString("N");
        var supplier = new Supplier { Identifier = "SQL-" + key, Name = "Proveedor prueba SQL", Phone = "77777777" };
        var first = new Product { Code = "SQL-A-" + key, Name = "Producto SQL A", Price = 1 };
        var second = new Product { Code = "SQL-B-" + key, Name = "Producto SQL B", Price = 1 };
        db.AddRange(supplier, first, second); await db.SaveChangesAsync();
        return (supplier.Id, first.Id, second.Id);
    }
    private static PurchaseInput Input(int supplier, int first, int second) => new() { SupplierId = supplier,
        Details = [new() { ProductId = first, Quantity = 3, UnitCost = 2.50m }, new() { ProductId = second, Quantity = 2, UnitCost = 1.20m }] };
    [Fact]
    public async Task RegisterAndReceive_PersistsDetailsAndStockExactlyOnce()
    {
        var seed = await SeedAsync();
        int id;
        await using (var db = Db())
        {
            var purchase = await Service(db).CreateAsync(Input(seed.Supplier, seed.First, seed.Second));
            id = purchase.Id;
            Assert.Equal(9.90m, purchase.Total);
            Assert.Equal(2, await db.PurchaseDetails.CountAsync(d => d.PurchaseId == id));
            Assert.Equal(0, await db.Products.Where(p => p.Id == seed.First).Select(p => p.Stock).SingleAsync());
        }
        await using (var db = Db())
        {
            var result = await Service(db).ReceiveAsync(id);
            Assert.Equal(PurchaseStatus.Received, result.Status);
            Assert.NotNull(result.ReceivedAt);
        }
        await using (var db = Db())
        {
            await Assert.ThrowsAsync<PurchaseConflictException>(() => Service(db).ReceiveAsync(id));
            Assert.Equal(3, await db.Products.Where(p => p.Id == seed.First).Select(p => p.Stock).SingleAsync());
            Assert.Equal(2, await db.Products.Where(p => p.Id == seed.Second).Select(p => p.Stock).SingleAsync());
            Assert.Equal(2, await db.InventoryMovements.CountAsync(m => m.PurchaseDetail != null && m.PurchaseDetail.PurchaseId == id));
        }
    }
    [Fact]
    public async Task ConcurrentConfirmations_OnlyOneReceives()
    {
        var seed = await SeedAsync(); int id;
        await using (var db = Db()) id = (await Service(db).CreateAsync(Input(seed.Supplier, seed.First, seed.Second))).Id;
        var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        async Task<bool> Attempt()
        {
            await using var db = Db(); await gate.Task;
            try { await Service(db).ReceiveAsync(id); return true; }
            catch (PurchaseConflictException) { return false; }
        }
        var first = Attempt(); var second = Attempt(); gate.SetResult();
        var results = await Task.WhenAll(first, second);
        Assert.Single(results, success => success);
        await using var verify = Db();
        Assert.Equal(3, await verify.Products.Where(p => p.Id == seed.First).Select(p => p.Stock).SingleAsync());
        Assert.Equal(2, await verify.InventoryMovements.CountAsync(m => m.PurchaseDetail != null && m.PurchaseDetail.PurchaseId == id));
    }
    [Fact]
    public async Task FailureOnSecondProduct_RollsBackEarlierStockMovementAndStatus()
    {
        var seed = await SeedAsync(); int id;
        await using (var db = Db()) id = (await Service(db).CreateAsync(Input(seed.Supplier, seed.First, seed.Second))).Id;
        // Desactivar el segundo producto después de registrar permite forzar un fallo
        // tras la primera entrada, sin disparadores SQL ni cambios a registros ajenos.
        await using (var db = Db()) await db.Products.Where(p => p.Id == seed.Second).ExecuteUpdateAsync(set => set.SetProperty(p => p.IsActive, false));
        await using (var db = Db()) await Assert.ThrowsAsync<InventoryConflictException>(() => Service(db).ReceiveAsync(id));
        await using (var db = Db())
        {
            var purchase = await db.Purchases.AsNoTracking().SingleAsync(p => p.Id == id);
            Assert.Equal(PurchaseStatus.Pending, purchase.Status); Assert.Null(purchase.ReceivedAt);
            Assert.Equal(0, await db.Products.Where(p => p.Id == seed.First).Select(p => p.Stock).SingleAsync());
            Assert.Equal(0, await db.InventoryMovements.CountAsync(m => m.PurchaseDetail != null && m.PurchaseDetail.PurchaseId == id));
            await db.Products.Where(p => p.Id == seed.Second).ExecuteUpdateAsync(set => set.SetProperty(p => p.IsActive, true));
        }
        // La misma compra se puede recibir después de corregir la causa del fallo.
        await using (var db = Db()) Assert.Equal(PurchaseStatus.Received, (await Service(db).ReceiveAsync(id)).Status);
    }
    [Fact]
    public async Task InvalidDetail_SaveChangesRollsBackHeaderAndOtherDetails()
    {
        var seed = await SeedAsync();
        await using var db = Db();
        var before = await db.Purchases.CountAsync(p => p.SupplierId == seed.Supplier);
        // Ejercita la transacción EF y la restricción SQL más allá de validaciones de servicio.
        var purchase = new Purchase { SupplierId = seed.Supplier, RegisteredAt = DateTimeOffset.UtcNow, Total = 1,
            Details = [new() { ProductId = seed.First, Quantity = 1, UnitCost = 1, Subtotal = 1 }, new() { ProductId = seed.Second, Quantity = 0, UnitCost = 0, Subtotal = 0 }] };
        await Assert.ThrowsAsync<DbUpdateException>(() => new PurchaseRepository(db, new InventoryRepository(db)).AddAsync(purchase, default));
        await using var verify = Db();
        Assert.Equal(before, await verify.Purchases.CountAsync(p => p.SupplierId == seed.Supplier));
        Assert.Empty(await verify.PurchaseDetails.Where(d => d.ProductId == seed.First || d.ProductId == seed.Second).ToListAsync());
    }
    [Fact]
    public async Task MissingPurchase_ReceiveReturnsNotFound()
    {
        await using var db = Db();
        await Assert.ThrowsAsync<PurchaseNotFoundException>(() => Service(db).ReceiveAsync(int.MaxValue));
    }
}
