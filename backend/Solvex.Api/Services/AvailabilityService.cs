using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Repositories;

namespace Solvex.Api.Services;

public interface IAvailabilityService
{
    Task<AvailabilityDto> CheckAsync(AvailabilityInput input, CancellationToken ct = default);
}

// Consulta reutilizable por pedidos; no guarda, reserva ni descuenta existencias.
public sealed class AvailabilityService(IInventoryRepository repository) : IAvailabilityService
{
    public async Task<AvailabilityDto> CheckAsync(AvailabilityInput input, CancellationToken ct = default)
    {
        Validator.ValidateObject(input, new ValidationContext(input), true);
        foreach (var item in input.Items)
        {
            if (item is null) throw new ValidationException("Los productos solicitados no pueden ser nulos.");
            Validator.ValidateObject(item, new ValidationContext(item), true);
        }
        var ids = input.Items.Select(i => i.ProductId).ToArray();
        if (ids.Distinct().Count() != ids.Length) throw new ValidationException("Selecciona cada producto una sola vez.");
        var stock = (await repository.GetStockAsync(ids, ct)).ToDictionary(p => p.ProductId);
        if (stock.Count != ids.Length) throw new ProductNotFoundException();
        var result = input.Items.Select(item => {
            var p = stock[item.ProductId];
            var quantity = item.Quantity!.Value;
            return new AvailabilityItemDto(p.ProductId, p.Code, p.Name, p.IsActive, quantity, p.Stock,
                p.IsActive && p.Stock >= quantity, p.IsActive ? Math.Max(0, quantity - p.Stock) : quantity);
        }).ToList();
        return new(result.All(p => p.IsSufficient), result);
    }
}
