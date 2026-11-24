using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;
using Solvex.Api.Services;
using Xunit;

namespace Solvex.Api.Tests;

public sealed class MockupServiceTests
{
    private readonly FakeMockups repository = new();
    private MockupService Service => new(repository);
    private static MockupInput Input(int customerId = 1, DateTimeOffset? deliveryAt = null) => new()
    { CustomerId = customerId, Institution = "Colegio San Calixto", Type = "Educativa", Size = "Mediana", DeliveryAt = deliveryAt ?? DateTimeOffset.UtcNow.AddDays(2), AgreedPrice = 200m, Observations = "Sistema solar" };

    [Fact]
    public async Task Create_RegistersRequestForExistingCustomer()
    {
        var result = await Service.CreateAsync(Input());
        Assert.Equal("Colegio San Calixto", result.Institution);
        Assert.Equal(200m, result.PendingBalance);
        Assert.Equal(MockupStatus.Requested, result.Status);
    }
    [Fact]
    public async Task Create_RejectsUnknownCustomerAndPastDelivery()
    {
        await Assert.ThrowsAsync<CustomerNotFoundException>(() => Service.CreateAsync(Input(customerId: 99)));
        await Assert.ThrowsAsync<ValidationException>(() => Service.CreateAsync(Input(deliveryAt: DateTimeOffset.UtcNow.AddMinutes(-1))));
    }
    [Fact]
    public async Task Payments_CalculateBalanceAndRejectExcess()
    {
        var created = await Service.CreateAsync(Input());
        var paid = await Service.AddPaymentAsync(created.Id, new() { Amount = 75m, Note = "Anticipo" });
        Assert.Equal(75m, paid.TotalPaid);
        Assert.Equal(125m, paid.PendingBalance);
        await Assert.ThrowsAsync<PaymentConflictException>(() => Service.AddPaymentAsync(created.Id, new() { Amount = 126m }));
    }
    [Fact]
    public async Task Status_OnlyAllowsForwardTransitions()
    {
        var created = await Service.CreateAsync(Input());
        await Assert.ThrowsAsync<MockupStatusConflictException>(() => Service.UpdateStatusAsync(created.Id, new() { Status = MockupStatus.Completed }));
        var started = await Service.UpdateStatusAsync(created.Id, new() { Status = MockupStatus.InProgress });
        Assert.Equal(MockupStatus.InProgress, started.Status);
        Assert.Equal(MockupStatus.Completed, (await Service.UpdateStatusAsync(created.Id, new() { Status = MockupStatus.Completed })).Status);
    }
    private sealed class FakeMockups : IMockupRepository
    {
        public List<Mockup> Items { get; } = [];
        public Task<bool> CustomerExistsAsync(int id, CancellationToken ct) => Task.FromResult(id == 1);
        public Task<List<Mockup>> ListAsync(CancellationToken ct) => Task.FromResult(Items.ToList());
        public Task<Mockup?> FindAsync(int id, CancellationToken ct) => Task.FromResult(Items.SingleOrDefault(m => m.Id == id));
        public Task<Mockup?> FindForUpdateAsync(int id, CancellationToken ct) => FindAsync(id, ct);
        public Task<Mockup> AddAsync(Mockup mockup, CancellationToken ct) { mockup.Id = Items.Count + 1; mockup.Customer = new() { Id = 1, Name = "María López" }; Items.Add(mockup); return Task.FromResult(mockup); }
        public async Task<Mockup> AddPaymentAsync(int id, decimal amount, string? note, CancellationToken ct)
        {
            var mockup = await FindAsync(id, ct) ?? throw new MockupNotFoundException();
            if (amount > mockup.AgreedPrice - mockup.Payments.Sum(p => p.Amount)) throw new PaymentConflictException("El pago supera el saldo pendiente de la maqueta.");
            mockup.Payments.Add(new() { Id = mockup.Payments.Count + 1, Amount = amount, Note = note, PaidAt = DateTimeOffset.UtcNow });
            return mockup;
        }
        public Task SaveAsync(CancellationToken ct) => Task.CompletedTask;
    }
}
