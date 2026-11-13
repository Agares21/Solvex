using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;
using Solvex.Api.Services;
using Xunit;

namespace Solvex.Api.Tests;

public sealed class PurchaseServiceTests
{
    private readonly FakePurchases repository = new();
    private PurchaseService Service => new(repository);
    private static PurchaseInput Input(int supplier = 1, int product = 1, int? quantity = 3, decimal? cost = 2.50m) =>
        new() { SupplierId = supplier, Details = [new() { ProductId = product, Quantity = quantity, UnitCost = cost }] };
    [Fact]
    public async Task Create_StoresDetailsCalculatesAmountsWithoutChangingStock()
    {
        var result = await Service.CreateAsync(new() { SupplierId = 1, Details = [new() { ProductId = 1, Quantity = 3, UnitCost = 2.50m }, new() { ProductId = 2, Quantity = 2, UnitCost = 1.20m }] });
        Assert.Equal(9.90m, result.Total);
        Assert.Equal(7.50m, result.Details[0].Subtotal);
        Assert.Equal(2.40m, result.Details[1].Subtotal);
        Assert.Equal(2, result.Details.Count);
        Assert.Equal(PurchaseStatus.Pending, result.Status);
        Assert.Null(result.ReceivedAt);
        Assert.All(repository.Products, p => Assert.Equal(5, p.Stock));
    }
    [Fact]
    public async Task MissingSupplierOrProduct_DoesNotSave()
    {
        await Assert.ThrowsAsync<SupplierNotFoundException>(() => Service.CreateAsync(Input(supplier: 999)));
        await Assert.ThrowsAsync<ProductNotFoundException>(() => Service.CreateAsync(Input(product: 999)));
        Assert.Empty(repository.Items);
    }
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(1000001)]
    [InlineData(null)]
    public async Task InvalidQuantity_IsRejected(int? quantity) => await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(Input(quantity: quantity)));
    [Theory]
    [InlineData("-1")]
    [InlineData("1.001")]
    [InlineData("100000000")]
    public async Task InvalidCost_IsRejected(string cost) => await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(Input(cost: decimal.Parse(cost, System.Globalization.CultureInfo.InvariantCulture))));
    [Fact]
    public async Task MissingCost_IsRejected() => await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(Input(cost: null)));
    [Fact]
    public async Task ZeroCost_IsAllowed() => Assert.Equal(0m, (await Service.CreateAsync(Input(cost: 0))).Total);
    [Fact]
    public async Task EmptyAndDuplicateDetails_AreRejected()
    {
        await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(new() { SupplierId = 1 }));
        await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(new() { SupplierId = 1, Details = [new() { ProductId = 1, Quantity = 1, UnitCost = 1 }, new() { ProductId = 1, Quantity = 2, UnitCost = 1 }] }));
        Assert.Empty(repository.Items);
    }
    [Fact]
    public async Task InactiveProducts_AreRejected()
    {
        repository.Products[0].IsActive = false;
        await Assert.ThrowsAsync<PurchaseConflictException>(() => Service.CreateAsync(Input()));
    }
    [Fact]
    public async Task GetAndList_ReturnRegisteredPurchase()
    {
        var result = await Service.CreateAsync(Input());
        Assert.Equal(result.Id, (await Service.GetAsync(result.Id)).Id);
        Assert.Equal(result.Total, Assert.Single(await Service.ListAsync()).Total);
        await Assert.ThrowsAsync<PurchaseNotFoundException>(() => Service.GetAsync(999));
    }
    private sealed class FakePurchases : IPurchaseRepository
    {
        public List<Product> Products { get; } = [new() { Id = 1, Code = "A", Name = "Cuaderno", Stock = 5 }, new() { Id = 2, Code = "B", Name = "Lápiz", Stock = 5 }];
        public List<Purchase> Items { get; } = [];
        public Task<bool> SupplierExistsAsync(int id, CancellationToken ct) => Task.FromResult(id == 1);
        public Task<List<Product>> ProductsAsync(int[] ids, CancellationToken ct) => Task.FromResult(Products.Where(p => ids.Contains(p.Id)).ToList());
        public Task<List<Purchase>> ListAsync(CancellationToken ct) => Task.FromResult(Items.ToList());
        public Task<Purchase?> FindAsync(int id, CancellationToken ct) => Task.FromResult(Items.SingleOrDefault(p => p.Id == id));
        public Task<Purchase> AddAsync(Purchase purchase, CancellationToken ct)
        {
            purchase.Id = Items.Count + 1; purchase.Supplier = new() { Id = 1, Name = "Proveedor" };
            for (var i = 0; i < purchase.Details.Count; i++) { purchase.Details[i].Id = i + 1; purchase.Details[i].Product = Products.Single(p => p.Id == purchase.Details[i].ProductId); }
            Items.Add(purchase); return Task.FromResult(purchase);
        }
        public Task<Purchase> ReceiveAsync(int id, CancellationToken ct) => throw new NotSupportedException("Recepción probada contra SQL Server real.");
    }
}
