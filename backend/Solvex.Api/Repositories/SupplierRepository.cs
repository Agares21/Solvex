using Microsoft.EntityFrameworkCore;
using Solvex.Api.Data;
using Solvex.Api.Entities;

namespace Solvex.Api.Repositories;

public interface ISupplierRepository
{
    Task<List<Supplier>> ListAsync(string? search, CancellationToken ct);
    Task<Supplier?> FindAsync(int id, CancellationToken ct);
    Task<bool> IdentifierExistsAsync(string identifier, CancellationToken ct);
    Task AddAsync(Supplier supplier, CancellationToken ct);
}
public sealed class SupplierRepository(SolvexDbContext db) : ISupplierRepository
{
    public Task<List<Supplier>> ListAsync(string? search, CancellationToken ct)
    {
        var query = db.Suppliers.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(s => s.Name.Contains(search) || s.Identifier.Contains(search));
        return query.OrderBy(s => s.Name).ThenBy(s => s.Id).ToListAsync(ct);
    }
    public Task<Supplier?> FindAsync(int id, CancellationToken ct) => db.Suppliers.AsNoTracking().SingleOrDefaultAsync(s => s.Id == id, ct);
    public Task<bool> IdentifierExistsAsync(string identifier, CancellationToken ct) => db.Suppliers.AnyAsync(s => s.Identifier == identifier, ct);
    public async Task AddAsync(Supplier supplier, CancellationToken ct) { db.Suppliers.Add(supplier); await db.SaveChangesAsync(ct); }
}
