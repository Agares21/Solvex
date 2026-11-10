using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;
using Solvex.Api.Services;
using Xunit;

namespace Solvex.Api.Tests;

public sealed class InventoryServiceTests
{
    private readonly InventoryFake repository = new();
    private InventoryService Service => new(repository);
    [Fact]
    public async Task Entry_IncreasesStockAndRecordsReasonAndDate()
    {
        var result = await Service.AdjustAsync(1, new() { Type = MovementType.Entry, Quantity = 5, Reason = " Compra recibida " });
        Assert.Equal(15, result.CurrentStock);
        Assert.Equal("Compra recibida", result.Movement.Reason);
        Assert.Equal(5, result.Movement.Quantity);
        Assert.Equal(MovementType.Entry, result.Movement.Type);
        Assert.Equal(TimeSpan.Zero, result.Movement.RegisteredAt.Offset);
        Assert.Single(repository.Movements);
    }
    [Fact]
    public async Task Exit_DecreasesStock()
    {
        var result = await Service.AdjustAsync(1, new() { Type = MovementType.Exit, Quantity = 4, Reason = "Ajuste de conteo" });
        Assert.Equal(6, result.CurrentStock);
        Assert.Equal(MovementType.Exit, result.Movement.Type);
    }
    [Theory]
    [InlineData(0, "Motivo", MovementType.Entry)]
    [InlineData(-1, "Motivo", MovementType.Exit)]
    [InlineData(1, " ", MovementType.Entry)]
    [InlineData(1, "Motivo", (MovementType)99)]
    public async Task RejectsInvalidMovements(int quantity, string reason, MovementType type)
    {
        await Assert.ThrowsAsync<ValidationException>(() => Service.AdjustAsync(1, new() { Type = type, Quantity = quantity, Reason = reason }));
        Assert.Empty(repository.Movements);
        Assert.Equal(10, repository.Stock[0].Stock);
        Assert.Equal(0, repository.AdjustCalls);
    }
    [Fact]
    public async Task RejectsMissingFieldsAndLongReason()
    {
        await Assert.ThrowsAsync<ValidationException>(() => Service.AdjustAsync(1, new() { Reason = "Motivo" }));
        await Assert.ThrowsAsync<ValidationException>(() => Service.AdjustAsync(1, new() { Type = MovementType.Entry, Quantity = 1, Reason = new string('A', 301) }));
    }
    [Fact]
    public async Task NegativeStock_IsRejectedAndHistoryUnchanged()
    {
        await Assert.ThrowsAsync<InventoryConflictException>(() => Service.AdjustAsync(1, new() { Type = MovementType.Exit, Quantity = 11, Reason = "Salida" }));
        Assert.Equal(10, (await Service.GetAsync(1)).Stock);
        Assert.Empty(await Service.MovementsAsync(1));
    }
    [Fact]
    public async Task Movements_CanBeQueried()
    {
        var adjustment = await Service.AdjustAsync(1, new() { Type = MovementType.Entry, Quantity = 1, Reason = "Conteo" });
        Assert.Equal(adjustment.Movement, Assert.Single(await Service.MovementsAsync(1)));
        Assert.Equal(adjustment.Movement, await Service.GetMovementAsync(adjustment.Movement.Id));
    }
    [Fact]
    public async Task MissingProductsAndMovements_AreReported()
    {
        await Assert.ThrowsAsync<ProductNotFoundException>(() => Service.GetAsync(999));
        await Assert.ThrowsAsync<ProductNotFoundException>(() => Service.MovementsAsync(999));
        await Assert.ThrowsAsync<ProductNotFoundException>(() => Service.AdjustAsync(999, new() { Type = MovementType.Entry, Quantity = 1, Reason = "Conteo" }));
        await Assert.ThrowsAsync<MovementNotFoundException>(() => Service.GetMovementAsync(999));
    }
    [Fact]
    public async Task InactiveProduct_RejectsMovements()
    {
        repository.Stock[0] = repository.Stock[0] with { IsActive = false };
        await Assert.ThrowsAsync<InventoryConflictException>(() => Service.AdjustAsync(1, new() { Type = MovementType.Entry, Quantity = 1, Reason = "Conteo" }));
        Assert.Empty(repository.Movements);
    }
}

// Sustituto de acceso a datos para pruebas de servicio. La atomicidad SQL se prueba
// por separado con sprint1-smoke.mjs contra SQL Server real.
internal sealed class InventoryFake : IInventoryRepository
{
    public List<StockDto> Stock { get; } = [new(1, "CUA", "Cuaderno", true, 10), new(2, "LAP", "Lápiz", true, 2)];
    public List<InventoryMovement> Movements { get; } = [];
    public int AdjustCalls { get; private set; }
    public Task<List<StockDto>> GetStockAsync(int[]? ids, CancellationToken ct) => Task.FromResult(Stock.Where(p => ids is null || ids.Contains(p.ProductId)).ToList());
    public Task<List<InventoryMovement>> GetMovementsAsync(int id, CancellationToken ct) => Task.FromResult(Movements.Where(m => m.ProductId == id).OrderByDescending(m => m.Id).Take(50).ToList());
    public Task<InventoryMovement?> FindMovementAsync(long id, CancellationToken ct) => Task.FromResult(Movements.SingleOrDefault(m => m.Id == id));
    public Task<AdjustmentDto> AdjustAsync(int id, MovementType type, int quantity, string reason, CancellationToken ct)
    {
        AdjustCalls++;
        var index = Stock.FindIndex(p => p.ProductId == id);
        if (index < 0) throw new ProductNotFoundException();
        var p = Stock[index];
        var delta = type == MovementType.Entry ? quantity : -quantity;
        if (!p.IsActive || (long)p.Stock + delta < 0 || (long)p.Stock + delta > int.MaxValue) throw new InventoryConflictException("Ajuste no permitido.");
        Stock[index] = p with { Stock = p.Stock + delta };
        var movement = new InventoryMovement { Id = Movements.Count + 1, ProductId = id, Type = type, Quantity = quantity, Reason = reason, RegisteredAt = DateTimeOffset.UtcNow };
        Movements.Add(movement);
        return Task.FromResult(new AdjustmentDto(new(movement.Id, id, type, quantity, reason, movement.RegisteredAt), Stock[index].Stock));
    }
}
