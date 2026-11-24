using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;
using Solvex.Api.Services;
using Xunit;

namespace Solvex.Api.Tests;

public sealed class OrderServiceTests
{
    private readonly FakeOrders repository = new();
    private OrderService Service => new(repository);
    private static OrderInput Input(int customerId = 1, int productId = 1, int? quantity = 2) => new()
    { CustomerId = customerId, Observations = "Entrega por la tarde", Details = [new() { ProductId = productId, Quantity = quantity }] };

    [Fact]
    public async Task Create_CalculatesTotalUsingPersistedProductPrice()
    {
        var result = await Service.CreateAsync(Input());
        Assert.Equal(25m, result.Total);
        Assert.Equal(12.50m, Assert.Single(result.Details).UnitPrice);
        Assert.Equal("Entrega por la tarde", result.Observations);
        Assert.Equal(OrderStatus.Pending, result.Status);
    }
    [Fact]
    public async Task Create_RejectsUnknownCustomerOrProduct()
    {
        await Assert.ThrowsAsync<CustomerNotFoundException>(() => Service.CreateAsync(Input(customerId: 99)));
        await Assert.ThrowsAsync<ProductNotFoundException>(() => Service.CreateAsync(Input(productId: 99)));
        Assert.Empty(repository.Items);
    }
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(1000001)]
    public async Task Create_RejectsInvalidQuantity(int quantity) => await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(Input(quantity: quantity)));
    [Fact]
    public async Task GetAndUpdate_ReturnOrderWithItsDetails()
    {
        var created = await Service.CreateAsync(Input());
        var updated = await Service.UpdateAsync(created.Id, new() { CustomerId = 1, Details = [new() { ProductId = 2, Quantity = 3 }] });
        Assert.Equal(15m, updated.Total);
        Assert.Equal(2, Assert.Single(updated.Details).ProductId);
        Assert.Equal(created.Id, (await Service.GetAsync(created.Id)).Id);
    }
    private sealed class FakeOrders : IOrderRepository
    {
        public List<Product> Products { get; } = [new() { Id = 1, Code = "CUA", Name = "Cuaderno", Price = 12.50m }, new() { Id = 2, Code = "LAP", Name = "Lápiz", Price = 5m }];
        public List<Order> Items { get; } = [];
        public Task<bool> CustomerExistsAsync(int id, CancellationToken ct) => Task.FromResult(id == 1);
        public Task<List<Product>> ProductsAsync(int[] ids, CancellationToken ct) => Task.FromResult(Products.Where(p => ids.Contains(p.Id)).ToList());
        public Task<List<Order>> ListAsync(CancellationToken ct) => Task.FromResult(Items.ToList());
        public Task<Order?> FindAsync(int id, CancellationToken ct) => Task.FromResult(Items.SingleOrDefault(o => o.Id == id));
        public Task<Order?> FindForUpdateAsync(int id, CancellationToken ct) => FindAsync(id, ct);
        public Task<Order> AddAsync(Order order, CancellationToken ct)
        {
            order.Id = Items.Count + 1; order.Customer = new() { Id = 1, Name = "María López" };
            for (var i = 0; i < order.Details.Count; i++) { order.Details[i].Id = i + 1; order.Details[i].Product = Products.Single(p => p.Id == order.Details[i].ProductId); }
            Items.Add(order); return Task.FromResult(order);
        }
        public Task SaveAsync(CancellationToken ct)
        {
            foreach (var order in Items) foreach (var detail in order.Details) detail.Product = Products.Single(p => p.Id == detail.ProductId);
            return Task.CompletedTask;
        }
    }
}
