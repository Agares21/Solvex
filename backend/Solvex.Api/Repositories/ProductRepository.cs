using Microsoft.EntityFrameworkCore;
using Solvex.Api.Data;
using Solvex.Api.Entities;

namespace Solvex.Api.Repositories;

public interface IProductRepository
{
    Task<List<Product>> ListAsync(CancellationToken ct);
    Task<Product?> FindAsync(int id, CancellationToken ct);
    Task<bool> CodeExistsAsync(string code, int? exceptId, CancellationToken ct);
    Task AddAsync(Product product, CancellationToken ct);
    Task SaveAsync(CancellationToken ct);
}

public sealed class ProductRepository(SolvexDbContext db) : IProductRepository
{
    public Task<List<Product>> ListAsync(CancellationToken ct) => db.Products.AsNoTracking().OrderBy(p => p.Name).ThenBy(p => p.Id).ToListAsync(ct);
    public Task<Product?> FindAsync(int id, CancellationToken ct) => db.Products.SingleOrDefaultAsync(p => p.Id == id, ct);
    public Task<bool> CodeExistsAsync(string code, int? exceptId, CancellationToken ct) => db.Products.AnyAsync(p => p.Code == code && p.Id != exceptId, ct);
    public async Task AddAsync(Product product, CancellationToken ct) => await db.Products.AddAsync(product, ct);
    public async Task SaveAsync(CancellationToken ct) => await db.SaveChangesAsync(ct);
}
