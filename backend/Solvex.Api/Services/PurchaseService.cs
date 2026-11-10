using System.ComponentModel.DataAnnotations;
using Solvex.Api.DTOs;
using Solvex.Api.Entities;
using Solvex.Api.Repositories;

namespace Solvex.Api.Services;

public sealed class PurchaseNotFoundException() : Exception("La compra no existe.");
public sealed class PurchaseConflictException(string message) : Exception(message);

public sealed class PurchaseService(IPurchaseRepository repository)
{
    public async Task<IReadOnlyList<PurchaseSummaryDto>> ListAsync(CancellationToken ct = default) => (await repository.ListAsync(ct))
        .Select(p => new PurchaseSummaryDto(p.Id, p.SupplierId, p.Supplier.Name, p.RegisteredAt, p.Status, p.ReceivedAt, p.Total)).ToList();
    public async Task<PurchaseDto> GetAsync(int id, CancellationToken ct = default) => Map(await repository.FindAsync(id, ct) ?? throw new PurchaseNotFoundException());
    public async Task<PurchaseDto> CreateAsync(PurchaseInput input, CancellationToken ct = default)
    {
        Validator.ValidateObject(input, new ValidationContext(input), true);
        foreach (var detail in input.Details)
        {
            if (detail is null) throw new ValidationException("Los detalles no pueden ser nulos.");
            Validator.ValidateObject(detail, new ValidationContext(detail), true);
            if (decimal.Round(detail.UnitCost!.Value, 2) != detail.UnitCost.Value) throw new ValidationException("El costo admite como máximo dos decimales.");
        }
        var ids = input.Details.Select(d => d.ProductId).ToArray();
        if (ids.Distinct().Count() != ids.Length) throw new ValidationException("Selecciona cada producto una sola vez por compra.");
        if (!await repository.SupplierExistsAsync(input.SupplierId, ct)) throw new SupplierNotFoundException();
        var products = await repository.ProductsAsync(ids, ct);
        if (products.Count != ids.Length) throw new ProductNotFoundException();
        if (products.Any(p => !p.IsActive)) throw new PurchaseConflictException("No se pueden registrar compras con productos inactivos.");
        var purchase = new Purchase { SupplierId = input.SupplierId, RegisteredAt = DateTimeOffset.UtcNow };
        purchase.Details = input.Details.Select(d => new PurchaseDetail { ProductId = d.ProductId, Quantity = d.Quantity!.Value,
            UnitCost = d.UnitCost!.Value, Subtotal = d.Quantity.Value * d.UnitCost.Value }).ToList();
        purchase.Total = purchase.Details.Sum(d => d.Subtotal);
        if (purchase.Total > 9999999999999999.99m) throw new ValidationException("El total supera el importe máximo permitido.");
        return Map(await repository.AddAsync(purchase, ct));
    }
    public async Task<PurchaseDto> ReceiveAsync(int id, CancellationToken ct = default) => Map(await repository.ReceiveAsync(id, ct));
    private static PurchaseDto Map(Purchase p) => new(p.Id, p.SupplierId, p.Supplier.Name, p.RegisteredAt, p.Status, p.ReceivedAt, p.Total,
        p.Details.OrderBy(d => d.Id).Select(d => new PurchaseDetailDto(d.Id, d.ProductId, d.Product.Code, d.Product.Name, d.Quantity, d.UnitCost, d.Subtotal)).ToList());
}
