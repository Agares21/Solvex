using Microsoft.EntityFrameworkCore;
using Solvex.Api.Data;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Services;

namespace Solvex.Api.Repositories;

public interface IInventoryRepository
{
    Task<List<StockDto>> GetStockAsync(int[]? ids, CancellationToken ct);
    Task<List<InventoryMovement>> GetMovementsAsync(int productId, CancellationToken ct);
    Task<InventoryMovement?> FindMovementAsync(long id, CancellationToken ct);
    Task<AdjustmentDto> AdjustAsync(int productId, MovementType type, int quantity, string reason, CancellationToken ct);
}

public sealed class InventoryRepository(SolvexDbContext db) : IInventoryRepository
{
    public Task<List<StockDto>> GetStockAsync(int[]? ids, CancellationToken ct)
    {
        var query = db.Products.AsNoTracking();
        if (ids is not null) query = query.Where(p => ids.Contains(p.Id));
        return query.OrderBy(p => p.Name).ThenBy(p => p.Id)
            .Select(p => new StockDto(p.Id, p.Code, p.Name, p.IsActive, p.Stock)).ToListAsync(ct);
    }
    public Task<List<InventoryMovement>> GetMovementsAsync(int productId, CancellationToken ct) =>
        db.InventoryMovements.AsNoTracking().Where(m => m.ProductId == productId)
            .OrderByDescending(m => m.RegisteredAt).ThenByDescending(m => m.Id).Take(50).ToListAsync(ct);
    public Task<InventoryMovement?> FindMovementAsync(long id, CancellationToken ct) =>
        db.InventoryMovements.AsNoTracking().SingleOrDefaultAsync(m => m.Id == id, ct);

    public async Task<AdjustmentDto> AdjustAsync(int productId, MovementType type, int quantity, string reason, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        // La condición y la suma se ejecutan en una sola sentencia UPDATE, bajo bloqueo SQL.
        // Nunca se calcula un saldo a partir de una lectura previa en memoria.
        var delta = type == MovementType.Entry ? quantity : -quantity;
        var eligible = db.Products.Where(p => p.Id == productId && p.IsActive);
        eligible = delta > 0 ? eligible.Where(p => p.Stock <= int.MaxValue - quantity)
            : eligible.Where(p => p.Stock >= quantity);
        var affected = await eligible.ExecuteUpdateAsync(update => update.SetProperty(p => p.Stock, p => p.Stock + delta), ct);
        if (affected == 0)
        {
            var product = await db.Products.AsNoTracking().SingleOrDefaultAsync(p => p.Id == productId, ct)
                ?? throw new ProductNotFoundException();
            throw new InventoryConflictException(!product.IsActive ? "No se permiten movimientos sobre productos inactivos."
                : delta < 0 ? "Stock insuficiente para registrar la salida." : "La entrada supera el límite de existencias permitido.");
        }
        var movement = new InventoryMovement { ProductId = productId, Type = type, Quantity = quantity, Reason = reason, RegisteredAt = DateTimeOffset.UtcNow };
        db.InventoryMovements.Add(movement);
        await db.SaveChangesAsync(ct);
        var stock = await db.Products.Where(p => p.Id == productId).Select(p => p.Stock).SingleAsync(ct);
        await transaction.CommitAsync(ct);
        return new(new MovementDto(movement.Id, movement.ProductId, movement.Type, movement.Quantity, movement.Reason, movement.RegisteredAt), stock);
    }
}
