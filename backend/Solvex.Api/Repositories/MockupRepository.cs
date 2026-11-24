using System.Data;
using Microsoft.EntityFrameworkCore;
using Solvex.Api.Data;
using Solvex.Api.Entities;
using Solvex.Api.Services;

namespace Solvex.Api.Repositories;

public interface IMockupRepository
{
    Task<bool> CustomerExistsAsync(int id, CancellationToken ct);
    Task<List<Mockup>> ListAsync(CancellationToken ct);
    Task<Mockup?> FindAsync(int id, CancellationToken ct);
    Task<Mockup?> FindForUpdateAsync(int id, CancellationToken ct);
    Task<Mockup> AddAsync(Mockup mockup, CancellationToken ct);
    Task<Mockup> AddPaymentAsync(int id, decimal amount, string? note, CancellationToken ct);
    Task SaveAsync(CancellationToken ct);
}

public sealed class MockupRepository(SolvexDbContext db) : IMockupRepository
{
    private IQueryable<Mockup> Query => db.Mockups.AsNoTracking().Include(m => m.Customer).Include(m => m.Payments);
    public Task<bool> CustomerExistsAsync(int id, CancellationToken ct) => db.Customers.AnyAsync(c => c.Id == id, ct);
    public Task<List<Mockup>> ListAsync(CancellationToken ct) => Query.OrderByDescending(m => m.Id).ToListAsync(ct);
    public Task<Mockup?> FindAsync(int id, CancellationToken ct) => Query.SingleOrDefaultAsync(m => m.Id == id, ct);
    public Task<Mockup?> FindForUpdateAsync(int id, CancellationToken ct) => db.Mockups.Include(m => m.Payments).SingleOrDefaultAsync(m => m.Id == id, ct);
    public async Task<Mockup> AddAsync(Mockup mockup, CancellationToken ct)
    {
        db.Mockups.Add(mockup);
        await db.SaveChangesAsync(ct);
        return (await FindAsync(mockup.Id, ct))!;
    }
    public async Task<Mockup> AddPaymentAsync(int id, decimal amount, string? note, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var mockup = await db.Mockups.Include(m => m.Payments).SingleOrDefaultAsync(m => m.Id == id, ct) ?? throw new MockupNotFoundException();
        var paid = mockup.Payments.Sum(p => p.Amount);
        if (amount > mockup.AgreedPrice - paid) throw new PaymentConflictException("El pago supera el saldo pendiente de la maqueta.");
        mockup.Payments.Add(new MockupPayment { Amount = amount, Note = note, PaidAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return (await FindAsync(id, ct))!;
    }
    public Task SaveAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
