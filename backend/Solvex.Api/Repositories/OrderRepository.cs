using Microsoft.EntityFrameworkCore;
using Solvex.Api.Data;
using Solvex.Api.Entities;

namespace Solvex.Api.Repositories;

public interface IOrderRepository
{
    Task<bool> CustomerExistsAsync(int id, CancellationToken ct);
    Task<List<Product>> ProductsAsync(int[] ids, CancellationToken ct);
    Task<List<Order>> ListAsync(CancellationToken ct);
    Task<Order?> FindAsync(int id, CancellationToken ct);
    Task<Order?> FindForUpdateAsync(int id, CancellationToken ct);
    Task<Order> AddAsync(Order order, CancellationToken ct);
    Task SaveAsync(CancellationToken ct);
}

public sealed class OrderRepository(SolvexDbContext db) : IOrderRepository
{
    private IQueryable<Order> Query => db.Orders.AsNoTracking().Include(o => o.Customer).Include(o => o.Details).ThenInclude(d => d.Product);
    public Task<bool> CustomerExistsAsync(int id, CancellationToken ct) => db.Customers.AnyAsync(c => c.Id == id, ct);
    public Task<List<Product>> ProductsAsync(int[] ids, CancellationToken ct) => db.Products.AsNoTracking().Where(p => ids.Contains(p.Id)).ToListAsync(ct);
    public Task<List<Order>> ListAsync(CancellationToken ct) => db.Orders.AsNoTracking().Include(o => o.Customer).OrderByDescending(o => o.Id).ToListAsync(ct);
    public Task<Order?> FindAsync(int id, CancellationToken ct) => Query.SingleOrDefaultAsync(o => o.Id == id, ct);
    public Task<Order?> FindForUpdateAsync(int id, CancellationToken ct) => db.Orders.Include(o => o.Details).SingleOrDefaultAsync(o => o.Id == id, ct);
    public async Task<Order> AddAsync(Order order, CancellationToken ct)
    {
        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);
        return (await FindAsync(order.Id, ct))!;
    }
    public Task SaveAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
