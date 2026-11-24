using System.ComponentModel.DataAnnotations;
using Solvex.Api.Entities;

namespace Solvex.Api.DTOs;

public sealed class OrderInput
{
    [Range(1, int.MaxValue)] public int CustomerId { get; init; }
    [Required, MinLength(1), MaxLength(100)] public List<OrderDetailInput> Details { get; init; } = [];
    [StringLength(1000)] public string? Observations { get; init; }
}

public sealed class OrderDetailInput
{
    [Range(1, int.MaxValue)] public int ProductId { get; init; }
    [Required, Range(1, 1000000)] public int? Quantity { get; init; }
}

public sealed record OrderDetailDto(int Id, int ProductId, string ProductCode, string ProductName, int Quantity, decimal UnitPrice, decimal Subtotal);
public sealed record OrderSummaryDto(int Id, int CustomerId, string CustomerName, DateTimeOffset RegisteredAt, OrderStatus Status, decimal Total);
public sealed record OrderDto(int Id, int CustomerId, string CustomerName, DateTimeOffset RegisteredAt, OrderStatus Status, string? Observations, decimal Total, IReadOnlyList<OrderDetailDto> Details);
