using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;

namespace Solvex.Api.Services;

public sealed class InventoryConflictException(string message) : Exception(message);
public sealed class MovementNotFoundException() : Exception("El movimiento no existe.");

public sealed class InventoryService(IInventoryRepository repository)
{
    public async Task<IReadOnlyList<StockDto>> ListAsync(CancellationToken ct = default) => await repository.GetStockAsync(null, ct);
    public async Task<StockDto> GetAsync(int id, CancellationToken ct = default) =>
        (await repository.GetStockAsync([id], ct)).SingleOrDefault() ?? throw new ProductNotFoundException();
    public async Task<IReadOnlyList<MovementDto>> MovementsAsync(int id, CancellationToken ct = default)
    {
        await GetAsync(id, ct);
        return (await repository.GetMovementsAsync(id, ct)).Select(Map).ToList();
    }
    public async Task<MovementDto> GetMovementAsync(long id, CancellationToken ct = default) =>
        Map(await repository.FindMovementAsync(id, ct) ?? throw new MovementNotFoundException());
    public Task<AdjustmentDto> AdjustAsync(int id, MovementInput input, CancellationToken ct = default)
    {
        Validator.ValidateObject(input, new ValidationContext(input), true);
        return repository.AdjustAsync(id, input.Type!.Value, input.Quantity!.Value, input.Reason.Trim(), ct);
    }
    internal static MovementDto Map(InventoryMovement m) => new(m.Id, m.ProductId, m.Type, m.Quantity, m.Reason, m.RegisteredAt);
}
