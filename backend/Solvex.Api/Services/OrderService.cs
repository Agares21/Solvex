using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;

namespace Solvex.Api.Services;

public sealed class OrderNotFoundException() : Exception("El pedido no existe.");

public interface IOrderService
{
    Task<IReadOnlyList<OrderSummaryDto>> ListAsync(CancellationToken ct = default);
    Task<OrderDto> GetAsync(int id, CancellationToken ct = default);
    Task<OrderDto> CreateAsync(OrderInput input, CancellationToken ct = default);
    Task<OrderDto> UpdateAsync(int id, OrderInput input, CancellationToken ct = default);
}

public sealed class OrderService(IOrderRepository repository) : IOrderService
{
    public async Task<IReadOnlyList<OrderSummaryDto>> ListAsync(CancellationToken ct = default) => (await repository.ListAsync(ct))
        .Select(o => new OrderSummaryDto(o.Id, o.CustomerId, o.Customer.Name, o.RegisteredAt, o.Status, o.Total)).ToList();
    public async Task<OrderDto> GetAsync(int id, CancellationToken ct = default) => Map(await repository.FindAsync(id, ct) ?? throw new OrderNotFoundException());
    public async Task<OrderDto> CreateAsync(OrderInput input, CancellationToken ct = default)
    {
        var prepared = await ValidateAndPrepareAsync(input, ct);
        var order = new Order { CustomerId = input.CustomerId, RegisteredAt = DateTimeOffset.UtcNow, Observations = Clean(input.Observations), Details = prepared };
        order.Total = order.Details.Sum(d => d.Subtotal);
        EnsureTotal(order.Total);
        return Map(await repository.AddAsync(order, ct));
    }
    public async Task<OrderDto> UpdateAsync(int id, OrderInput input, CancellationToken ct = default)
    {
        var prepared = await ValidateAndPrepareAsync(input, ct);
        var order = await repository.FindForUpdateAsync(id, ct) ?? throw new OrderNotFoundException();
        order.CustomerId = input.CustomerId;
        order.Observations = Clean(input.Observations);
        order.Details.Clear();
        order.Details.AddRange(prepared);
        order.Total = order.Details.Sum(d => d.Subtotal);
        EnsureTotal(order.Total);
        await repository.SaveAsync(ct);
        return Map(await repository.FindAsync(id, ct) ?? throw new OrderNotFoundException());
    }
    private async Task<List<OrderDetail>> ValidateAndPrepareAsync(OrderInput input, CancellationToken ct)
    {
        Validator.ValidateObject(input, new ValidationContext(input), true);
        foreach (var detail in input.Details)
        {
            if (detail is null) throw new ValidationException("Los detalles no pueden ser nulos.");
            Validator.ValidateObject(detail, new ValidationContext(detail), true);
        }
        var ids = input.Details.Select(d => d.ProductId).ToArray();
        if (ids.Distinct().Count() != ids.Length) throw new ValidationException("Selecciona cada producto una sola vez por pedido.");
        if (!await repository.CustomerExistsAsync(input.CustomerId, ct)) throw new CustomerNotFoundException();
        var products = await repository.ProductsAsync(ids, ct);
        if (products.Count != ids.Length) throw new ProductNotFoundException();
        var byId = products.ToDictionary(p => p.Id);
        return input.Details.Select(d => new OrderDetail { ProductId = d.ProductId, Quantity = d.Quantity!.Value,
            UnitPrice = byId[d.ProductId].Price, Subtotal = byId[d.ProductId].Price * d.Quantity.Value }).ToList();
    }
    private static void EnsureTotal(decimal total)
    {
        if (total > 9999999999999999.99m) throw new ValidationException("El total supera el importe máximo permitido.");
    }
    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static OrderDto Map(Order order) => new(order.Id, order.CustomerId, order.Customer.Name, order.RegisteredAt, order.Status, order.Observations, order.Total,
        order.Details.OrderBy(d => d.Id).Select(d => new OrderDetailDto(d.Id, d.ProductId, d.Product.Code, d.Product.Name, d.Quantity, d.UnitPrice, d.Subtotal)).ToList());
}
