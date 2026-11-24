using Microsoft.EntityFrameworkCore;
using Solvex.Api.Data;
using Solvex.Api.Entities;

namespace Solvex.Api.Repositories;

public interface ICustomerRepository
{
    Task<List<Customer>> ListAsync(CancellationToken ct);
    Task<Customer?> FindAsync(int id, CancellationToken ct);
    Task<Customer?> FindWithHistoryAsync(int id, CancellationToken ct);
    Task AddAsync(Customer customer, CancellationToken ct);
    Task SaveAsync(CancellationToken ct);
}

public sealed class CustomerRepository(SolvexDbContext db) : ICustomerRepository
{
    public Task<List<Customer>> ListAsync(CancellationToken ct) => db.Customers.AsNoTracking().OrderBy(c => c.Name).ThenBy(c => c.Id).ToListAsync(ct);
    public Task<Customer?> FindAsync(int id, CancellationToken ct) => db.Customers.SingleOrDefaultAsync(c => c.Id == id, ct);
    public Task<Customer?> FindWithHistoryAsync(int id, CancellationToken ct) => db.Customers.AsNoTracking().AsSplitQuery()
        .Include(c => c.Orders).ThenInclude(o => o.Details)
        .Include(c => c.Mockups).ThenInclude(m => m.Payments)
        .SingleOrDefaultAsync(c => c.Id == id, ct);
    public async Task AddAsync(Customer customer, CancellationToken ct) => await db.Customers.AddAsync(customer, ct);
    public Task SaveAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
