using Microsoft.EntityFrameworkCore;
using Solvex.Api.Data;
using Solvex.Api.Entities;
using Solvex.Api.Services;

namespace Solvex.Api.Repositories;

public interface IPurchaseRepository
{
    Task<bool> SupplierExistsAsync(int id, CancellationToken ct);
    Task<List<Product>> ProductsAsync(int[] ids, CancellationToken ct);
    Task<List<Purchase>> ListAsync(CancellationToken ct);
    Task<Purchase?> FindAsync(int id, CancellationToken ct);
    Task<Purchase> AddAsync(Purchase purchase, CancellationToken ct);
    Task<Purchase> ReceiveAsync(int id, CancellationToken ct);
}
public sealed class PurchaseRepository(SolvexDbContext db, IPurchaseInventory inventory) : IPurchaseRepository
{
    private IQueryable<Purchase> Query => db.Purchases.AsNoTracking().Include(p => p.Supplier).Include(p => p.Details).ThenInclude(d => d.Product);
    public Task<bool> SupplierExistsAsync(int id, CancellationToken ct) => db.Suppliers.AnyAsync(s => s.Id == id, ct);
    public Task<List<Product>> ProductsAsync(int[] ids, CancellationToken ct) => db.Products.AsNoTracking().Where(p => ids.Contains(p.Id)).ToListAsync(ct);
    public Task<List<Purchase>> ListAsync(CancellationToken ct) => db.Purchases.AsNoTracking().Include(p => p.Supplier).OrderByDescending(p => p.Id).ToListAsync(ct);
    public Task<Purchase?> FindAsync(int id, CancellationToken ct) => Query.SingleOrDefaultAsync(p => p.Id == id, ct);
    public async Task<Purchase> AddAsync(Purchase purchase, CancellationToken ct)
    {
        // Un SaveChanges guarda cabecera y detalles en una única transacción EF.
        db.Purchases.Add(purchase);
        await db.SaveChangesAsync(ct);
        return (await FindAsync(purchase.Id, ct))!;
    }
    public async Task<Purchase> ReceiveAsync(int id, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var now = DateTimeOffset.UtcNow;
        // Este UPDATE adquiere el bloqueo sobre la compra y reclama la recepción.
        // Otro receptor esperará y, tras el commit, afectará cero filas.
        var claimed = await db.Purchases.Where(p => p.Id == id && p.Status == PurchaseStatus.Pending)
            .ExecuteUpdateAsync(set => set.SetProperty(p => p.Status, PurchaseStatus.Received).SetProperty(p => p.ReceivedAt, now), ct);
        if (claimed == 0)
        {
            if (!await db.Purchases.AnyAsync(p => p.Id == id, ct)) throw new PurchaseNotFoundException();
            throw new PurchaseConflictException("La compra ya fue recibida.");
        }
        var details = await db.PurchaseDetails.AsNoTracking().Where(d => d.PurchaseId == id).OrderBy(d => d.ProductId).ToListAsync(ct);
        foreach (var detail in details)
            await inventory.ReceiveAsync(detail.ProductId, detail.Quantity, detail.Id, $"Recepción de compra #{id}", ct);
        var result = (await FindAsync(id, ct))!;
        await transaction.CommitAsync(ct);
        return result;
    }
}
