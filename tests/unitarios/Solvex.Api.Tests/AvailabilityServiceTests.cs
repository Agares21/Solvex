using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Services;
using Xunit;

namespace Solvex.Api.Tests;

public sealed class AvailabilityServiceTests
{
    private readonly InventoryFake repository = new();
    private AvailabilityService Service => new(repository);
    private static AvailabilityInput Input(int id, int? quantity) => new() { Items = [new() { ProductId = id, Quantity = quantity }] };
    [Fact]
    public async Task SufficientQuantity_IncludingExactStock()
    {
        var result = await Service.CheckAsync(Input(1, 10));
        Assert.True(result.AllAvailable);
        var item = Assert.Single(result.Items);
        Assert.Equal(0, item.MissingQuantity);
        Assert.Equal(10, item.AvailableQuantity);
        Assert.True(item.IsSufficient);
    }
    [Fact]
    public async Task MultipleProducts_ReportInsufficientAndMissingUnits()
    {
        var result = await Service.CheckAsync(new() { Items = [new() { ProductId = 1, Quantity = 5 }, new() { ProductId = 2, Quantity = 5 }] });
        Assert.False(result.AllAvailable);
        Assert.True(result.Items[0].IsSufficient);
        Assert.False(result.Items[1].IsSufficient);
        Assert.Equal(3, result.Items[1].MissingQuantity);
    }
    [Fact]
    public async Task Check_DoesNotChangeStockOrCreateMovements()
    {
        var before = repository.Stock.ToArray();
        await Service.CheckAsync(Input(1, 5));
        await Service.CheckAsync(Input(1, 50));
        Assert.Equal(before, repository.Stock);
        Assert.Empty(repository.Movements);
        Assert.Equal(0, repository.AdjustCalls);
    }
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(null)]
    public async Task InvalidQuantities_AreRejected(int? quantity) => await Assert.ThrowsAsync<ValidationException>(() => Service.CheckAsync(Input(1, quantity)));
    [Fact]
    public async Task EmptyDuplicatesAndInvalidIds_AreRejected()
    {
        await Assert.ThrowsAsync<ValidationException>(() => Service.CheckAsync(new()));
        await Assert.ThrowsAsync<ValidationException>(() => Service.CheckAsync(Input(0, 1)));
        await Assert.ThrowsAsync<ValidationException>(() => Service.CheckAsync(new() { Items = [new() { ProductId = 1, Quantity = 1 }, new() { ProductId = 1, Quantity = 2 }] }));
        await Assert.ThrowsAsync<ValidationException>(() => Service.CheckAsync(new() { Items = Enumerable.Range(1, 101).Select(id => new AvailabilityItemInput { ProductId = id, Quantity = 1 }).ToList() }));
    }
    [Fact]
    public async Task UnknownProduct_IsNotTreatedAsZeroStock() => await Assert.ThrowsAsync<ProductNotFoundException>(() => Service.CheckAsync(Input(999, 1)));
    [Fact]
    public async Task InactiveProduct_IsUnavailableEvenWithStock()
    {
        repository.Stock[0] = repository.Stock[0] with { IsActive = false };
        var result = await Service.CheckAsync(Input(1, 2));
        Assert.False(result.AllAvailable);
        Assert.Equal(10, result.Items[0].AvailableQuantity);
        Assert.Equal(2, result.Items[0].MissingQuantity);
    }
}
