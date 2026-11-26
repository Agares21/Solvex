using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;
using Solvex.Api.Services;
using Xunit;

namespace Solvex.Api.Tests;

public sealed class CustomerServiceTests
{
    private readonly FakeCustomers repository = new();
    private CustomerService Service => new(repository);

    [Fact]
    public async Task CreateAndUpdate_NormalizesCustomerData()
    {
        var created = await Service.CreateAsync(new() { Name = "  María López ", Phone = " 70000000 " });
        var updated = await Service.UpdateAsync(created.Id, new() { Name = "María López", Email = "maria@example.com" });
        Assert.Equal("María López", updated.Name);
        Assert.Equal("maria@example.com", updated.Email);
        Assert.Null(updated.Phone);
    }
    [Fact]
    public async Task History_OnlyReturnsTheRequestedCustomersRecords()
    {
        var customer = new Customer { Id = 2, Name = "Ana" };
        customer.Orders.Add(new Order { Id = 7, CustomerId = 2, RegisteredAt = DateTimeOffset.UtcNow, Total = 30m });
        customer.Mockups.Add(new Mockup { Id = 3, CustomerId = 2, Institution = "Colegio", Type = "Escolar", Size = "Pequeña", DeliveryAt = DateTimeOffset.UtcNow.AddDays(1), RequestedAt = DateTimeOffset.UtcNow, StatusUpdatedAt = DateTimeOffset.UtcNow, AgreedPrice = 100m, Payments = [new() { Amount = 40m }] });
        repository.History = customer;
        var history = await Service.HistoryAsync(2);
        Assert.Equal(2, history.Customer.Id);
        Assert.Equal(7, Assert.Single(history.Orders).Id);
        Assert.Equal(60m, Assert.Single(history.Mockups).PendingBalance);
        await Assert.ThrowsAsync<CustomerNotFoundException>(() => Service.HistoryAsync(99));
    }
    [Fact]
    public async Task History_ListsMostRecentFirstWithStatusNamesUsedByTheFrontend()
    {
        var now = DateTimeOffset.UtcNow;
        var customer = new Customer { Id = 5, Name = "Juan Pérez" };
        customer.Orders.Add(new Order { Id = 3, CustomerId = 5, RegisteredAt = now.AddDays(-3), Status = OrderStatus.Delivered, Total = 10m });
        customer.Orders.Add(new Order { Id = 8, CustomerId = 5, RegisteredAt = now, Status = OrderStatus.Pending, Total = 25m });
        customer.Mockups.Add(new Mockup { Id = 2, CustomerId = 5, Institution = "Colegio", Type = "Escolar", Size = "Pequeña", DeliveryAt = now.AddDays(5), RequestedAt = now.AddDays(-2), StatusUpdatedAt = now, AgreedPrice = 90m, Status = MockupStatus.Cancelled });
        customer.Mockups.Add(new Mockup { Id = 6, CustomerId = 5, Institution = "Unidad Educativa", Type = "Educativa", Size = "Grande", DeliveryAt = now.AddDays(9), RequestedAt = now, StatusUpdatedAt = now, AgreedPrice = 150m, Status = MockupStatus.Delivered, Payments = [new() { Amount = 150m }] });
        repository.History = customer;

        var history = await Service.HistoryAsync(5);

        Assert.Equal([8, 3], history.Orders.Select(o => o.Id));
        Assert.Equal(["Pending", "Delivered"], history.Orders.Select(o => o.Status));
        Assert.Equal([6, 2], history.Mockups.Select(m => m.Id));
        Assert.Equal(["Delivered", "Cancelled"], history.Mockups.Select(m => m.Status));
        Assert.Equal(0m, history.Mockups[0].PendingBalance);
    }
    [Fact]
    public async Task History_CustomerWithoutRequestsReturnsEmptyLists()
    {
        repository.History = new Customer { Id = 9, Name = "Cliente nuevo", Phone = "71111111" };
        var history = await Service.HistoryAsync(9);
        Assert.Equal("71111111", history.Customer.Phone);
        Assert.Empty(history.Orders);
        Assert.Empty(history.Mockups);
    }
    private sealed class FakeCustomers : ICustomerRepository
    {
        public List<Customer> Items { get; } = [];
        public Customer? History { get; set; }
        public Task<List<Customer>> ListAsync(CancellationToken ct) => Task.FromResult(Items.ToList());
        public Task<Customer?> FindAsync(int id, CancellationToken ct) => Task.FromResult(Items.SingleOrDefault(c => c.Id == id));
        public Task<Customer?> FindWithHistoryAsync(int id, CancellationToken ct) => Task.FromResult(History?.Id == id ? History : null);
        public Task AddAsync(Customer customer, CancellationToken ct) { customer.Id = Items.Count + 1; Items.Add(customer); return Task.CompletedTask; }
        public Task SaveAsync(CancellationToken ct) => Task.CompletedTask;
    }
}
