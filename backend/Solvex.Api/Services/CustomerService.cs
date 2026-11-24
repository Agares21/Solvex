using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;

namespace Solvex.Api.Services;

public sealed class CustomerNotFoundException() : Exception("El cliente no existe.");

public interface ICustomerService
{
    Task<IReadOnlyList<CustomerDto>> ListAsync(CancellationToken ct = default);
    Task<CustomerDto> GetAsync(int id, CancellationToken ct = default);
    Task<CustomerDto> CreateAsync(CustomerInput input, CancellationToken ct = default);
    Task<CustomerDto> UpdateAsync(int id, CustomerInput input, CancellationToken ct = default);
    Task<CustomerHistoryDto> HistoryAsync(int id, CancellationToken ct = default);
}

public sealed class CustomerService(ICustomerRepository repository) : ICustomerService
{
    public async Task<IReadOnlyList<CustomerDto>> ListAsync(CancellationToken ct = default) => (await repository.ListAsync(ct)).Select(Map).ToList();
    public async Task<CustomerDto> GetAsync(int id, CancellationToken ct = default) => Map(await RequiredAsync(id, ct));
    public async Task<CustomerDto> CreateAsync(CustomerInput input, CancellationToken ct = default)
    {
        Validator.ValidateObject(input, new ValidationContext(input), true);
        var customer = new Customer { Name = input.Name.Trim(), Phone = Clean(input.Phone), Email = Clean(input.Email) };
        if (customer.Name.Length == 0) throw new ValidationException("El nombre del cliente es obligatorio.");
        await repository.AddAsync(customer, ct);
        await repository.SaveAsync(ct);
        return Map(customer);
    }
    public async Task<CustomerDto> UpdateAsync(int id, CustomerInput input, CancellationToken ct = default)
    {
        Validator.ValidateObject(input, new ValidationContext(input), true);
        var customer = await RequiredAsync(id, ct);
        customer.Name = input.Name.Trim(); customer.Phone = Clean(input.Phone); customer.Email = Clean(input.Email);
        if (customer.Name.Length == 0) throw new ValidationException("El nombre del cliente es obligatorio.");
        await repository.SaveAsync(ct);
        return Map(customer);
    }
    public async Task<CustomerHistoryDto> HistoryAsync(int id, CancellationToken ct = default)
    {
        var customer = await repository.FindWithHistoryAsync(id, ct) ?? throw new CustomerNotFoundException();
        var orders = customer.Orders.OrderByDescending(o => o.Id).Select(o => new CustomerOrderHistoryDto(o.Id, o.RegisteredAt, o.Status.ToString(), o.Total)).ToList();
        var mockups = customer.Mockups.OrderByDescending(m => m.Id).Select(m => {
            var paid = m.Payments.Sum(p => p.Amount);
            return new CustomerMockupHistoryDto(m.Id, m.Institution, m.Type, m.Status.ToString(), m.RequestedAt, m.DeliveryAt, m.AgreedPrice, paid, m.AgreedPrice - paid);
        }).ToList();
        return new CustomerHistoryDto(Map(customer), orders, mockups);
    }
    private async Task<Customer> RequiredAsync(int id, CancellationToken ct) => await repository.FindAsync(id, ct) ?? throw new CustomerNotFoundException();
    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    internal static CustomerDto Map(Customer customer) => new(customer.Id, customer.Name, customer.Phone, customer.Email);
}
