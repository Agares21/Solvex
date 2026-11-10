using System.ComponentModel.DataAnnotations;
using Solvex.Api.Entities;

namespace Solvex.Api.DTOs;

public sealed class PurchaseInput
{
    [Range(1, int.MaxValue)] public int SupplierId { get; init; }
    [Required, MinLength(1), MaxLength(100)] public List<PurchaseDetailInput> Details { get; init; } = [];
}
public sealed class PurchaseDetailInput
{
    [Range(1, int.MaxValue)] public int ProductId { get; init; }
    [Required, Range(1, 1000000)] public int? Quantity { get; init; }
    [Required, Range(typeof(decimal), "0", "99999999.99", ParseLimitsInInvariantCulture = true)] public decimal? UnitCost { get; init; }
}
public sealed record PurchaseDetailDto(int Id, int ProductId, string ProductCode, string ProductName, int Quantity, decimal UnitCost, decimal Subtotal);
public sealed record PurchaseSummaryDto(int Id, int SupplierId, string SupplierName, DateTimeOffset RegisteredAt, PurchaseStatus Status, DateTimeOffset? ReceivedAt, decimal Total);
public sealed record PurchaseDto(int Id, int SupplierId, string SupplierName, DateTimeOffset RegisteredAt, PurchaseStatus Status, DateTimeOffset? ReceivedAt, decimal Total, IReadOnlyList<PurchaseDetailDto> Details);
